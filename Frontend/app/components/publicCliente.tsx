import { createPublicClient, custom, http } from "viem";
import { mantleSepoliaTestnet } from "viem/chains";
import dotenv from "dotenv";
dotenv.config();

export const publicClient = 
    createPublicClient({
        chain: mantleSepoliaTestnet,
        transport: http(process.env.MANTLE_SEPOLIA_RPC_URL)
       //transport: custom((window.ethereum) as any)
      }); 
