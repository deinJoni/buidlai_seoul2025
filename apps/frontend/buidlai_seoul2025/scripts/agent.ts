import { MastraClient } from '@mastra/client-js';

// Initialize the client
const client = new MastraClient({
    // https://mastra-buidlseoul25-production.up.railway.app/swagger-ui
    baseUrl: 'https://mastra-buidlseoul25-production.up.railway.app', // Your Mastra API endpoint
});

// Example: Working with an Agent
async function main() {
    // Get an agent instance
    const agent = client.getAgent('aiAssistantAgent');
    // const agent = client.getAgent('pinaiAgent');

    // Generate a response
    const response = await agent.generate({
        messages: [{ role: 'user', content: "What's the weather like today?" }],
    });

    console.log(response);
}

main().catch(console.error);