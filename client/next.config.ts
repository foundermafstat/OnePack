import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	async rewrites() {
		return [
			{
				source: '/api/rpc/:path*',
				destination: `${
					process.env.NEXT_PUBLIC_ONECHAIN_RPC_URL || 'http://127.0.0.1:9000'
				}/:path*`,
			},
		];
	},
};

export default nextConfig;
