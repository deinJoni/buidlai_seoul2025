import { useState, useEffect, useRef } from 'react'
import './App.css'
import '@rainbow-me/rainbowkit/styles.css'

import {
  getDefaultConfig,
  RainbowKitProvider,
  ConnectButton
} from '@rainbow-me/rainbowkit'
import { WagmiProvider, useWriteContract, useAccount, useReadContract } from 'wagmi'
import { defineChain } from 'viem'
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query"
// Import http for when you uncomment the transports section
import { http } from 'wagmi'
import { sagaABI, sagaContractAddress } from './sagaABI'
import { MastraClient } from '@mastra/client-js'

// Initialize the Mastra client
const mastraClient = new MastraClient({
  baseUrl: 'https://mastra-buidlseoul25-production.up.railway.app',
})

// Define SAGA Chainlet
const sagaChainlet = defineChain({
  id: 2744367451770000,
  name: 'SAGA Chainlet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://buidlseoul-2744367451770000-1.jsonrpc.sagarpc.io'],
    },
  },
  blockExplorers: {
    default: { 
      name: 'SAGA Explorer', 
      url: 'https://app.saga.xyz/chainlets/detail/?chainId=buidlseoul_2744367451770000-1' 
    },
  },
})

// Configure wagmi and rainbowkit
const config = getDefaultConfig({
  appName: 'BuidlAI Seoul 2025',
  projectId: 'YOUR_PROJECT_ID', // Replace with your WalletConnect project ID
  chains: [sagaChainlet],
  ssr: true,
  // For production, use dedicated RPC endpoints
  transports: {
    [sagaChainlet.id]: http('https://buidlseoul-2744367451770000-1.jsonrpc.sagarpc.io'),
  }
})

// Create the query client
const queryClient = new QueryClient()

// Main App Component - Providers
function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ResearchAssistant />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

// Define the Query type based on contract structure
interface Query {
  user: string;
  queryText: string;
  state: number;
  runId: bigint;
}

