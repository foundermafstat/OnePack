import React from 'react';
import { InventoryItem, DragState, GhostGrid } from './types';
import { ITEM_TYPES, GRID_W, GRID_H, CELL_SIZE } from './constants';
import { FaSync, FaLock } from 'react-icons/fa';

interface GameGridProps {
	inventory: InventoryItem[];
	dragState: DragState | null;
	ghostGrid: GhostGrid | null;
	gameState: string;
	isEnemy?: boolean;
	backpackRef?: React.RefObject<HTMLDivElement | null>;
	onPointerDown: (
		e: React.PointerEvent,
		item: InventoryItem,
		source: 'shop' | 'inventory' | 'physics',
		cellCol?: number,
		cellRow?: number
	) => void;
}

export const GameGrid: React.FC<GameGridProps> = ({
	inventory,
	dragState,
	ghostGrid,
	gameState,
	isEnemy = false,
	backpackRef,
	onPointerDown,
}) => {
	const renderGridCell = (x: number, y: number) => {
		let bgColor = isEnemy ? 'bg-red-950/5' : 'bg-slate-900/5';
		let borderColor = '';

		const bagItem = inventory.find((i) => {
			if (
				!isEnemy &&
				dragState &&
				dragState.source === 'inventory' &&
				i.uniqueId === dragState.item.uniqueId
			)
				return false;
			if (i.type !== ITEM_TYPES.BAG) return false;
			const h = i.currentShape.length;
			const w = i.currentShape[0].length;
			if (x >= i.x && x < i.x + w && y >= i.y && y < i.y + h)
				return i.currentShape[y - i.y][x - i.x] === 1;
			return false;
		});

		if (bagItem) {
			bgColor = bagItem.color;
			borderColor = '';
		}

		if (!isEnemy && ghostGrid) {
			const { x: gx, y: gy, valid } = ghostGrid;
			const r = y - gy;
			const c = x - gx;
			if (
				r >= 0 &&
				r < dragState!.currentShape.length &&
				c >= 0 &&
				c < dragState!.currentShape[0].length
			) {
				if (dragState!.currentShape[r][c] === 1) {
					bgColor = valid ? 'bg-green-500/40' : 'bg-red-500/40';
					borderColor = '';
				}
			}
		}

		const item = inventory.find((i) => {
			if (
				!isEnemy &&
				dragState &&
				dragState.source === 'inventory' &&
				i.uniqueId === dragState.item.uniqueId
			)
				return false;
			if (i.type === ITEM_TYPES.BAG) return false;
			const h = i.currentShape.length;
			const w = i.currentShape[0].length;
			if (x >= i.x && x < i.x + w && y >= i.y && y < i.y + h)
				return i.currentShape[y - i.y][x - i.x] === 1;
			return false;
		});

		let content: React.ReactNode = null;
		if (item) {
			bgColor = item.color;
			borderColor = '';

			let itemR = y - item.y;
			let itemC = x - item.x;
			const isAnchor =
				item.currentShape[itemR]?.[itemC] === 1 && itemR === 0 && itemC === 0;
			let animClass = '';
			if (isEnemy && item.lastTrigger && Date.now() - item.lastTrigger < 300) {
				animClass = 'scale-125 brightness-150 duration-75 z-20';
			}

			content = (
				<div
					className={`absolute inset-0 flex items-center justify-center text-slate-800 transition-all ${animClass} ${
						!isEnemy ? 'cursor-pointer hover:brightness-110' : ''
					}`}
					onPointerDown={(e) => {
						if (!isEnemy) onPointerDown(e, item, 'inventory', itemC, itemR);
					}}
				>
					{isAnchor ? item.icon : ''}
					{isAnchor && item.isPinned && (
						<FaLock
							size={12}
							className="absolute top-1 right-1 text-slate-700"
						/>
					)}
					{isAnchor && item.isMergeLocked && !isEnemy && (
						<div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500 border border-white"></div>
					)}
				</div>
			);

			if (
				gameState === 'battle' &&
				item.cooldownCurrent !== undefined &&
				item.cooldown
			) {
				const percent = 1 - item.cooldownCurrent / item.cooldown;
				if (!isNaN(percent)) {
					content = (
						<>
							{content}
							<div
								className="absolute inset-0 bg-white mix-blend-overlay pointer-events-none"
								style={{
									height: `${percent * 100}%`,
									opacity: 0.3,
									bottom: 0,
									top: 'auto',
								}}
							></div>
						</>
					);
				}
			}
		} else if (bagItem && !isEnemy) {
			let bagR = y - bagItem.y;
			let bagC = x - bagItem.x;
			if (bagR === 0 && bagC === 0) {
				content = (
					<div
						className="absolute z-0 flex items-center justify-center text-amber-900/50 cursor-grab hover:text-amber-100 w-full h-full"
						onPointerDown={(e) =>
							onPointerDown(e, bagItem, 'inventory', bagC, bagR)
						}
					>
						<FaSync size={14} className="pointer-events-auto" />
					</div>
				);
			} else {
				content = (
					<div
						className="absolute inset-0 z-0 cursor-grab"
						onPointerDown={(e) =>
							onPointerDown(e, bagItem, 'inventory', bagC, bagR)
						}
					></div>
				);
			}
		}

		return (
			<div
				key={`${x}-${y}`}
				className={`relative ${borderColor} ${bgColor}`}
				style={{ width: CELL_SIZE, height: CELL_SIZE }}
			>
				{content}
			</div>
		);
	};

	const backgroundImage = isEnemy
		? '/ui/enemy-board.jpg'
		: '/ui/player-board.jpg';

	return (
		<div
			className="relative p-11 bg-cover bg-center bg-no-repeat"
			style={{
				backgroundImage: `url(${backgroundImage})`,
				backgroundSize: 'cover',
			}}
		>
			<div
				ref={backpackRef}
				className="grid relative"
				style={{
					gridTemplateColumns: `repeat(${GRID_W}, ${CELL_SIZE}px)`,
				}}
			>
				{Array.from({ length: GRID_H }).map((_, y) =>
					Array.from({ length: GRID_W }).map((_, x) => renderGridCell(x, y))
				)}
			</div>
		</div>
	);
};
