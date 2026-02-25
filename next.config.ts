// next.config.ts
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
	experimental: {
		serverActions: {
			bodySizeLimit: '3mb', // increase as needed
		},
	},
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'lh3.googleusercontent.com',
			},
			{
				protocol: 'https',
				hostname: 'blogger.googleusercontent.com',
			},
			{
				protocol: 'https',
				hostname: 'burleyfamilysearchcenter.com',
			},

			{
				protocol: 'http',
				hostname: 'localhost',
				port: '3000',
			},
			{ protocol: 'https', hostname: 'zecjdztqymcsdpyznlfa.supabase.co' },
		],
	},
}

const withNextIntl = createNextIntlPlugin()
export default withNextIntl(nextConfig)
