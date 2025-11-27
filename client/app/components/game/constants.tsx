import React from 'react';
import { FaShieldAlt, FaHeart, FaBolt, FaShoppingBag } from 'react-icons/fa';
import { Item, ItemType } from './types';

// Simple sword icon component
const SwordIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="currentColor"
		className={className}
		xmlns="http://www.w3.org/2000/svg"
	>
		<path d="M6.92 5H5L14 14L15 13.06L19.06 17.11L17.11 19.06L13.06 15L12 14L4 22H2V20L10 12L9 11L4.89 6.89L6.92 5ZM20.71 4.04L21.96 2.79C22.15 2.6 22.15 2.29 21.96 2.1L19.9 0.04C19.71 -0.15 19.4 -0.15 19.21 0.04L18 1.25L20.71 4.04ZM17.96 5.29L15.12 8.12L8.29 1.29L11.12 -1.54L11.96 -0.71L19.79 7.12L20.63 6.29L17.96 5.29Z" />
	</svg>
);

export const GRID_W = 10;
export const GRID_H = 10;
export const CELL_SIZE = 40;

export const ITEM_TYPES = {
	WEAPON: 'weapon' as ItemType,
	ARMOR: 'armor' as ItemType,
	CONSUMABLE: 'consumable' as ItemType,
	ACCESSORY: 'accessory' as ItemType,
	BAG: 'bag' as ItemType,
};

export const MERGE_RECIPES: Record<string, string> = {
	wooden_sword: 'steel_sword',
	iron_shield: 'golden_shield',
	health_potion: 'big_potion',
	dagger: 'assassin_dagger',
	gem_ruby: 'gem_diamond',
};

