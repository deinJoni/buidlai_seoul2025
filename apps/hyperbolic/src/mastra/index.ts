
import { Mastra } from '@mastra/core/mastra';
import { createLogger } from '@mastra/core/logger';
import { weatherWorkflow } from './workflows';
import { aiAssistantAgent, pinaiAgent } from './agents';

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { aiAssistantAgent, pinaiAgent },
  logger: createLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
