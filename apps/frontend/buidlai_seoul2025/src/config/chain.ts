import { defineChain } from 'viem'

// Define SAGA Chainlet
export const sagaChainlet = defineChain({
  id: 2744367451770000,
  name: 'SAGA Chainlet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://buidlseoul-2744367451770000-1.jsonrpc.sagarpc.io'],
    },
  },
  blockExplorers: {
    default: { 
      name: 'SAGA Explorer', 
      url: 'https://app.saga.xyz/chainlets/detail/?chainId=buidlseoul_2744367451770000-1' 
    },
  },
})
