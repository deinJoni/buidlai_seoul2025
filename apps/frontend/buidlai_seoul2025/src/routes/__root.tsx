import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { getDefaultConfig, RainbowKitProvider, ConnectButton } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
import { http } from 'wagmi'
import { sagaChainlet } from '../config/chain'
import './styles.css'
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
          <div className="app-layout">
            <header className="app-header">
              <div className="nav-container">
                <nav className="main-nav">
                  <Link to="/" className="nav-link [&.active]:font-bold">
                    Home
                  </Link>
                  <Link to="/blockchain" className="nav-link [&.active]:font-bold">
                    Blockchain
                  </Link>
                </nav>
                <div className="wallet-connect">
                  <ConnectButton />
                </div>
              </div>
            </header>
            <main className="app-main">
              <Outlet />
            </main>
            <TanStackRouterDevtools />
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  ),
})
