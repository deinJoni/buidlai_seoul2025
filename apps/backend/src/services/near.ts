import OpenAI from 'openai';
import * as borsh from 'borsh';
import * as naj from 'near-api-js';
import js_sha256 from 'js-sha256';

import { AuthPayload } from '../types.js';

let openai: OpenAI;

class Payload {
  tag: number;
  message: string;
  nonce: Uint8Array;
  recipient: string;
  callbackUrl?: string;

  constructor({ message, nonce, recipient, callbackUrl }: any) {
    this.tag = 2147484061;
    this.message = message;
    this.nonce = new Uint8Array(Buffer.from(nonce));
    this.recipient = recipient;
    if (callbackUrl) this.callbackUrl = callbackUrl;
  }
}

const payloadSchema = {
  struct: {
    tag: 'u32',
    message: 'string',
    nonce: { array: { type: 'u8', len: 32 } },
    recipient: 'string',
    callbackUrl: { option: 'string' },
  },
};

export async function authenticate(auth: AuthPayload): Promise<boolean> {
  const fullKey = await verifyFullKeyBelongsToUser(auth.accountId, auth.publicKey);
  const signatureValid = verifySignature(auth);
  
  if (fullKey && signatureValid) {
    openai = new OpenAI({
      baseURL: "https://api.near.ai/v1",
      apiKey: `Bearer ${JSON.stringify(auth)}`
    });
    return true;
  }
  return false;
}

function verifySignature(auth: AuthPayload): boolean {
  const payload = new Payload(auth);
  const serialized = borsh.serialize(payloadSchema, payload);
  const toSign = Uint8Array.from(js_sha256.sha256.array(serialized));
  const realSignature = Buffer.from(auth.signature, 'base64');
  const publicKey = naj.utils.PublicKey.from(auth.publicKey);
  return publicKey.verify(toSign, realSignature);
}

async function verifyFullKeyBelongsToUser(accountId: string, publicKey: string): Promise<boolean> {
  const response = await fetch('https://test.rpc.fastnear.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'query',
      params: [`access_key/${accountId}`, ''],
      id: 1,
    }),
  });
  const data = await response.json();
  return data.result.keys.some(
    (k: any) => k.public_key === publicKey && k.access_key.permission === 'FullAccess'
  );
}

export async function initiateAgentRun(auth: AuthPayload, question: string) {
  const thread = await openai.beta.threads.create();
  await openai.beta.threads.messages.create(thread.id, {
    role: 'user',
    content: question,
  });
  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: process.env.AGENT_ID!,
  });

  return { threadId: thread.id, runId: run.id };
}

export async function getAgentStatus(threadId: string, runId: string) {
  const run = await openai.beta.threads.runs.retrieve(threadId, runId);
  return run.status;
}

export async function getAgentResult(threadId: string) {
  const messages = await openai.beta.threads.messages.list(threadId);
  const message = messages.data.find(m => m.role === 'assistant');
  const content = message?.content[0];
  return content?.type === 'text' ? content.text.value : '';
}
