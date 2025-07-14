import { useState, useEffect } from "react";
import { BREAKPOINTS } from "../constants";

export function useResponsive() {
	const [screenSize, setScreenSize] = useState({
		width: typeof window !== "undefined" ? window.innerWidth : 0,
		height: typeof window !== "undefined" ? window.innerHeight : 0,
	});

	const [isMobile, setIsMobile] = useState(false);
	const [isTablet, setIsTablet] = useState(false);
	const [isDesktop, setIsDesktop] = useState(false);

	useEffect(() => {
		const handleResize = () => {
			const width = window.innerWidth;
			const height = window.innerHeight;

			setScreenSize({ width, height });
			setIsMobile(width < BREAKPOINTS.SM);
			setIsTablet(width >= BREAKPOINTS.SM && width < BREAKPOINTS.LG);
			setIsDesktop(width >= BREAKPOINTS.LG);
		};

		// Set initial values
		handleResize();

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return {
		screenSize,
		isMobile,
		isTablet,
		isDesktop,
	};
}
