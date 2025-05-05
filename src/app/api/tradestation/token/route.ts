import { tradestationConfig } from "@/app/api/services/tradestation/config";

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return Response.json(
        { error: "Authorization code is required" },
        { status: 400 },
      );
    }

    // Exchange the authorization code for tokens
    const payload = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: tradestationConfig.apiCallback,
      client_id: tradestationConfig.clientId,
      client_secret: tradestationConfig.clientSecret,
    });

    const response = await fetch(
      `${tradestationConfig.baseUrlSim}/v2/Security/Authorize`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: payload.toString(),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Token exchange failed:", error);
      return Response.json(
        { error: "Failed to exchange code for token" },
        { status: response.status },
      );
    }

    const tokenInfo = await response.json();
    return Response.json(tokenInfo);
  } catch (error) {
    console.error("Token exchange error:", error);
    return Response.json(
      { error: "Failed to exchange code for token" },
      { status: 500 },
    );
  }
}
