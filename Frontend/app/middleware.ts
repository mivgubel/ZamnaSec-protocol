import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
	// Clone the request headers
	const requestHeaders = new Headers(request.headers);

	// Add custom headers for enhanced security
	const response = NextResponse.next({
		request: {
			headers: requestHeaders,
		},
	});

	// Add security headers
	response.headers.set("X-Robots-Tag", "index, follow");

	// Rate limiting headers (basic implementation)
	const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "127.0.0.1";
	response.headers.set("X-Forwarded-For", ip);

	// Add request ID for debugging
	response.headers.set("X-Request-ID", crypto.randomUUID());

	// CORS headers for API routes
	if (request.nextUrl.pathname.startsWith("/api/")) {
		response.headers.set("Access-Control-Allow-Origin", "*");
		response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
		response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
	}

	return response;
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		"/((?!_next/static|_next/image|favicon.ico).*)",
	],
};
