'use client';

import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useSuiClientQuery } from '@mysten/dapp-kit';
import {
	CONTRACT_CONFIG,
	formatTokenAmount,
	parseTokenAmount,
	getExplorerUrl,
} from '@/lib/contract';
import { buildSwapSuiToOnepackTransaction } from '@/lib/contract-transactions';
import { FaExchangeAlt, FaSpinner } from 'react-icons/fa';

// Helper function to extract balance value from various possible structures
function extractBalanceValue(balanceField: any): string {
	if (!balanceField) return '0';
	
	// Try different possible structures
	if (typeof balanceField === 'string') {
		return balanceField;
	}
	
	if (typeof balanceField === 'number') {
		return String(balanceField);
	}
	
	if (balanceField.fields?.value !== undefined) {
		return String(balanceField.fields.value);
	}
	
	if (balanceField.value !== undefined) {
		return String(balanceField.value);
	}
	
	if (typeof balanceField === 'object') {
		// Try to find value in nested structure
		const keys = Object.keys(balanceField);
		for (const key of keys) {
			if (key === 'value' || key === 'Value') {
				return String(balanceField[key]);
			}
			if (typeof balanceField[key] === 'object' && balanceField[key]?.value !== undefined) {
				return String(balanceField[key].value);
			}
		}
	}
	
	return '0';
}

