import { tradestationService } from '@/app/api/services/tradestation/tradingService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const token = searchParams.get('token');

    if (!url) {
      return Response.json({ error: 'URL is required' }, { status: 400 });
    }

    if (!token) {
      return Response.json({ error: 'Token is required' }, { status: 400 });
    }

    const headers = new Headers({
      'Authorization': `Bearer ${token}`
    });
    
    const data = await tradestationService.get(url, headers);
    return Response.json(data);

  } catch (error) {
    console.error('Failed to fetch barchart data:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch barchart data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { url, token } = await request.json();
    
    if (!url) {
      return Response.json({ error: 'URL is required' }, { status: 400 });
    }

    if (!token) {
      return Response.json({ error: 'Token is required' }, { status: 400 });
    }

    const headers = new Headers({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });

    const data = await tradestationService.get(url, headers);
    return Response.json(data);
  } catch (error) {
    console.error('Failed to fetch barchart data:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch barchart data' },
      { status: 500 }
    );
  }
} 