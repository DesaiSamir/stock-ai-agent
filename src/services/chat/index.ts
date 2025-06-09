import { ENDPOINTS } from '@/constants/http';
import { httpService } from '../http-client';
import { useChatStore } from '@/store/chat';
import { ToolExecutor } from '../tool-executor';
import { v4 as uuidv4 } from 'uuid';
import type { Message, MessageType } from '@/types/chat';
import type { ToolType } from '@/types/tools';

interface ToolCallRequest {
  name: string;
  payload: Record<string, unknown>;
}

interface ToolResult {
  name: string;
  result: unknown;
}

type ResponseType = 'tool_request' | 'analysis' | 'final_response';

interface ChatResponse {
  type: ResponseType;
  reply: string;
  needsMoreData?: boolean;
  toolCalls?: ToolCallRequest[];
  history?: Message[];
  status?: string;
}

export class ChatService {
  private static instance: ChatService | null = null;
  private toolExecutor: ToolExecutor;
  private isConnected: boolean = false;
  private connectionTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    this.toolExecutor = ToolExecutor.getInstance();
    this.setupConnectionCheck();
  }

  private setupConnectionCheck() {
    // Check connection every 30 seconds
    this.connectionTimeout = setInterval(() => {
      this.checkConnection();
    }, 30000);
  }

  private async checkConnection() {
    try {
      await httpService.get(ENDPOINTS.AI.HEALTH);
      this.isConnected = true;
    } catch (error) {
      this.isConnected = false;
      console.error('Chat service connection error:', error);
    }
  }

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  public static destroyInstance() {
    if (ChatService.instance?.connectionTimeout) {
      clearInterval(ChatService.instance.connectionTimeout);
    }
    ChatService.instance = null;
  }

  private async handleToolCall(toolCall: ToolCallRequest): Promise<unknown> {
    if (!this.isConnected) {
      throw new Error('Chat service is not connected');
    }

    try {
      const toolName = toolCall.name.toUpperCase().replace(/[^A-Z_]/g, '_') as ToolType;
      const toolType = this.toolExecutor.validateToolRequest(toolName);
      
      const context = {
        requestId: uuidv4(),
        timestamp: new Date().toISOString(),
        source: 'chat',
        actionId: uuidv4()
      };

      return await this.toolExecutor.execute(toolType, toolCall.payload, context);
    } catch (error) {
      console.error('Tool execution failed:', error);
      throw error;
    }
  }

  private createMessage(
    content: string,
    role: Message['role'] = 'assistant',
    type: MessageType = 'text',
    isIntermediate: boolean = false
  ): Message {
    return {
      id: uuidv4(),
      content,
      role,
      type,
      isIntermediate,
      timestamp: new Date().toISOString(),
      conversationId: uuidv4()
    };
  }

  private async executeToolsAndGetResponse(aiResponse: ChatResponse, messages: Message[]): Promise<ChatResponse> {
    // If this is a final response, return as is
    if (aiResponse.type === 'final_response') {
      return aiResponse;
    }

    const store = useChatStore.getState();

    // Add AI's explanation as an intermediate message
    const intermediateMessage = this.createMessage(aiResponse.reply, 'assistant', 'text', true);
    store.addMessage(intermediateMessage);

    // If there are tool calls, execute them
    if (aiResponse.toolCalls?.length) {
      const toolResults: ToolResult[] = [];

      // Execute all tool calls
      for (const toolCall of aiResponse.toolCalls) {
        try {
          // Handle web search differently
          if (toolCall.name === 'web_search') {
            toolResults.push({
              name: toolCall.name,
              result: {
                success: true,
                data: {
                  searchQuery: toolCall.payload.search_term,
                  message: "Web search capability is enabled for the AI's analysis, respond in JSON format as expected."
                },
                timestamp: new Date().toISOString()
              }
            });
            continue;
          }

          const result = await this.handleToolCall(toolCall);
          toolResults.push({
            name: toolCall.name,
            result
          });

          // Add small delay between tool calls to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error('Tool execution failed:', error);
          toolResults.push({
            name: toolCall.name,
            result: { error: error instanceof Error ? error.message : 'Unknown error' }
          });
        }
      }

      // Create a system message with the tool results
      const toolResultMessage = this.createMessage(
        JSON.stringify(toolResults),
        'system',
        'tool_result'
      );

      try {
        // Get next response from AI with tool results
        const nextResponse = await this.sendMessage(
          [...messages, intermediateMessage, toolResultMessage],
          toolResults
        );

        // Continue the loop if needed
        return this.executeToolsAndGetResponse(nextResponse, [...messages, intermediateMessage, toolResultMessage]);
      } catch (error: unknown) {
        // Handle rate limit errors gracefully
        if (error instanceof Error && error.message.includes('rate limit')) {
          // Wait for 2 seconds and try again
          await new Promise(resolve => setTimeout(resolve, 2000));
          return this.executeToolsAndGetResponse(aiResponse, messages);
        }
        throw error;
      }
    }

    // If the AI wants to continue analysis, send it back as a tool result
    if (aiResponse.type === 'analysis' && aiResponse.needsMoreData) {
      const analysisResult = {
        name: 'analysis_continuation',
        result: {
          success: true,
          data: {
            message: aiResponse.reply,
            status: aiResponse.status,
            needsMoreData: aiResponse.needsMoreData
          },
          timestamp: new Date().toISOString()
        }
      };

      const toolResultMessage = this.createMessage(
        JSON.stringify([analysisResult]),
        'system',
        'analysis_result'
      );

      try {
        const nextResponse = await this.sendMessage(
          [...messages, intermediateMessage, toolResultMessage],
          [analysisResult]
        );

        return this.executeToolsAndGetResponse(nextResponse, [...messages, intermediateMessage, toolResultMessage]);
      } catch (error: unknown) {
        // Handle rate limit errors gracefully
        if (error instanceof Error && error.message.includes('rate limit')) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          return this.executeToolsAndGetResponse(aiResponse, messages);
        }
        throw error;
      }
    }

    // If we get here, it means we have an analysis response that doesn't need more data
    if (aiResponse.type === 'analysis') {
      return {
        type: 'final_response',
        reply: aiResponse.reply,
        status: aiResponse.status
      };
    }

    // Remove all intermediate messages before returning final response
    store.messages
      .filter(m => m.isIntermediate)
      .forEach(m => store.removeMessage(m.id));

    return aiResponse;
  }

  public async processUserMessage(message: string) {
    const store = useChatStore.getState();
    
    // Create user message
    const userMessage = this.createMessage(message, 'user');
    
    // Create a local copy of messages and add the new user message
    const currentMessages = [...store.messages, userMessage];
    
    // Add user message to chat store
    store.addMessage(userMessage);
    store.setLoading(true);

    try {
      // Get initial AI response using the local messages array
      const initialResponse = await this.sendMessage(currentMessages);

      // Execute tools and get final response (this will loop until we get a final response)
      const finalResponse = await this.executeToolsAndGetResponse(initialResponse, currentMessages);

      // Add AI's final response to chat
      const assistantMessage = this.createMessage(finalResponse.reply);
      store.addMessage(assistantMessage);
    } catch (error) {
      console.error('Failed to process message:', error);
      const errorMessage = this.createMessage(
        'Sorry, I encountered an error while processing your message.',
        'assistant',
        'error'
      );
      store.addMessage(errorMessage);
    } finally {
      store.setLoading(false);
    }
  }

  public async sendMessage(messages: Message[], toolResults?: ToolResult[]): Promise<ChatResponse> {
    if (!this.isConnected) {
      await this.checkConnection();
      if (!this.isConnected) {
        throw new Error('Unable to connect to chat service');
      }
    }

    try {
      const recentMessages = messages.slice(-10);
      
      if (toolResults?.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return await httpService.post<ChatResponse>(ENDPOINTS.AI.CHAT, { 
        messages: recentMessages, 
        toolResults
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('rate limit')) {
        console.warn('Rate limit hit, retrying after delay...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.sendMessage(messages, toolResults);
      }
      throw error;
    }
  }

  async clearHistory(): Promise<void> {
    const store = useChatStore.getState();
    store.clearMessages();
  }
} 