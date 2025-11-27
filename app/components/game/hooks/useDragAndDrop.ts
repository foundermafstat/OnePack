import { useState, useCallback, useEffect } from 'react';
import { DragState, InventoryItem, SelectedItem, PhysicsItem } from '../types';
import { CELL_SIZE, GRID_W, GRID_H } from '../constants';
import { checkCollision } from '../collision';
import { generateId, rotateMatrix } from '../utils';

interface UseDragAndDropProps {
	inventory: InventoryItem[];
	gold: number;
	shopItems: InventoryItem[];
	selectedItem: SelectedItem | null;
	setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
	setGold: React.Dispatch<React.SetStateAction<number>>;
	setShopItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
	setSelectedItem: React.Dispatch<React.SetStateAction<SelectedItem | null>>;
	setFallingItems: React.Dispatch<React.SetStateAction<PhysicsItem[]>>;
	backpackRef: React.RefObject<HTMLDivElement | null>;
	shopRef: React.RefObject<HTMLDivElement | null>;
}

export const useDragAndDrop = ({
	inventory,
	gold,
	shopItems,
	selectedItem,
	setInventory,
	setGold,
	setShopItems,
	setSelectedItem,
	setFallingItems,
	backpackRef,
	shopRef,
}: UseDragAndDropProps) => {
	const [dragState, setDragState] = useState<DragState | null>(null);
	const [modalPos, setModalPos] = useState({ x: 100, y: 100 });
	const [isModalDragging, setIsModalDragging] = useState(false);
	const [modalDragOffset, setModalDragOffset] = useState({ x: 0, y: 0 });

	const handlePointerDown = (
		e: React.PointerEvent,
		item: InventoryItem,
		source: 'shop' | 'inventory' | 'physics',
		cellCol: number = 0,
		cellRow: number = 0
	) => {
		if (e.button !== 0) return;
		e.preventDefault();
		e.stopPropagation();

		const rect = e.currentTarget.getBoundingClientRect();
		const clickInternalX = e.clientX - rect.left;
		const clickInternalY = e.clientY - rect.top;
		let totalOffsetX = clickInternalX;
		let totalOffsetY = clickInternalY;

		if (source === 'inventory') {
			totalOffsetX += cellCol * CELL_SIZE;
			totalOffsetY += cellRow * CELL_SIZE;
		}

		setDragState({
			item: { ...item },
			source,
			startX: e.clientX,
			startY: e.clientY,
			currentX: e.clientX,
			currentY: e.clientY,
			offsetX: totalOffsetX,
			offsetY: totalOffsetY,
			rotation: item.rotation || 0,
			currentShape: item.currentShape || item.shape,
			originalItem: item,
			startTime: Date.now(),
		});

		if (source === 'physics')
			setFallingItems((prev) => prev.filter((i) => i.id !== item.uniqueId));
	};

	const handlePointerMove = useCallback(
		(e: PointerEvent) => {
			if (dragState) {
				setDragState((prev) =>
					prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null
				);
			}
			if (isModalDragging) {
				setModalPos({
					x: e.clientX - modalDragOffset.x,
					y: e.clientY - modalDragOffset.y,
				});
			}
		},
		[dragState, isModalDragging, modalDragOffset]
	);

	const handlePointerUp = useCallback(
		(e: PointerEvent) => {
			setIsModalDragging(false);
			if (!dragState) return;

			const {
				item,
				source,
				currentShape,
				rotation,
				startX,
				startY,
				currentX,
				currentY,
			} = dragState;

			// CLICK DETECTION
			const dist = Math.sqrt(
				Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2)
			);
			if (dist < 5) {
				if (selectedItem && selectedItem.item.uniqueId === item.uniqueId) {
					setSelectedItem(null);
				} else {
					setSelectedItem({ item, source });
					setModalPos({ x: currentX + 20, y: currentY });
				}
				setDragState(null);
				return;
			}

			// DRAG / DROP LOGIC
			const shopRect = shopRef.current?.getBoundingClientRect();
			if (
				shopRect &&
				currentY > shopRect.top &&
				currentY < shopRect.bottom &&
				currentX > shopRect.left &&
				currentX < shopRect.right
			) {
				if (source === 'inventory' || source === 'physics') {
					setGold((g) => g + Math.floor(item.cost / 2));
					setInventory((prev) => prev.filter((i) => i.uniqueId !== item.uniqueId));
					if (selectedItem?.item.uniqueId === item.uniqueId) setSelectedItem(null);
				}
				setDragState(null);
				return;
			}

			if (backpackRef.current) {
				const gridRect = backpackRef.current.getBoundingClientRect();
				const isOverBackpack =
					currentX > gridRect.left - 50 &&
					currentX < gridRect.right + 50 &&
					currentY > gridRect.top - 50 &&
					currentY < gridRect.bottom + 50;

				if (!isOverBackpack && (source === 'inventory' || source === 'shop')) {
					if (source === 'inventory') {
						setInventory((prev) => prev.filter((i) => i.uniqueId !== item.uniqueId));
						if (selectedItem?.item.uniqueId === item.uniqueId) setSelectedItem(null);
					}
					if (source === 'shop') if (gold >= item.cost) setGold((g) => g - item.cost);

					setFallingItems((prev) => [
						...prev,
						{
							id: source === 'shop' ? generateId() : item.uniqueId,
							item: {
								...item,
								uniqueId: source === 'shop' ? generateId() : item.uniqueId,
							},
							x: currentX,
							y: currentY,
							vx: (Math.random() - 0.5) * 300,
							vy: 0,
							rotation: rotation,
							vr: (Math.random() - 0.5) * 360,
						} as PhysicsItem,
					]);

					if (source === 'shop')
						setShopItems((prev) => prev.filter((i) => i.uniqueId !== item.uniqueId));
					setDragState(null);
					return;
				}

				const itemScreenX = currentX - dragState.offsetX;
				const itemScreenY = currentY - dragState.offsetY;
				const relativeX = itemScreenX - gridRect.left + CELL_SIZE / 2;
				const relativeY = itemScreenY - gridRect.top + CELL_SIZE / 2;
				const gridX = Math.floor(relativeX / CELL_SIZE);
				const gridY = Math.floor(relativeY / CELL_SIZE);
				const isValid = !checkCollision(
					inventory,
					gridX,
					gridY,
					currentShape,
					item.uniqueId,
					item.type,
					GRID_W,
					GRID_H
				);

				if (isValid) {
					const newItem = {
						...item,
						x: gridX,
						y: gridY,
						currentShape,
						rotation,
						cooldownCurrent: 0,
					};

					if (source === 'shop') {
						if (gold >= item.cost) {
							setGold((g) => g - item.cost);
							setInventory((prev) => [...prev, newItem]);
							setShopItems((prev) => prev.filter((i) => i.uniqueId !== item.uniqueId));
						}
					} else if (source === 'physics') {
						setInventory((prev) => [...prev, newItem]);
					} else {
						setInventory((prev) =>
							prev.map((i) => {
								if (i.uniqueId === item.uniqueId) return newItem;
								return i;
							})
						);
					}
				} else {
					if (source === 'physics') {
						setFallingItems((prev) => [
							...prev,
							{
								id: item.uniqueId,
								item: item,
								x: currentX,
								y: currentY,
								vx: 0,
								vy: 0,
								rotation,
								vr: 45,
							} as PhysicsItem,
						]);
					}
				}
			}

			setDragState(null);
		},
		[dragState, inventory, gold, selectedItem, backpackRef, shopRef, setInventory, setGold, setShopItems, setSelectedItem, setFallingItems]
	);

	useEffect(() => {
		window.addEventListener('pointermove', handlePointerMove);
		window.addEventListener('pointerup', handlePointerUp);
		return () => {
			window.removeEventListener('pointermove', handlePointerMove);
			window.removeEventListener('pointerup', handlePointerUp);
		};
	}, [handlePointerMove, handlePointerUp]);

	// Auto rotate
	useEffect(() => {
		let interval: NodeJS.Timeout | undefined;
		if (dragState) {
			interval = setInterval(() => {
				setDragState((prev) => {
					if (!prev) return null;
					const newShape = rotateMatrix(prev.currentShape);
					return {
						...prev,
						currentShape: newShape,
						rotation: (prev.rotation + 90) % 360,
					};
				});
			}, 4000);
		}
		return () => {
			if (interval) clearInterval(interval);
		};
	}, [dragState?.startTime]);

	return {
		dragState,
		modalPos,
		setModalPos,
		isModalDragging,
		setIsModalDragging,
		modalDragOffset,
		setModalDragOffset,
		handlePointerDown,
	};
};

