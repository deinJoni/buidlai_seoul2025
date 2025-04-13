import { BrowserLocalStorageKeyStore } from "near-api-js/lib/key_stores";

export async function sendSessionToBackend(accountId: string) {
  const nonce = Date.now().toString();
  const message = "Login to NEAR AI";
  const recipient = "near-ai-backend";
  const callbackUrl = "";

  const payload = { message, nonce, recipient, callbackUrl };
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));

  const keyStore = new BrowserLocalStorageKeyStore();
  const keyPair = await keyStore.getKey("testnet", accountId);

  if (!keyPair) throw new Error("KeyPair not found for account");

  const { signature, publicKey } = keyPair.sign(payloadBytes);

  const sessionPayload = {
    signature: Buffer.from(signature).toString("base64"),
    accountId,
    publicKey: publicKey.toString(),
    message,
    nonce,
    recipient,
    callbackUrl,
  };

  await fetch(import.meta.env.VITE_BACKEND_URL + "/api/store-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sessionPayload),
  });
}
