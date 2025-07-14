import { arbitrumSepolia } from "viem/chains";

// Contract Addresses
export const CONTRACTS = {
	ZAMNA_FACTORY: "0x87c477d181Ab3133810dfca3B5D0c99bE7d2D64C" as const,
} as const;

export const CHAIN = arbitrumSepolia;

// Form Options
export const TYPE_OPTIONS = [
	{ label: "UINT", value: "1" },
	{ label: "INT", value: "2" },
	{ label: "ADDRESS", value: "3" },
	{ label: "BOOL", value: "4" },
	{ label: "BYTES32", value: "5" },
] as const;

export const RULE_OPTIONS = [
	{ label: "<", value: "1" },
	{ label: "<=", value: "2" },
	{ label: "==", value: "3" },
	{ label: ">=", value: "4" },
	{ label: ">", value: "5" },
	{ label: "!=", value: "6" },
] as const;

export const BOOL_RULE_OPTIONS = [
	{ label: "==", value: "3" },
	{ label: "!=", value: "6" },
] as const;

// UI Constants
export const BREAKPOINTS = {
	SM: 640,
	MD: 768,
	LG: 1024,
} as const;

// Security Constants
export const VALIDATION_PATTERNS = {
	HEX_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
	HEX_32: /^0x[a-fA-F0-9]{64}$/,
	HEX: /^0x[a-fA-F0-9]+$/,
	UINT: /^\d+$/,
	INT: /^-?\d+$/,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
	METAMASK_NOT_INSTALLED: "MetaMask is not installed",
	INVALID_ADDRESS: "Invalid hexadecimal address (0x + 40 hexadecimal characters)",
	INVALID_VALUE: "Invalid value for the selected type",
	REQUIRED_FIELD: "This field is required",
	NETWORK_ERROR: "Network error occurred",
	TRANSACTION_FAILED: "Transaction failed",
} as const;
