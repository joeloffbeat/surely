import express from "express";
import cors from "cors";
import crypto from "crypto";

const app = express();
app.use(cors());
app.use(express.json());

function sha256Hash(...inputs: string[]): string {
  const hash = crypto
    .createHash("sha256")
    .update(inputs.join("|"))
    .digest("hex");
  return "0x" + hash;
}

// POST /verify/all — Combined KYC + PEP + sanctions
app.post("/verify/all", (req, res) => {
  const { name, idNumber, dateOfBirth, nationality } = req.body;
  const isSanctioned =
    typeof name === "string" && name.toLowerCase().includes("sanctioned");
  const proofHash = sha256Hash(
    name || "",
    idNumber || "",
    dateOfBirth || "",
    nationality || "",
  );
  const ccidCredential = sha256Hash("ccid", proofHash);

  res.json({
    eligible: !isSanctioned,
    kycPassed: !isSanctioned,
    pepCheck: false,
    sanctionsCheck: isSanctioned,
    proofHash,
    ccidCredential,
  });
});

// POST /verify/flight
app.post("/verify/flight", (req, res) => {
  const { flightNumber, date, passengerName } = req.body;
  const proofHash = sha256Hash(
    flightNumber || "",
    date || "",
    passengerName || "",
  );

  res.json({
    eligible: true,
    flightExists: true,
    passengerVerified: true,
    proofHash,
  });
});

// POST /verify/employment
app.post("/verify/employment", (req, res) => {
  const { employerName, employeeId, role } = req.body;
  const proofHash = sha256Hash(
    employerName || "",
    employeeId || "",
    role || "",
  );

  res.json({
    eligible: true,
    employed: true,
    proofHash,
  });
});

// POST /verify/identity
app.post("/verify/identity", (req, res) => {
  const { name, idNumber, idType } = req.body;
  const proofHash = sha256Hash(name || "", idNumber || "", idType || "");

  res.json({
    eligible: true,
    verified: true,
    proofHash,
  });
});

// POST /verify/property
app.post("/verify/property", (req, res) => {
  const { propertyId, location, ownerName } = req.body;
  const proofHash = sha256Hash(
    propertyId || "",
    location || "",
    ownerName || "",
  );

  res.json({
    eligible: true,
    propertyExists: true,
    ownerVerified: true,
    proofHash,
  });
});

// GET /data/crypto
app.get("/data/crypto", (_req, res) => {
  res.json({
    btc: { price: 67500, change24h: -2.5 },
    eth: { price: 3200, change24h: -1.8 },
  });
});

// BTC price endpoints — used by trigger-monitoring workflow (3 data sources)
app.get("/api/btc-price/coingecko", (_req, res) => {
  res.json({ btc: { price: 67500, change24h: -2.5 } });
});

app.get("/api/btc-price/cryptocompare", (_req, res) => {
  res.json({ btc: { price: 67480, change24h: -2.4 } });
});

app.get("/api/btc-price/chainlink", (_req, res) => {
  res.json({ btc: { price: 67510, change24h: -2.6 } });
});

// GET /data/weather
app.get("/data/weather", (_req, res) => {
  res.json({
    location: "Central Valley, CA",
    rainfall_mm: 45,
    period: "30d",
  });
});

// GET /data/flight-status
app.get("/data/flight-status", (_req, res) => {
  res.json({
    flight: "AA1234",
    delay_minutes: 195,
    status: "delayed",
  });
});

// POST /stripe/verify
app.post("/stripe/verify", (req, res) => {
  const { paymentIntentId, amount } = req.body;
  res.json({
    verified: true,
    amount,
    currency: "usd",
    paymentIntentId,
  });
});

// POST /api/ai-adjudicate — AI adjudication via Claude Service
// Wraps the streaming Claude Service into a single JSON response for CRE workflows
const CLAUDE_SERVICE_URL =
  process.env.CLAUDE_SERVICE_URL || "http://localhost:5001";
const CLAUDE_SERVICE_API_KEY =
  process.env.CLAUDE_SERVICE_API_KEY ||
  "f057a134e8c46dd2993f221bfbf957d15fa59234c501962a0ee67bfdce78802e";

app.post("/api/ai-adjudicate", async (req, res) => {
  const {
    description,
    threshold,
    comparison,
    value1,
    value2,
    value3,
    medianValue,
  } = req.body;

  const prompt = `You are an insurance trigger adjudicator. Analyze objective data to determine if an insurance trigger condition has been genuinely met.

TRIGGER CONDITION: ${description || "Parametric insurance trigger condition"}
THRESHOLD: ${threshold || "unknown"} ${comparison || "unknown"}

DATA SOURCES:
- Source 1: ${value1}
- Source 2: ${value2}
- Source 3: ${value3}

MEDIAN VALUE: ${medianValue}

ANALYSIS REQUIRED:
1. Do the data sources agree? What is the variance?
2. Is the consensus value genuinely past the threshold, or is it noise?
3. Are there any anomalies in the data (stale data, API errors, outliers)?
4. Based on the data, is this a sustained condition or a momentary spike?

Return ONLY valid JSON with no markdown formatting:
{"confidence": <0.0 to 1.0>, "triggered": <boolean>, "reasoning": "<2-3 sentence explanation>", "data_quality": "<high|medium|low>", "anomalies_detected": ["<anomaly descriptions>"]}`;

  try {
    const response = await fetch(`${CLAUDE_SERVICE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": CLAUDE_SERVICE_API_KEY,
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ prompt, model: "sonnet", maxTurns: 1 }),
    });

    if (!response.ok) {
      throw new Error(`Claude Service returned ${response.status}`);
    }

    // Parse streaming response — collect text from claude_event stream deltas
    const text = await response.text();
    const lines = text.split("\n").filter((l) => l.trim());
    let fullOutput = "";

    for (const line of lines) {
      try {
        const event = JSON.parse(line);
        if (event.type === "claude_event") {
          const inner = event.data;
          if (
            inner?.type === "stream_event" &&
            inner.event?.type === "content_block_delta" &&
            inner.event.delta?.type === "text_delta" &&
            inner.event.delta.text
          ) {
            fullOutput += inner.event.delta.text;
          }
        }
        if (event.type === "raw_output" && typeof event.data === "string") {
          fullOutput += event.data;
        }
      } catch {
        // skip non-JSON lines
      }
    }

    // Extract JSON from the output (may be wrapped in markdown code blocks)
    const jsonMatch = fullOutput.match(/\{[\s\S]*?"confidence"[\s\S]*?\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      res.json(result);
    } else {
      // Fallback if we can't parse
      res.json({
        confidence: 0.5,
        triggered: false,
        reasoning:
          "Could not parse AI response, defaulting to medium confidence",
        data_quality: "low",
        anomalies_detected: ["parse_error"],
      });
    }
  } catch (err: any) {
    console.error("AI adjudication error:", err.message);
    res.json({
      confidence: 0.3,
      triggered: false,
      reasoning: `AI service error: ${err.message}`,
      data_quality: "low",
      anomalies_detected: ["service_error"],
    });
  }
});

// GET /health
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Surely mock server running on port ${PORT}`);
});
