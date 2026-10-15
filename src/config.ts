/**
 * wagmi configuration — Arc Mainnet
 * Built with Arc Studio — https://studio.arc.io
 */

import { http, createConfig } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { arc } from 'viem/chains'
import { injected, coinbaseWallet } from 'wagmi/connectors'
import { registerChain } from './tracing'

// Pre-register chain RPC URL for trace events
registerChain(arc.id, arc.rpcUrls.default.http[0])

export const config = createConfig({
  chains: [arc, mainnet],
  connectors: [
    // Injected wallets (MetaMask, Rabby, etc.)
    injected(),
    // Coinbase Wallet — supports email, passkey and social login
    coinbaseWallet({
      appName: 'Flex Wallet',
      appLogoUrl: 'https://flexwallet.netlify.app/favicon.ico',
    }),
  ],
  transports: {
    [arc.id]: http(arc.rpcUrls.default.http[0]),
    [mainnet.id]: http(),
  },
})
