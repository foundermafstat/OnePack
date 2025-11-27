import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
	isConnected: boolean;
	walletName: string | null;
	accountAddress: string | null;
	setAuth: (walletName: string | null, accountAddress: string | null) => void;
	clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			isConnected: false,
			walletName: null,
			accountAddress: null,
			setAuth: (walletName, accountAddress) =>
				set({
					isConnected: true,
					walletName,
					accountAddress,
				}),
			clearAuth: () =>
				set({
					isConnected: false,
					walletName: null,
					accountAddress: null,
				}),
		}),
		{
			name: 'onepack-auth-storage',
		}
	)
);
