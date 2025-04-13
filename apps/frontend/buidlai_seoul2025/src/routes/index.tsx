import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { MastraClient } from '@mastra/client-js'
import { useWriteContract, useAccount, useReadContract } from 'wagmi'
import { sagaABI, sagaContractAddress } from '../sagaABI'

// Initialize the Mastra client
const mastraClient = new MastraClient({
  baseUrl: 'https://mastra-buidlseoul25-production.up.railway.app',
})

// Message type for chat history
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Define the Query type based on contract structure
interface Query {
  user: string;
  queryText: string;
  state: number;
  runId: bigint;
}

export const Route = createFileRoute('/')({
  component: HomePage
})

function HomePage() {
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingAnswer, setStreamingAnswer] = useState('')
  const [txStatus, setTxStatus] = useState('')
  const [selectedQueryId, setSelectedQueryId] = useState<number | null>(null)
  const [showQueryHistory, setShowQueryHistory] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  
  // Get account information
  const { isConnected } = useAccount()
  
  // Write contract function for submitting queries
  const { writeContract, isPending, isSuccess, error } = useWriteContract()
  
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
      setTxStatus('');
      
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
  
  // Handle submitting a query to the blockchain
  const handleSubmitToBlockchain = async () => {
    if (!query.trim() || !isConnected) return;
    
    try {
      setLoading(true);
      setTxStatus('');
      
      // Submit query to blockchain
      writeContract({
        address: sagaContractAddress,
        abi: sagaABI,
        functionName: 'submitQuery',
        args: [query],
      });
      
    } catch (err) {
      console.error('Error submitting query to blockchain:', err);
      setTxStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
      setLoading(false);
    }
  };
  
  // Watch for transaction success/failure
  useEffect(() => {
    if (isSuccess) {
      setTxStatus(`Query submitted to blockchain successfully!`);
      setLoading(false);
    } else if (error) {
      setTxStatus(`Error: ${error.message}`);
      setLoading(false);
    }
  }, [isSuccess, error]);

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, streamingAnswer]);

  // Format message timestamp
  const formatTimestamp = () => {
    const now = new Date();
    return `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
  };
  
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
    <div className="w-full max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">Blockchain Analytics Assistant</h1>
      
      <div className="flex justify-end mb-4">
        <button 
          onClick={() => setShowQueryHistory(!showQueryHistory)}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
        >
          {showQueryHistory ? 'Hide Query History' : 'Show Query History'}
        </button>
      </div>
      
      {showQueryHistory && (
        <div className="mb-8 p-5 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Query Registry</h2>
          <p className="text-gray-600 mb-4">Explore previously stored queries on SAGA Chainlet</p>
          
          <div className="flex justify-center mb-4">
            <button 
              onClick={() => setSelectedQueryId(selectedQueryId === null ? 0 : null)}
              className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
            >
              {selectedQueryId === null ? 'View Latest Query' : 'Hide Query Details'}
            </button>
            
            {selectedQueryId !== null && (
              <div className="flex items-center gap-4 ml-4">
                <button 
                  onClick={() => setSelectedQueryId(prev => prev !== null && prev > 0 ? prev - 1 : 0)}
                  disabled={selectedQueryId === 0}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="font-medium text-gray-700">Query #{selectedQueryId}</span>
                <button 
                  onClick={() => setSelectedQueryId(prev => prev !== null ? prev + 1 : 0)}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
          
          {selectedQueryId !== null && typedQueryData && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Query Details (ID: {selectedQueryId})</h3>
              <div className="space-y-2 text-gray-700">
                <p><span className="font-semibold">User:</span> {typedQueryData.user}</p>
                <p><span className="font-semibold">Query Text:</span> {typedQueryData.queryText}</p>
                <p><span className="font-semibold">State:</span> {typedQueryData.state}</p>
                <p><span className="font-semibold">Run ID:</span> {typedQueryData.runId.toString()}</p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Chat container */}
      <div 
        ref={chatContainerRef} 
        className="w-full h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50 mb-6 shadow-inner"
      >
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <h3 className="text-xl font-semibold text-blue-800 mb-2">Welcome to Blockchain Analytics Assistant!</h3>
            <p className="text-gray-600 mb-4">Ask me any question about blockchain data and I'll help you find the answer.</p>
            <p className="text-sm text-gray-500">Your queries will be processed using NEAR AI for SQL generation and can be stored on SAGA Chainlet.</p>
          </div>
        ) : (
          chatHistory.map((message, index) => (
            <div 
              key={index} 
              className={`mb-4 p-3 rounded-lg max-w-[85%] ${
                message.role === 'user' 
                  ? 'ml-auto bg-blue-100 text-right' 
                  : 'mr-auto bg-white border border-gray-200'
              }`}
            >
              <div className="flex justify-between items-center mb-1 text-xs text-gray-500">
                <span className="font-semibold">
                  {message.role === 'user' ? 'You' : 'Assistant'}
                </span>
                <span>{formatTimestamp()}</span>
              </div>
              <div className="text-sm break-words">
                {message.content}
              </div>
            </div>
          ))
        )}
        
        {/* Show streaming response */}
        {isStreaming && (
          <div className="mb-4 p-3 rounded-lg max-w-[85%] mr-auto bg-white border border-gray-200">
            <div className="flex justify-between items-center mb-1 text-xs text-gray-500">
              <span className="font-semibold">Assistant</span>
              <span>{formatTimestamp()}</span>
            </div>
            <div className="text-sm break-words">
              {streamingAnswer}
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full ml-1 animate-pulse"></span>
            </div>
          </div>
        )}
      </div>
      
      <div className="w-full mt-6">
        <div className="mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about blockchain data..."
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            disabled={loading || isStreaming}
          />
        </div>
        
        <div className="flex justify-center gap-4">
          <button 
            onClick={handleSearch}
            disabled={loading || !query.trim() || isStreaming}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {loading && !isPending ? 'Searching...' : 'Search with AI'}
          </button>
          
          {isConnected ? (
            <button 
              onClick={handleSubmitToBlockchain}
              disabled={loading || !query.trim() || isPending}
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed"
            >
              {isPending ? 'Storing...' : 'Store on Blockchain'}
            </button>
          ) : (
            <button 
              className="px-6 py-3 bg-gray-300 text-gray-600 font-semibold rounded-lg shadow-md cursor-not-allowed"
              disabled={true}
            >
              Connect Wallet to Store
            </button>
          )}
        </div>
      </div>
      
      {loading && (
        <div className="mt-4 text-center italic text-gray-500">Processing your request...</div>
      )}
      
      {answer && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-blue-800 mb-2">Answer:</h2>
          <p className="text-gray-700">{answer}</p>
        </div>
      )}
      
      {txStatus && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">Blockchain Transaction:</h2>
          <p className="text-gray-700">{txStatus}</p>
        </div>
      )}
    </div>
  );
}
