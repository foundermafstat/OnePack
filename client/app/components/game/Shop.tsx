import React, { useRef } from 'react';
import { InventoryItem, DragState } from './types';
import { ShopItem } from './ShopItem';
import { FaSync, FaShoppingBag, FaTimesCircle } from 'react-icons/fa';

interface ShopProps {
	shopItems: InventoryItem[];
	gold: number;
	dragState: DragState | null;
	onReroll: () => void;
	onPointerDown: (
		e: React.PointerEvent,
		item: InventoryItem,
		source: 'shop'
	) => void;
}

export const Shop: React.FC<ShopProps> = ({
	shopItems,
	gold,
	dragState,
	onReroll,
	onPointerDown,
}) => {
	const shopRef = useRef<HTMLDivElement>(null);

	return (
		<div
			ref={shopRef}
			className="w-full max-w-4xl bg-slate-900/30 p-3 rounded border border-slate-800/50 mb-4 transition-colors pointer-events-auto"
		>
			<div className="flex justify-between items-center mb-2">
				<span className="text-slate-400 font-medium text-xs flex items-center">
					<FaShoppingBag className="mr-2" size={14} /> SHOP
				</span>
				<button
					onClick={onReroll}
					className="text-xs flex items-center px-2 py-1 bg-slate-800/50 hover:bg-slate-700/50 rounded text-slate-300 border border-slate-700/50 transition-colors"
				>
					<FaSync size={10} className="mr-1" /> Refresh (1$)
				</button>
			</div>

			{dragState &&
			(dragState.source === 'inventory' || dragState.source === 'physics') ? (
				<div className="w-full h-24 border-2 border-dashed border-slate-600 bg-slate-800/30 rounded flex items-center justify-center text-slate-300 font-medium">
					<FaTimesCircle className="mr-2" /> SELL FOR{' '}
					{Math.floor(dragState.item.cost / 2)}$
				</div>
			) : (
				<div className="flex gap-4 overflow-x-auto pb-2 min-h-[80px] items-center">
					{shopItems.map((item) => (
						<ShopItem
							key={item.uniqueId}
							item={item}
							gold={gold}
							onPointerDown={onPointerDown}
						/>
					))}
				</div>
			)}
		</div>
	);
};
