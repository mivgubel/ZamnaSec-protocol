// Wallet Types
export interface WalletContextType {
	address: string | null;
	connect: () => Promise<void>;
	disconnect: () => Promise<void>;
	isConnecting: boolean;
}

// Contract Types
export interface Invariant {
	id: number;
	name: string;
	asker: string;
	type: string;
	rule: string;
	value: string;
	enabled?: boolean;
}

export interface InvariantFormData {
	name: string;
	asker: string;
	type: string;
	rule: string;
	value: string;
}

// UI Types
export interface ModalProps {
	open: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
}

export interface ToastMessage {
	type: "success" | "error" | "info";
	message: string;
}

// Chain and Contract Types
export interface ContractConfig {
	factoryAddress: string;
	rpcUrl?: string;
}

// Validation Types
export interface ValidationResult {
	isValid: boolean;
	error?: string;
}

// Type Options for forms
export interface TypeOption {
	label: string;
	value: string;
}

export interface RuleOption {
	label: string;
	value: string;
}
