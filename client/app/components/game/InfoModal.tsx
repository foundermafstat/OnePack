import React, { useState, useCallback, useEffect } from 'react';
import { SelectedItem, InventoryItem } from './types';
import { MERGE_RECIPES, ITEMS_DB } from './constants';
import { FaLock, FaCodeBranch } from 'react-icons/fa';

interface InfoModalProps {
	selectedItem: SelectedItem | null;
	modalPos: { x: number; y: number };
	setModalPos: (pos: { x: number; y: number }) => void;
	onTogglePin: (item: InventoryItem) => void;
	onToggleMergeLock: (item: InventoryItem) => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({
	selectedItem,
	modalPos,
	setModalPos,
	onTogglePin,
	onToggleMergeLock,
}) => {
	const [isDragging, setIsDragging] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

	const handlePointerMove = useCallback(
		(e: PointerEvent) => {
			if (isDragging) {
				setModalPos({
					x: e.clientX - dragOffset.x,
					y: e.clientY - dragOffset.y,
				});
			}
		},
		[isDragging, dragOffset, setModalPos]
	);

	const handlePointerUp = useCallback(() => {
		setIsDragging(false);
	}, []);

	useEffect(() => {
		if (isDragging) {
			window.addEventListener('pointermove', handlePointerMove);
			window.addEventListener('pointerup', handlePointerUp);
			return () => {
				window.removeEventListener('pointermove', handlePointerMove);
				window.removeEventListener('pointerup', handlePointerUp);
			};
		}
	}, [isDragging, handlePointerMove, handlePointerUp]);

	if (!selectedItem) return null;

	const { item, source } = selectedItem;
	const recipes = Object.entries(MERGE_RECIPES).filter(([k]) => k === item.id);

	return (
		<div
			className="fixed z-[100] pointer-events-auto"
			style={{ left: modalPos.x, top: modalPos.y }}
			onPointerDown={(e) => e.stopPropagation()}
		>
			<div className="relative group">
				<div className="bg-slate-900/90 border border-slate-800/50 rounded w-64 overflow-hidden flex flex-col backdrop-blur-sm">
					<div
						className="bg-slate-800/50 p-2 flex justify-center items-center cursor-move border-b border-slate-800/50"
						onPointerDown={(e) => {
							e.preventDefault();
							setIsDragging(true);
							setDragOffset({
								x: e.clientX - modalPos.x,
								y: e.clientY - modalPos.y,
							});
						}}
					>
						<span className="font-medium text-sm text-slate-200">
							{item.name}
						</span>
					</div>
					<div className="p-4 flex flex-col gap-3">
						<div className="flex gap-4">
							<div
								className={`w-16 h-16 rounded-lg ${item.color} flex items-center justify-center text-slate-800`}
							>
								<div className="scale-150">{item.icon}</div>
							</div>
							<div className="text-xs text-slate-300">
								<div className="mb-1">{item.description}</div>
								<div className="flex gap-2">
									{item.damage && (
										<span className="text-slate-300">
											Damage: {item.damage}
										</span>
									)}
									{item.block && (
										<span className="text-slate-300">Block: {item.block}%</span>
									)}
								</div>
								<div className="mt-1 text-slate-400">
									Cooldown: {item.cooldown}s
								</div>
							</div>
						</div>
						{recipes.length > 0 && (
							<div className="bg-slate-800/30 p-2 rounded border border-slate-800/50 text-xs">
								<div className="text-slate-400 mb-1 flex items-center">
									<FaCodeBranch size={12} className="mr-1" /> Merges:
								</div>
								{recipes.map(([, result]) => {
									const resItem = ITEMS_DB.find((i) => i.id === result);
									return (
										<div
											key={result}
											className="flex items-center gap-1 text-slate-300"
										>
											2x {item.name} = {resItem?.name || result}
										</div>
									);
								})}
							</div>
						)}
					</div>
				</div>

				<div className="absolute top-0 -right-12 flex flex-col gap-2">
					{source === 'shop' && (
						<button
							onClick={() => onTogglePin(item)}
							className={`w-10 h-10 rounded border flex items-center justify-center transition-all transform active:scale-95 ${
								item.isPinned
									? 'bg-slate-700 border-slate-600 text-slate-200'
									: 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-700/50'
							}`}
							title={item.isPinned ? 'Unpin' : 'Pin'}
						>
							{item.isPinned ? (
								<FaLock size={18} />
							) : (
								<div className="relative">
									<FaLock size={18} />
									<div className="absolute inset-0 flex items-center justify-center">
										<div className="w-full h-0.5 bg-current rotate-45"></div>
									</div>
								</div>
							)}
						</button>
					)}

					{source === 'inventory' && (
						<button
							onClick={() => onToggleMergeLock(item)}
							className={`w-10 h-10 rounded border flex items-center justify-center transition-all transform active:scale-95 ${
								item.isMergeLocked
									? 'bg-slate-700 border-slate-600 text-slate-200'
									: 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50'
							}`}
							title={item.isMergeLocked ? 'Merge disabled' : 'Merge enabled'}
						>
							{!item.isMergeLocked ? (
								<FaCodeBranch size={18} />
							) : (
								<div className="relative">
									<FaCodeBranch size={18} />
									<div className="absolute inset-0 flex items-center justify-center">
										<div className="w-full h-0.5 bg-current rotate-45"></div>
									</div>
								</div>
							)}
						</button>
					)}
				</div>
			</div>
		</div>
	);
};
