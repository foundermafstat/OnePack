import { InventoryItem, ItemType } from './types';
import { ITEM_TYPES } from './constants';

export const isCellCoveredByBag = (
	inv: InventoryItem[],
	x: number,
	y: number,
	ignoreBagId: string | null = null
): boolean => {
	return inv.some((item) => {
		if (item.type !== ITEM_TYPES.BAG) return false;
		if (item.uniqueId === ignoreBagId) return false;
		const h = item.currentShape.length;
		const w = item.currentShape[0].length;
		if (x >= item.x && x < item.x + w && y >= item.y && y < item.y + h)
			return item.currentShape[y - item.y][x - item.x] === 1;
		return false;
	});
};

export const checkCollision = (
	inv: InventoryItem[],
	x: number,
	y: number,
	shape: number[][],
	ignoreId: string | null = null,
	itemType: ItemType,
	gridW: number,
	gridH: number
): boolean => {
	const h = shape.length;
	const w = shape[0].length;
	if (x < 0 || y < 0 || x + w > gridW || y + h > gridH) return true;

	if (itemType === ITEM_TYPES.BAG) {
		for (const item of inv) {
			if (item.uniqueId === ignoreId) continue;
			if (item.type !== ITEM_TYPES.BAG) continue;

			const itemH = item.currentShape.length;
			const itemW = item.currentShape[0].length;
			for (let row = 0; row < h; row++) {
				for (let col = 0; col < w; col++) {
					if (shape[row][col] === 1) {
						const globalX = x + col;
						const globalY = y + row;
						for (let iRow = 0; iRow < itemH; iRow++) {
							for (let iCol = 0; iCol < itemW; iCol++) {
								if (item.currentShape[iRow][iCol] === 1) {
									if (item.x + iCol === globalX && item.y + iRow === globalY) return true;
								}
							}
						}
					}
				}
			}
		}
		return false;
	} else {
		for (let row = 0; row < h; row++) {
			for (let col = 0; col < w; col++) {
				if (shape[row][col] === 1) {
					const globalX = x + col;
					const globalY = y + row;
					if (!isCellCoveredByBag(inv, globalX, globalY)) return true;

					for (const item of inv) {
						if (item.uniqueId === ignoreId) continue;
						if (item.type === ITEM_TYPES.BAG) continue;

						const itemH = item.currentShape.length;
						const itemW = item.currentShape[0].length;
						for (let iRow = 0; iRow < itemH; iRow++) {
							for (let iCol = 0; iCol < itemW; iCol++) {
								if (item.currentShape[iRow][iCol] === 1) {
									if (item.x + iCol === globalX && item.y + iRow === globalY) return true;
								}
							}
						}
					}
				}
			}
		}
		return false;
	}
};

