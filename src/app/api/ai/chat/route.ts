import { NextRequest, NextResponse } from 'next/server';
import { aiService, ChatMessage } from '@/app/api/services/ai/aiService';

// Allowed roles for chat
const allowedRoles = ["system", "user", "assistant", "developer"] as const;

// In-memory chat history (per process; replace with persistent store for production)
let chatHistory: ChatMessage[] = [];

function filterValidMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter(
    (m) =>
      m &&
      typeof m.content === 'string' &&
      allowedRoles.includes(m.role)
  );
}

// POST /api/ai/chat
export async function POST(req: NextRequest) {
  try {
    const { messages, tools } = await req.json();
    // If messages are provided, append to history
    if (Array.isArray(messages) && messages.length > 0) {
      chatHistory = [...chatHistory, ...filterValidMessages(messages)];
    }
    // Use the last 20 messages for context
    const context = chatHistory.slice(-20) as ChatMessage[];
    // Call aiService to get a response
    const aiReply = await aiService.makeOpenAIRequest(context as ChatMessage[]);
    // Add AI response to history
    chatHistory.push({ role: 'assistant', content: aiReply });
    return NextResponse.json({
      reply: aiReply,
      history: chatHistory,
      toolsUsed: tools || [],
      status: 'ok',
    });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request', details: String(err) }, { status: 400 });
  }
}

// POST /api/ai/chat/clear
export async function DELETE() {
  chatHistory = [];
  return NextResponse.json({ status: 'cleared', history: [] });
} 