import { tradestationService } from '@/app/api/services/tradestation/tradingService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbols = searchParams.get('symbols');
    const stream = searchParams.get('stream') === 'true';
    const token = searchParams.get('token');

    if (!symbols) {
      return Response.json({ error: 'Missing symbols parameter' }, { status: 400 });
    }

    if (!token) {
      return Response.json({ error: 'Token is required' }, { status: 400 });
    }

    const headers = new Headers({
      'Authorization': `Bearer ${token}`
    });

    // If stream is true, setup SSE connection for real-time quotes
    if (stream) {
      // Use the real-time quote endpoint
      const url = `/v2/stream/quote/changes/${symbols}`;
      
      const stream = new ReadableStream({
        async start(controller) {
          await tradestationService.getStream(url, headers, controller);
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // For non-streaming, use the current quote endpoint
    const url = `/v2/data/quote/${symbols}`;
    const quoteData = await tradestationService.get(url, headers);
    return Response.json(quoteData ?? []);
  } catch (error) {
    console.error('Failed to fetch quote:', error);
    if (error instanceof Error && error.message.includes('No token available')) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch quote' },
      { status: 500 }
    );
  }
} 