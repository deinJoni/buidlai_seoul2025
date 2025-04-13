import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { MastraClient } from '@mastra/client-js'

// Initialize the Mastra client
const mastraClient = new MastraClient({
  baseUrl: 'https://mastra-buidlseoul25-production.up.railway.app',
})

// Message type for chat history
interface Message {
  role: 'user' | 'assistant';
  content: string;
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
  const chatContainerRef = useRef<HTMLDivElement>(null)

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

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">Research Assistant</h1>
      
      {/* Chat container */}
      <div 
        ref={chatContainerRef} 
        className="w-full h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50 mb-6 shadow-inner"
      >
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <h3 className="text-xl font-semibold text-blue-800 mb-2">Welcome to Research Assistant!</h3>
            <p className="text-gray-600">Ask me any research question and I'll help you find the answer.</p>
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
            placeholder="Ask a research question..."
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            disabled={loading || isStreaming}
          />
        </div>
        
        <div className="flex justify-center">
          <button 
            onClick={handleSearch}
            disabled={loading || !query.trim() || isStreaming}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
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
    </div>
  );
}
