import { tradestationService } from "@/app/api/services/tradestation/tradingService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return Response.json({ error: "URL is required" }, { status: 400 });
    }

    const data = await tradestationService.get(url);
    return Response.json(data);
  } catch (error) {
    console.error("Failed to fetch barchart data:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch barchart data",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return Response.json({ error: "URL is required" }, { status: 400 });
    }

    const data = await tradestationService.get(url);
    return Response.json(data);
  } catch (error) {
    console.error("Failed to fetch barchart data:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch barchart data",
      },
      { status: 500 },
    );
  }
}
