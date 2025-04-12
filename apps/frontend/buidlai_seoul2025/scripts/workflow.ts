import { MastraClient } from '@mastra/client-js';

// Initialize the client
const client = new MastraClient({
    // https://mastra-buidlseoul25-production.up.railway.app/swagger-ui
    baseUrl: 'https://mastra-buidlseoul25-production.up.railway.app', // Your Mastra API endpoint
});

// Function to execute the hyperbolic-inference tool
async function executeHyperbolicInference(query: string) {
    try {
        // Get the tool instance
        const workflows = await client.getWorkflows()
        console.log("🚀 ~ executeHyperbolicInference ~ workflows:", workflows)
        const workflow = client.getWorkflow('hyperbolicInferenceWorkflow')

        // Execute the tool with the query
        const run = await workflow.createRun();

        const result = await workflow.start({
            runId: run.runId,
            triggerData: {
                prompt: query
            }
        })

        console.log('Hyperbolic Inference Result:');
        console.log(JSON.stringify(result, null, 2));

        // workflow.watch({runId: run.runId}, (record) => {
        //     console.log('Workflow run state:', record.results);
        //     console.log('Workflow run timestamp:', record.timestamp);
        //     console.log('Workflow run active paths:', record.activePaths);
        // })

        return result;
    } catch (error) {
        console.error('Error executing hyperbolic-inference tool:', error);
        throw error;
    }
}

// Example usage
async function main() {
    const query = "What are the implications of quantum computing on blockchain technology?";

    console.log(`Executing hyperbolic-inference tool with query: "${query}"`);
    await executeHyperbolicInference(query);
}

// Run the main function
main().catch(console.error);


