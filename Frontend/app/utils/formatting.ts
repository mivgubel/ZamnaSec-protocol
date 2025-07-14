/**
 * Formats an address for display with ellipsis
 */
export function formatAddress(address: string, startChars: number = 8, endChars: number = 4): string {
	if (!address) return "N/A";

	const displayLength = startChars + 3 + endChars; // chars + '...' + chars
	if (address.length <= displayLength) {
		return address;
	}

	return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Formats bytes32 for display
 */
export function formatBytes32(value: string, startChars: number = 10, endChars: number = 6): string {
	if (!value) return "N/A";

	if (value.length <= startChars + 3 + endChars) {
		return value;
	}

	return `${value.slice(0, startChars)}...${value.slice(-endChars)}`;
}

/**
 * Formats a value based on its type for display
 */
export function formatValueForDisplay(value: any, type: string): string {
	if (value === undefined || value === null) return "N/A";

	try {
		const bigIntValue = BigInt(value);

		switch (type) {
			case "1": // UINT
				return bigIntValue.toString(10);
			case "2": // INT
				// Handle signed integers (int256)
				if (bigIntValue > (BigInt(1) << BigInt(255)) - BigInt(1)) {
					return (bigIntValue - (BigInt(1) << BigInt(256))).toString();
				}
				return bigIntValue.toString();
			case "3": // ADDRESS
				const hex = "0x" + bigIntValue.toString(16).padStart(40, "0");
				return formatAddress(hex);
			case "4": // BOOL
				return value.toString().endsWith("1") ? "true" : "false";
			case "5": // BYTES32
				return formatBytes32(value.toString());
			default:
				return value.toString();
		}
	} catch (error) {
		console.error("Error formatting value:", error);
		return value?.toString() || "N/A";
	}
}

/**
 * Formats invariant value based on type
 */
export function formatInvariantValue(value: any, type: string): string {
	if (!value) return "N/A";

	try {
		switch (type) {
			case "1": // UINT
				return BigInt(value).toString();
			case "2": // INT
				let hex = value.startsWith("0x") ? value : `0x${value}`;
				let bn = BigInt(hex);
				// Handle signed int256
				if (bn > (BigInt(1) << BigInt(255)) - BigInt(1)) {
					bn = bn - (BigInt(1) << BigInt(256));
				}
				return bn.toString();
			case "3": // ADDRESS
				let addressHex = value.startsWith("0x") ? value : `0x${value}`;
				return `0x${addressHex.slice(-40)}`;
			case "4": // BOOL
				return value.endsWith("1") ? "true" : "false";
			case "5": // BYTES32
				return value;
			default:
				return value;
		}
	} catch (error) {
		console.error("Error formatting invariant value:", error);
		return value;
	}
}

/**
 * Converts a value to proper format for contract calls
 */
export function formatValueForContract(value: string, type: string): string {
	switch (type) {
		case "1": // UINT
		case "2": // INT
			return value;
		case "3": // ADDRESS
			return value.toLowerCase();
		case "4": // BOOL
			return value.toLowerCase() === "true" || value === "1" ? "1" : "0";
		case "5": // BYTES32
			return value;
		default:
			return value;
	}
}

/**
 * Converts a value to bytes32 format for contract calls
 */
export function valueToBytes32(value: string, type: string): `0x${string}` {
	switch (type) {
		case "1": // UINT
			// Convert number to hex and pad to 32 bytes
			const uintValue = BigInt(value);
			return `0x${uintValue.toString(16).padStart(64, "0")}` as `0x${string}`;

		case "2": // INT
			// Convert signed integer to hex and pad to 32 bytes
			let intValue = BigInt(value);
			if (intValue < 0) {
				// Handle negative numbers using two's complement
				intValue = (BigInt(1) << BigInt(256)) + intValue;
			}
			return `0x${intValue.toString(16).padStart(64, "0")}` as `0x${string}`;

		case "3": // ADDRESS
			// Convert address to bytes32 by padding with zeros
			const address = value.toLowerCase().replace("0x", "");
			return `0x${address.padStart(64, "0")}` as `0x${string}`;

		case "4": // BOOL
			// Convert boolean to bytes32 (0 or 1)
			const boolValue = value.toLowerCase() === "true" || value === "1" ? "1" : "0";
			return `0x${boolValue.padStart(64, "0")}` as `0x${string}`;

		case "5": // BYTES32
			// Already bytes32, ensure proper format
			if (value.startsWith("0x")) {
				return value as `0x${string}`;
			}
			return `0x${value}` as `0x${string}`;

		default:
			throw new Error(`Unsupported type: ${type}`);
	}
}

export function shortenMiddle(str: string, start: number = 6, end: number = 5): string {
	if (!str || str.length <= start + end) return str;
	return `${str.slice(0, start)}...${str.slice(-end)}`;
}
