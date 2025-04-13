import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/near')({
  component: NearAgentPage
})

function NearAgentPage() {
  return (
    <div className="w-full h-screen max-w-7xl mx-auto flex flex-col">
      <h1 className="text-3xl font-bold text-blue-800 mb-4 p-4">Flipside Query Wizard</h1>
      
      <div className="flex-grow w-full bg-white rounded-lg shadow-md overflow-hidden">
        <iframe 
          src="https://app.near.ai/embed/einjoni.near/flipside-query-wizard/latest" 
          sandbox="allow-scripts allow-popups allow-same-origin allow-forms"
          className="w-full h-full border-none"
          title="NEAR AI Flipside Query Wizard"
        />
      </div>
    </div>
  );
}
