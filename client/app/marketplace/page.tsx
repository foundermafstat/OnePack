'use client';

import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useSuiClientQuery } from '@mysten/dapp-kit';
import { CONTRACT_CONFIG, formatTokenAmount, formatAddress } from '@/lib/contract';
import { buildBuyItemTransaction } from '@/lib/contract-transactions';
import { FaShoppingBag, FaSpinner, FaExternalLinkAlt } from 'react-icons/fa';
import Link from 'next/link';

interface MarketplaceListing {
	id: string;
	itemId: string;
	price: string;
	seller: string;
	item?: {
		name: string;
		description: string;
		imageUrl: string;
		itemType: number;
		rarity: number;
	};
}

export default function MarketplacePage() {
	const account = useCurrentAccount();
	const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();
	const [listings, setListings] = useState<MarketplaceListing[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [onepackCoins, setOnepackCoins] = useState<any[]>([]);

	// Fetch user's ONEPACK coins for payment
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
		}
	}, [coinsData]);

	// Fetch marketplace listings
	// Note: In a real implementation, you would query events or use an indexer
	// For now, this is a placeholder that would need to be implemented with proper event queries
	useEffect(() => {
		// TODO: Implement proper event querying for ItemListed events
		// This is a placeholder structure
		setLoading(false);
		setListings([]);
	}, []);

	const handleBuyItem = (listing: MarketplaceListing) => {
		if (!account) {
			setError('Please connect your wallet');
			return;
		}

		if (onepackCoins.length === 0) {
			setError('You need ONEPACK tokens to buy items');
			return;
		}

		// Find a coin with sufficient balance
		const priceBigInt = BigInt(listing.price);
		const suitableCoin = onepackCoins.find((coin) => coin.balance >= priceBigInt);

		if (!suitableCoin) {
			setError('Insufficient ONEPACK balance');
			return;
		}

		setError(null);
		const tx = buildBuyItemTransaction(
			CONTRACT_CONFIG.ONE_PACK_STATE_ID,
			CONTRACT_CONFIG.TREASURY_CAP_ID,
			listing.itemId,
			suitableCoin.id,
			listing.price
		);

		signAndExecute(
			{
				transaction: tx,
			},
			{
				onSuccess: () => {
					// Refresh listings
					setLoading(true);
					// TODO: Refresh listings
				},
				onError: (err) => {
					setError(err.message || 'Transaction failed');
				},
			}
		);
	};

	const getRarityColor = (rarity: number) => {
		switch (rarity) {
			case 0:
				return 'text-slate-400 border-slate-600';
			case 1:
				return 'text-green-400 border-green-600';
			case 2:
				return 'text-blue-400 border-blue-600';
			case 3:
				return 'text-purple-400 border-purple-600';
			case 4:
				return 'text-yellow-400 border-yellow-600';
			default:
				return 'text-slate-400 border-slate-600';
		}
	};

	const getRarityName = (rarity: number) => {
		const names = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
		return names[rarity] || 'Unknown';
	};

	return (
		<div className="min-h-screen bg-[#020305] p-4">
			<div className="max-w-7xl mx-auto">
				<div className="mb-6">
					<h1 className="text-4xl font-bold text-slate-300 mb-2 flex items-center gap-3">
						<FaShoppingBag className="w-10 h-10" />
						Marketplace
					</h1>
					<p className="text-slate-400">Buy and sell game items</p>
				</div>

				{error && (
					<div className="mb-4 p-4 bg-red-900/20 border border-red-800/50 rounded-lg text-red-400">
						{error}
					</div>
				)}

				{loading ? (
					<div className="flex items-center justify-center py-12">
						<FaSpinner className="w-8 h-8 animate-spin text-slate-400" />
					</div>
				) : listings.length === 0 ? (
					<div className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-12 text-center">
						<FaShoppingBag className="w-16 h-16 text-slate-600 mx-auto mb-4" />
						<h2 className="text-2xl font-bold text-slate-400 mb-2">No Listings Available</h2>
						<p className="text-slate-500">Check back later for new items</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
						{listings.map((listing) => (
							<div
								key={listing.id}
								className="bg-slate-900/50 border border-slate-800/50 rounded-lg overflow-hidden hover:border-slate-700 transition-colors"
							>
								{listing.item?.imageUrl ? (
									<div className="aspect-square bg-slate-800/50 relative overflow-hidden">
										<img
											src={listing.item.imageUrl}
											alt={listing.item.name}
											className="w-full h-full object-cover"
										/>
										<div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold border ${getRarityColor(listing.item.rarity)}`}>
											{getRarityName(listing.item.rarity)}
										</div>
									</div>
								) : (
									<div className="aspect-square bg-slate-800/50 flex items-center justify-center">
										<FaShoppingBag className="w-16 h-16 text-slate-600" />
									</div>
								)}

								<div className="p-4">
									<h3 className="text-lg font-bold text-slate-300 mb-1 truncate">
										{listing.item?.name || 'Unknown Item'}
									</h3>
									<p className="text-sm text-slate-400 mb-3 line-clamp-2">
										{listing.item?.description || 'No description'}
									</p>

									<div className="flex items-center justify-between mb-4">
										<div>
											<p className="text-xs text-slate-500">Price</p>
											<p className="text-xl font-bold text-slate-300">
												{formatTokenAmount(BigInt(listing.price), CONTRACT_CONFIG.DECIMALS)} ONEPACK
											</p>
										</div>
									</div>

									<div className="mb-4">
										<p className="text-xs text-slate-500 mb-1">Seller</p>
										<Link
											href={`/profile/${listing.seller}`}
											className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
										>
											{formatAddress(listing.seller)}
											<FaExternalLinkAlt className="w-3 h-3" />
										</Link>
									</div>

									<button
										onClick={() => handleBuyItem(listing)}
										disabled={isPending || !account || listing.seller === account.address}
										className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded transition-colors flex items-center justify-center gap-2"
									>
										{isPending ? (
											<>
												<FaSpinner className="w-4 h-4 animate-spin" />
												Processing...
											</>
										) : (
											'Buy Now'
										)}
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

