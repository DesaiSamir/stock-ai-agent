import { tradestationService } from '@/app/api/services/tradestation/tradingService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols');

  if (!symbols) {
    return Response.json({ error: 'Missing symbols parameter' }, { status: 400 });
  }

  try {
    const url = `/v2/data/quote/${symbols}`;
    const quoteData = await tradestationService.get(url, request.headers);
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