export const ITEMS_DB: Item[] = [
	// --- BAGS ---
	{
		id: 'starter_bag',
		name: 'Leather Bag',
		type: ITEM_TYPES.BAG,
		shape: [
			[1, 1, 1],
			[1, 1, 1],
			[1, 1, 1],
		],
		rarity: 'common',
		cost: 4,
		description: 'Basic 3x3 bag.',
		icon: <FaShoppingBag size={20} className="opacity-50" />,
		color: 'bg-amber-700/40',
	},
	{
		id: 'long_bag',
		name: 'Belt',
		type: ITEM_TYPES.BAG,
		shape: [[1, 1, 1, 1]],
		rarity: 'common',
		cost: 3,
		description: 'Long belt.',
		icon: <div className="w-full h-1 bg-amber-900/50"></div>,
		color: 'bg-amber-800/40',
	},
	{
		id: 'cross_bag',
		name: 'First Aid Kit',
		type: ITEM_TYPES.BAG,
		shape: [
			[0, 1, 0],
			[1, 1, 1],
			[0, 1, 0],
		],
		rarity: 'rare',
		cost: 5,
		description: 'Cross-shaped bag.',
		icon: <div className="font-bold text-red-900/50 text-xl">+</div>,
		color: 'bg-red-900/20',
	},
	{
		id: 'heavy_bag',
		name: 'Heavy Backpack',
		type: ITEM_TYPES.BAG,
		shape: [
			[1, 1],
			[1, 1],
			[1, 1],
		],
		rarity: 'rare',
		cost: 6,
		description: 'Deep backpack.',
		icon: <FaShoppingBag size={20} className="opacity-80 text-stone-800" />,
		color: 'bg-stone-700/40',
	},
	// --- WEAPONS ---
	{
		id: 'wooden_sword',
		name: 'Sword',
		type: ITEM_TYPES.WEAPON,
		shape: [[1], [1], [1]],
		rarity: 'common',
		cost: 3,
		cooldown: 2.0,
		damage: 4,
		staminaCost: 1,
		description: '4 damage.',
		icon: <SwordIcon size={24} />,
		color: 'bg-stone-400',
	},
	{
		id: 'steel_sword',
		name: 'Steel Sword',
		type: ITEM_TYPES.WEAPON,
		shape: [[1], [1], [1]],
		rarity: 'rare',
		cost: 7,
		cooldown: 1.8,
		damage: 7,
		staminaCost: 1.2,
		description: '7 damage. Fast.',
		icon: <SwordIcon size={24} className="text-sky-300 drop-shadow-md" />,
		color: 'bg-sky-700',
	},
	{
		id: 'dagger',
		name: 'Dagger',
		type: ITEM_TYPES.WEAPON,
		shape: [[1, 1]],
		rarity: 'common',
		cost: 4,
		cooldown: 1.2,
		damage: 3,
		staminaCost: 0.5,
		description: '3 damage.',
		icon: <SwordIcon size={20} className="rotate-45" />,
		color: 'bg-slate-300',
	},
	{
		id: 'assassin_dagger',
		name: 'Assassin Dagger',
		type: ITEM_TYPES.WEAPON,
		shape: [[1, 1]],
		rarity: 'epic',
		cost: 9,
		cooldown: 0.8,
		damage: 5,
		staminaCost: 0.5,
		description: '5 damage. Very fast.',
		icon: <SwordIcon size={20} className="rotate-45 text-purple-400" />,
		color: 'bg-purple-900',
	},
	// --- ARMOR ---
	{
		id: 'iron_shield',
		name: 'Shield',
		type: ITEM_TYPES.ARMOR,
		shape: [
			[1, 1],
			[1, 1],
		],
		rarity: 'rare',
		cost: 6,
		cooldown: 4.0,
		block: 20,
		description: 'Blocks 20% damage.',
		icon: <FaShieldAlt size={24} />,
		color: 'bg-blue-400',
	},
	{
		id: 'golden_shield',
		name: 'Golden Shield',
		type: ITEM_TYPES.ARMOR,
		shape: [
			[1, 1],
			[1, 1],
		],
		rarity: 'legendary',
		cost: 15,
		cooldown: 4.0,
		block: 40,
		description: 'Blocks 40% damage.',
		icon: <FaShieldAlt size={24} className="text-yellow-200" />,
		color: 'bg-yellow-600',
	},
	// --- CONSUMABLES ---
	{
		id: 'health_potion',
		name: 'Potion',
		type: ITEM_TYPES.CONSUMABLE,
		shape: [[1], [1]],
		rarity: 'common',
		cost: 2,
		cooldown: 4.0,
		heal: 10,
		isConsumable: true,
		description: 'Heals 10.',
		icon: <FaHeart size={24} />,
		color: 'bg-red-400',
	},
	{
		id: 'big_potion',
		name: 'Big Potion',
		type: ITEM_TYPES.CONSUMABLE,
		shape: [[1], [1]],
		rarity: 'rare',
		cost: 5,
		cooldown: 4.0,
		heal: 25,
		isConsumable: true,
		description: 'Heals 25.',
		icon: <FaHeart size={28} className="text-white drop-shadow" />,
		color: 'bg-red-600',
	},
	{
		id: 'banana',
		name: 'Banana',
		type: ITEM_TYPES.CONSUMABLE,
		shape: [[1], [1]],
		rarity: 'common',
		cost: 2,
		cooldown: 3.0,
		heal: 4,
		staminaRegen: 2,
		description: 'Heal + Stamina.',
		icon: <span className="text-xl">🍌</span>,
		color: 'bg-yellow-300',
	},
	// --- ACCESSORIES ---
	{
		id: 'gem_ruby',
		name: 'Ruby',
		type: ITEM_TYPES.ACCESSORY,
		shape: [[1]],
		rarity: 'epic',
		cost: 8,
		cooldown: 5.0,
		effectType: 'buff_damage',
		value: 1,
		description: '+1 damage.',
		icon: <FaBolt size={20} />,
		color: 'bg-pink-500',
	},
	{
		id: 'gem_diamond',
		name: 'Diamond',
		type: ITEM_TYPES.ACCESSORY,
		shape: [[1]],
		rarity: 'legendary',
		cost: 16,
		cooldown: 4.0,
		effectType: 'buff_damage',
		value: 2,
		description: '+2 damage. Faster.',
		icon: <FaBolt size={20} className="text-cyan-200" />,
		color: 'bg-cyan-500',
	},
];

