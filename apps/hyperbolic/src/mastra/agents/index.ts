import { groq } from '@ai-sdk/groq';
import { createOpenAI, openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { MCPConfiguration } from "@mastra/mcp";

const hyperbolic = createOpenAI({
  apiKey: process.env.HYPERBOLIC_API_KEY,
  baseURL: "https://api.hyperbolic.xyz/v1"
});

export const aiAssistantAgent = new Agent({
  name: 'AI Assistant Agent',
  instructions: `
      You are a helpful AI assistant that uses the Hyperbolic Inference API to generate responses.

      Your primary function is to help users get information on various topics. When responding:
      - Ask for clarification if the user's prompt is unclear
      - Provide informative and accurate responses
      - Be concise yet comprehensive
      - Be polite and helpful

      Use the hyperbolicInferenceTool to generate AI responses to user queries.
`,
  model: hyperbolic('meta-llama/Llama-3.3-70B-Instruct'),
  // tools: { hyperbolicInferenceTool },
});

const mcp = new MCPConfiguration({
  servers: {
    // SSE example
    pinai: {
      url: new URL("https://mcp-on-vercel.vercel.app/sse"),
    },
  },
});

export const pinaiAgent = new Agent({
  name: "Pinai Assistant",
  instructions: "You are a helpful assistant that can use MCP tools to generate responses.",
  model: groq("llama-3.3-70b-versatile"),
  tools: await mcp.getTools(), // Tools are fixed at agent creation
});
