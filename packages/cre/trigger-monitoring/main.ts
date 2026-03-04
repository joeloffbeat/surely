import {
  CronCapability,
  HTTPClient,
  EVMClient,
  handler,
  getNetwork,
  prepareReportRequest,
  Runner,
  ok,
  consensusIdenticalAggregation,
  type Runtime,
  type CronPayload,
  type HTTPSendRequester,
} from "@chainlink/cre-sdk";

type Config = {
  poolAddress: string;
  creRouterAddress: string;
  dataSource1Url: string;
  dataSource2Url: string;
  dataSource3Url: string;
  triggerThreshold: number;
  comparison: number; // 0=LT, 1=GT
  receiverAddress: string;
  gasLimit: number;
  chainSelectorName: string;
};

// Named callback for HTTP data source fetch
const fetchSource = (
  sendRequester: HTTPSendRequester,
  url: string,
): Record<string, unknown> => {
  const resp = sendRequester.sendRequest({ url, method: "GET" }).result();
  if (!ok(resp)) throw new Error(`Source failed: ${resp.statusCode}`);
  return JSON.parse(new TextDecoder().decode(resp.body));
};

const initWorkflow = (config: Config) => {
  const cron = new CronCapability();

  return [
    handler(
      cron.trigger({ schedule: "*/10 * * * *" }),
      (runtime: Runtime<Config>, _payload: CronPayload): string => {
        // Import viem inside handler — NOT at module level (CRE WASM constraint)
        const { encodeAbiParameters, parseAbiParameters } =
          require("viem") as typeof import("viem");

        const network = getNetwork({
          chainFamily: "evm",
          chainSelectorName: config.chainSelectorName,
          isTestnet: true,
        });
        if (!network)
          throw new Error(`Network not found: ${config.chainSelectorName}`);

        const evmClient = new EVMClient(network.chainSelector.selector);
        const httpClient = new HTTPClient();

        // 1. Fetch from 3 data sources (3 HTTP calls of 5 max)
        runtime.log("Fetching data from 3 sources...");

        const source1 = httpClient
          .sendRequest(runtime, fetchSource, consensusIdenticalAggregation())(
            config.dataSource1Url,
          )
          .result();

        const source2 = httpClient
          .sendRequest(runtime, fetchSource, consensusIdenticalAggregation())(
            config.dataSource2Url,
          )
          .result();

        const source3 = httpClient
          .sendRequest(runtime, fetchSource, consensusIdenticalAggregation())(
            config.dataSource3Url,
          )
          .result();

        // 2. Extract numeric values and compute median
        const extractValue = (data: Record<string, unknown>): number => {
          const d = data as Record<string, any>;
          if (d?.btc?.change24h !== undefined) return d.btc.change24h;
          if (d?.rainfall_mm !== undefined) return d.rainfall_mm;
          if (d?.delay_minutes !== undefined) return d.delay_minutes;
          if (d?.price !== undefined) return d.price;
          if (d?.value !== undefined) return d.value;
          return 0;
        };

        const values = [
          extractValue(source1),
          extractValue(source2),
          extractValue(source3),
        ].sort((a, b) => a - b);

        const medianValue = values[1]; // middle of 3 sorted values
        runtime.log(
          `Median value: ${medianValue}, Threshold: ${config.triggerThreshold}`,
        );

        // 3. Compare against threshold
        const threshold = config.triggerThreshold;
        let triggered = false;
        if (config.comparison === 0) {
          // LT
          triggered = medianValue < threshold;
        } else {
          // GT
          triggered = medianValue > threshold;
        }

        // 4. Determine action: LOG(0), SETTLEMENT(1), or BORDERLINE -> emit event
        const thresholdDistance = Math.abs(medianValue - threshold);
        const thresholdPercent =
          Math.abs(threshold) > 0
            ? (thresholdDistance / Math.abs(threshold)) * 100
            : thresholdDistance;
        const isBorderline = thresholdPercent <= 10;

        // Variance check across sources
        const maxVal = values[2];
        const minVal = values[0];
        const sourceVariance =
          Math.abs(maxVal) > 0
            ? ((maxVal - minVal) / Math.abs(maxVal)) * 100
            : 0;
        const sourcesDisagree = sourceVariance > 5;

        let action: number; // 0=LOG, 1=SETTLEMENT
        let consecutiveCount = 0;
        let confidence = 0;

        if (triggered && !isBorderline && !sourcesDisagree) {
          // Clean trigger — direct settlement
          action = 1; // SETTLEMENT
          consecutiveCount = 1;
          confidence = 100; // 1.0 scaled to uint256 (100 = 100%)
          runtime.log("SETTLEMENT: Clean trigger confirmed");
        } else if (isBorderline || (triggered && sourcesDisagree)) {
          // Borderline — encode as LOG with borderline flag so settlement picks it up
          action = 0; // LOG — but with consecutiveCount > 0 to signal borderline
          consecutiveCount = 1; // signals borderline event
          confidence = 0;
          runtime.log(
            "BORDERLINE: Near threshold or sources disagree — flagging for AI adjudication",
          );
        } else {
          // Not triggered
          action = 0; // LOG
          consecutiveCount = 0;
          confidence = 0;
          runtime.log("LOG: Value within safe range");
        }

        // 5. Encode report: (uint8 action, int256 value, uint8 consecutiveCount, uint256 confidence)
        const scaledValue = BigInt(Math.round(medianValue * 100)); // scale to avoid decimals
        const encodedPayload = encodeAbiParameters(
          parseAbiParameters("uint8, int256, uint8, uint256"),
          [action, scaledValue, consecutiveCount, BigInt(confidence)],
        );

        // 6. Generate signed report
        const reportResponse = runtime
          .report(prepareReportRequest(encodedPayload))
          .result();

        // 7. Write to CRERouter
        const writeResult = evmClient
          .writeReport(runtime, {
            receiver: config.receiverAddress,
            report: reportResponse,
            gasConfig: { gasLimit: config.gasLimit },
          })
          .result();

        runtime.log(`Write result tx status: ${writeResult.txStatus}`);

        return `Monitoring complete: action=${action}, value=${medianValue}`;
      },
    ),
  ];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
