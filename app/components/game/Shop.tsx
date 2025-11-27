import React, { useRef } from 'react';
import { InventoryItem, DragState } from './types';
import { ShopItem } from './ShopItem';
import { RefreshCw, ShoppingBag, XCircle } from 'lucide-react';

interface ShopProps {
	shopItems: InventoryItem[];
	gold: number;
	dragState: DragState | null;
	onReroll: () => void;
	onPointerDown: (e: React.PointerEvent, item: InventoryItem, source: 'shop') => void;
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
			className="w-full max-w-4xl bg-slate-900/90 p-3 rounded-xl border border-slate-700 mb-4 transition-colors pointer-events-auto"
		>
			<div className="flex justify-between items-center mb-2">
				<span className="text-slate-300 font-bold text-xs flex items-center">
					<ShoppingBag className="mr-2" size={14} /> SHOP
				</span>
				<button
					onClick={onReroll}
					className="text-xs flex items-center px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-yellow-400 border border-slate-700"
				>
					<RefreshCw size={10} className="mr-1" /> Refresh (1$)
				</button>
			</div>

			{dragState && (dragState.source === 'inventory' || dragState.source === 'physics') ? (
				<div className="w-full h-24 border-2 border-dashed border-red-500 bg-red-900/20 rounded flex items-center justify-center text-red-400 font-bold animate-pulse">
					<XCircle className="mr-2" /> SELL FOR {Math.floor(dragState.item.cost / 2)}$
				</div>
			) : (
				<div className="flex gap-4 overflow-x-auto pb-2 min-h-[80px] items-center">
					{shopItems.map((item) => (
						<ShopItem key={item.uniqueId} item={item} gold={gold} onPointerDown={onPointerDown} />
					))}
				</div>
			)}
		</div>
	);
};

