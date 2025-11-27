import { InventoryItem } from './types';
import { MERGE_RECIPES } from './constants';

export const areItemsTouching = (
	item1: InventoryItem,
	item2: InventoryItem
): boolean => {
	if (item1.isMergeLocked || item2.isMergeLocked) return false;

	const cells1: { x: number; y: number }[] = [];
	for (let r = 0; r < item1.currentShape.length; r++) {
		for (let c = 0; c < item1.currentShape[0].length; c++) {
			if (item1.currentShape[r][c] === 1)
				cells1.push({ x: item1.x + c, y: item1.y + r });
		}
	}

	const cells2: { x: number; y: number }[] = [];
	for (let r = 0; r < item2.currentShape.length; r++) {
		for (let c = 0; c < item2.currentShape[0].length; c++) {
			if (item2.currentShape[r][c] === 1)
				cells2.push({ x: item2.x + c, y: item2.y + r });
		}
	}

	for (const c1 of cells1) {
		for (const c2 of cells2) {
			const dx = Math.abs(c1.x - c2.x);
			const dy = Math.abs(c1.y - c2.y);
			if (dx + dy === 1) return true;
		}
	}

	return false;
};

export const getMergeablePairs = (
	inv: InventoryItem[]
): [InventoryItem, InventoryItem][] => {
	const pairs: [InventoryItem, InventoryItem][] = [];
	const usedIds = new Set<string>();

	for (let i = 0; i < inv.length; i++) {
		for (let j = i + 1; j < inv.length; j++) {
			const itemA = inv[i];
			const itemB = inv[j];

			if (usedIds.has(itemA.uniqueId) || usedIds.has(itemB.uniqueId))
				continue;
			if (itemA.id !== itemB.id) continue;
			if (!MERGE_RECIPES[itemA.id]) continue;
			if (areItemsTouching(itemA, itemB)) {
				pairs.push([itemA, itemB]);
				usedIds.add(itemA.uniqueId);
				usedIds.add(itemB.uniqueId);
			}
		}
	}

	return pairs;
};

