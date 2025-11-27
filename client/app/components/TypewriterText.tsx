'use client';

import { useState, useEffect } from 'react';

interface TypewriterTextProps {
	text: string;
	speed?: number;
	onComplete?: () => void;
	onTextUpdate?: () => void;
	className?: string;
}

export function TypewriterText({
	text,
	speed = 30,
	onComplete,
	onTextUpdate,
	className = '',
}: TypewriterTextProps) {
	const [displayedText, setDisplayedText] = useState('');
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isComplete, setIsComplete] = useState(false);

	useEffect(() => {
		if (currentIndex < text.length) {
			const timeout = setTimeout(() => {
				setDisplayedText((prev) => prev + text[currentIndex]);
				setCurrentIndex((prev) => prev + 1);
				onTextUpdate?.();
			}, speed);

			return () => clearTimeout(timeout);
		} else if (!isComplete) {
			setIsComplete(true);
			onComplete?.();
		}
	}, [currentIndex, text, speed, isComplete, onComplete, onTextUpdate]);

	return (
		<div className={className}>
			<span className="font-mono text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">
				{displayedText}
			</span>
			{!isComplete && (
				<span className="inline-block w-0.5 h-4 bg-white ml-1 animate-pulse drop-shadow-[0_0_4px_rgba(255,255,255,0.9)]">
					|
				</span>
			)}
		</div>
	);
}

