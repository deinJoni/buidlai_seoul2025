// NEAR AI Integration using OpenAI SDK
// This implementation uses environment variables for configuration
import OpenAI from "openai";

// For TypeScript compatibility with Vite environment variables
declare interface ImportMeta {
  readonly env: Record<string, string>;
}

// API constants
const NEAR_API_BASE_URL = "https://api.near.ai/v1";

/**
 * Get environment variables with fallbacks
 */
function getEnvVar(name: string, defaultValue: string = ''): string {
  // @ts-ignore - Vite handles this at build time
  return import.meta.env?.[name] || defaultValue;
}

/**
 * Get auth token for NEAR AI
 */
function getAuthToken() {
  return JSON.stringify({
    accountId: getEnvVar('VITE_NEAR_ACCOUNT_ID'),
    publicKey: getEnvVar('VITE_NEAR_PUBLIC_KEY'),
    signature: getEnvVar('VITE_NEAR_SIGNATURE'),
    message: getEnvVar('VITE_NEAR_MESSAGE'),
    nonce: getEnvVar('VITE_NEAR_NONCE'),
    recipient: getEnvVar('VITE_NEAR_RECIPIENT')
  });
}

/**
 * Initialize the OpenAI client configured for NEAR AI
 */
function createClient() {
  return new OpenAI({
    baseURL: NEAR_API_BASE_URL,
    apiKey: `Bearer ${getAuthToken()}`,
    dangerouslyAllowBrowser: true // Required for browser usage
  });
}

/**
 * Ask a question to the NEAR AI agent and get the response
 * @param question The user's question
 * @returns The agent's response
 */
export async function askQuestion(question: string): Promise<string> {
  try {
    const openai = createClient();
    const agentId = getEnvVar('VITE_AGENT_ID', 'einjoni.near/flipside-query-wizard/latest');
    
    // Create a new thread
    const thread = await openai.beta.threads.create();
    
    // Add the user's message to the thread
    await openai.beta.threads.messages.create(
      thread.id,
      {
        role: "user",
        content: question
      }
    );
    
    // Create a run and poll for completion
    const run = await createRunAndPoll(openai, thread.id, agentId);
    
    if (run.status === 'completed') {
      // Get the latest messages
      const messages = await openai.beta.threads.messages.list(thread.id);
      const message = messages.data.find(m => m.role === 'assistant');
      
      if (!message || !message.content || message.content.length === 0) {
        return 'No response received';
      }
      
      const content = message.content[0];
      return content.type === 'text' ? content.text.value : 'Received non-text response';
    } else {
      return `The request ${run.status === 'failed' ? 'failed' : 'timed out'}. Please try again.`;
    }
  } catch (error) {
    console.error('Error asking question:', error);
    if (error instanceof Error) {
      return `Error: ${error.message}`;
    }
    return 'An unknown error occurred';
  }
}

/**
 * Create a run and poll for completion
 */
async function createRunAndPoll(openai: OpenAI, threadId: string, assistantId: string) {
  // Create run
  const run = await openai.beta.threads.runs.create(
    threadId,
    { 
      assistant_id: assistantId
    }
  );
  
  // Poll for completion
  let status = await getRun(openai, threadId, run.id);
  const maxAttempts = 30; // Timeout after ~30 seconds
  let attempts = 0;
  
  while (attempts < maxAttempts && 
        status.status !== 'completed' && 
        status.status !== 'failed' && 
        status.status !== 'cancelled') {
    // Wait before checking again
    await new Promise(resolve => setTimeout(resolve, 1000));
    status = await getRun(openai, threadId, run.id);
    attempts++;
  }
  
  return status;
}

/**
 * Get run status
 */
async function getRun(openai: OpenAI, threadId: string, runId: string) {
  return await openai.beta.threads.runs.retrieve(threadId, runId);
}

async function test() {
  console.log('Testing NEAR AI integration...');
  
  // Example blockchain analytics questions you can try
  const questions = [
    'What were the top 5 NFT collections by volume on Ethereum last week?',
    'Show me the daily active addresses on Solana for the past month',
    'Which DeFi protocols have the highest TVL on Avalanche?',
    'Analyze the gas fees on Ethereum over the last 3 months'
  ];
  
  // Select one question to test
  const testQuestion = questions[0];
  console.log(`Asking: "${testQuestion}"`);
  
  try {
    // Execute the question and get response
    const answer = await askQuestion(testQuestion);
    console.log('Response from NEAR AI:');
    console.log('-'.repeat(50));
    console.log(answer);
    console.log('-'.repeat(50));
  } catch (error) {
    console.error('Error during test:', error);
  }
}
test()

// Example usage in a React component:
/**
 * To use this in a React component:
 * 
 * import { askQuestion } from '../../scripts/nearai';
 * import { useState } from 'react';
 * 
 * function NearAIExample() {
 *   const [question, setQuestion] = useState('');
 *   const [answer, setAnswer] = useState('');
 *   const [loading, setLoading] = useState(false);
 *   
 *   const handleSubmit = async (e) => {
 *     e.preventDefault();
 *     if (!question) return;
 *     
 *     setLoading(true);
 *     try {
 *       const response = await askQuestion(question);
 *       setAnswer(response);
 *     } catch (error) {
 *       console.error(error);
 *       setAnswer('Error processing your question');
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 *   
 *   return (
 *     <div>
 *       <form onSubmit={handleSubmit}>
 *         <input
 *           value={question}
 *           onChange={(e) => setQuestion(e.target.value)}
 *           placeholder="Ask a blockchain analytics question..."
 *         />
 *         <button type="submit" disabled={loading}>
 *           {loading ? 'Processing...' : 'Ask'}
 *         </button>
 *       </form>
 *       {answer && (
 *         <div>
 *           <h3>Response:</h3>
 *           <p>{answer}</p>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 */