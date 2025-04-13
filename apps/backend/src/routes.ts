import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authenticate, initiateAgentRun } from './services/near.js';
import { callAgentInitiated } from './services/evm.js';
import { redis } from './services/redis.js';
import { AuthPayload } from './types.js';

export const app = new Hono();

app.use('*', cors());

app.post('/api/store-session', async (c) => {
  const auth = await c.req.json<AuthPayload>();
  const isValid = await authenticate(auth);
  if (!isValid) return c.json({ error: 'Invalid session' }, 401);

  await redis.set(`session:${auth.accountId}`, JSON.stringify(auth), 'EX', 3600);
  return c.json({ success: true });
});

app.post('/api/ask-agent', async (c) => {
  console.log("🔍 Received ask-agent request");
  const { accountId, question } = await c.req.json<{ accountId: string; question: string }>();
  console.log("🔍 Account ID:", accountId);
  console.log("🔍 Question:", question);
  const sessionData = await redis.get(`session:${accountId}`);
  if (!sessionData) return c.json({ error: 'Session not found' }, 401);
  console.log("✅ Session found:", sessionData);
  const auth = JSON.parse(sessionData) as AuthPayload;
  const { threadId, runId } = await initiateAgentRun(auth, question);

  await redis.hset(`agent:${accountId}`, {
    threadId,
    runId,
    status: 'running',
    accountId,
  });

  await callAgentInitiated(accountId, threadId);

  return c.json({ success: true, threadId, runId });
});

app.get('/api/result', async (c) => {
  const accountId = c.req.query('accountId');
  const agentData = await redis.hgetall(`agent:${accountId}`);

  if (!agentData || !agentData.result) {
    return c.json({ status: 'pending' });
  }

  return c.json({ status: 'completed', result: agentData.result });
});
