'use client';

import { ConnectButton, useCurrentAccount, useDisconnectWallet, useCurrentWallet } from '@mysten/dapp-kit';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, LogOut, User } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
	const account = useCurrentAccount();
	const { currentWallet } = useCurrentWallet();
	const { mutate: disconnect } = useDisconnectWallet();
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Close dropdown menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
		setIsDropdownOpen(false);
	};

	const formatAddress = (address: string) => {
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	};

	return (
		<header className="w-full bg-slate-900 border-b border-slate-800 shadow-lg z-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					{/* Logo / Title */}
					<Link href="/" className="flex items-center space-x-2">
						<h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
							OnePack
						</h1>
					</Link>

					{/* Navigation */}
					<nav className="flex items-center space-x-4">
						<Link
							href="/game"
							className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
						>
							Game
						</Link>
					</nav>

					{/* Wallet */}
					<div className="flex items-center">
						{account ? (
							<div className="relative" ref={dropdownRef}>
								<button
									onClick={() => setIsDropdownOpen(!isDropdownOpen)}
									className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
								>
									<div className="flex items-center space-x-2">
										<div className="w-2 h-2 bg-green-500 rounded-full"></div>
										<span className="text-sm font-medium text-slate-200">
											{formatAddress(account.address)}
										</span>
									</div>
									<ChevronDown
										size={16}
										className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
									/>
								</button>

								{/* Dropdown menu */}
								{isDropdownOpen && (
									<div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
										<div className="p-4 border-b border-slate-700">
											<div className="flex items-center space-x-3">
												<div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
													<User size={20} className="text-slate-900" />
												</div>
												<div className="flex-1 min-w-0">
													<p className="text-sm font-medium text-slate-200 truncate">
														{currentWallet?.name || 'Wallet'}
													</p>
													<p className="text-xs text-slate-400 font-mono truncate">
														{account.address}
													</p>
												</div>
											</div>
										</div>

										<div className="p-2">
											{account.chains && account.chains.length > 0 && (
												<div className="px-3 py-2 text-xs text-slate-400">
													Network: <span className="text-slate-300">{account.chains[0]}</span>
												</div>
											)}
										</div>

										<div className="p-2 border-t border-slate-700">
											<button
												onClick={handleDisconnect}
												className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
											>
												<LogOut size={16} />
												<span>Disconnect Wallet</span>
											</button>
										</div>
									</div>
								)}
							</div>
						) : (
							<ConnectButton />
						)}
					</div>
				</div>
			</div>
		</header>
	);
}
