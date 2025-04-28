import { tradestationService } from '@/app/api/services/tradestation/tradingService';

export async function GET() {
  // Example: get all orders (customize as needed)
  const url = `/v2/orders`;
  const result = await tradestationService.get(url);
  return Response.json(result ?? []);
}

export async function POST(request: Request) {
  const payload = await request.json();
  const url = '/v2/orders';
  const result = await tradestationService.post(url, payload);
  return Response.json(result ?? []);
}

export async function PUT(request: Request) {
  const { order_id, payload } = await request.json();
  const url = `/v2/orders/${order_id}`;
  const result = await tradestationService.post(url, payload); // You may want to implement a .put method
  return Response.json(result ?? []);
}

export async function DELETE(request: Request) {
  const { orderid } = await request.json();
  const url = `/v2/orders/${orderid}`;
  // You may want to implement a .delete method in tradestationService
  const result = await tradestationService.get(url); // Placeholder
  return Response.json(result ?? []);
} 