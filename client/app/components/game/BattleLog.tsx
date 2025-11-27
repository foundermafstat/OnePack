import React from 'react';
import { BattleLog as BattleLogType } from './types';
import { FaInfoCircle } from 'react-icons/fa';

interface BattleLogProps {
	logs: BattleLogType[];
	gameState: string;
}

export const BattleLog: React.FC<BattleLogProps> = ({ logs, gameState }) => {
	if (gameState === 'battle') {
		return (
			<div className=" bg-slate-900/20 rounded border border-slate-800/50 p-2 font-mono text-[10px] overflow-y-auto scrollbar-hide flex flex-col-reverse">
				{logs.map((l, i) => (
					<div
						key={i}
						className={`mb-1 px-1 rounded ${
							l.type === 'player'
								? 'text-slate-300 text-left border-l-2 border-slate-600 bg-slate-800/20'
								: l.type === 'enemy'
								? 'text-slate-300 text-right border-r-2 border-slate-600 bg-slate-800/20'
								: 'text-slate-400 text-center bg-slate-800/10'
						}`}
					>
						{l.text}
					</div>
				))}
			</div>
		);
	}

	return (
		<div className="flex-1 flex flex-col items-center justify-center text-slate-500 border border-slate-800/50 rounded bg-slate-900/20">
			<FaInfoCircle size={32} className="mb-2 opacity-40" />
			<div className="text-xs text-center px-4">
				Arrange items.
				<br />
				Identical items can be merged.
			</div>
		</div>
	);
};
