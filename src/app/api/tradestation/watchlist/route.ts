import { tradestationService } from "@/app/api/services/tradestation/tradingService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  if (symbol) {
    const url = `/v2/data/quote/${symbol}`;
    const result = await tradestationService.get(url);
    return Response.json(result ?? []);
  }
  // You can implement more GET logic for watchlist here
  return new Response(JSON.stringify({ error: "Missing symbol parameter" }), {
    status: 400,
  });
}

export async function POST(request: Request) {
  const payload = await request.json();
  // You can implement logic to add to watchlist here
  return new Response(
    JSON.stringify({ message: "Added to watchlist (placeholder)", payload }),
    { status: 200 },
  );
}
