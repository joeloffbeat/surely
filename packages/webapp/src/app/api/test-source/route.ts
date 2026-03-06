import { NextRequest, NextResponse } from "next/server";

const MOCK_SERVER = process.env.MOCK_SERVER_URL || "http://localhost:4000";

// Map source display names to mock server endpoints
const SOURCE_ENDPOINTS: Record<string, string> = {
  "CoinGecko API": "/api/btc-price/coingecko",
  "CryptoCompare API": "/api/btc-price/cryptocompare",
  "Chainlink Price Feed": "/api/btc-price/chainlink",
  "OpenWeather API": "/data/weather",
  "WeatherAPI.com": "/data/weather",
  "NOAA Satellite Data": "/data/weather",
  "FlightAware API": "/data/flight-status",
  "AviationStack API": "/data/flight-status",
  "ADS-B Exchange": "/data/flight-status",
  "Uniswap TWAP": "/api/btc-price/coingecko",
};

export async function POST(req: NextRequest) {
  try {
    const { source } = await req.json();
    const endpoint = SOURCE_ENDPOINTS[source];

    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: `Unknown source: ${source}` },
        { status: 400 },
      );
    }

    const start = Date.now();
    const res = await fetch(`${MOCK_SERVER}${endpoint}`, { cache: "no-store" });
    const latency = Date.now() - start;

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Source returned ${res.status}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    return NextResponse.json({ success: true, data, latency });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to reach source",
      },
      { status: 500 },
    );
  }
}
