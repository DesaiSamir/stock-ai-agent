import { tradestationService } from "@/app/api/services/tradestation/tradingService";
import { authService } from "@/app/api/services/tradestation/authService";

export async function POST(request: Request) {
  const { method, url, payload, token } = await request.json();
  authService.setAccessToken(token);
  let result;
  if (method === "GET") {
    result = await tradestationService.get(url);
  } else if (method === "POST") {
    result = await tradestationService.post(url, payload);
  } else {
    return new Response(JSON.stringify({ error: "Unsupported method" }), {
      status: 400,
    });
  }
  return Response.json(result ?? []);
}
