import { InventoryItem } from '../types';
import { ITEMS_DB, MERGE_RECIPES } from '../constants';
import { generateId, rotateMatrix } from '../utils';
import { getMergeablePairs } from '../merge';
import { checkCollision } from '../collision';
import { GRID_W, GRID_H } from '../constants';

export const useInventory = () => {
	const performMerges = (
		inventory: InventoryItem[],
		setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>,
		setFallingItems: React.Dispatch<React.SetStateAction<any[]>>
	) => {
		let currentInv = [...inventory];
		let toDrop: InventoryItem[] = [];
		const pairs = getMergeablePairs(currentInv);

		if (pairs.length === 0) return;

		const newItems: InventoryItem[] = [];
		const removedIds = new Set<string>();

		pairs.forEach((pair) => {
			const [itemA, itemB] = pair;
			const newId = MERGE_RECIPES[itemA.id];

			if (newId) {
				const newTemplate = ITEMS_DB.find((i) => i.id === newId);
				if (newTemplate) {
					removedIds.add(itemA.uniqueId);
					removedIds.add(itemB.uniqueId);
					const newItem: InventoryItem = {
						...newTemplate,
						uniqueId: generateId(),
						rotation: itemA.rotation,
						currentShape:
							itemA.rotation % 180 === 0
								? newTemplate.shape
								: rotateMatrix(newTemplate.shape),
						cooldownCurrent: 0,
						x: itemA.x,
						y: itemA.y,
					} as InventoryItem;
					newItems.push(newItem);
				}
			}
		});

		let tempInv = currentInv.filter((i) => !removedIds.has(i.uniqueId));
		newItems.forEach((item) => {
			if (
				!checkCollision(
					tempInv,
					item.x,
					item.y,
					item.currentShape,
					item.uniqueId,
					item.type,
					GRID_W,
					GRID_H
				)
			) {
				tempInv.push(item);
			} else {
				toDrop.push(item);
			}
		});

		setInventory(tempInv);
		if (toDrop.length > 0) {
			const droppedPhysics = toDrop.map(
				(item) =>
					({
						id: generateId(),
						item: item,
						x: window.innerWidth / 2,
						y: window.innerHeight / 2,
						vx: (Math.random() - 0.5) * 300,
						vy: -200,
						rotation: 0,
						vr: 90,
					} as any)
			);
			setFallingItems((prev: any[]) => [...prev, ...droppedPhysics]);
		}
	};

	return { performMerges };
};

