import { createPublicClient, http } from "viem";
import { CHAIN } from "../constants";

const RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";

export const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http(RPC_URL),
});

export const createBrowserClient = () => {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is not available");
  }
  return createPublicClient({
    chain: CHAIN,
    transport: http(RPC_URL),
  });
}; 
