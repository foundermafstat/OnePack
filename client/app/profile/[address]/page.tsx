'use client';

import { use } from 'react';
import { useSuiClientQuery } from '@mysten/dapp-kit';
import { CONTRACT_CONFIG, formatTokenAmount, formatAddress } from '@/lib/contract';
import { FaTrophy, FaBullseye, FaClock, FaChartLine, FaBox, FaUser } from 'react-icons/fa';
import Link from 'next/link';

interface PlayerStats {
	wins: bigint;
	losses: bigint;
	totalDamage: bigint;
	playTimeSeconds: bigint;
	level: bigint;
	rating: bigint;
	gameResultIpfs: string;
	backpackIpfs: string;
}

export default function ProfilePage({ params }: { params: Promise<{ address: string }> }) {
	const resolvedParams = use(params);
	const address = decodeURIComponent(resolvedParams.address);

	// Fetch player stats (SBT)
	const { data: statsData, isLoading: statsLoading } = useSuiClientQuery(
		'getOwnedObjects',
		{
			owner: address,
			filter: {
				StructType: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::PlayerStats`,
			},
			options: {
				showContent: true,
				showType: true,
			},
		},
		{
			enabled: !!address,
		}
	);

	// Fetch player items
	const { data: itemsData, isLoading: itemsLoading } = useSuiClientQuery(
		'getOwnedObjects',
		{
			owner: address,
			filter: {
				StructType: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::GameItem`,
			},
			options: {
				showContent: true,
				showType: true,
			},
		},
		{
			enabled: !!address,
		}
	);

	const stats: PlayerStats | null =
		statsData?.data?.[0]?.data?.content && 'fields' in statsData.data[0].data.content
			? {
					wins: BigInt((statsData.data[0].data.content.fields as any).wins || '0'),
					losses: BigInt((statsData.data[0].data.content.fields as any).losses || '0'),
					totalDamage: BigInt((statsData.data[0].data.content.fields as any).total_damage || '0'),
					playTimeSeconds: BigInt((statsData.data[0].data.content.fields as any).play_time_seconds || '0'),
					level: BigInt((statsData.data[0].data.content.fields as any).level || '1'),
					rating: BigInt((statsData.data[0].data.content.fields as any).rating || '1000'),
					gameResultIpfs: (statsData.data[0].data.content.fields as any).game_result_ipfs || '',
					backpackIpfs: (statsData.data[0].data.content.fields as any).backpack_ipfs || '',
			  }
			: null;

	const items =
		itemsData?.data
			?.map((obj: any) => {
				if (obj.data?.content && 'fields' in obj.data.content) {
					const fields = obj.data.content.fields as any;
					return {
						id: obj.data.objectId,
						itemId: fields.item_id || '0',
						itemType: fields.item_type || 0,
						rarity: fields.rarity || 0,
						name: new TextDecoder().decode(new Uint8Array(fields.name || [])),
						description: new TextDecoder().decode(new Uint8Array(fields.description || [])),
						imageUrl: new TextDecoder().decode(new Uint8Array(fields.image_url || [])),
						ipfsMetadataUrl: new TextDecoder().decode(new Uint8Array(fields.ipfs_metadata_url || [])),
						owner: fields.owner || '',
						isListed: fields.is_listed || false,
					};
				}
				return null;
			})
			.filter(Boolean) || [];

	const totalGames = stats ? Number(stats.wins) + Number(stats.losses) : 0;
	const winRate = totalGames > 0 ? (Number(stats?.wins || 0) / totalGames) * 100 : 0;
	const playTimeHours = stats ? Number(stats.playTimeSeconds) / 3600 : 0;

	const getRarityColor = (rarity: number) => {
		switch (rarity) {
			case 0:
				return 'border-slate-600 bg-slate-800/30';
			case 1:
				return 'border-green-600 bg-green-900/20';
			case 2:
				return 'border-blue-600 bg-blue-900/20';
			case 3:
				return 'border-purple-600 bg-purple-900/20';
			case 4:
				return 'border-yellow-600 bg-yellow-900/20';
			default:
				return 'border-slate-600 bg-slate-800/30';
		}
	};

	const getRarityName = (rarity: number) => {
		const names = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
		return names[rarity] || 'Unknown';
	};

	return (
		<div className="min-h-screen bg-[#020305] p-4">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-6">
					<Link
						href="/marketplace"
						className="text-sm text-slate-400 hover:text-slate-300 mb-4 inline-block"
					>
						← Back to Marketplace
					</Link>
					<div className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-6">
						<div className="flex items-center gap-4">
							<div className="w-20 h-20 bg-slate-800/50 border border-slate-700/50 rounded-full flex items-center justify-center">
								<FaUser className="w-10 h-10 text-slate-400" />
							</div>
							<div>
								<h1 className="text-3xl font-bold text-slate-300 mb-1">Player Profile</h1>
								<p className="text-slate-400 font-mono text-sm">{formatAddress(address)}</p>
							</div>
						</div>
					</div>
				</div>

				{/* Stats Section */}
				{statsLoading ? (
					<div className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-12 text-center">
						<p className="text-slate-400">Loading stats...</p>
					</div>
				) : stats ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
						<div className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-4">
							<div className="flex items-center gap-3 mb-2">
								<FaTrophy className="w-5 h-5 text-yellow-400" />
								<p className="text-sm text-slate-400">Level</p>
							</div>
							<p className="text-3xl font-bold text-slate-300">{stats.level.toString()}</p>
						</div>

						<div className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-4">
							<div className="flex items-center gap-3 mb-2">
								<FaChartLine className="w-5 h-5 text-blue-400" />
								<p className="text-sm text-slate-400">Rating</p>
							</div>
							<p className="text-3xl font-bold text-slate-300">{stats.rating.toString()}</p>
						</div>

						<div className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-4">
							<div className="flex items-center gap-3 mb-2">
								<FaBullseye className="w-5 h-5 text-green-400" />
								<p className="text-sm text-slate-400">Win Rate</p>
							</div>
							<p className="text-3xl font-bold text-slate-300">{winRate.toFixed(1)}%</p>
							<p className="text-xs text-slate-500 mt-1">
								{stats.wins.toString()}W / {stats.losses.toString()}L
							</p>
						</div>

						<div className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-4">
							<div className="flex items-center gap-3 mb-2">
								<FaClock className="w-5 h-5 text-purple-400" />
								<p className="text-sm text-slate-400">Play Time</p>
							</div>
							<p className="text-3xl font-bold text-slate-300">{playTimeHours.toFixed(1)}h</p>
							<p className="text-xs text-slate-500 mt-1">
								{stats.totalDamage.toString()} total damage
							</p>
						</div>
					</div>
				) : (
					<div className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-12 text-center mb-6">
						<p className="text-slate-400">No player stats found. This player hasn't created their stats yet.</p>
					</div>
				)}

				{/* Items Section */}
				<div className="mb-6">
					<h2 className="text-2xl font-bold text-slate-300 mb-4 flex items-center gap-2">
						<FaBox className="w-6 h-6" />
						Items ({items.length})
					</h2>

					{itemsLoading ? (
						<div className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-12 text-center">
							<p className="text-slate-400">Loading items...</p>
						</div>
					) : items.length === 0 ? (
						<div className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-12 text-center">
							<FaBox className="w-16 h-16 text-slate-600 mx-auto mb-4" />
							<p className="text-slate-400">No items found</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
							{items.map((item: any) => (
								<div
									key={item.id}
									className={`bg-slate-900/50 border rounded-lg overflow-hidden ${getRarityColor(item.rarity)}`}
								>
									{item.imageUrl ? (
										<div className="aspect-square bg-slate-800/50 relative overflow-hidden">
											<img
												src={item.imageUrl}
												alt={item.name}
												className="w-full h-full object-cover"
											/>
											<div className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold bg-slate-900/80 text-slate-300">
												{getRarityName(item.rarity)}
											</div>
										</div>
									) : (
										<div className="aspect-square bg-slate-800/50 flex items-center justify-center">
											<FaBox className="w-16 h-16 text-slate-600" />
										</div>
									)}

									<div className="p-4">
										<h3 className="text-lg font-bold text-slate-300 mb-1 truncate">{item.name}</h3>
										<p className="text-sm text-slate-400 line-clamp-2">{item.description}</p>
										{item.isListed && (
											<div className="mt-2">
												<span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded border border-blue-800/50">
													Listed
												</span>
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* IPFS Links */}
				{stats && (stats.gameResultIpfs || stats.backpackIpfs) && (
					<div className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-6">
						<h2 className="text-xl font-bold text-slate-300 mb-4">Additional Data</h2>
						<div className="space-y-2">
							{stats.gameResultIpfs && (
								<div>
									<p className="text-sm text-slate-400 mb-1">Game Results (IPFS)</p>
									<a
										href={`https://ipfs.io/ipfs/${stats.gameResultIpfs}`}
										target="_blank"
										rel="noopener noreferrer"
										className="text-sm text-blue-400 hover:text-blue-300 break-all"
									>
										{stats.gameResultIpfs}
									</a>
								</div>
							)}
							{stats.backpackIpfs && (
								<div>
									<p className="text-sm text-slate-400 mb-1">Backpack State (IPFS)</p>
									<a
										href={`https://ipfs.io/ipfs/${stats.backpackIpfs}`}
										target="_blank"
										rel="noopener noreferrer"
										className="text-sm text-blue-400 hover:text-blue-300 break-all"
									>
										{stats.backpackIpfs}
									</a>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

