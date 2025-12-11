// next.config.ts
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'lh3.googleusercontent.com',
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
		],
	},
}

const withNextIntl = createNextIntlPlugin()
export default withNextIntl(nextConfig)
