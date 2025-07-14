import type { NextConfig } from "next";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const nextConfig: NextConfig = {
	// Performance optimizations
	poweredByHeader: false,
	compress: true,
	generateEtags: true,

	// Security headers
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{
						key: "X-DNS-Prefetch-Control",
						value: "on",
					},
					{
						key: "X-XSS-Protection",
						value: "1; mode=block",
					},
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "Referrer-Policy",
						value: "origin-when-cross-origin",
					},
					{
						key: "Content-Security-Policy",
						value: [
							"default-src 'self'",
							"script-src 'self' 'unsafe-eval' 'unsafe-inline'", // @note Consider making this stricter in production
							"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
							"font-src 'self' https://fonts.gstatic.com",
							"img-src 'self' data: https:",
							"connect-src 'self' https://rpc.sepolia.mantle.xyz https://sepolia-rollup.arbitrum.io https://*.metamask.io",
							"frame-src 'none'",
							"object-src 'none'",
							"base-uri 'self'",
							"form-action 'self'",
							"upgrade-insecure-requests",
						].join("; "),
					},
				],
			},
		];
	},

	// Image optimization
	images: {
		formats: ["image/webp", "image/avif"],
		dangerouslyAllowSVG: false,
		contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
		domains: [], // @note Add external image domains if needed
	},

	// Experimental features for better performance
	experimental: {
		optimizeCss: true,
		scrollRestoration: true,
	},

	// Turbopack configuration (stable)
	turbopack: {
		rules: {
			"*.svg": {
				loaders: ["@svgr/webpack"],
				as: "*.js",
			},
		},
	},

	// Environment variables validation
	env: {
		CUSTOM_NODE_ENV: process.env.NODE_ENV,
	},

	// Webpack customization for security (when not using Turbopack)
	webpack: (config, { dev, isServer, nextRuntime }) => {
		// Only apply webpack config if not using Turbopack
		if (nextRuntime === "nodejs") {
			// Add source map in development for debugging
			if (dev && !isServer) {
				config.devtool = "eval-source-map";
			}

			// @note Security: Don't expose source maps in production
			if (!dev) {
				config.devtool = false;
			}
		}

		return config;
	},

	// TypeScript configuration
	typescript: {
		ignoreBuildErrors: false,
	},

	// ESLint configuration
	eslint: {
		ignoreDuringBuilds: false,
	},
};

export default nextConfig;
