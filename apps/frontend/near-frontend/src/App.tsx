import { useEffect, useState } from 'react';
import { initNear, showWalletModal, signOut, getAccountId, isSignedIn, signMessage } from './lib/near';

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [sessionSent, setSessionSent] = useState(false);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<number | null>(null);

  useEffect(() => {
    initNear().then(async () => {
      if (await isSignedIn()) {
        const accountId = await getAccountId();
        setAccount(accountId);
        await sendSessionToBackend();
        setSessionSent(true);
      }
    });
  }, [sessionSent]);

  useEffect(() => {
    // Cleanup polling interval when component unmounts
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  const handleLogin = () => {
    showWalletModal();
  };

  const handleLogout = () => {
    signOut();
    setAccount(null);
  };

  async function sendSessionToBackend() {
    const nonce = Date.now().toString();
    const recipient = 'near-ai-backend';
  
    const message = 'Login to NEAR AI';
    const signed = await signMessage({ message, nonce, recipient });
  
    const payload = {
      ...signed,
      message,
      nonce,
      recipient,
    };
  
    await fetch('http://localhost:3000/api/store-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  const handleAskAI = async () => {
    if (!question.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setAnswer(null);

      // Send question to backend
      const response = await fetch('http://localhost:3000/api/ask-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to send question to AI agent');
      }

      // Start polling for results
      const interval = window.setInterval(async () => {
        try {
          const pollResponse = await fetch('http://localhost:3000/api/result');
          const data = await pollResponse.json();

          if (data.status === 'completed') {
            setAnswer(data.answer);
            setLoading(false);
            clearInterval(interval);
            setPollInterval(null);
          } else if (data.status === 'error') {
            throw new Error(data.error || 'An error occurred while processing your question');
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to get AI response');
          setLoading(false);
          clearInterval(interval);
          setPollInterval(null);
        }
      }, 5000);

      setPollInterval(interval);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ask AI');
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8 text-center">NEAR AI Frontend</h1>
      
      <div className="mb-8 flex justify-end">
        {account ? (
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-600">Connected as: {account}</p>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Disconnect Wallet
            </button>
          </div>
        ) : (
          <button 
            onClick={handleLogin}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Connect NEAR Wallet
          </button>
        )}
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask your question here..."
            className="w-full h-32 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading || !account}
          />
          
          <button
            onClick={handleAskAI}
            disabled={loading || !question.trim() || !account}
            className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Waiting for AI Agent response...' : 'Ask AI'}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {answer && (
          <div className="p-6 bg-gray-50 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Answer:</h2>
            <p className="whitespace-pre-wrap">{answer}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
