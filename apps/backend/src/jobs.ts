import { redis } from './services/redis.js';
import { callAgentFinished } from './services/evm.js';
import { getAgentResult, getAgentStatus } from './services/near.js';

async function pollAgents() {
  const keys = await redis.keys('agent:*');

  for (const key of keys) {
    const agentData = await redis.hgetall(key);
    if (agentData.status !== 'running') continue;

    const status = await getAgentStatus(agentData.threadId, agentData.runId);

    if (status === 'completed') {
      const result = await getAgentResult(agentData.threadId);
      await callAgentFinished(agentData.accountId, agentData.threadId, result);
      await redis.hset(key, { status: 'completed', result });
    }
  }
}

setInterval(pollAgents, 10000);
