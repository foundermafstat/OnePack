import React from 'react';
import { BattleLog as BattleLogType } from './types';
import { Info } from 'lucide-react';

interface BattleLogProps {
	logs: BattleLogType[];
	gameState: string;
}

export const BattleLog: React.FC<BattleLogProps> = ({ logs, gameState }) => {
	if (gameState === 'battle') {
		return (
			<div className="flex-1 bg-black/40 rounded-lg p-2 font-mono text-[10px] overflow-y-auto border border-slate-800 scrollbar-hide flex flex-col-reverse">
				{logs.map((l, i) => (
					<div
						key={i}
						className={`mb-1 px-1 rounded ${
							l.type === 'player'
								? 'text-green-400 text-left border-l-2 border-green-500 bg-green-900/10'
								: l.type === 'enemy'
									? 'text-red-400 text-right border-r-2 border-red-500 bg-red-900/10'
									: 'text-yellow-500 text-center bg-yellow-900/10'
						}`}
					>
						{l.text}
					</div>
				))}
			</div>
		);
	}

	return (
		<div className="flex-1 flex flex-col items-center justify-center text-slate-600 border border-slate-800/50 rounded-lg bg-slate-900/30">
			<Info size={32} className="mb-2 opacity-50" />
			<div className="text-xs text-center px-4">
				Arrange items.
				<br />
				Identical items can be merged.
			</div>
		</div>
	);
};

