import { tradestationService } from '@/app/api/services/tradestation/tradingService';

export async function POST(request: Request) {
  const { method, url, payload } = await request.json();
  let result;
  if (method === 'GET') {
    result = await tradestationService.get(url);
  } else if (method === 'POST') {
    result = await tradestationService.post(url, payload);
  } else {
    return new Response(JSON.stringify({ error: 'Unsupported method' }), { status: 400 });
  }
  return Response.json(result ?? []);
} 