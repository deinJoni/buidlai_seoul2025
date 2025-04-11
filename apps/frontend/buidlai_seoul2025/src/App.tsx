import { useState } from 'react'
import './App.css'

function App() {
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)

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

  return (
    <div className="container">
      <h1>Research Assistant</h1>
      
      <div className="search-container">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a research question..."
          className="search-input"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button 
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="search-button"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
      
      {loading && <div className="loading">Loading research data...</div>}
      
      {answer && (
        <div className="answer-container">
          <h2>Answer:</h2>
          <p className="answer">{answer}</p>
        </div>
      )}
    </div>
  )
}

export default App
