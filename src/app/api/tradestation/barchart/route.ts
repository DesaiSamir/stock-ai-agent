import { tradestationService } from '@/app/api/services/tradestation/tradingService';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return Response.json({ error: 'URL is required' }, { status: 400 });
    }

    const barData = await tradestationService.get(url, request.headers);
    return Response.json(barData);
  } catch (error) {
    console.error('Failed to fetch barchart data:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch barchart data' },
      { status: 500 }
    );
  }
} 