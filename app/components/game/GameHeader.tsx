import React from 'react';
import { GameState, PlayerStats } from './types';
import { Play, Sparkles, Coins, Heart, Shield } from 'lucide-react';

interface GameHeaderProps {
	gameState: GameState;
	battleSpeed: number;
	gold: number;
	playerStats: PlayerStats;
	onStartBattle: () => void;
	onSetBattleSpeed: (speed: number) => void;
	onContinue: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
	gameState,
	battleSpeed,
	gold,
	playerStats,
	onStartBattle,
	onSetBattleSpeed,
	onContinue,
}) => {
	return (
		<div className="z-10 w-full max-w-6xl flex justify-between items-center mb-2 bg-slate-900 p-2 rounded-xl border border-slate-800 shadow-lg pointer-events-auto">
			<h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent flex items-center gap-2">
				BattlePack{' '}
				<span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
					BETA
				</span>
			</h1>

			{gameState === 'shop' && (
				<button
					onClick={onStartBattle}
					className="px-6 py-1 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded shadow-lg flex items-center justify-center gap-2 hover:scale-[1.05] transition-transform"
				>
					<Play size={16} fill="white" /> TO BATTLE
				</button>
			)}
			{gameState === 'battle' && (
				<div className="flex bg-slate-800 rounded p-1 gap-1">
					{[1, 2, 4, 8].map((s) => (
						<button
							key={s}
							onClick={() => onSetBattleSpeed(s)}
							className={`px-2 py-0.5 text-xs font-bold rounded ${
								battleSpeed === s
									? 'bg-yellow-500 text-black'
									: 'text-slate-400 hover:bg-slate-700'
							}`}
						>
							x{s}
						</button>
					))}
				</div>
			)}
			{(gameState === 'victory' || gameState === 'gameover') && (
				<button
					onClick={onContinue}
					className="px-4 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded shadow-lg flex items-center justify-center gap-2"
				>
					{gameState === 'victory' ? (
						<>
							<Sparkles size={16} /> CONTINUE
						</>
					) : (
						'RESTART'
					)}
				</button>
			)}
			<div className="flex gap-3 text-sm font-medium">
				<div className="text-yellow-400 flex items-center">
					<Coins size={16} className="mr-1" />
					{gold}
				</div>
				<div className="text-red-400 flex items-center">
					<Heart size={16} className="mr-1" />
					{Math.ceil(playerStats.hp)}
				</div>
				<div className="text-blue-400 flex items-center">
					<Shield size={16} className="mr-1" />
					{Math.min(90, Math.floor(playerStats.armor))}%
				</div>
			</div>
		</div>
	);
};

