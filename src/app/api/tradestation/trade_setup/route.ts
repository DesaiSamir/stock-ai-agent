import { tradestationService } from "@/app/api/services/tradestation/tradingService";

export async function GET() {
  // Example: get trade setups (customize as needed)
  const url = `/v2/trade_setup`;
  const result = await tradestationService.get(url);
  return Response.json(result ?? []);
}

export async function POST(request: Request) {
  const payload = await request.json();
  // For now, just log the payload as in the original code
  console.log(payload);
  // You can implement actual POST logic here if needed
  return new Response(JSON.stringify({ message: "Received", payload }), {
    status: 200,
  });
}
