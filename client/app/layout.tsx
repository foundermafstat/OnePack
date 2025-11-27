import type { Metadata } from 'next';
import './globals.css';
import '@mysten/dapp-kit/dist/index.css';
import { Providers } from './providers';
import Header from './components/Header';
import { fontBebas, fontMontserrat } from '@/assets/fonts';

export const metadata: Metadata = {
	title: 'OnePack - Sui dApp',
	description: 'Sui dApp built with Next.js and Mysten Labs dApp Kit',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${fontBebas.variable} ${fontMontserrat.variable} antialiased`}
			>
				<Providers>
					<Header />
					{children}
				</Providers>
			</body>
		</html>
	);
}
