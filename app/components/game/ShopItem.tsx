import React from 'react';
import { InventoryItem } from './types';
import { Lock } from 'lucide-react';

interface ShopItemProps {
	item: InventoryItem;
	gold: number;
	onPointerDown: (e: React.PointerEvent, item: InventoryItem, source: 'shop') => void;
}

export const ShopItem: React.FC<ShopItemProps> = ({ item, gold, onPointerDown }) => {
	const w = item.shape[0].length;
	return (
		<div
			className={`relative p-1 rounded border-2 ${
				gold >= item.cost
					? 'border-slate-600 bg-slate-800 hover:border-yellow-500 cursor-pointer'
					: 'border-red-900 bg-slate-900 opacity-50'
			} transition-all`}
			onPointerDown={(e) => gold >= item.cost && onPointerDown(e, item, 'shop')}
		>
			<div
				className="grid gap-[1px]"
				style={{ gridTemplateColumns: `repeat(${w}, 20px)` }}
			>
				{item.shape.map((row, r) =>
					row.map((cell, c) => (
						<div
							key={`${r}-${c}`}
							className={`w-5 h-5 ${
								cell ? item.color : 'bg-transparent'
							} flex items-center justify-center text-[10px]`}
						>
							{cell && r === 0 && c === 0 ? (
								<div className="scale-75">{item.icon}</div>
							) : (
								''
							)}
						</div>
					))
				)}
			</div>
			<div className="mt-1 text-center text-[10px] font-bold text-yellow-500 flex justify-between">
				<span>{item.cost}$</span>
				<span className="text-slate-400 max-w-[60px] truncate">
					{item.name}
				</span>
			</div>
			{item.isPinned && (
				<div className="absolute -top-2 -right-2 bg-yellow-400 text-black rounded-full p-0.5 border border-white">
					<Lock size={10} />
				</div>
			)}
		</div>
	);
};

