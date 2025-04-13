import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { getDefaultConfig, RainbowKitProvider, ConnectButton } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
import { http } from 'wagmi'
import { sagaChainlet } from '../config/chain'
import '@rainbow-me/rainbowkit/styles.css'

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

export const Route = createRootRoute({
  component: () => (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <div className="flex flex-col min-h-screen w-full">
            <header className="sticky top-0 bg-white border-b border-gray-200 z-10 w-full px-6 py-4 shadow-sm">
              <div className="max-w-7xl mx-auto flex justify-between items-center">
                <nav className="flex gap-6">
                  <Link 
                    to="/" 
                    className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors [&.active]:text-blue-600 [&.active]:font-semibold"
                  >
                    Home
                  </Link>
                  <Link 
                    to="/blockchain" 
                    className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors [&.active]:text-blue-600 [&.active]:font-semibold"
                  >
                    Blockchain
                  </Link>
                  <Link 
                    to="/near" 
                    className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors [&.active]:text-blue-600 [&.active]:font-semibold"
                  >
                    Query Wizard
                  </Link>
                </nav>
                <div>
                  <ConnectButton />
                </div>
              </div>
            </header>
            <main className="flex-grow p-6 max-w-7xl mx-auto w-full">
              <Outlet />
            </main>
            <TanStackRouterDevtools />
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  ),
})
