import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useWriteContract, useAccount, useReadContract } from 'wagmi'
import { sagaABI, sagaContractAddress } from '../sagaABI'

// Define the Query type based on contract structure
interface Query {
  user: string;
  queryText: string;
  state: number;
  runId: bigint;
}

export const Route = createFileRoute('/blockchain')({
  component: BlockchainPage
})

function BlockchainPage() {
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
    <div className="w-full max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">Blockchain Integration</h1>
      
      {ownerData && (
        <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800 mb-6">
          <p>Contract Owner: {typeof ownerData === 'string' ? ownerData : String(ownerData)}</p>
        </div>
      )}
      
      <div className="mb-10 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">Submit Query to Blockchain</h2>
        <p className="text-gray-600 mb-6">This feature allows you to permanently store your research queries on the SAGA Chainlet.</p>
        
        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your query to store on blockchain..."
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={loading || !isConnected}
            />
          </div>
          
          <div className="flex justify-center">
            {isConnected ? (
              <button 
                onClick={handleSubmitToBlockchain}
                disabled={loading || !query.trim() || isPending}
                className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed"
              >
                {isPending ? 'Submitting...' : 'Submit to Blockchain'}
              </button>
            ) : (
              <p className="text-gray-500 italic text-center">Connect your wallet to submit queries to the blockchain</p>
            )}
          </div>
        </div>
        
        {loading && (
          <div className="mt-4 text-center italic text-gray-500">Processing your request...</div>
        )}
        
        {answer && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Transaction Status:</h3>
            <p className="text-gray-700">{answer}</p>
          </div>
        )}
      </div>
      
      <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">Query Explorer</h2>
        <p className="text-gray-600 mb-6">View previously submitted queries</p>
        
        <div className="flex justify-center mb-6">
          <button 
            onClick={() => setSelectedQueryId(selectedQueryId === null ? 0 : null)}
            className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
          >
            {selectedQueryId === null ? 'View Latest Query' : 'Hide Query Details'}
          </button>
          
          {/* Additional query navigation buttons could be added here */}
          
          {selectedQueryId !== null && (
            <div className="flex items-center gap-4 mt-4">
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
          <div className="p-5 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Query Details (ID: {selectedQueryId})</h3>
            <div className="space-y-2 text-gray-700">
              <p><span className="font-semibold">User:</span> {typedQueryData.user}</p>
              <p><span className="font-semibold">Query Text:</span> {typedQueryData.queryText}</p>
              <p><span className="font-semibold">State:</span> {typedQueryData.state}</p>
              <p><span className="font-semibold">Run ID:</span> {typedQueryData.runId.toString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
