import { VALIDATION_PATTERNS, ERROR_MESSAGES } from "../constants";
import type { ValidationResult } from "../types";

/**
 * Validates a hexadecimal address
 */
export function validateHexAddress(address: string): ValidationResult {
	if (!address) {
		return { isValid: false, error: ERROR_MESSAGES.REQUIRED_FIELD };
	}

	if (!VALIDATION_PATTERNS.HEX_ADDRESS.test(address)) {
		return { isValid: false, error: ERROR_MESSAGES.INVALID_ADDRESS };
	}

	return { isValid: true };
}

/**
 * Validates a value based on its type
 */
export function validateValueByType(value: string, type: string): ValidationResult {
	if (!value) {
		return { isValid: false, error: ERROR_MESSAGES.REQUIRED_FIELD };
	}

	switch (type) {
		case "1": // UINT
			if (!VALIDATION_PATTERNS.UINT.test(value) || Number(value) < 0) {
				return { isValid: false, error: "Invalid UINT value" };
			}
			break;
		case "2": // INT
			if (!VALIDATION_PATTERNS.INT.test(value)) {
				return { isValid: false, error: "Invalid INT value" };
			}
			break;
		case "3": // ADDRESS
			return validateHexAddress(value);
		case "4": // BOOL
			if (!["true", "false", "1", "0"].includes(value.toLowerCase())) {
				return { isValid: false, error: "Invalid BOOL value (true/false)" };
			}
			break;
		case "5": // BYTES32
			if (!VALIDATION_PATTERNS.HEX_32.test(value)) {
				return { isValid: false, error: "Invalid BYTES32 value (0x + 64 hex chars)" };
			}
			break;
		default:
			return { isValid: false, error: "Invalid type selected" };
	}

	return { isValid: true };
}

/**
 * Validates form data
 */
export function validateInvariantForm(data: {
	name: string;
	asker: string;
	type: string;
	rule: string;
	value: string;
}): ValidationResult {
	if (!data.name.trim()) {
		return { isValid: false, error: "Name is required" };
	}

	if (data.name.trim().length > 100) {
		return { isValid: false, error: "Name must be less than 100 characters" };
	}

	const askerValidation = validateHexAddress(data.asker);
	if (!askerValidation.isValid) {
		return { isValid: false, error: `Asker address: ${askerValidation.error}` };
	}

	if (!data.type) {
		return { isValid: false, error: "Type is required" };
	}

	if (!data.rule) {
		return { isValid: false, error: "Rule is required" };
	}

	const valueValidation = validateValueByType(data.value, data.type);
	if (!valueValidation.isValid) {
		return { isValid: false, error: `Value: ${valueValidation.error}` };
	}

	return { isValid: true };
}

/**
 * Sanitizes input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
	return input
		.replace(/[<>]/g, "") // Remove potential HTML tags
		.trim()
		.slice(0, 1000); // Limit length
}
