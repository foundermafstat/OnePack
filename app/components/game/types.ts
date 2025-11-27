import React from 'react';

export type ItemType = 'weapon' | 'armor' | 'consumable' | 'accessory' | 'bag';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export type GameState = 'shop' | 'battle' | 'victory' | 'gameover';

export interface Item {
	id: string;
	name: string;
	type: ItemType;
	shape: number[][];
	rarity: Rarity;
	cost: number;
	description: string;
	icon: React.ReactNode;
	color: string;
	cooldown?: number;
	damage?: number;
	staminaCost?: number;
	block?: number;
	heal?: number;
	staminaRegen?: number;
	isConsumable?: boolean;
	effectType?: string;
	value?: number;
}

export interface InventoryItem extends Item {
	uniqueId: string;
	x: number;
	y: number;
	rotation: number;
	currentShape: number[][];
	cooldownCurrent?: number;
	isPinned?: boolean;
	isMergeLocked?: boolean;
	lastTrigger?: number;
}

export interface DragState {
	item: InventoryItem;
	source: 'shop' | 'inventory' | 'physics';
	startX: number;
	startY: number;
	currentX: number;
	currentY: number;
	offsetX: number;
	offsetY: number;
	rotation: number;
	currentShape: number[][];
	originalItem: InventoryItem;
	startTime: number;
}

export interface PhysicsItem {
	id: string;
	item: InventoryItem;
	x: number;
	y: number;
	vx: number;
	vy: number;
	rotation: number;
	vr: number;
}

export interface PlayerStats {
	hp: number;
	maxHp: number;
	armor: number;
	stamina: number;
	maxStamina: number;
}

export interface EnemyStats {
	hp: number;
	maxHp: number;
	damage: number;
	attackSpeed: number;
	nextAttack: number;
	armor: number;
}

export interface BattleLog {
	text: string;
	type: 'player' | 'enemy' | 'info' | 'neutral';
}

export interface GhostGrid {
	x: number;
	y: number;
	valid: boolean;
}

export interface MergeLink {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}

export interface SelectedItem {
	item: InventoryItem;
	source: 'shop' | 'inventory' | 'physics';
}

