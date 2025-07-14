import { createWalletClient, custom, type Address } from "viem";
import { CHAIN } from "../constants";
import { publicClient } from "../components/publicCliente";
import { zFactoryAbi } from "../abi/zFactoryAbi";
import { zEnforcerAbi } from "../abi/zEnforcerAbi";
import { CONTRACTS, ERROR_MESSAGES } from "../constants";
import { valueToBytes32 } from "../utils/formatting";
import type { Invariant, InvariantFormData } from "../types";

/**
 * Service for interacting with the Zamna Factory contract
 */
export class ContractService {
	private walletClient: any = null;

	constructor() {
		this.initializeWalletClient();
	}

	private async initializeWalletClient() {
		if (typeof window !== "undefined" && window.ethereum) {
			this.walletClient = createWalletClient({
				chain: CHAIN,
				transport: custom(window.ethereum),
			});
		}
	}

	private ensureWalletClient() {
		if (!this.walletClient) {
			throw new Error(ERROR_MESSAGES.METAMASK_NOT_INSTALLED);
		}
		return this.walletClient;
	}

	private async getActiveAccount(): Promise<Address> {
		if (typeof window !== "undefined" && window.ethereum) {
			const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
			return accounts[0] as Address;
		}
		throw new Error("No wallet connected");
	}

	/**
	 * Deploy a new invariants contract
	 */
	async deployInvariantsContract(configurer: Address): Promise<Address> {
		const client = this.ensureWalletClient();
		const account = await this.getActiveAccount();

		try {
			const { request } = await publicClient.simulateContract({
				address: CONTRACTS.ZAMNA_FACTORY,
				abi: zFactoryAbi,
				functionName: "deployInvariantsContract",
				args: [configurer],
				account,
			});

			const hash = await client.writeContract(request);
			const receipt = await publicClient.waitForTransactionReceipt({ hash });

			// Extract the deployed contract address from events
			if (receipt.logs && receipt.logs.length > 0) {
				// Parse the event to get the deployed contract address
				// This is simplified - in production, you'd properly decode the event
				return receipt.logs[0].address as Address;
			}

			throw new Error("Failed to get deployed contract address");
		} catch (error) {
			console.error("Error deploying contract:", error);
			throw new Error(ERROR_MESSAGES.TRANSACTION_FAILED);
		}
	}

	/**
	 * Get contracts deployed by a user
	 */
	async getContractsDeployedByUser(userAddress: Address): Promise<Address[]> {
		console.log("userAddress", userAddress);
		try {
			const numContracts = (await publicClient.readContract({
				address: CONTRACTS.ZAMNA_FACTORY,
				abi: zFactoryAbi,
				functionName: "numContractsDeployedByUser",
				args: [userAddress],
			})) as number;

			const contracts: Address[] = [];
			for (let i = 0; i < numContracts; i++) {
				const contractAddress = (await publicClient.readContract({
					address: CONTRACTS.ZAMNA_FACTORY,
					abi: zFactoryAbi,
					functionName: "contractsDeployedByUser",
					args: [userAddress, BigInt(i)],
				})) as Address;
				contracts.push(contractAddress);
			}

			return contracts;
		} catch (error) {
			console.error("Error fetching deployed contracts:", error);
			return [];
		}
	}

	/**
	 * Create a new invariant
	 */
	async createInvariant(contractAddress: Address, data: InvariantFormData): Promise<void> {
		const client = this.ensureWalletClient();
		const account = await this.getActiveAccount();

		try {
			// Convert value to bytes32 format based on type
			const bytes32Value = valueToBytes32(data.value, data.type);

			const { request } = await publicClient.simulateContract({
				address: contractAddress,
				abi: zEnforcerAbi,
				functionName: "Create_Invariant",
				args: [data.name, data.asker as Address, parseInt(data.type), parseInt(data.rule), bytes32Value],
				account,
			});

			const hash = await client.writeContract(request);
			await publicClient.waitForTransactionReceipt({ hash });
		} catch (error) {
			console.error("Error creating invariant:", error);
			throw new Error(ERROR_MESSAGES.TRANSACTION_FAILED);
		}
	}

