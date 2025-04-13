import { setupWalletSelector, WalletModuleFactory, WalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupNearWallet } from "@near-wallet-selector/near-wallet";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { keyStores, utils } from "near-api-js";
import "@near-wallet-selector/modal-ui/styles.css";

let selector: WalletSelector | null = null;
let modal: ReturnType<typeof setupModal> | null = null;

const network = "testnet";

export async function initNear() {
  if (selector) return selector;
  const modules = [setupNearWallet(), setupMyNearWallet()] as unknown as WalletModuleFactory[];

  selector = await setupWalletSelector({
    network,
    modules,
  });


  modal = setupModal(selector, { contractId: "test.near" }); // Optional contractId
  return selector;
}

export function showWalletModal() {
  if (!modal) throw new Error("Wallet modal not initialized");
  modal.show();
}

export async function getAccountId() {
  if (!selector) throw new Error("Wallet selector not initialized");
  const state = selector.store.getState();
  return state.accounts[0]?.accountId || null;
}

export async function isSignedIn() {
  if (!selector) throw new Error("Wallet selector not initialized");
  const state = selector.store.getState();
  return state.accounts.length > 0;
}

export async function signOut() {
  if (!selector) throw new Error("Wallet selector not initialized");
  const wallet = await selector.wallet();
  await wallet.signOut();
}

export async function signMessage({ message, nonce, recipient, callbackUrl }: { message: string, nonce: string, recipient: string, callbackUrl?: string }) {
  const accountId = await getAccountId();
  if (!accountId) throw new Error("No account found");

  const keyStore = new keyStores.BrowserLocalStorageKeyStore();
  const keyPair = await keyStore.getKey(network, accountId);
  if (!keyPair) throw new Error("KeyPair not found");

  const payload = {
    tag: 2147484061,
    message,
    nonce: Buffer.from(nonce).toString(),
    recipient,
    callbackUrl,
  };

  const borsh = await import("borsh");
  const schema = {
    struct: {
      tag: "u32",
      message: "string",
      nonce: { array: { type: "u8", len: 32 } },
      recipient: "string",
      callbackUrl: { option: "string" },
    },
  };

  const serialized = borsh.serialize(schema, payload);
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", serialized));
  const signature = keyPair.sign(hash).signature;

  return {
    signature: Buffer.from(signature).toString("base64"),
    publicKey: keyPair.getPublicKey().toString(),
    accountId,
  };
}