// Message type for chat history
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// ResearchAssistant Component - Contains main functionality
function ResearchAssistant() {
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedQueryId, setSelectedQueryId] = useState<number | null>(null)
  const [chatHistory, setChatHistory] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingAnswer, setStreamingAnswer] = useState('')
  const chatContainerRef = useRef<HTMLDivElement>(null)
  
  // Get account information
  const { isConnected } = useAccount()
  
  // Write contract function for submitting queries
  const { writeContract, isPending, isSuccess, error } = useWriteContract()
  
  // Read contract to get owner
  const { data: ownerData } = useReadContract({
    address: sagaContractAddress,
    abi: sagaABI,
    functionName: 'owner',
  })
  
  // Read contract to get query data by ID
  const { data: queryData } = useReadContract({
    address: sagaContractAddress,
    abi: sagaABI,
    functionName: 'queries',
    args: selectedQueryId !== null ? [BigInt(selectedQueryId)] : undefined,
    query: {
      enabled: selectedQueryId !== null,
    }
  })
  
  // Handle submitting a query to the blockchain
  const handleSubmitToBlockchain = async () => {
    if (!query.trim() || !isConnected) return;
    
    try {
      setLoading(true);
      
      // Submit query to blockchain
      writeContract({
        address: sagaContractAddress,
        abi: sagaABI,
        functionName: 'submitQuery',
        args: [query],
      });
      
    } catch (err) {
      console.error('Error submitting query to blockchain:', err);
      setAnswer(`Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
      setLoading(false);
    }
  }
  
  // Watch for transaction success/failure
  useEffect(() => {
    if (isSuccess) {
      setAnswer(`Query submitted to blockchain successfully!`);
      setLoading(false);
    } else if (error) {
      setAnswer(`Error: ${error.message}`);
      setLoading(false);
    }
  }, [isSuccess, error]);
  
  // Use AI agent to get a response
  const getAIResponse = async (userQuery: string) => {
    try {
      // Add user message to chat history
      const userMessage: Message = { role: 'user', content: userQuery };
      setChatHistory(prev => [...prev, userMessage]);
      
      // Get agent instance
      const agent = mastraClient.getAgent('aiAssistantAgent');
      
      // Start loading
      setIsStreaming(true);
      setStreamingAnswer('');
      
      // Generate the response
      const response = await agent.generate({
        messages: chatHistory.concat(userMessage).map(msg => ({ 
          role: msg.role, 
          content: msg.content 
        })),
      });
      
      // Add assistant response to chat history
      if (response && typeof response === 'object') {
        // Access the response content based on the actual response structure
        const responseObj = response as Record<string, any>;
        let responseContent = '';
        
        // Log the response to help debug the structure
        console.log('AI Response:', responseObj);
        
        // Try to extract content from various possible response formats
        if (responseObj.content !== undefined) {
          responseContent = String(responseObj.content);
        } else if (responseObj.text !== undefined) {
          responseContent = String(responseObj.text);
        } else {
          // Fallback to stringify the entire response
          responseContent = JSON.stringify(responseObj);
        }
        
        const assistantMessage: Message = { role: 'assistant', content: responseContent };
        setChatHistory(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Invalid response format');
      }
      
      // Clear loading state
      setIsStreaming(false);
      setStreamingAnswer('');
      
    } catch (err) {
      console.error('Error getting AI response:', err);
      
      // Add error message to chat history
      const errorMessage: Message = { 
        role: 'assistant', 
        content: `Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`
      };
      setChatHistory(prev => [...prev, errorMessage]);
      
      setIsStreaming(false);
      setStreamingAnswer('');
    }
  };
  
  // Regular search functionality with AI
  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    
    try {
      // Clear previous answer
      setAnswer('');
      
      // Get AI response
      await getAIResponse(query);
      
      // Clear query input
      setQuery('');
    } catch (err) {
      console.error('Error in search:', err);
      setAnswer(`Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Process query data when available
  useEffect(() => {
    if (queryData) {
      console.log('Query data:', queryData);
      // Process the query data
    }
  }, [queryData]);

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, streamingAnswer]);

  // Helper function to check if queryData is a valid Query object
  const isValidQueryData = (data: unknown): data is Query => {
    return (
      typeof data === 'object' &&
      data !== null &&
      'user' in data &&
      'queryText' in data &&
      'state' in data &&
      'runId' in data
    );
  };

  // Extract typed query data
  const typedQueryData = isValidQueryData(queryData) ? queryData : null;

  // Format message timestamp
  const formatTimestamp = () => {
    const now = new Date();
    return `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="container">
      <h1>Research Assistant</h1>
      
      {/* RainbowKit Connect Button */}
      <div className="wallet-connect">
        <ConnectButton />
      </div>
      
      {ownerData && (
        <div className="contract-info">
          <p>Contract Owner: {ownerData as string}</p>
        </div>
      )}
      
      {/* Chat container */}
      <div className="chat-container" ref={chatContainerRef}>
        {chatHistory.length === 0 ? (
          <div className="welcome-message">
            <h3>Welcome to Research Assistant!</h3>
            <p>Ask me any research question and I'll help you find the answer.</p>
          </div>
        ) : (
          chatHistory.map((message, index) => (
            <div 
              key={index} 
              className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
            >
              <div className="message-header">
                <span className="message-sender">
                  {message.role === 'user' ? 'You' : 'Assistant'}
                </span>
                <span className="message-time">{formatTimestamp()}</span>
              </div>
              <div className="message-content">
                {message.content}
              </div>
            </div>
          ))
        )}
        
        {/* Show streaming response */}
        {isStreaming && (
          <div className="message assistant-message">
            <div className="message-header">
              <span className="message-sender">Assistant</span>
              <span className="message-time">{formatTimestamp()}</span>
            </div>
            <div className="message-content">
              {streamingAnswer}
              <span className="typing-indicator"></span>
            </div>
          </div>
        )}
      </div>
      
      <div className="search-container">
        <div className="input-row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a research question..."
            className="search-input"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            disabled={loading || isStreaming}
          />
        </div>
        
        <div className="button-row">
          <button 
            onClick={handleSearch}
            disabled={loading || !query.trim() || isStreaming}
            className="search-button"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          
          {isConnected && (
            <button 
              onClick={handleSubmitToBlockchain}
              disabled={loading || !query.trim() || isPending || isStreaming}
              className="blockchain-button"
            >
              {isPending ? 'Submitting...' : 'Submit to Blockchain'}
            </button>
          )}
        </div>
      </div>
      
      {loading && <div className="loading">Processing your request...</div>}
      
      {answer && (
        <div className="answer-container">
          <h2>Answer:</h2>
          <p className="answer">{answer}</p>
        </div>
      )}
      
      {selectedQueryId !== null && typedQueryData && (
        <div className="query-details">
          <h3>Query Details (ID: {selectedQueryId})</h3>
          <p>User: {typedQueryData.user}</p>
          <p>Query Text: {typedQueryData.queryText}</p>
          <p>State: {typedQueryData.state}</p>
          <p>Run ID: {typedQueryData.runId.toString()}</p>
        </div>
      )}
      
      {/* For demo purposes - Allows selecting a query ID to view */}
      <div className="query-selector">
        <button onClick={() => setSelectedQueryId(selectedQueryId === null ? 0 : null)}>
          {selectedQueryId === null ? 'View Latest Query' : 'Hide Query Details'}
        </button>
      </div>
    </div>
  );
}

export default App
