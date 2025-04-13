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
    <div className="container">
      <h1>Research Assistant</h1>
      
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
        </div>
      </div>
      
      {loading && <div className="loading">Processing your request...</div>}
      
      {answer && (
        <div className="answer-container">
          <h2>Answer:</h2>
          <p className="answer">{answer}</p>
        </div>
      )}
    </div>
  );
}
