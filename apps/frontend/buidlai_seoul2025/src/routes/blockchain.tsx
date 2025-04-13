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
    <div className="container">
      <h1>Blockchain Integration</h1>
      
      {ownerData && (
        <div className="contract-info">
          <p>Contract Owner: {typeof ownerData === 'string' ? ownerData : String(ownerData)}</p>
        </div>
      )}
      
      <div className="blockchain-section">
        <h2>Submit Query to Blockchain</h2>
        <p>This feature allows you to permanently store your research queries on the SAGA Chainlet.</p>
        
        <div className="search-container">
          <div className="input-row">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your query to store on blockchain..."
              className="search-input"
              disabled={loading || !isConnected}
            />
          </div>
          
          <div className="button-row">
            {isConnected ? (
              <button 
                onClick={handleSubmitToBlockchain}
                disabled={loading || !query.trim() || isPending}
                className="blockchain-button"
              >
                {isPending ? 'Submitting...' : 'Submit to Blockchain'}
              </button>
            ) : (
              <p className="connect-wallet-prompt">Connect your wallet to submit queries to the blockchain</p>
            )}
          </div>
        </div>
        
        {loading && <div className="loading">Processing your request...</div>}
        
        {answer && (
          <div className="answer-container">
            <h3>Transaction Status:</h3>
            <p className="answer">{answer}</p>
          </div>
        )}
      </div>
      
      <div className="query-explorer">
        <h2>Query Explorer</h2>
        <p>View previously submitted queries</p>
        
        <div className="query-selector">
          <button 
            onClick={() => setSelectedQueryId(selectedQueryId === null ? 0 : null)}
            className="selector-button"
          >
            {selectedQueryId === null ? 'View Latest Query' : 'Hide Query Details'}
          </button>
          
          {/* Additional query navigation buttons could be added here */}
          
          {selectedQueryId !== null && (
            <div className="query-id-selector">
              <button 
                onClick={() => setSelectedQueryId(prev => prev !== null && prev > 0 ? prev - 1 : 0)}
                disabled={selectedQueryId === 0}
                className="nav-button"
              >
                Previous
              </button>
              <span>Query #{selectedQueryId}</span>
              <button 
                onClick={() => setSelectedQueryId(prev => prev !== null ? prev + 1 : 0)}
                className="nav-button"
              >
                Next
              </button>
            </div>
          )}
        </div>
        
        {selectedQueryId !== null && typedQueryData && (
          <div className="query-details">
            <h3>Query Details (ID: {selectedQueryId})</h3>
            <div className="query-info">
              <p><strong>User:</strong> {typedQueryData.user}</p>
              <p><strong>Query Text:</strong> {typedQueryData.queryText}</p>
              <p><strong>State:</strong> {typedQueryData.state}</p>
              <p><strong>Run ID:</strong> {typedQueryData.runId.toString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
