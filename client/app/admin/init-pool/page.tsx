'use client';

import { useState, useMemo } from 'react';
import { useCurrentAccount, useSuiClient, useSuiClientQuery } from '@mysten/dapp-kit';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import {
	CONTRACT_CONFIG,
	formatTokenAmount,
	parseTokenAmount,
	getExplorerUrl,
} from '@/lib/contract';
import { buildInitSwapPoolTransaction } from '@/lib/contract-transactions';
import { FaSpinner, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

export default function InitPoolPage() {
	const account = useCurrentAccount();
	const suiClient = useSuiClient();
	const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();
	const [initialOctAmount, setInitialOctAmount] = useState('');
	const [initialOnepackAmount, setInitialOnepackAmount] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [txDigest, setTxDigest] = useState<string | null>(null);

	// Fetch object versions to ensure they're resolved
	const { data: stateObject } = useSuiClientQuery('getObject', {
		id: CONTRACT_CONFIG.ONE_PACK_STATE_ID,
		options: { showPreviousTransaction: true },
	});

	const { data: adminCapObject } = useSuiClientQuery('getObject', {
		id: CONTRACT_CONFIG.ADMIN_CAP_ID,
		options: { showPreviousTransaction: true },
	});

	const { data: treasuryCapObject } = useSuiClientQuery('getObject', {
		id: CONTRACT_CONFIG.TREASURY_CAP_ID,
		options: { showPreviousTransaction: true },
	});

	// MIN_LIQUIDITY = 1000 in base units (with decimals)
	// For 9 decimals: 1000 / 10^9 = 0.000001 tokens
	const minLiquidityBase = CONTRACT_CONFIG.MIN_LIQUIDITY;
	const minLiquidityFormatted = formatTokenAmount(BigInt(minLiquidityBase), 9);

	// Calculate exchange rate dynamically
	const exchangeRate = useMemo(() => {
		const oct = parseFloat(initialOctAmount);
		const onepack = parseFloat(initialOnepackAmount);

		if (oct > 0 && onepack > 0) {
			return {
				octToOnepack: (onepack / oct).toFixed(6),
				onepackToOct: (oct / onepack).toFixed(6),
			};
		}
		return null;
	}, [initialOctAmount, initialOnepackAmount]);

	const handleInitPool = () => {
		if (!account) {
			setError('Please connect your wallet');
			return;
		}

		if (!initialOctAmount || !initialOnepackAmount) {
			setError('Please fill in all fields');
			return;
		}

		const octAmount = parseFloat(initialOctAmount);
		const onepackAmount = parseFloat(initialOnepackAmount);

		// Validate minimum liquidity in base units
		const octAmountBase = parseTokenAmount(initialOctAmount, 9);
		const onepackAmountBase = parseTokenAmount(
			initialOnepackAmount,
			CONTRACT_CONFIG.DECIMALS
		);

		if (
			octAmountBase < BigInt(minLiquidityBase) ||
			onepackAmountBase < BigInt(minLiquidityBase)
		) {
			setError(
				`Minimum liquidity is ${minLiquidityFormatted} for each token (${minLiquidityBase} base units)`
			);
			return;
		}

		if (octAmount <= 0 || onepackAmount <= 0) {
			setError('Amounts must be greater than zero');
			return;
		}

		if (!stateObject || !adminCapObject || !treasuryCapObject) {
			setError('Loading object data. Please wait...');
			return;
		}

		setError(null);
		setSuccess(false);
		setTxDigest(null);

		try {
			const tx = buildInitSwapPoolTransaction(
				CONTRACT_CONFIG.ONE_PACK_STATE_ID,
				CONTRACT_CONFIG.ADMIN_CAP_ID,
				CONTRACT_CONFIG.TREASURY_CAP_ID,
				initialOctAmount,
				initialOnepackAmount,
				account?.address
			);

			console.log('Transaction built:', tx);
			console.log('State object:', stateObject);
			console.log('AdminCap object:', adminCapObject);
			console.log('TreasuryCap object:', treasuryCapObject);

			signAndExecute(
				{
					transaction: tx,
				},
				{
					onSuccess: (result) => {
						setSuccess(true);
						setTxDigest(result.digest);
						setInitialOctAmount('');
						setInitialOnepackAmount('');
					},
					onError: (err) => {
						console.error('Transaction error:', err);
						setError(err.message || 'Transaction failed');
						setTxDigest(null);
					},
				}
			);
		} catch (err: any) {
			console.error('Error building transaction:', err);
			setError(err.message || 'Failed to build transaction');
		}
	};

	if (!account) {
		return (
			<div className="min-h-screen bg-[#020305] flex items-center justify-center p-4">
				<div className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-8 max-w-md w-full text-center">
					<h2 className="text-2xl font-bold text-slate-300 mb-4">
						Connect Wallet
					</h2>
					<p className="text-slate-400">
						Please connect your wallet to initialize the pool
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#020305] p-4">
			<div className="max-w-2xl mx-auto">
				<div className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-6">
					<div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-800/50 rounded-lg">
						<div className="flex items-start gap-3">
							<FaExclamationTriangle
								className="text-yellow-400 mt-0.5"
								size={20}
							/>
							<div>
								<h3 className="text-sm font-semibold text-yellow-400 mb-1">
									Admin Only
								</h3>
								<p className="text-xs text-yellow-300">
									This page is for admin use only. You need AdminCap to
									initialize the swap pool. Minimum liquidity required:{' '}
									{minLiquidityFormatted} for each token ({minLiquidityBase}{' '}
									base units).
								</p>
							</div>
						</div>
					</div>

					<h1 className="text-3xl font-bold text-slate-300 mb-6">
						Initialize Swap Pool
					</h1>

					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-slate-400 mb-2">
								Initial OCT Amount
							</label>
							<input
								type="number"
								step="0.000000001"
								value={initialOctAmount}
								onChange={(e) => setInitialOctAmount(e.target.value)}
								placeholder="0.01"
								className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<p className="text-xs text-slate-500 mt-1">
								Minimum: {minLiquidityFormatted} OCT ({minLiquidityBase} base
								units)
							</p>
						</div>

						<div>
							<label className="block text-sm font-medium text-slate-400 mb-2">
								Initial ONEPACK Amount
							</label>
							<input
								type="number"
								step="0.000000001"
								value={initialOnepackAmount}
								onChange={(e) => setInitialOnepackAmount(e.target.value)}
								placeholder="1000"
								className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<p className="text-xs text-slate-500 mt-1">
								Minimum: {minLiquidityFormatted} ONEPACK ({minLiquidityBase}{' '}
								base units)
							</p>
						</div>

						{exchangeRate && (
							<div className="p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
								<div className="flex items-start gap-3">
									<FaInfoCircle className="text-blue-400 mt-0.5" size={18} />
									<div className="flex-1">
										<h4 className="text-sm font-semibold text-blue-400 mb-2">
											Exchange Rate
										</h4>
										<div className="space-y-1 text-xs text-blue-300">
											<p>1 OCT = {exchangeRate.octToOnepack} ONEPACK</p>
											<p>1 ONEPACK = {exchangeRate.onepackToOct} OCT</p>
										</div>
									</div>
								</div>
							</div>
						)}

						{error && (
							<div className="p-3 bg-red-900/20 border border-red-800/50 rounded-lg text-red-400 text-sm">
								{error}
							</div>
						)}

						{success && (
							<div className="p-4 bg-green-900/20 border border-green-800/50 rounded-lg">
								<p className="text-green-400 text-sm mb-2">
									✅ Pool initialized successfully! You can now use the swap
									functionality.
								</p>
								<p className="text-green-300 text-xs mb-2">
									Note: The tokens you provided are now in the liquidity pool,
									not in your wallet. This is expected behavior - they provide
									liquidity for swaps.
								</p>
								{txDigest && (
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
								)}
							</div>
						)}

						<button
							onClick={handleInitPool}
							disabled={isPending || !initialOctAmount || !initialOnepackAmount}
							className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
						>
							{isPending ? (
								<>
									<FaSpinner className="w-5 h-5 animate-spin" />
									Initializing...
								</>
							) : (
								'Initialize Pool'
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
