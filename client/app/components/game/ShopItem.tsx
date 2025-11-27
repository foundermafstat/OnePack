import React from 'react';
import { InventoryItem } from './types';
import { FaLock } from 'react-icons/fa';

interface ShopItemProps {
	item: InventoryItem;
	gold: number;
	onPointerDown: (
		e: React.PointerEvent,
		item: InventoryItem,
		source: 'shop'
	) => void;
}

export const ShopItem: React.FC<ShopItemProps> = ({
	item,
	gold,
	onPointerDown,
}) => {
	const w = item.shape[0].length;
	return (
		<div
			className={`relative p-1 rounded border ${
				gold >= item.cost
					? 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50 cursor-pointer'
					: 'border-slate-800/50 bg-slate-900/30 opacity-50'
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
			<div className="mt-1 text-center text-[10px] font-medium text-slate-300 flex justify-between">
				<span>{item.cost}$</span>
				<span className="text-slate-400 max-w-[60px] truncate">
					{item.name}
				</span>
			</div>
			{item.isPinned && (
				<div className="absolute -top-2 -right-2 bg-slate-700 text-slate-200 rounded-full p-0.5 border border-slate-600">
					<FaLock size={10} />
				</div>
			)}
		</div>
	);
};
