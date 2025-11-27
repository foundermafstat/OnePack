'use client';

import {
	useCurrentAccount,
	useDisconnectWallet,
	useCurrentWallet,
	ConnectModal,
} from '@mysten/dapp-kit';
import { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaSignOutAlt, FaUser, FaWallet } from 'react-icons/fa';
import Link from 'next/link';
import { useAuthStore } from '@/app/store/authStore';

export default function Header() {
	const account = useCurrentAccount();
	const { currentWallet } = useCurrentWallet();
	const { mutate: disconnect } = useDisconnectWallet();
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const { setAuth, clearAuth } = useAuthStore();

	// Sync wallet state with zustand store
	useEffect(() => {
		if (account && currentWallet) {
			setAuth(currentWallet.name || null, account.address);
		} else {
			clearAuth();
		}
	}, [account, currentWallet, setAuth, clearAuth]);

	// Close dropdown menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsDropdownOpen(false);
			}
		};

		if (isDropdownOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isDropdownOpen]);

	const handleDisconnect = () => {
		disconnect();
		clearAuth();
		setIsDropdownOpen(false);
	};

	const formatAddress = (address: string) => {
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	};

	return (
		<div className="z-10 w-full flex flex-col pointer-events-auto bg-[#020305]">
			<div className="flex justify-between items-center bg-slate-900/50 p-3 border-b border-slate-800/50">
				<Link href="/" className="flex items-center gap-2">
					<h1 className="text-xl flex items-center gap-2">
						<span
							className="inline-block"
							style={{
								fontFamily: 'var(--font-bebas), sans-serif',
								fontWeight: 600,
								background:
									'linear-gradient(180deg, #ffffff 0%, #e0e0e0 20%, #ffffff 40%, #c8c8c8 50%, #ffffff 60%, #d0d0d0 80%, #a0a0a0 100%)',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent',
								backgroundClip: 'text',
								filter:
									'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))',
								letterSpacing: '0.05em',
							}}
						>
							ONEPACK
						</span>
						<span className="text-[10px] text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded">
							BETA
						</span>
					</h1>
				</Link>

				<nav className="flex items-center gap-1">
					<Link
						href="/game"
						className="px-2 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 rounded border border-slate-700/50 transition-colors"
						style={{
							fontFamily: 'var(--font-bebas), sans-serif',
							fontWeight: 500,
						}}
					>
						GAME
					</Link>
					<Link
						href="/swap"
						className="px-2 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 rounded border border-slate-700/50 transition-colors"
						style={{
							fontFamily: 'var(--font-bebas), sans-serif',
							fontWeight: 500,
						}}
					>
						SWAP
					</Link>
					<Link
						href="/swap/reverse"
						className="px-2 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 rounded border border-slate-700/50 transition-colors"
						style={{
							fontFamily: 'var(--font-bebas), sans-serif',
							fontWeight: 500,
						}}
					>
						REVERSE SWAP
					</Link>
					<Link
						href="/marketplace"
						className="px-2 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 rounded border border-slate-700/50 transition-colors"
						style={{
							fontFamily: 'var(--font-bebas), sans-serif',
							fontWeight: 500,
						}}
					>
						MARKETPLACE
					</Link>
					{account && (
						<Link
							href={`/profile/${account.address}`}
							className="px-2 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 rounded border border-slate-700/50 transition-colors"
							style={{
								fontFamily: 'var(--font-bebas), sans-serif',
								fontWeight: 500,
							}}
						>
							PROFILE
						</Link>
					)}
				</nav>

				<div className="flex items-center gap-3">
					{account ? (
						<div className="relative" ref={dropdownRef}>
							<button
								onClick={() => setIsDropdownOpen(!isDropdownOpen)}
								className="px-4 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 rounded border border-slate-700/50 flex items-center gap-2 transition-colors"
								style={{
									fontFamily: 'var(--font-bebas), sans-serif',
									fontWeight: 500,
								}}
							>
								<div className="w-2 h-2 bg-slate-400 rounded-full"></div>
								<span className="text-sm font-bebas-nav">
									{formatAddress(account.address)}
								</span>
								<FaChevronDown
									size={12}
									className={`text-slate-400 transition-transform ${
										isDropdownOpen ? 'rotate-180' : ''
									}`}
								/>
							</button>

							{isDropdownOpen && (
								<div className="absolute right-0 mt-2 w-64 bg-slate-900/95 border border-slate-800/50 rounded shadow-xl z-50 backdrop-blur-md">
									<div className="p-4 border-b border-slate-800/50">
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 bg-slate-800/50 border border-slate-700/50 rounded-full flex items-center justify-center">
												<FaUser size={18} className="text-slate-300" />
											</div>
											<div className="flex-1 min-w-0">
												<p
													className="text-sm text-slate-300 truncate"
													style={{
														fontFamily: 'var(--font-bebas), sans-serif',
														fontWeight: 500,
													}}
												>
													{currentWallet?.name || 'Wallet'}
												</p>
												<p className="text-xs text-slate-500 font-mono truncate">
													{account.address}
												</p>
											</div>
										</div>
									</div>

									<div className="p-2 space-y-1">
										{account.chains && account.chains.length > 0 && (
											<div
												className="px-3 py-2 text-xs text-slate-400"
												style={{
													fontFamily: 'var(--font-bebas), sans-serif',
													fontWeight: 500,
												}}
											>
												Network:{' '}
												<span className="text-slate-300">
													{account.chains[0]}
												</span>
											</div>
										)}
										<Link
											href={`/profile/${account.address}`}
											onClick={() => setIsDropdownOpen(false)}
											className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/50 rounded border border-slate-700/50 transition-colors font-bebas-nav"
										>
											<FaUser size={14} />
											<span className="font-bebas-nav">VIEW PROFILE</span>
										</Link>
									</div>

									<div className="p-2 border-t border-slate-800/50">
										<button
											onClick={handleDisconnect}
											className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/50 rounded border border-slate-700/50 transition-colors font-bebas-nav"
										>
											<FaSignOutAlt size={14} />
											<span className="font-bebas-nav">DISCONNECT</span>
										</button>
									</div>
								</div>
							)}
						</div>
					) : (
						<ConnectModal
							trigger={
								<button
									className="px-4 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 rounded border border-slate-700/50 flex items-center gap-2 transition-colors"
									style={{
										fontFamily: 'var(--font-bebas), sans-serif',
										fontWeight: 500,
									}}
								>
									<FaWallet size={14} />
									<span>CONNECT</span>
								</button>
							}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
