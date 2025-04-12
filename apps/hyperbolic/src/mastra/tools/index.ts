import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { mcpTool } from './mcp';

export { mcpTool };

export const hyperbolicInferenceTool = createTool({
  id: 'hyperbolic-inference',
  description: 'Generate AI responses using Hyperbolic API',
  inputSchema: z.object({
    prompt: z.string().describe('User prompt for the AI model'),
    model: z.string().default('meta-llama/Llama-3.3-70B-Instruct').optional().describe('AI model to use'),
    temperature: z.number().default(0.1).optional().describe('Temperature for generation'),
    maxTokens: z.number().default(512).optional().describe('Maximum tokens to generate'),
    topP: z.number().default(0.9).optional().describe('Top-p sampling parameter'),
  }),
  outputSchema: z.object({
    response: z.string().describe('AI response'),
  }),
  execute: async ({ context }) => {
    return await generateResponse(
      context.prompt, 
      context.model || 'meta-llama/Llama-3.3-70B-Instruct',
      context.temperature || 0.1,
      context.maxTokens || 512,
      context.topP || 0.9
    );
  },
});

const generateResponse = async (
  prompt: string,
  model: string = 'meta-llama/Llama-3.3-70B-Instruct',
  temperature: number = 0.1,
  maxTokens: number = 512,
  topP: number = 0.9
) => {
  const url = 'https://api.hyperbolic.xyz/v1/chat/completions';

  if (!process.env.HYPERBOLIC_API_KEY) {
    throw new Error('HYPERBOLIC_API_KEY environment variable is not set');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.HYPERBOLIC_API_KEY}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [{
        "role": "user",
        "content": prompt
      }],
      max_tokens: maxTokens,
      temperature: temperature,
      top_p: topP,
      stream: false
    }),
  });

  const json = await response.json();
  
  if (!json.choices || !json.choices[0]) {
    throw new Error('Invalid response from Hyperbolic API');
  }

  return {
    response: json.choices[0].message.content,
  };
};
