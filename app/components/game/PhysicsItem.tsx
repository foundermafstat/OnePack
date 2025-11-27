import React from 'react';
import { PhysicsItem as PhysicsItemType } from './types';
import { CELL_SIZE } from './constants';

interface PhysicsItemProps {
	itemData: PhysicsItemType;
	onGrab: (e: React.PointerEvent, itemData: PhysicsItemType) => void;
}

export const PhysicsItem: React.FC<PhysicsItemProps> = ({ itemData, onGrab }) => {
	const { item, x, y, rotation } = itemData;
	const w = item.currentShape[0].length;
	return (
		<div
			className="absolute origin-center cursor-grab hover:scale-105 transition-transform"
			style={{
				left: x,
				top: y,
				width: w * 20,
				transform: `rotate(${rotation}deg)`,
				zIndex: 5,
			}}
			onPointerDown={(e) => onGrab(e, itemData)}
		>
			<div
				className="grid gap-[1px]"
				style={{ gridTemplateColumns: `repeat(${w}, 20px)` }}
			>
				{item.currentShape.map((row, r) =>
					row.map((cell, c) => (
						<div
							key={`${r}-${c}`}
							className={`w-5 h-5 ${
								cell ? item.color : 'bg-transparent'
							} flex items-center justify-center text-[10px] rounded-sm shadow-sm`}
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
		</div>
	);
};

