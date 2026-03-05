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
  stripeVerifyUrl: string;
  czusdConsumerAddress: string;
  receiverAddress: string;
  gasLimit: number;
  chainSelectorName: string;
  publicKey: string;
};

type StripeVerifyResult = {
  verified: boolean;
  amount: number;
};

// Named callback for Stripe verification HTTP call
const verifyStripePayment = (
  sendRequester: HTTPSendRequester,
  bodyBytes: Uint8Array,
  url: string,
): StripeVerifyResult => {
  const resp = sendRequester
    .sendRequest({
      url,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: bodyBytes,
    })
    .result();
  if (!ok(resp)) throw new Error(`Stripe verify failed: ${resp.statusCode}`);
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
          throw new Error("Empty payment webhook payload");
        }

        const inputData = decodeJson(payload.input) as {
          paymentIntentId: string;
          amount: number;
          recipient: string;
        };

        runtime.log(
          `Fiat payment: ${inputData.paymentIntentId}, amount=${inputData.amount}, recipient=${inputData.recipient}`,
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

        // 1. Verify payment with Stripe mock (1 HTTP call of 5 max)
        const verifyBody = JSON.stringify({
          paymentIntentId: inputData.paymentIntentId,
          amount: inputData.amount,
        });
        const bodyBytes = new Uint8Array(
          Array.from(verifyBody).map((c) => c.charCodeAt(0)),
        );

        const stripeResult = httpClient
          .sendRequest(runtime, verifyStripePayment, consensusIdenticalAggregation())(
            bodyBytes,
            config.stripeVerifyUrl,
          )
          .result();

        if (!stripeResult.verified) {
          throw new Error("Stripe payment verification failed");
        }

        runtime.log(`Stripe verified: amount=${stripeResult.amount}`);

        // 2. Generate proof hash from payment data
        const proofStr = `${inputData.paymentIntentId}|${inputData.amount}|${inputData.recipient}`;
        const proofBytes = new Uint8Array(
          Array.from(proofStr).map((c) => c.charCodeAt(0)),
        );
        // Simple hash: use first 32 bytes padded
        const hashHex =
          "0x" +
          Array.from(proofBytes.slice(0, 32))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")
            .padEnd(64, "0");

        // 3. Encode report for CZUSDConsumer
        // (uint8 workflowType=2 MINT_FIAT, address recipient, uint256 amount, bytes32 paymentProofHash)
        const amountCzusd = BigInt(inputData.amount) * BigInt(10 ** 6); // CZUSD has 6 decimals
        const encodedPayload = encodeAbiParameters(
          parseAbiParameters("uint8, address, uint256, bytes32"),
          [
            2, // MINT_FIAT
            inputData.recipient as `0x${string}`,
            amountCzusd,
            hashHex as `0x${string}`,
          ],
        );

        // 4. Generate signed report
        const reportResponse = runtime
          .report(prepareReportRequest(encodedPayload))
          .result();

        // 5. Write to CZUSDConsumer
        const writeResult = evmClient
          .writeReport(runtime, {
            receiver: config.receiverAddress,
            report: reportResponse,
            gasConfig: { gasLimit: config.gasLimit },
          })
          .result();

        runtime.log(
          `Fiat payment processed, tx status: ${writeResult.txStatus}`,
        );

        return `CZUSD mint: ${inputData.amount} for ${inputData.recipient}`;
      },
    ),
  ];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
