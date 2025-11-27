// Transaction builders for contract interactions
import { Transaction } from '@mysten/sui/transactions';
import { CONTRACT_CONFIG, CONTRACT_FUNCTIONS } from './contract';
import { parseTokenAmount } from './contract';

export function buildSwapSuiToOnepackTransaction(
	poolId: string,
	suiAmount: string,
	minOnepackOut: string
): Transaction {
	const tx = new Transaction();
	
	const suiAmountBigInt = parseTokenAmount(suiAmount, 9); // SUI has 9 decimals
	const minOnepackOutBigInt = parseTokenAmount(minOnepackOut, CONTRACT_CONFIG.DECIMALS);
	
	// Split SUI from gas
	const [suiCoin] = tx.splitCoins(tx.gas, [suiAmountBigInt]);
	
	tx.moveCall({
		target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::${CONTRACT_FUNCTIONS.SWAP_SUI_TO_ONEPACK}`,
		arguments: [
			tx.object(poolId),
			suiCoin,
			tx.pure.u64(minOnepackOutBigInt),
		],
	});
	
	return tx;
}

export function buildSwapOnepackToSuiTransaction(
	poolId: string,
	onepackCoinId: string,
	onepackAmount: string,
	minSuiOut: string
): Transaction {
	const tx = new Transaction();
	
	const onepackAmountBigInt = parseTokenAmount(onepackAmount, CONTRACT_CONFIG.DECIMALS);
	const minSuiOutBigInt = parseTokenAmount(minSuiOut, 9); // SUI has 9 decimals
	
	// Split the required amount from the coin
	const onepackCoin = tx.object(onepackCoinId);
	const [onepackCoinSplit] = tx.splitCoins(onepackCoin, [onepackAmountBigInt]);
	
	tx.moveCall({
		target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::${CONTRACT_FUNCTIONS.SWAP_ONEPACK_TO_SUI}`,
		arguments: [
			tx.object(poolId),
			onepackCoinSplit,
			tx.pure.u64(minSuiOutBigInt),
		],
	});
	
	return tx;
}

export function buildListItemTransaction(
	stateId: string,
	itemId: string,
	price: string
): Transaction {
	const tx = new Transaction();
	
	const priceBigInt = parseTokenAmount(price, CONTRACT_CONFIG.DECIMALS);
	
	tx.moveCall({
		target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::${CONTRACT_FUNCTIONS.LIST_ITEM}`,
		arguments: [
			tx.object(stateId),
			tx.object(itemId),
			tx.pure.u64(priceBigInt),
		],
	});
	
	return tx;
}

export function buildCancelListingTransaction(
	stateId: string,
	itemId: string
): Transaction {
	const tx = new Transaction();
	
	tx.moveCall({
		target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::${CONTRACT_FUNCTIONS.CANCEL_LISTING}`,
		arguments: [tx.object(stateId), tx.pure.id(itemId)],
	});
	
	return tx;
}

export function buildBuyItemTransaction(
	stateId: string,
	treasuryCapId: string,
	itemId: string,
	onepackCoinId: string,
	price: string
): Transaction {
	const tx = new Transaction();
	
	const priceBigInt = parseTokenAmount(price, CONTRACT_CONFIG.DECIMALS);
	
	// Split the required amount from the coin
	const onepackCoin = tx.object(onepackCoinId);
	const [onepackCoinSplit] = tx.splitCoins(onepackCoin, [priceBigInt]);
	
	tx.moveCall({
		target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::${CONTRACT_FUNCTIONS.BUY_ITEM}`,
		arguments: [
			tx.object(stateId),
			tx.object(treasuryCapId),
			tx.pure.id(itemId),
			onepackCoinSplit,
		],
	});
	
	return tx;
}

export function buildCreatePlayerStatsTransaction(stateId: string): Transaction {
	const tx = new Transaction();
	
	tx.moveCall({
		target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::${CONTRACT_FUNCTIONS.CREATE_PLAYER_STATS}`,
		arguments: [tx.object(stateId)],
	});
	
	return tx;
}
