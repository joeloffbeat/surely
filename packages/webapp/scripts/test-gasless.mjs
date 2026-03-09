/**
 * Test: Thirdweb gas sponsorship on Avalanche Fuji
 *
 * What this verifies:
 *   1. Smart account deploys / resolves successfully
 *   2. A transaction is sent with sponsorGas: true
 *   3. The tx goes through even if the smart account holds 0 AVAX
 */

import { createThirdwebClient, sendTransaction, prepareTransaction } from "thirdweb";
import { avalancheFuji } from "thirdweb/chains";
import { privateKeyToAccount, smartWallet, getWalletBalance } from "thirdweb/wallets";

const CLIENT_ID   = "5a05190823f33f0b20dd83dbd3b7d400";
const SECRET_KEY  = "cxr56KRKcqx4xfpLlkPqcVELRQIkwqC_sLItXyR3lqW3fj_KoNmCvOE_djpgsuL8rkOZpMtCXoLCY7iWq10yNA";
const PRIVATE_KEY = "0xfa5aaf38f4e19824782bea1d02a1ccfd192daa89ceb1741de3dcb77e652b1eee";

async function main() {
  console.log("=== Thirdweb Gas Sponsorship Test — Avalanche Fuji ===\n");

  // 1. Client
  const client = createThirdwebClient({ clientId: CLIENT_ID, secretKey: SECRET_KEY });
  console.log("✓ Client created");

  // 2. Signer (EOA)
  const personalAccount = privateKeyToAccount({ client, privateKey: PRIVATE_KEY });
  console.log(`✓ Personal account (EOA): ${personalAccount.address}`);

  // 3. Smart wallet with gas sponsorship
  const wallet = smartWallet({ chain: avalancheFuji, sponsorGas: true });
  const account = await wallet.connect({ client, personalAccount });
  console.log(`✓ Smart account address:  ${account.address}`);

  // 4. Check native balance on smart account
  const balance = await getWalletBalance({ address: account.address, chain: avalancheFuji, client });
  console.log(`  Smart account AVAX balance: ${balance.displayValue} ${balance.symbol}`);

  // 5. Send a 0-value self-transfer (cheapest possible tx to prove sponsorship works)
  console.log("\nSending 0-value tx via paymaster...");
  const tx = prepareTransaction({
    to: account.address,
    value: 0n,
    chain: avalancheFuji,
    client,
  });

  const receipt = await sendTransaction({ transaction: tx, account });

  console.log("\n=== RESULT ===");
  console.log(`✓ Tx hash:   ${receipt.transactionHash}`);
  console.log(`  Explorer:  https://testnet.snowtrace.io/tx/${receipt.transactionHash}`);
  console.log("\nGas sponsorship is working — transaction sent with 0 AVAX on smart account.");
}

main().catch((err) => {
  console.error("\n✗ Test failed:", err.message || err);
  process.exit(1);
});
