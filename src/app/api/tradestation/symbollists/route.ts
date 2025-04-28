import { tradestationService } from '@/app/api/services/tradestation/tradingService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolListId = searchParams.get('symbol_list_id');
  const symbols = searchParams.get('symbols');

  if (symbolListId && symbols) {
    const url = `/v2/data/symbollists/${symbolListId}/symbols`;
    const result = await tradestationService.get(url);
    return Response.json(result ?? []);
  }
  if (symbolListId) {
    const url = `/v2/data/symbollists/${symbolListId}`;
    const result = await tradestationService.get(url);
    return Response.json(result ?? []);
  }
  // Default: get all symbol lists
  const url = `/v2/data/symbollists`;
  const result = await tradestationService.get(url);
  return Response.json(result ?? []);
} 