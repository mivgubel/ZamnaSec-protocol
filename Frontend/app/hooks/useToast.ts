import { useState, useCallback } from "react";
import type { ToastMessage } from "../types";

export function useToast() {
	const [toast, setToast] = useState<ToastMessage | string | null>(null);

	const showToast = useCallback((message: ToastMessage | string) => {
		setToast(message);
	}, []);

	const showSuccess = useCallback((message: string) => {
		setToast({ type: "success", message });
	}, []);

	const showError = useCallback((message: string) => {
		setToast({ type: "error", message });
	}, []);

	const showInfo = useCallback((message: string) => {
		setToast({ type: "info", message });
	}, []);

	const hideToast = useCallback(() => {
		setToast(null);
	}, []);

	return {
		toast,
		showToast,
		showSuccess,
		showError,
		showInfo,
		hideToast,
	};
}
