import { tradestationConfig } from "@/app/api/services/tradestation/config";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const host = requestUrl.host || "localhost:3000";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const redirect_uri = `${protocol}://${host}${tradestationConfig.apiCallback}`;

  // Debug logging
  console.log("TradeStation Config:", {
    clientId: tradestationConfig.clientId?.substring(0, 5) + "...", // Only log first 5 chars for security
    baseUrlSim: tradestationConfig.baseUrlSim,
    redirect_uri,
  });

  // Construct the proper TradeStation OAuth URL according to docs
  const params = new URLSearchParams();
  params.append("response_type", "code");
  params.append("client_id", tradestationConfig.clientId);
  params.append("redirect_uri", redirect_uri);

  // Log the URL for debugging (remove in production)
  const authUrl = `${tradestationConfig.baseUrlSim}/v2/authorize?${params.toString()}`;
  console.log("Authorization URL:", authUrl);

  return new Response(JSON.stringify({ loginUrl: authUrl }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
