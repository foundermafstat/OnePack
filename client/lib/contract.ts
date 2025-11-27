// Contract configuration and utilities
export const CONTRACT_CONFIG = {
	PACKAGE_ID: '0x1865f2d52964f2432815952e11f39eb03f4aee9b30c9b748beacabe7c38310cc',
	MODULE_NAME: 'onepack',
	ONE_PACK_STATE_ID: '0x470b1d9058071d20fe7bca8ea0eccbedc34447c76d00ef814b18e723fd351cb5',
	TREASURY_CAP_ID: '0x9718a10642edab5b19d109575801815dd30ebd794dc8adefdcfb8e5f0813ed39',
	COIN_TYPE: '0x1865f2d52964f2432815952e11f39eb03f4aee9b30c9b748beacabe7c38310cc::onepack::ONEPACK',
	DECIMALS: 9,
} as const;

export const CONTRACT_FUNCTIONS = {
	SWAP_SUI_TO_ONEPACK: 'swap_sui_to_onepack',
	SWAP_ONEPACK_TO_SUI: 'swap_onepack_to_sui',
	LIST_ITEM: 'list_item',
	CANCEL_LISTING: 'cancel_listing',
	BUY_ITEM: 'buy_item',
	CREATE_PLAYER_STATS: 'create_player_stats',
	GET_POOL_BALANCES: 'get_pool_balances',
	GET_STATS: 'get_stats',
	GET_ITEM_INFO: 'get_item_info',
	GET_LISTING_INFO: 'get_listing_info',
} as const;

export function formatTokenAmount(amount: bigint | number, decimals: number = CONTRACT_CONFIG.DECIMALS): string {
	const divisor = BigInt(10 ** decimals);
	const whole = amount / divisor;
	const fraction = amount % divisor;
	
	if (fraction === BigInt(0)) {
		return whole.toString();
	}
	
	const fractionStr = fraction.toString().padStart(decimals, '0');
	const trimmed = fractionStr.replace(/0+$/, '');
	
	return trimmed ? `${whole}.${trimmed}` : whole.toString();
}

export function parseTokenAmount(amount: string, decimals: number = CONTRACT_CONFIG.DECIMALS): bigint {
	const [whole, fraction = ''] = amount.split('.');
	const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
	return BigInt(whole) * BigInt(10 ** decimals) + BigInt(paddedFraction || '0');
}

export function formatAddress(address: string): string {
	if (!address) return '';
	return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

