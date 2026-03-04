import {
  HTTPCapability,
  HTTPClient,
  EVMClient,
  handler,
  getNetwork,
  prepareReportRequest,
  Runner,
  ok,
  consensusIdenticalAggregation,
  type Runtime,
  type HTTPPayload,
  type HTTPSendRequester,
  decodeJson,
} from "@chainlink/cre-sdk";

type Config = {
  verificationApiUrl: string;
  complianceConsumerAddress: string;
  receiverAddress: string;
  gasLimit: number;
  chainSelectorName: string;
  publicKey: string;
};

type VerifyResult = {
  eligible: boolean;
  kycPassed: boolean;
  proofHash: string;
};

// Named callback for verification HTTP call
const verifyUser = (
  sendRequester: HTTPSendRequester,
  url: string,
  bodyBytes: Uint8Array,
): VerifyResult => {
  const resp = sendRequester
    .sendRequest({
      url,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: bodyBytes,
    })
    .result();
  if (!ok(resp)) throw new Error(`Verification failed: ${resp.statusCode}`);
  return JSON.parse(new TextDecoder().decode(resp.body));
};

const initWorkflow = (config: Config) => {
  const http = new HTTPCapability();

  return [
    handler(
      http.trigger({
        authorizedKeys: [
          { type: "KEY_TYPE_ECDSA_EVM", publicKey: config.publicKey },
        ],
      }),
      (runtime: Runtime<Config>, payload: HTTPPayload): string => {
        const { encodeAbiParameters, parseAbiParameters } =
          require("viem") as typeof import("viem");

        if (!payload.input || payload.input.length === 0) {
          throw new Error("Empty eligibility request");
        }

        const inputData = decodeJson(payload.input) as {
          userAddress: string;
          verificationType: number;
          verificationData: Record<string, string>;
        };

        runtime.log(
          `Eligibility check for ${inputData.userAddress}, type=${inputData.verificationType}`,
        );

        const network = getNetwork({
          chainFamily: "evm",
          chainSelectorName: config.chainSelectorName,
          isTestnet: true,
        });
        if (!network)
          throw new Error(`Network not found: ${config.chainSelectorName}`);

        const evmClient = new EVMClient(network.chainSelector.selector);
        const httpClient = new HTTPClient();

        // 1. Call mock verification API (1 HTTP call of 5 max)
        const verifyBody = JSON.stringify(inputData.verificationData);
        const bodyBytes = new Uint8Array(
          Array.from(verifyBody).map((c) => c.charCodeAt(0)),
        );

        const verifyResult = httpClient
          .sendRequest(runtime, verifyUser, consensusIdenticalAggregation())(
            `${config.verificationApiUrl}/verify/all`,
            bodyBytes,
          )
          .result();

        runtime.log(
          `Verification result: eligible=${verifyResult.eligible}, kycPassed=${verifyResult.kycPassed}`,
        );

        // 2. Encode report for ComplianceConsumer
        const proofHashBytes = verifyResult.proofHash as `0x${string}`;
        const encodedPayload = encodeAbiParameters(
          parseAbiParameters("uint8, address, uint8, bytes32, bool"),
          [
            0, // actionType = eligibility store
            inputData.userAddress as `0x${string}`,
            inputData.verificationType,
            proofHashBytes,
            verifyResult.kycPassed,
          ],
        );

        // 3. Generate signed report
        const reportResponse = runtime
          .report(prepareReportRequest(encodedPayload))
          .result();

        // 4. Write to ComplianceConsumer
        const writeResult = evmClient
          .writeReport(runtime, {
            receiver: config.receiverAddress,
            report: reportResponse,
            gasConfig: { gasLimit: config.gasLimit },
          })
          .result();

        runtime.log(
          `Eligibility proof written, tx status: ${writeResult.txStatus}`,
        );

        return `Eligibility verified: eligible=${verifyResult.eligible}`;
      },
    ),
  ];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
