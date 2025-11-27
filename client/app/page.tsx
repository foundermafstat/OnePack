'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { TypewriterText } from './components/TypewriterText';
import { Button } from './components/ui/button';

const descriptionText = `Onepack elevates the auto-battler genre by transforming inventory management into the core of combat mastery. Every item is a puzzle piece, every placement a tactical decision, and every backpack layout a unique blueprint for victory. Players must fit, rotate, and combine distinctively shaped NFT items inside a limited 2D grid, creating explosive synergies and highly personalized builds that evolve with each match.

Battles unfold through an asynchronous PvP system designed for instant action — no waiting rooms, no pressure, just pure strategy on your terms. Combined with OneChain's speed, zero-fee environment, and seamless on-chain asset ownership, Onepack delivers frictionless competitive gameplay accessible to everyone.

The game economy is driven by a carefully balanced dual-token model. A soft in-game currency fuels upgrades, crafting, and experimentation, while token empowers players to participate in high-stakes competitions, unlock elite rewards, and shape the future of the ecosystem.

By blending spatial puzzles, competitive strategy, and decentralized asset ownership, Onepack creates a Play-to-Own experience where every decision feels meaningful, every build feels personal, and every win feels earned. This is the next evolution of blockchain gaming — dynamic, rewarding, and irresistibly strategic.`;

export default function Home() {
	const [showButton, setShowButton] = useState(false);
	const [startTyping, setStartTyping] = useState(false);
	const terminalRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		// Prevent scrolling
		document.body.style.overflow = 'hidden';
		// Start typing animation after a short delay
		const timer = setTimeout(() => {
			setStartTyping(true);
		}, 500);
		return () => {
			document.body.style.overflow = 'unset';
			clearTimeout(timer);
		};
	}, []);

	// Auto-scroll terminal to bottom
	useEffect(() => {
		if (terminalRef.current && startTyping) {
			terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
		}
	}, [startTyping, showButton]);

	return (
		<div className="relative w-screen h-[calc(100vh-4rem)] overflow-hidden">
			{/* Video Background */}
			<div className="absolute inset-0 w-full h-full">
				<video
					autoPlay
					loop
					muted
					playsInline
					className="absolute inset-0 w-full h-full object-cover scale-110"
				>
					<source src="/ui/video-bg.mp4" type="video/mp4" />
				</video>
				{/* Gradient overlay - left to right (from transparent to background color) */}
				<div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-950/40 via-slate-950/70 to-slate-950" />
			</div>

			{/* Content Container - One third of screen, positioned on the right */}
			<div className="relative z-10 h-full flex items-center justify-end">
				<div className="w-1/3 pl-8 pr-16">
					{/* Logo/Title */}
					<div className="mb-8">
						<h1 className="text-5xl font-heading font-bold cyberpunk-text-glow text-cyan-400 mb-2 tracking-wider">
							ONEPACK
						</h1>
						<div className="h-1 w-24 bg-cyan-400 cyberpunk-glow" />
					</div>

					{/* Typewriter Text */}
					<div className="mb-8">
						<div
							ref={terminalRef}
							className="bg-black/80 backdrop-blur-md rounded-lg p-8 shadow-2xl  border-cyan-500/50 max-h-[50vh] overflow-y-auto terminal-scrollbar"
						>
							<div className="text-sm leading-relaxed font-body">
								{startTyping ? (
									<TypewriterText
										text={descriptionText}
										speed={12}
										onComplete={() => setShowButton(true)}
										className="whitespace-pre-line"
										onTextUpdate={() => {
											// Auto-scroll on each text update
											if (terminalRef.current) {
												terminalRef.current.scrollTop =
													terminalRef.current.scrollHeight;
											}
										}}
									/>
								) : (
									<div className="text-cyan-400 font-mono animate-pulse">
										Initializing...
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Start Playing Button */}
					<div
						className={`transition-all duration-1000 ease-out ${
							showButton
								? 'opacity-100 translate-y-0'
								: 'opacity-0 translate-y-4 pointer-events-none'
						}`}
					>
						<Link href="/game">
							<button className="cyberpunk-button px-10 py-7 text-xl font-heading font-bold uppercase tracking-wider">
								START PLAYING
							</button>
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
