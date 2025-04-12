import { groq } from '@ai-sdk/groq';
import { createTool } from '@mastra/core/tools';
import { experimental_createMCPClient as createMCPClient, generateText } from 'ai';
import { z } from 'zod';

// use mastra MCP instead

export const mcpTool = createTool({
    id: 'mcp-tool',
    description: 'Use Multi-Client Protocol (MCP) client to access external tools',
    inputSchema: z.object({
        prompt: z.string().describe('User prompt for the AI model'),
    }),
    execute: async ({ context }) => {
        try {
            const mcpClient = await createMCPClient({
                transport: {
                    type: 'sse',
                    url: "https://mcp-on-vercel.vercel.app/sse",
                },
            });

            const result = await generateText({
                model: groq('llama-3.3-70b-versatile'),
                tools: await mcpClient.tools(), // use MCP tools
                prompt: context.prompt,
            });
            console.log("🚀 ~ execute: ~ result:", result.toolCalls)

            // Convert the result to a string and return in the expected format
            return {
                response: result.response.messages
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Error in MCP tool:', errorMessage);
            throw new Error(`Failed to generate response using MCP: ${errorMessage}`);
        }
    },
});
