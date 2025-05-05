import { tradestationService } from "@/app/api/services/tradestation/tradingService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userid = searchParams.get("userid");
  const balancesKey = searchParams.get("balances");
  const positionsKey = searchParams.get("positions");

  if (userid) {
    const url = `/v2/users/${userid}/accounts`;
    const result = await tradestationService.get(url);
    return Response.json(result ?? []);
  }
  if (balancesKey) {
    const url = `/v2/accounts/${balancesKey}/balances`;
    const result = await tradestationService.get(url);
    return Response.json(result ?? []);
  }
  if (positionsKey) {
    const url = `/v2/accounts/${positionsKey}/positions`;
    const result = await tradestationService.get(url);
    return Response.json(result ?? []);
  }
  return new Response(JSON.stringify({ error: "Missing required parameter" }), {
    status: 400,
  });
}
