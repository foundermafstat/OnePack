import React from 'react';
import { GameState, PlayerStats, EnemyStats } from './types';
import { FaPlay, FaMagic, FaCoins, FaHeart, FaShieldAlt } from 'react-icons/fa';

interface GameHeaderProps {
	gameState: GameState;
	battleSpeed: number;
	gold: number;
	playerStats: PlayerStats;
	enemyStats?: EnemyStats;
	onStartBattle: () => void;
	onSetBattleSpeed: (speed: number) => void;
	onContinue: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
	gameState,
	battleSpeed,
	gold,
	playerStats,
	enemyStats,
	onStartBattle,
	onSetBattleSpeed,
	onContinue,
}) => {
	return (
		<div className="z-10 w-full flex flex-col gap-2 pointer-events-auto bg-[#020305]">
			<div className="flex justify-between items-center bg-slate-900/50 p-3 border-b border-slate-800/50">
				<h1 className="text-xl font-bold text-slate-300 flex items-center gap-2">
					BattlePack{' '}
					<span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded">
						BETA
					</span>
				</h1>

				{gameState === 'shop' && (
					<button
						onClick={onStartBattle}
						className="px-6 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-medium rounded border border-slate-700/50 flex items-center justify-center gap-2 transition-colors"
					>
						<FaPlay size={14} /> TO BATTLE
					</button>
				)}
				{gameState === 'battle' && (
					<div className="flex bg-slate-800/50 rounded border border-slate-700/50 p-1 gap-1">
						{[1, 2, 4, 8].map((s) => (
							<button
								key={s}
								onClick={() => onSetBattleSpeed(s)}
								className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
									battleSpeed === s
										? 'bg-slate-700 text-slate-200'
										: 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'
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
						className="px-4 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-medium rounded border border-slate-700/50 flex items-center justify-center gap-2 transition-colors"
					>
						{gameState === 'victory' ? (
							<>
								<FaMagic size={14} /> CONTINUE
							</>
						) : (
							'RESTART'
						)}
					</button>
				)}
				<div className="flex gap-3 text-sm font-medium">
					<div className="text-slate-400 flex items-center">
						<FaCoins size={14} className="mr-1" />
						{gold}
					</div>
				</div>
			</div>

			{(gameState === 'battle' ||
				gameState === 'victory' ||
				gameState === 'gameover') && (
				<div className="flex justify-between items-center gap-4 bg-slate-900/30 p-3 border-b border-slate-800/50">
					<div className="flex flex-col gap-1">
						<div className="text-xs text-slate-500 uppercase tracking-wider">
							PLAYER
						</div>
						<div className="flex gap-4 text-sm font-medium">
							<div className="text-slate-300 flex items-center">
								<FaHeart size={12} className="mr-1" />
								HP: {Math.ceil(playerStats.hp)}/{playerStats.maxHp}
							</div>
							<div className="text-slate-300 flex items-center">
								<FaShieldAlt size={12} className="mr-1" />
								Armor: {Math.min(90, Math.floor(playerStats.armor))}%
							</div>
							{playerStats.stamina !== undefined && (
								<div className="text-slate-300 flex items-center">
									<span className="mr-1">⚡</span>
									Stamina: {playerStats.stamina}/{playerStats.maxStamina}
								</div>
							)}
						</div>
					</div>
					{enemyStats && (
						<div className="flex flex-col gap-1 items-end">
							<div className="text-xs text-slate-500 uppercase tracking-wider">
								ENEMY
							</div>
							<div className="flex gap-4 text-sm font-medium">
								<div className="text-slate-300 flex items-center">
									<FaHeart size={12} className="mr-1" />
									HP: {Math.ceil(enemyStats.hp)}/{enemyStats.maxHp}
								</div>
								{enemyStats.armor !== undefined && (
									<div className="text-slate-300 flex items-center">
										<FaShieldAlt size={12} className="mr-1" />
										Armor: {Math.min(90, Math.floor(enemyStats.armor))}%
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
};
