'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
	GameState,
	InventoryItem,
	PlayerStats,
	EnemyStats,
	BattleLog,
	GhostGrid,
	MergeLink,
} from './game/types';
import {
	GRID_W,
	GRID_H,
	CELL_SIZE,
	ITEMS_DB,
	ITEM_TYPES,
} from './game/constants';
import { generateId } from './game/utils';
import { getMergeablePairs } from './game/merge';
import { checkCollision } from './game/collision';
import { useBattle } from './game/hooks/useBattle';
import { usePhysics } from './game/hooks/usePhysics';
import { useInventory } from './game/hooks/useInventory';
import { useDragAndDrop } from './game/hooks/useDragAndDrop';
import { PhysicsItem } from './game/PhysicsItem';
import { Shop } from './game/Shop';
import { GameGrid } from './game/GameGrid';
import { BattleLog as BattleLogComponent } from './game/BattleLog';
import { GameHeader } from './game/GameHeader';
import { DragPreview } from './game/DragPreview';
import { InfoModal } from './game/InfoModal';

export default function BattlePackArena() {
	// --- STATE ---
	const [gameState, setGameState] = useState<GameState>('shop');
	const [inventory, setInventory] = useState<InventoryItem[]>([]);
	const [enemyInventory, setEnemyInventory] = useState<InventoryItem[]>([]);
	const [gold, setGold] = useState(15);
	const [shopItems, setShopItems] = useState<InventoryItem[]>([]);
	const [battleSpeed, setBattleSpeed] = useState(1);

	const [playerStats, setPlayerStats] = useState<PlayerStats>({
		hp: 100,
		maxHp: 100,
		armor: 0,
		stamina: 10,
		maxStamina: 10,
	});
	const [enemyStats, setEnemyStats] = useState<EnemyStats>({
		hp: 100,
		maxHp: 100,
		damage: 5,
		attackSpeed: 2.0,
		nextAttack: 2.0,
		armor: 0,
	});
	const [battleLog, setBattleLog] = useState<BattleLog[]>([]);
	const [fallingItems, setFallingItems] = useState<any[]>([]);
	const [selectedItem, setSelectedItem] = useState<{
		item: InventoryItem;
		source: 'shop' | 'inventory' | 'physics';
	} | null>(null);

	const backpackRef = useRef<HTMLDivElement>(null);
	const shopRef = useRef<HTMLDivElement>(null);

	// --- HOOKS ---
	useBattle({
		gameState,
		battleSpeed,
		inventory,
		enemyInventory,
		playerStats,
		enemyStats,
		setInventory,
		setEnemyInventory,
		setPlayerStats,
		setEnemyStats,
		setGameState,
		setGold,
		setBattleLog,
	});

	usePhysics(setFallingItems);

	const { performMerges } = useInventory();

	const {
		dragState,
		modalPos,
		setModalPos,
		isModalDragging,
		setIsModalDragging,
		modalDragOffset,
		setModalDragOffset,
		handlePointerDown,
	} = useDragAndDrop({
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
	});

	// --- INIT ---
	const rerollShop = () => {
		if (gold < 1 && shopItems.length > 0) return;
		const pinnedItems = shopItems.filter((i) => i.isPinned);
		if (shopItems.length > 0 && gold >= 1) setGold((g) => g - 1);
		const countNeeded = 5 - pinnedItems.length;
		const newShop = Array.from({ length: countNeeded }).map(() => {
			const itemTemplate =
				ITEMS_DB[Math.floor(Math.random() * ITEMS_DB.length)];
			return {
				...itemTemplate,
				uniqueId: generateId(),
				rotation: 0,
				currentShape: itemTemplate.shape,
			} as InventoryItem;
		});
		setShopItems([...pinnedItems, ...newShop]);
	};

	useEffect(() => {
		// Disable scrolling on body and html
		document.body.style.overflow = 'hidden';
		document.documentElement.style.overflow = 'hidden';

		const starterBag = ITEMS_DB.find((i) => i.id === 'starter_bag');
		if (starterBag) {
			setInventory([
				{
					...starterBag,
					uniqueId: generateId(),
					x: 1,
					y: 2,
					rotation: 0,
					currentShape: starterBag.shape,
					cooldownCurrent: 0,
				} as InventoryItem,
			]);
		}
		rerollShop();

		return () => {
			// Re-enable scrolling when component unmounts
			document.body.style.overflow = 'unset';
			document.documentElement.style.overflow = 'unset';
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// --- BATTLE ---
	const startBattle = () => {
		if (gameState === 'battle') return;
		setGameState('battle');
		setBattleLog([{ text: 'Battle started!', type: 'info' }]);

		const bag = ITEMS_DB.find((i) => i.id === 'starter_bag');
		const weapon = ITEMS_DB.find((i) => i.type === ITEM_TYPES.WEAPON);
		const shield = ITEMS_DB.find((i) => i.id === 'iron_shield');

		if (bag && weapon && shield) {
			const enemyInv: InventoryItem[] = [
				{
					...bag,
					uniqueId: 'e_bag1',
					x: 2,
					y: 2,
					currentShape: bag.shape,
					rotation: 0,
					color: 'bg-red-900/40',
				} as InventoryItem,
				{
					...weapon,
					uniqueId: 'e_wep',
					x: 2,
					y: 2,
					currentShape: weapon.shape,
					rotation: 0,
					cooldownCurrent: 0,
					lastTrigger: 0,
				} as InventoryItem,
				{
					...shield,
					uniqueId: 'e_shd',
					x: 3,
					y: 2,
					currentShape: shield.shape,
					rotation: 0,
					cooldownCurrent: 0,
					lastTrigger: 0,
				} as InventoryItem,
			];
			setEnemyInventory(enemyInv);
		}

		setInventory((inv) =>
			inv.map((i) => ({ ...i, cooldownCurrent: i.cooldown || 0 }))
		);
		setPlayerStats((prev) => ({
			...prev,
			hp: prev.maxHp,
			armor: 0,
			stamina: prev.maxStamina,
		}));
		setEnemyStats({
			hp: 150 + Math.floor(Math.random() * 50),
			maxHp: 200,
			damage: 4,
			attackSpeed: 2.5,
			nextAttack: 2.5,
			armor: 0,
		});
		setSelectedItem(null);
	};

	const handleContinue = () => {
		performMerges(inventory, setInventory, setFallingItems);
		setGameState('shop');
		setPlayerStats((prev) => ({ ...prev, hp: prev.maxHp }));
		rerollShop();
		setEnemyInventory([]);
	};

	const togglePin = (item: InventoryItem) => {
		setShopItems((prev) =>
			prev.map((i) =>
				i.uniqueId === item.uniqueId ? { ...i, isPinned: !i.isPinned } : i
			)
		);
		setSelectedItem((prev) =>
			prev
				? { ...prev, item: { ...prev.item, isPinned: !prev.item.isPinned } }
				: null
		);
	};

	const toggleMergeLock = (item: InventoryItem) => {
		setInventory((prev) =>
			prev.map((i) =>
				i.uniqueId === item.uniqueId
					? { ...i, isMergeLocked: !i.isMergeLocked }
					: i
			)
		);
		setSelectedItem((prev) =>
			prev
				? {
						...prev,
						item: { ...prev.item, isMergeLocked: !prev.item.isMergeLocked },
				  }
				: null
		);
	};

	// --- RENDERERS ---
	let ghostGrid: GhostGrid | null = null;
	if (dragState && backpackRef.current) {
		const gridRect = backpackRef.current.getBoundingClientRect();
		const itemScreenX = dragState.currentX - dragState.offsetX;
		const itemScreenY = dragState.currentY - dragState.offsetY;
		const relativeX = itemScreenX - gridRect.left + CELL_SIZE / 2;
		const relativeY = itemScreenY - gridRect.top + CELL_SIZE / 2;
		const gx = Math.floor(relativeX / CELL_SIZE);
		const gy = Math.floor(relativeY / CELL_SIZE);
		const valid = !checkCollision(
			inventory,
			gx,
			gy,
			dragState.currentShape,
			dragState.item.uniqueId,
			dragState.item.type,
			GRID_W,
			GRID_H
		);
		ghostGrid = { x: gx, y: gy, valid };
	}

	// Calculate merge links
	const mergeLinks: MergeLink[] = [];
	if (gameState !== 'battle') {
		const pairs = getMergeablePairs(inventory);
		pairs.forEach((pair) => {
			const c1 = {
				x: pair[0].x + pair[0].currentShape[0].length / 2,
				y: pair[0].y + pair[0].currentShape.length / 2,
			};
			const c2 = {
				x: pair[1].x + pair[1].currentShape[0].length / 2,
				y: pair[1].y + pair[1].currentShape.length / 2,
			};
			mergeLinks.push({
				x1: c1.x * CELL_SIZE,
				y1: c1.y * CELL_SIZE,
				x2: c2.x * CELL_SIZE,
				y2: c2.y * CELL_SIZE,
			});
		});
	}

	return (
		<div
			className="h-screen w-screen text-slate-100 font-sans flex flex-col items-center select-none overflow-hidden touch-none"
			style={{ backgroundColor: '#020305' }}
			onPointerDown={(e) => {
				if (e.target === e.currentTarget) {
					setSelectedItem(null);
				}
			}}
		>
			<div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
				{fallingItems.map((p) => (
					<div className="pointer-events-auto" key={p.id}>
						<PhysicsItem
							itemData={p}
							onGrab={(e, data) => handlePointerDown(e, data.item, 'physics')}
						/>
					</div>
				))}
			</div>

			<div className="w-full">
				<GameHeader
					gameState={gameState}
					battleSpeed={battleSpeed}
					gold={gold}
					playerStats={playerStats}
					enemyStats={enemyStats}
					onStartBattle={startBattle}
					onSetBattleSpeed={setBattleSpeed}
					onContinue={handleContinue}
				/>
			</div>

			<div className="z-10 flex flex-col items-center w-full max-w-7xl pointer-events-none p-2 flex-1 overflow-hidden min-h-0">
				{gameState === 'shop' && (
					<Shop
						shopItems={shopItems}
						gold={gold}
						dragState={dragState}
						onReroll={rerollShop}
						onPointerDown={handlePointerDown}
					/>
				)}

				<div className="flex flex-col lg:flex-row gap-4 w-full justify-center items-stretch flex-1 min-h-0">
					<div className="flex flex-col gap-2 pointer-events-auto">
						<div className="relative">
							<GameGrid
								inventory={inventory}
								dragState={dragState}
								ghostGrid={ghostGrid}
								gameState={gameState}
								isEnemy={false}
								backpackRef={backpackRef}
								onPointerDown={handlePointerDown}
							/>
							<svg className="absolute inset-0 pointer-events-none w-full h-full z-20">
								{mergeLinks.map((link, i) => (
									<g key={i}>
										<line
											x1={link.x1}
											y1={link.y1}
											x2={link.x2}
											y2={link.y2}
											stroke="#a855f7"
											strokeWidth="3"
											className="animate-pulse"
										/>
										<circle
											cx={(link.x1 + link.x2) / 2}
											cy={(link.y1 + link.y2) / 2}
											r="4"
											fill="#d8b4fe"
											className="animate-ping"
										/>
									</g>
								))}
							</svg>
						</div>
					</div>

					<div className="flex flex-col gap-2 w-full lg:w-64 pointer-events-auto min-h-0">
						<BattleLogComponent logs={battleLog} gameState={gameState} />
					</div>

					{gameState !== 'shop' && (
						<div className="flex flex-col gap-2 animate-in fade-in slide-in-from-right duration-500 pointer-events-auto">
							<div className="relative">
								<GameGrid
									inventory={enemyInventory}
									dragState={null}
									ghostGrid={null}
									gameState={gameState}
									isEnemy={true}
									onPointerDown={handlePointerDown}
								/>
							</div>
						</div>
					)}
				</div>
			</div>

			<DragPreview dragState={dragState} />
			<InfoModal
				selectedItem={selectedItem}
				modalPos={modalPos}
				setModalPos={setModalPos}
				onTogglePin={togglePin}
				onToggleMergeLock={toggleMergeLock}
			/>
		</div>
	);
}