	/**
	 * Update an existing invariant
	 */
	async updateInvariant(contractAddress: Address, invariantId: number, data: InvariantFormData): Promise<void> {
		const client = this.ensureWalletClient();
		const account = await this.getActiveAccount();

		try {
			// Convert value to bytes32 format based on type
			const bytes32Value = valueToBytes32(data.value, data.type);

			const { request } = await publicClient.simulateContract({
				address: contractAddress,
				abi: zEnforcerAbi,
				functionName: "Update_Invariant",
				args: [
					BigInt(invariantId),
					data.name,
					data.asker as Address,
					parseInt(data.type),
					parseInt(data.rule),
					bytes32Value,
				],
				account,
			});

			const hash = await client.writeContract(request);
			await publicClient.waitForTransactionReceipt({ hash });
		} catch (error) {
			console.error("Error updating invariant:", error);
			throw new Error(ERROR_MESSAGES.TRANSACTION_FAILED);
		}
	}

	/**
	 * Toggle invariant enabled/disabled state
	 */
	async toggleInvariant(contractAddress: Address, invariantId: number, enabled: boolean): Promise<void> {
		const client = this.ensureWalletClient();
		const account = await this.getActiveAccount();

		try {
			const { request } = await publicClient.simulateContract({
				address: contractAddress,
				abi: zEnforcerAbi,
				functionName: "Disable_Invariant",
				args: [BigInt(invariantId), enabled],
				account,
			});

			const hash = await client.writeContract(request);
			await publicClient.waitForTransactionReceipt({ hash });
		} catch (error) {
			console.error("Error toggling invariant:", error);
			throw new Error(ERROR_MESSAGES.TRANSACTION_FAILED);
		}
	}

	/**
	 * Llama a Disable_Invariant en el contrato para habilitar/deshabilitar un invariant
	 */
	async disableInvariant(contractAddress: Address, invariantId: number, disable: boolean): Promise<void> {
		const client = this.ensureWalletClient();
		const account = await this.getActiveAccount();
		try {
			await client.writeContract({
				address: contractAddress,
				abi: zEnforcerAbi,
				functionName: "Disable_Invariant",
				account,
				args: [BigInt(invariantId), disable],
				chain: CHAIN,
			});
		} catch (error) {
			console.error("Error disabling/enabling invariant:", error);
			throw error;
		}
	}

	/**
	 * Get all invariants from a contract
	 */
	async getInvariants(contractAddress: Address): Promise<Invariant[]> {
		try {
			const count = (await publicClient.readContract({
				address: contractAddress,
				abi: zEnforcerAbi,
				functionName: "countInvariantID",
			})) as bigint;

			const invariants: Invariant[] = [];
			for (let i = 1; i <= Number(count); i++) {
				try {
					const invariant = (await publicClient.readContract({
						address: contractAddress,
						abi: zEnforcerAbi,
						functionName: "getInvariant",
						args: [BigInt(i)],
					})) as [string, Address, number, number, `0x${string}`];

					invariants.push({
						id: i,
						name: invariant[0],
						asker: invariant[1],
						type: invariant[2].toString(),
						rule: invariant[3].toString(),
						value: invariant[4],
						enabled: true, // You might need another call to check if it's enabled
					});
				} catch (error) {
					console.warn(`Failed to fetch invariant ${i}:`, error);
				}
			}

			return invariants;
		} catch (error) {
			console.error("Error fetching invariants:", error);
			return [];
		}
	}

	/**
	 * Consulta si un invariant está activo en la blockchain
	 */
	async isInvariantActive(contractAddress: Address, invariantId: number): Promise<boolean> {
		try {
			const result = await publicClient.readContract({
				address: contractAddress,
				abi: zEnforcerAbi,
				functionName: "isInvariantActive",
				args: [BigInt(invariantId)],
			});
			return result as boolean;
		} catch (error) {
			console.error("Error checking invariant active status:", error);
			return false;
		}
	}
}

// Singleton instance
export const contractService = new ContractService();
