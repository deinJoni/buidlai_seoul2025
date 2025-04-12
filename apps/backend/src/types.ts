export interface AuthPayload {
    accountId: string;
    publicKey: string;
    signature: string;
    message: string;
    nonce: string;
    recipient: string;
    callbackUrl?: string;
  }
  