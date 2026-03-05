import {
  EVMClient,
  HTTPClient,
  handler,
  getNetwork,
  hexToBase64,
  bytesToHex,
  prepareReportRequest,
  Runner,
  ok,
  consensusIdenticalAggregation,
  type Runtime,
  type EVMLog,
  type HTTPSendRequester,
} from "@chainlink/cre-sdk";

type Config = {
  poolAddress: string;
  creRouterAddress: string;
  receiverAddress: string;
  gasLimit: number;
  chainSelectorName: string;
  aiAdjudicateUrl: string;
};

type AdjudicationResult = {
  confidence: number;
  triggered: boolean;
  reasoning: string;
  data_quality: string;
  anomalies_detected: string[];
};

// Named callback for AI adjudication via Claude Service (proxied through mock server)
const callAdjudicate = (
  sendRequester: HTTPSendRequester,
  bodyBytes: Uint8Array,
  url: string,
): AdjudicationResult => {
  const resp = sendRequester
    .sendRequest({
      url,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: bodyBytes,
    })
    .result();
  if (!ok(resp)) {
    return {
      confidence: 0.3,
      triggered: false,
      reasoning: `AI service returned ${resp.statusCode}, defaulting to low confidence`,
      data_quality: "low",
      anomalies_detected: ["api_error"],
    };
  }
  return JSON.parse(new TextDecoder().decode(resp.body));
};

const initWorkflow = (config: Config) => {
  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: config.chainSelectorName,
    isTestnet: true,
  });
  if (!network)
    throw new Error(`Network not found: ${config.chainSelectorName}`);

  const evmClient = new EVMClient(network.chainSelector.selector);

  return [
    handler(
      evmClient.logTrigger({
        addresses: [hexToBase64(config.poolAddress)],
      }),
      (runtime: Runtime<Config>, log: EVMLog): string => {
        const { encodeAbiParameters, parseAbiParameters, decodeAbiParameters } =
          require("viem") as typeof import("viem");

        const httpClient = new HTTPClient();

        runtime.log(
          `Settlement workflow triggered by log from ${bytesToHex(log.address)}`,
        );

        // 1. Decode MonitoringTick(int256 value, bool triggered, uint8 consecutiveCount, uint256 timestamp)
        const logDataHex = bytesToHex(log.data);
        runtime.log(`Log data: ${logDataHex}`);

        const decoded = decodeAbiParameters(
          parseAbiParameters("int256, bool, uint8, uint256"),
          logDataHex as `0x${string}`,
        );
        const monitorValue = decoded[0] as bigint;
        const triggered = decoded[1] as boolean;
        const consecutiveCount = decoded[2] as number;
        const eventTimestamp = decoded[3] as bigint;

        runtime.log(
          `MonitoringTick: value=${monitorValue}, triggered=${triggered}, count=${consecutiveCount}, ts=${eventTimestamp}`,
        );

        // 2. Call AI adjudication via Claude Service (proxied through mock server)
        const adjudicateBody = JSON.stringify({
          description:
            "Parametric insurance trigger condition — borderline case flagged by monitoring",
          threshold: "20",
          comparison: triggered ? "exceeded" : "not exceeded",
          value1: String(monitorValue),
          value2: String(monitorValue),
          value3: String(monitorValue),
          medianValue: String(monitorValue),
        });

        const bodyBytes = new Uint8Array(
          Array.from(adjudicateBody).map((c) => c.charCodeAt(0)),
        );

        const aiResult = httpClient
          .sendRequest(runtime, callAdjudicate, consensusIdenticalAggregation())(
            bodyBytes,
            config.aiAdjudicateUrl,
          )
          .result();

        runtime.log(
          `AI adjudication: confidence=${aiResult.confidence}, triggered=${aiResult.triggered}`,
        );

        // 3. Determine action based on confidence
        let action: number;
        let confidence: number;

        if (aiResult.confidence > 0.8 && aiResult.triggered) {
          action = 1; // SETTLEMENT
          confidence = Math.round(aiResult.confidence * 100);
          runtime.log("SETTLEMENT: AI confirms trigger with high confidence");
        } else if (aiResult.confidence >= 0.5) {
          action = 0; // LOG
          confidence = Math.round(aiResult.confidence * 100);
          runtime.log("LOG: Medium confidence — flagged for review");
        } else {
          action = 0; // LOG
          confidence = Math.round(aiResult.confidence * 100);
          runtime.log("LOG: Low confidence — false alarm");
        }

        // 4. Encode report
        const encodedPayload = encodeAbiParameters(
          parseAbiParameters("uint8, int256, uint8, uint256"),
          [action, BigInt(0), 0, BigInt(confidence)],
        );

        // 5. Generate and submit report
        const reportResponse = runtime
          .report(prepareReportRequest(encodedPayload))
          .result();

        const writeResult = evmClient
          .writeReport(runtime, {
            receiver: config.receiverAddress,
            report: reportResponse,
            gasConfig: { gasLimit: config.gasLimit },
          })
          .result();

        runtime.log(`Settlement write tx status: ${writeResult.txStatus}`);

        return `Settlement complete: action=${action}, confidence=${aiResult.confidence}`;
      },
    ),
  ];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
