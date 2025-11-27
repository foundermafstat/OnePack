'use client';

import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useSuiClientQuery } from '@mysten/dapp-kit';
import { CONTRACT_CONFIG, formatTokenAmount, parseTokenAmount } from '@/lib/contract';
import { buildSwapSuiToOnepackTransaction } from '@/lib/contract-transactions';
import { FaExchangeAlt, FaSpinner } from 'react-icons/fa';

export default function SwapPage() {
	const account = useCurrentAccount();
	const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();
	const [suiAmount, setSuiAmount] = useState('');
	const [onepackAmount, setOnepackAmount] = useState('');
	const [poolId, setPoolId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Fetch pool ID from state
	const { data: stateData } = useSuiClientQuery('getObject', {
		id: CONTRACT_CONFIG.ONE_PACK_STATE_ID,
		options: {
			showContent: true,
		},
	});

	// Fetch pool balances
	const { data: poolData } = useSuiClientQuery(
		'getObject',
		{
			id: poolId || '',
			options: {
				showContent: true,
			},
		},
		{
			enabled: !!poolId,
		}
	);

	useEffect(() => {
		if (stateData?.data?.content && 'fields' in stateData.data.content) {
			const fields = stateData.data.content.fields as any;
			const swapPool = fields.swap_pool;
			// Handle Option<ID> - could be an object with fields or a string ID
			if (swapPool) {
				if (typeof swapPool === 'string') {
					setPoolId(swapPool);
				} else if (swapPool.fields?.id) {
					setPoolId(swapPool.fields.id);
				} else if (swapPool.id) {
					setPoolId(swapPool.id);
				}
			}
		}
	}, [stateData]);

	// Calculate ONEPACK output based on constant product formula
	useEffect(() => {
		if (!suiAmount || !poolData?.data?.content || !poolId) {
			setOnepackAmount('');
			return;
		}

		try {
			const suiIn = parseTokenAmount(suiAmount, 9);
			if (poolData.data.content && 'fields' in poolData.data.content) {
				const fields = poolData.data.content.fields as any;
				const suiBalance = BigInt(fields.sui_balance?.fields?.value || '0');
				const onepackBalance = BigInt(fields.onepack_balance?.fields?.value || '0');

				if (suiBalance > 0 && onepackBalance > 0) {
					const suiAfter = suiBalance + suiIn;
					const onepackOut = (onepackBalance * suiIn) / suiAfter;
					setOnepackAmount(formatTokenAmount(onepackOut, CONTRACT_CONFIG.DECIMALS));
				}
			}
		} catch (err) {
			setOnepackAmount('');
		}
	}, [suiAmount, poolData, poolId]);

	const handleSwap = () => {
		if (!account || !poolId || !suiAmount || !onepackAmount) {
			setError('Please fill in all fields');
			return;
		}

		setError(null);
		const minOnepackOut = parseTokenAmount(
			(String(Number(onepackAmount) * 0.95)), // 5% slippage tolerance
			CONTRACT_CONFIG.DECIMALS
		);

		const tx = buildSwapSuiToOnepackTransaction(poolId, suiAmount, formatTokenAmount(minOnepackOut, CONTRACT_CONFIG.DECIMALS));

		signAndExecute(
			{
				transaction: tx,
			},
			{
				onSuccess: () => {
					setSuiAmount('');
					setOnepackAmount('');
				},
				onError: (err) => {
					setError(err.message || 'Transaction failed');
				},
			}
		);
	};

	if (!account) {
		return (
			<div className="min-h-screen bg-[#020305] flex items-center justify-center p-4">
				<div className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-8 max-w-md w-full text-center">
					<h2 className="text-2xl font-bold text-slate-300 mb-4">Connect Wallet</h2>
					<p className="text-slate-400">Please connect your wallet to use the swap</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#020305] p-4">
			<div className="max-w-2xl mx-auto">
				<div className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-6">
					<h1 className="text-3xl font-bold text-slate-300 mb-6 flex items-center gap-2">
						<FaExchangeAlt className="w-8 h-8" />
						Swap SUI to ONEPACK
					</h1>

					{poolData && poolData.data?.content && 'fields' in poolData.data.content && (
						<div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
							<h3 className="text-sm font-semibold text-slate-400 mb-2">Pool Liquidity</h3>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-xs text-slate-500">SUI Balance</p>
									<p className="text-lg font-bold text-slate-300">
										{formatTokenAmount(
											BigInt((poolData.data.content.fields as any).sui_balance?.fields?.value || '0'),
											9
										)}
									</p>
								</div>
								<div>
									<p className="text-xs text-slate-500">ONEPACK Balance</p>
									<p className="text-lg font-bold text-slate-300">
										{formatTokenAmount(
											BigInt((poolData.data.content.fields as any).onepack_balance?.fields?.value || '0'),
											CONTRACT_CONFIG.DECIMALS
										)}
									</p>
								</div>
							</div>
						</div>
					)}

					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-slate-400 mb-2">
								You Pay (SUI)
							</label>
							<input
								type="number"
								step="0.000000001"
								value={suiAmount}
								onChange={(e) => setSuiAmount(e.target.value)}
								placeholder="0.0"
								className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						<div className="flex justify-center my-2">
							<div className="w-10 h-10 bg-slate-800/50 border border-slate-700/50 rounded-full flex items-center justify-center">
								<FaExchangeAlt className="w-5 h-5 text-slate-400" />
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-slate-400 mb-2">
								You Receive (ONEPACK)
							</label>
							<input
								type="text"
								value={onepackAmount}
								readOnly
								placeholder="0.0"
								className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-300 placeholder-slate-500 opacity-75"
							/>
						</div>

						{error && (
							<div className="p-3 bg-red-900/20 border border-red-800/50 rounded-lg text-red-400 text-sm">
								{error}
							</div>
						)}

						<button
							onClick={handleSwap}
							disabled={isPending || !suiAmount || !onepackAmount || !poolId}
							className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
						>
							{isPending ? (
								<>
									<FaSpinner className="w-5 h-5 animate-spin" />
									Swapping...
								</>
							) : (
								'Swap'
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

