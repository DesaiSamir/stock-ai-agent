import { NextRequest, NextResponse } from 'next/server';
import { aiService, ChatMessage } from '@/app/api/services/ai/aiService';

// Allowed roles for chat
const allowedRoles = ["system", "user", "assistant", "developer"] as const;

function filterValidMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter(
    (m) =>
      m &&
      typeof m.content === 'string' &&
      allowedRoles.includes(m.role)
  );
}

interface AIResponse {
  type: 'tool_request' | 'analysis' | 'final_response';
  reply: string;
  needsMoreData?: boolean;
  toolCalls?: Array<{
    name: string;
    payload: Record<string, unknown>;
  }>;
}

function parseAIResponse(content: string): AIResponse {
  try {
    // Try to parse the response as JSON
    const response = JSON.parse(content);
    
    // Validate the response has the required fields
    if (
      typeof response === 'object' &&
      response !== null &&
      typeof response.type === 'string' &&
      ['tool_request', 'analysis', 'final_response'].includes(response.type) &&
      typeof response.reply === 'string'
    ) {
      return response as AIResponse;
    }
  } catch (error) {
    console.warn('Failed to parse AI response as JSON:', error);
  }

  // If parsing fails or validation fails, wrap the response in a final_response format
  return {
    type: 'final_response',
    reply: content
  };
}

// POST /api/ai/chat
export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    // Validate messages array
    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { 
          type: 'final_response',
          reply: 'Invalid request: messages must be an array',
          status: 'error'
        },
        { status: 400 }
      );
    }

    // Filter valid messages
    const validMessages = filterValidMessages(messages);

    // Call aiService to get a response
    const aiReply = await aiService.makeOpenAIRequest(validMessages);

    // Parse the AI response
    const parsedResponse = parseAIResponse(aiReply);

    return NextResponse.json({
      ...parsedResponse,
      status: 'ok'
    });
  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json(
      { 
        type: 'final_response',
        reply: 'Sorry, I encountered an error processing your request.',
        error: String(err),
        status: 'error'
      }, 
      { status: 500 }
    );
  }
}

// POST /api/ai/chat/clear - No longer needed as history is managed client-side
export async function DELETE() {
  return NextResponse.json({ status: 'ok' });
} 