'use client';

import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useSuiClientQuery } from '@mysten/dapp-kit';
import { CONTRACT_CONFIG, formatTokenAmount, parseTokenAmount } from '@/lib/contract';
import { buildSwapOnepackToSuiTransaction } from '@/lib/contract-transactions';
import { FaExchangeAlt, FaSpinner } from 'react-icons/fa';

export default function ReverseSwapPage() {
	const account = useCurrentAccount();
	const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();
	const [onepackAmount, setOnepackAmount] = useState('');
	const [suiAmount, setSuiAmount] = useState('');
	const [poolId, setPoolId] = useState<string | null>(null);
	const [onepackCoins, setOnepackCoins] = useState<any[]>([]);
	const [selectedCoinId, setSelectedCoinId] = useState<string>('');
	const [error, setError] = useState<string | null>(null);

	// Fetch pool ID from state
	const { data: stateData } = useSuiClientQuery('getObject', {
		id: CONTRACT_CONFIG.ONE_PACK_STATE_ID,
		options: {
			showContent: true,
		},
	});

	// Fetch user's ONEPACK coins
	const { data: coinsData } = useSuiClientQuery(
		'getOwnedObjects',
		{
			owner: account?.address || '',
			filter: {
				StructType: '0x2::coin::Coin<0x1865f2d52964f2432815952e11f39eb03f4aee9b30c9b748beacabe7c38310cc::onepack::ONEPACK>',
			},
			options: {
				showContent: true,
				showType: true,
			},
		},
		{
			enabled: !!account?.address,
		}
	);

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

	useEffect(() => {
		if (coinsData?.data) {
			const coins = coinsData.data
				.map((obj: any) => {
					if (obj.data?.content && 'fields' in obj.data.content) {
						return {
							id: obj.data.objectId,
							balance: BigInt((obj.data.content.fields as any).balance || '0'),
						};
					}
					return null;
				})
				.filter(Boolean);
			setOnepackCoins(coins);
			if (coins.length > 0 && !selectedCoinId) {
				setSelectedCoinId(coins[0].id);
			}
		}
	}, [coinsData, selectedCoinId]);

	// Calculate SUI output based on constant product formula
	useEffect(() => {
		if (!onepackAmount || !poolData?.data?.content || !poolId) {
			setSuiAmount('');
			return;
		}

		try {
			const onepackIn = parseTokenAmount(onepackAmount, CONTRACT_CONFIG.DECIMALS);
			if (poolData.data.content && 'fields' in poolData.data.content) {
				const fields = poolData.data.content.fields as any;
				const suiBalance = BigInt(fields.sui_balance?.fields?.value || '0');
				const onepackBalance = BigInt(fields.onepack_balance?.fields?.value || '0');

				if (suiBalance > 0 && onepackBalance > 0) {
					const onepackAfter = onepackBalance + onepackIn;
					const suiOut = (suiBalance * onepackIn) / onepackAfter;
					setSuiAmount(formatTokenAmount(suiOut, 9));
				}
			}
		} catch (err) {
			setSuiAmount('');
		}
	}, [onepackAmount, poolData, poolId]);

	const selectedCoin = onepackCoins.find((c) => c.id === selectedCoinId);
	const maxBalance = selectedCoin ? formatTokenAmount(selectedCoin.balance, CONTRACT_CONFIG.DECIMALS) : '0';

	const handleSwap = () => {
		if (!account || !poolId || !onepackAmount || !suiAmount || !selectedCoinId) {
			setError('Please fill in all fields');
			return;
		}

		if (selectedCoin && parseTokenAmount(onepackAmount, CONTRACT_CONFIG.DECIMALS) > selectedCoin.balance) {
			setError('Insufficient ONEPACK balance');
			return;
		}

		setError(null);
		const minSuiOut = parseTokenAmount(
			(String(Number(suiAmount) * 0.95)), // 5% slippage tolerance
			9
		);

		const tx = buildSwapOnepackToSuiTransaction(
			poolId,
			selectedCoinId,
			onepackAmount,
			formatTokenAmount(minSuiOut, 9)
		);

		signAndExecute(
			{
				transaction: tx,
			},
			{
				onSuccess: () => {
					setOnepackAmount('');
					setSuiAmount('');
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
						Swap ONEPACK to SUI
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

					{onepackCoins.length > 0 && (
						<div className="mb-4">
							<label className="block text-sm font-medium text-slate-400 mb-2">
								Select ONEPACK Coin
							</label>
							<select
								value={selectedCoinId}
								onChange={(e) => setSelectedCoinId(e.target.value)}
								className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								{onepackCoins.map((coin) => (
									<option key={coin.id} value={coin.id}>
										{formatTokenAmount(coin.balance, CONTRACT_CONFIG.DECIMALS)} ONEPACK
									</option>
								))}
							</select>
							{selectedCoin && (
								<p className="text-xs text-slate-500 mt-1">
									Available: {formatTokenAmount(selectedCoin.balance, CONTRACT_CONFIG.DECIMALS)} ONEPACK
								</p>
							)}
						</div>
					)}

					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-slate-400 mb-2">
								You Pay (ONEPACK)
							</label>
							<div className="relative">
								<input
									type="number"
									step="0.000000001"
									value={onepackAmount}
									onChange={(e) => setOnepackAmount(e.target.value)}
									placeholder="0.0"
									max={maxBalance}
									className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
								{maxBalance !== '0' && (
									<button
										onClick={() => setOnepackAmount(maxBalance)}
										className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded border border-slate-600/50"
									>
										MAX
									</button>
								)}
							</div>
						</div>

						<div className="flex justify-center my-2">
							<div className="w-10 h-10 bg-slate-800/50 border border-slate-700/50 rounded-full flex items-center justify-center">
								<FaExchangeAlt className="w-5 h-5 text-slate-400" />
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-slate-400 mb-2">
								You Receive (SUI)
							</label>
							<input
								type="text"
								value={suiAmount}
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
							disabled={isPending || !onepackAmount || !suiAmount || !poolId || !selectedCoinId || onepackCoins.length === 0}
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

