'use client';

import {
	ConnectButton,
	useCurrentAccount,
	useSuiClientQuery,
} from '@mysten/dapp-kit';
import { useState } from 'react';

export default function Home() {
	const account = useCurrentAccount();
	const [ownerAddress, setOwnerAddress] = useState<string>('');

	// Example of using hook for RPC requests
	const { data, isPending, error, refetch } = useSuiClientQuery(
		'getOwnedObjects',
		{
			owner: ownerAddress || account?.address || '',
			options: {
				showType: true,
				showContent: true,
				showOwner: true,
			},
		},
		{
			enabled: !!(ownerAddress || account?.address),
		}
	);

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black p-8">
			<main className="flex w-full max-w-4xl flex-col gap-8">
				{/* Header */}
				<div className="text-center">
					<h1 className="text-4xl font-bold text-black dark:text-zinc-50 mb-2">
						OnePack - Sui dApp
					</h1>
					<p className="text-lg text-zinc-600 dark:text-zinc-400">
						Application built with Next.js 16 and Mysten Labs dApp Kit
					</p>
				</div>

				{/* Wallet connection component */}
				<div className="flex justify-center">
					<ConnectButton />
				</div>

				{/* Current account information */}
				{account && (
					<div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
						<h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
							Wallet Information
						</h2>
						<div className="space-y-2">
							<p className="text-sm text-zinc-600 dark:text-zinc-400">
								<span className="font-medium">Address:</span>{' '}
								<span className="font-mono text-xs break-all">
									{account.address}
								</span>
							</p>
							{account.chains && (
								<p className="text-sm text-zinc-600 dark:text-zinc-400">
									<span className="font-medium">Network:</span> {account.chains[0]}
								</p>
							)}
						</div>
					</div>
				)}

				{/* Object search by address */}
				<div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
					<h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
						Search Objects
					</h2>
					<div className="space-y-4">
						<div className="flex gap-2">
							<input
								type="text"
								placeholder={account?.address || 'Enter Sui address...'}
								value={ownerAddress}
								onChange={(e) => setOwnerAddress(e.target.value)}
								className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm text-black dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<button
								onClick={() => refetch()}
								disabled={isPending || !(ownerAddress || account?.address)}
								className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								{isPending ? 'Loading...' : 'Search'}
							</button>
						</div>

						{error && (
							<div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
								<p className="text-sm text-red-600 dark:text-red-400">
									Error: {error.message}
								</p>
							</div>
						)}

						{data && (
							<div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 p-4">
								<p className="text-sm font-medium text-black dark:text-zinc-50 mb-2">
									Objects found: {data.data?.length || 0}
								</p>
								<pre className="text-xs text-zinc-600 dark:text-zinc-400 overflow-auto max-h-96">
									{JSON.stringify(data, null, 2)}
								</pre>
							</div>
						)}
					</div>
				</div>

				{/* Application information */}
				<div className="text-center text-sm text-zinc-500 dark:text-zinc-500">
					<p>
						Built with{' '}
						<a
							href="https://sdk.mystenlabs.com/dapp-kit"
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-600 dark:text-blue-400 hover:underline"
						>
							Mysten Labs dApp Kit
						</a>
					</p>
				</div>
			</main>
		</div>
	);
}
