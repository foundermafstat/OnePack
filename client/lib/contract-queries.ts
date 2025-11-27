// React Query hooks for contract data
import { useSuiClientQuery } from '@mysten/dapp-kit';
import { CONTRACT_CONFIG } from './contract';

export function useSwapPool() {
	return useSuiClientQuery('getObject', {
		id: CONTRACT_CONFIG.ONE_PACK_STATE_ID,
		options: {
			showContent: true,
			showOwner: true,
		},
	});
}

export function usePlayerStats(playerAddress: string | null) {
	return useSuiClientQuery(
		'getOwnedObjects',
		{
			owner: playerAddress || '',
			filter: {
				StructType: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::PlayerStats`,
			},
			options: {
				showContent: true,
				showType: true,
			},
		},
		{
			enabled: !!playerAddress,
		}
	);
}

export function usePlayerItems(playerAddress: string | null) {
	return useSuiClientQuery(
		'getOwnedObjects',
		{
			owner: playerAddress || '',
			filter: {
				StructType: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::GameItem`,
			},
			options: {
				showContent: true,
				showType: true,
			},
		},
		{
			enabled: !!playerAddress,
		}
	);
}

export function useMarketplaceListings() {
	// This would need to query events or use a custom indexer
	// For now, we'll use a placeholder that queries the state object
	return useSuiClientQuery('getObject', {
		id: CONTRACT_CONFIG.ONE_PACK_STATE_ID,
		options: {
			showContent: true,
		},
	});
}

