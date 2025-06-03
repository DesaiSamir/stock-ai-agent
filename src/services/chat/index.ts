import { ENDPOINTS } from '@/constants/http';
import { httpService } from '../http-client';
import { useChatStore } from '@/store/chat';
import { ToolExecutor } from '../tool-executor';
import { v4 as uuidv4 } from 'uuid';
import type { Message } from '@/store/chat';

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

  private constructor() {
    this.toolExecutor = ToolExecutor.getInstance();
  }

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  private async handleToolCall(toolCall: ToolCallRequest): Promise<unknown> {
    try {
      // First validate that the tool exists
      const toolType = this.toolExecutor.validateToolRequest(toolCall.name);
      
      const context = {
        requestId: uuidv4(),
        timestamp: new Date().toISOString(),
        source: 'chat',
        actionId: uuidv4()
      };

      // The tool will handle its own payload validation
      return await this.toolExecutor.execute(toolType, toolCall.payload, context);
    } catch (error) {
      console.error('Tool execution failed:', error);
      throw error;
    }
  }

  private createMessage(
    content: string,
    role: Message['role'] = 'assistant',
    type: Message['type'] = 'text',
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
    // Convert analysis with needsMoreData: false to final_response
    if (aiResponse.type === 'analysis' && !aiResponse.needsMoreData) {
      return {
        type: 'final_response',
        reply: aiResponse.reply,
        status: aiResponse.status
      };
    }

    // If this is a final response, return as is
    if (aiResponse.type === 'final_response') {
      return aiResponse;
    }

    // Add AI's explanation of what it's doing as an intermediate message
    const store = useChatStore.getState();
    const intermediateMessage = this.createMessage(aiResponse.reply, 'assistant', 'text', true);
    store.addMessage(intermediateMessage);

    // If there are tool calls, execute them
    if (aiResponse.toolCalls?.length) {
      const toolResults: ToolResult[] = [];

      // Execute all tool calls
      for (const toolCall of aiResponse.toolCalls) {
        try {
          const result = await this.handleToolCall(toolCall);
          toolResults.push({
            name: toolCall.name,
            result
          });
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
        'text'
      );

      // Get next response from AI with tool results
      const nextResponse = await this.sendMessage(
        [...messages, intermediateMessage, toolResultMessage],
        toolResults
      );

      // Continue the loop if needed
      return this.executeToolsAndGetResponse(nextResponse, [...messages, intermediateMessage, toolResultMessage]);
    }

    // If no tool calls but still analyzing (type === 'analysis' && needsMoreData), continue the conversation
    if (aiResponse.type === 'analysis' && aiResponse.needsMoreData) {
      // Get next response from AI to continue analysis
      const nextResponse = await this.sendMessage(
        [...messages, intermediateMessage]
      );

      // Continue the loop
      return this.executeToolsAndGetResponse(nextResponse, [...messages, intermediateMessage]);
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

  async sendMessage(messages: Message[], toolResults?: ToolResult[]): Promise<ChatResponse> {
    // Only send the last 20 messages for context
    const recentMessages = messages.slice(-20);
    
    return httpService.post<ChatResponse>(ENDPOINTS.AI.CHAT, { 
      messages: recentMessages, 
      toolResults
    });
  }

  async clearHistory(): Promise<void> {
    const store = useChatStore.getState();
    store.clearMessages();
  }
} 