'use client';

import {
	createNetworkConfig,
	SuiClientProvider,
	WalletProvider,
} from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

// OneChain Testnet RPC endpoint
// You can set this via environment variable NEXT_PUBLIC_ONECHAIN_RPC_URL
// Options:
// - Local OneChain node: http://127.0.0.1:9000 (requires running local node)
// - OneChain testnet: Use the RPC URL from your OneChain CLI configuration
//   Check with: onechain client env
const ONECHAIN_TESTNET_RPC =
	process.env.NEXT_PUBLIC_ONECHAIN_RPC_URL || 'http://127.0.0.1:9000';

// Network configuration for connections
const { networkConfig } = createNetworkConfig({
	localnet: { url: 'http://127.0.0.1:9000' },
	mainnet: { url: 'https://fullnode.mainnet.sui.io' },
	testnet: { url: ONECHAIN_TESTNET_RPC },
	devnet: { url: 'https://fullnode.devnet.sui.io' },
});

export function Providers({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 1000 * 60 * 5, // 5 minutes
						refetchOnWindowFocus: false,
					},
				},
			})
	);

	return (
		<QueryClientProvider client={queryClient}>
			<SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
				<WalletProvider autoConnect>{children}</WalletProvider>
			</SuiClientProvider>
		</QueryClientProvider>
	);
}
