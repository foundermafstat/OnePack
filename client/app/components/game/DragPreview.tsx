import React from 'react';
import { DragState } from './types';
import { CELL_SIZE } from './constants';

interface DragPreviewProps {
	dragState: DragState | null;
}

export const DragPreview: React.FC<DragPreviewProps> = ({ dragState }) => {
	if (!dragState) return null;

	return (
		<div
			className="fixed pointer-events-none z-50 flex flex-col opacity-90"
			style={{
				left: dragState.currentX,
				top: dragState.currentY,
				transform: `translate(-${dragState.offsetX}px, -${dragState.offsetY}px)`,
			}}
		>
			<div
				className="grid gap-0"
				style={{
					gridTemplateColumns: `repeat(${dragState.currentShape[0].length}, ${CELL_SIZE}px)`,
					transform: `rotate(${0}deg)`,
				}}
			>
				{dragState.currentShape.map((row, r) =>
					row.map((cell, c) => (
						<div
							key={`${r}-${c}`}
							className={`w-[${CELL_SIZE}px] h-[${CELL_SIZE}px] ${
								cell ? dragState.item.color : 'bg-transparent'
							} flex items-center justify-center border ${
								cell ? 'border-white/50' : 'border-transparent'
							}`}
						>
							{cell && r === 0 && c === 0 ? (
								<div className="scale-125 text-white drop-shadow-md">
									{dragState.item.icon}
								</div>
							) : (
								''
							)}
						</div>
					))
				)}
			</div>
			<div className="absolute -top-3 -right-3 w-5 h-5 rounded-full border-2 border-slate-600 border-t-transparent animate-spin bg-slate-900/80"></div>
		</div>
	);
};
