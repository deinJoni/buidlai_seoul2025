import { useState, useEffect } from 'react'
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

const API_URL = 'https://mastra-buidlseoul25-production.up.railway.app/api'

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

// ResearchAssistant Component - Contains main functionality
function ResearchAssistant() {
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedQueryId, setSelectedQueryId] = useState<number | null>(null)
  
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
  
  // Regular search functionality (simulated)
  const handleSearch = () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setAnswer('');
    
    // Simulate fetching research data
    setTimeout(() => {
      setLoading(false);
      setAnswer(`Research answer for: "${query}"`);
      // In a real app, you would call an API here
      // Example: fetchResearchData(query).then(data => setAnswer(data))
    }, 1000);
  }
  
  // Process query data when available
  useEffect(() => {
    if (queryData) {
      console.log('Query data:', queryData);
      // Process the query data
    }
  }, [queryData]);

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
      
      <div className="search-container">
        <div className="input-row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a research question..."
            className="search-input"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        
        <div className="button-row">
          <button 
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="search-button"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          
          {isConnected && (
            <button 
              onClick={handleSubmitToBlockchain}
              disabled={loading || !query.trim() || isPending}
              className="blockchain-button"
            >
              {isPending ? 'Submitting...' : 'Submit to Blockchain'}
            </button>
          )}
        </div>
      </div>
      
      {loading && <div className="loading">Loading research data...</div>}
      
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