export default function SwapPage() {
	const account = useCurrentAccount();
	const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();
	const [octAmount, setOctAmount] = useState('');
	const [onepackAmount, setOnepackAmount] = useState('');
	const [poolId, setPoolId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [txDigest, setTxDigest] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

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
			const swapPool = (stateData.data.content.fields as any).swap_pool;
			// Handle Option<ID> - could be an object with fields or a string ID
			if (swapPool) {
				if (typeof swapPool === 'string') {
					setPoolId(swapPool);
				} else if (swapPool.fields?.id) {
					setPoolId(swapPool.fields.id);
				} else if (swapPool.id) {
					setPoolId(swapPool.id);
				}
			} else {
				console.log('No swap pool found in state:', stateData.data.content);
			}
		}
	}, [stateData]);

	// Debug: log pool data
	useEffect(() => {
		if (poolData) {
			console.log('Pool data:', poolData);
			if (poolData.data?.content && 'fields' in poolData.data.content) {
				const fields = poolData.data.content.fields as any;
				console.log('Pool fields:', fields);
				console.log('OCT balance field:', fields.sui_balance);
				console.log('ONEPACK balance field:', fields.onepack_balance);
				console.log('Extracted OCT balance:', extractBalanceValue(fields.sui_balance));
				console.log('Extracted ONEPACK balance:', extractBalanceValue(fields.onepack_balance));
			}
		}
	}, [poolData]);

	// Calculate ONEPACK output based on constant product formula
	// Динамический расчет количества получаемых ONEPACK токенов при обмене OCT
	useEffect(() => {
		if (!octAmount || !poolData?.data?.content || !poolId) {
			setOnepackAmount('');
			return;
		}

		try {
			const octIn = parseTokenAmount(octAmount, 9);
			if (poolData.data.content && 'fields' in poolData.data.content) {
				const fields = poolData.data.content.fields as any;
				
				// Extract balances using helper function
				const octBalanceValue = extractBalanceValue(fields.sui_balance);
				const onepackBalanceValue = extractBalanceValue(fields.onepack_balance);
				
				const octBalance = BigInt(octBalanceValue);
				const onepackBalanceBigInt = BigInt(onepackBalanceValue);

				if (octBalance > 0 && onepackBalanceBigInt > 0) {
					const octAfter = octBalance + octIn;
					const onepackOut = (onepackBalanceBigInt * octIn) / octAfter;
					setOnepackAmount(
						formatTokenAmount(onepackOut, CONTRACT_CONFIG.DECIMALS)
					);
				}
			}
		} catch (err) {
			console.error('Error calculating swap amount:', err);
			setOnepackAmount('');
		}
	}, [octAmount, poolData, poolId]);

	const handleSwap = () => {
		if (!account || !poolId || !octAmount || !onepackAmount) {
			setError('Please fill in all fields');
			return;
		}

		setError(null);
		const minOnepackOut = parseTokenAmount(
			String(Number(onepackAmount) * 0.95), // 5% slippage tolerance
			CONTRACT_CONFIG.DECIMALS
		);

		const tx = buildSwapSuiToOnepackTransaction(
			poolId,
			octAmount,
			formatTokenAmount(minOnepackOut, CONTRACT_CONFIG.DECIMALS)
		);

		signAndExecute(
			{
				transaction: tx,
			},
			{
				onSuccess: (result) => {
					setSuccess(true);
					setTxDigest(result.digest);
					setOctAmount('');
					setOnepackAmount('');
				},
				onError: (err) => {
					console.error('Transaction error:', err);
					setError(err.message || 'Transaction failed');
					setTxDigest(null);
					setSuccess(false);
				},
			}
		);
	};

	if (!account) {
		return (
			<div className="min-h-screen bg-[#020305] flex items-center justify-center p-4">
				<div className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-8 max-w-md w-full text-center">
					<h2 className="text-2xl font-bold text-slate-300 mb-4">
						Connect Wallet
					</h2>
					<p className="text-slate-400">
						Please connect your wallet to use the swap
					</p>
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
						Swap OCT to ONEPACK
					</h1>

					{!poolId && (
						<div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-800/50 rounded-lg">
							<p className="text-yellow-400 text-sm">
								⚠️ Pool not initialized. Please initialize the pool first.
							</p>
							{stateData && (
								<p className="text-yellow-300 text-xs mt-2">
									State data loaded: {stateData.data ? 'Yes' : 'No'}
								</p>
							)}
						</div>
					)}

					{poolId && (
						<div className="mb-4 p-2 bg-slate-800/30 rounded text-xs text-slate-500">
							Pool ID: {poolId.slice(0, 10)}...{poolId.slice(-8)}
						</div>
					)}

					{poolId && !poolData && (
						<div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
							<p className="text-slate-400 text-sm">Loading pool data...</p>
						</div>
					)}

					{poolData &&
						poolData.data?.content &&
						'fields' in poolData.data.content && (
							<div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
								<h3 className="text-sm font-semibold text-slate-400 mb-2">
									Pool Liquidity
								</h3>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<p className="text-xs text-slate-500">OCT Balance</p>
										<p className="text-lg font-bold text-slate-300">
											{(() => {
												const fields = poolData.data.content.fields as any;
												const suiBalance = fields.sui_balance;
												const balanceValue = extractBalanceValue(suiBalance);
												return formatTokenAmount(BigInt(balanceValue), 9);
											})()}
										</p>
									</div>
									<div>
										<p className="text-xs text-slate-500">ONEPACK Balance</p>
										<p className="text-lg font-bold text-slate-300">
											{(() => {
												const fields = poolData.data.content.fields as any;
												const onepackBalance = fields.onepack_balance;
												const balanceValue = extractBalanceValue(onepackBalance);
												return formatTokenAmount(BigInt(balanceValue), CONTRACT_CONFIG.DECIMALS);
											})()}
										</p>
									</div>
								</div>
							</div>
						)}

					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-slate-400 mb-2">
								You Pay (OCT)
							</label>
							<input
								type="number"
								step="0.000000001"
								value={octAmount}
								onChange={(e) => setOctAmount(e.target.value)}
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

						{success && txDigest && (
							<div className="p-4 bg-green-900/20 border border-green-800/50 rounded-lg">
								<p className="text-green-400 text-sm mb-2">
									✅ Swap completed successfully!
								</p>
								<a
									href={getExplorerUrl(txDigest)}
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-400 hover:text-blue-300 text-sm underline inline-flex items-center gap-1"
								>
									View transaction on explorer
									<svg
										className="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
										/>
									</svg>
								</a>
							</div>
						)}

						<button
							onClick={handleSwap}
							disabled={isPending || !octAmount || !onepackAmount || !poolId}
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
