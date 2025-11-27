import { useEffect, useRef } from 'react';
import { GameState, InventoryItem, PlayerStats, EnemyStats, BattleLog } from '../types';
import { ITEM_TYPES } from '../constants';

interface UseBattleProps {
	gameState: GameState;
	battleSpeed: number;
	inventory: InventoryItem[];
	enemyInventory: InventoryItem[];
	playerStats: PlayerStats;
	enemyStats: EnemyStats;
	setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
	setEnemyInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
	setPlayerStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
	setEnemyStats: React.Dispatch<React.SetStateAction<EnemyStats>>;
	setGameState: React.Dispatch<React.SetStateAction<GameState>>;
	setGold: React.Dispatch<React.SetStateAction<number>>;
	setBattleLog: React.Dispatch<React.SetStateAction<BattleLog[]>>;
}

export const useBattle = ({
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
}: UseBattleProps) => {
	const inventoryRef = useRef(inventory);
	const playerStatsRef = useRef(playerStats);
	const enemyStatsRef = useRef(enemyStats);
	const battleSpeedRef = useRef(battleSpeed);
	const enemyInventoryRef = useRef(enemyInventory);

	useEffect(() => {
		inventoryRef.current = inventory;
	}, [inventory]);
	useEffect(() => {
		playerStatsRef.current = playerStats;
	}, [playerStats]);
	useEffect(() => {
		enemyStatsRef.current = enemyStats;
	}, [enemyStats]);
	useEffect(() => {
		battleSpeedRef.current = battleSpeed;
	}, [battleSpeed]);
	useEffect(() => {
		enemyInventoryRef.current = enemyInventory;
	}, [enemyInventory]);

	const log = (text: string, type: BattleLog['type'] = 'neutral') => {
		setBattleLog((prev) => [{ text, type }, ...prev].slice(0, 12));
	};

	useEffect(() => {
		if (gameState !== 'battle') return;

		const interval = setInterval(() => {
			const dt = 0.1 * battleSpeedRef.current;
			const currentInv = [...inventoryRef.current];
			let currentEnemyInv = [...enemyInventoryRef.current];
			const player = { ...playerStatsRef.current };
			const enemy = { ...enemyStatsRef.current };
			const now = Date.now();

			// PLAYER Items
			currentInv.forEach((item) => {
				if (item.type === ITEM_TYPES.BAG) return;
				if (item.cooldownCurrent !== undefined && item.cooldownCurrent > 0) {
					item.cooldownCurrent -= dt;
				}

				if (item.cooldownCurrent !== undefined && item.cooldownCurrent <= 0) {
					let triggered = false;
					if (item.type === ITEM_TYPES.WEAPON) {
						if (player.stamina >= (item.staminaCost || 0)) {
							let dmg = item.damage || 0;
							if (enemy.armor > 0) {
								const reduce = Math.min(90, enemy.armor) / 100;
								dmg = dmg * (1 - reduce);
							}
							enemy.hp -= dmg;
							player.stamina -= item.staminaCost || 0;
							log(`${item.name}: ${dmg.toFixed(1)} damage`, 'player');
							triggered = true;
						}
					} else if (item.type === ITEM_TYPES.ARMOR) {
						player.armor = Math.min(90, player.armor + (item.block || 10));
						log(`${item.name}: +${item.block}% block`, 'player');
						triggered = true;
					} else if (item.heal) {
						if (player.hp < player.maxHp) {
							player.hp = Math.min(player.maxHp, player.hp + item.heal);
							log(`${item.name}: healing`, 'player');
							triggered = true;
						}
					}

					if (triggered) {
						item.cooldownCurrent = item.cooldown || 0;
					}
				}
			});

			// ENEMY Items
			currentEnemyInv.forEach((item) => {
				if (item.type === ITEM_TYPES.BAG) return;
				if (item.cooldownCurrent === undefined)
					item.cooldownCurrent = item.cooldown || 0;

				if (item.cooldownCurrent > 0) {
					item.cooldownCurrent -= dt;
				}
				if (item.cooldownCurrent <= 0) {
					let triggered = false;
					if (item.type === ITEM_TYPES.WEAPON) {
						let dmg = item.damage || 4;
						if (player.armor > 0) {
							const reduce = Math.min(90, player.armor) / 100;
							dmg = dmg * (1 - reduce);
						}
						player.hp -= dmg;
						log(`Enemy: ${item.name} - ${dmg.toFixed(1)} damage`, 'enemy');
						triggered = true;
					} else if (item.type === ITEM_TYPES.ARMOR) {
						enemy.armor = Math.min(90, enemy.armor + (item.block || 10));
						log(`Enemy: ${item.name} - block`, 'enemy');
						triggered = true;
					}

					if (triggered) {
						item.cooldownCurrent = item.cooldown || 0;
						item.lastTrigger = now;
					}
				}
			});

			// Passive Stamina
			if (player.stamina < player.maxStamina) player.stamina += dt * 0.5;

			if (player.armor > 0) player.armor = Math.max(0, player.armor - dt * 2);
			if (enemy.armor > 0) enemy.armor = Math.max(0, enemy.armor - dt * 2);

			setInventory(currentInv);
			setEnemyInventory(currentEnemyInv);
			setPlayerStats(player);
			setEnemyStats(enemy);

			if (enemy.hp <= 0) {
				setGameState('victory');
				setGold((g) => g + 6);
				log('VICTORY!', 'info');
			} else if (player.hp <= 0) {
				setGameState('gameover');
				log('DEFEAT...', 'info');
			}
		}, 100);

		return () => clearInterval(interval);
	}, [gameState, setInventory, setEnemyInventory, setPlayerStats, setEnemyStats, setGameState, setGold, setBattleLog]);
};

