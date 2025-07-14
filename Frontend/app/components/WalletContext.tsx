"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { WalletContextType } from "../types";
import { ERROR_MESSAGES } from "../constants";

// Extended window interface for MetaMask
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      selectedAddress: string | null;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
    };
  }
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const ARBITRUM_SEPOLIA_PARAMS = {
  chainId: "0x66eee", // 421614 en hexadecimal
  chainName: "Arbitrum Sepolia",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
  blockExplorerUrls: ["https://sepolia.arbiscan.io/"],
};

async function switchToArbitrumSepolia() {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ARBITRUM_SEPOLIA_PARAMS.chainId }],
      });
    } catch (switchError: any) {
      // Si la red no está en MetaMask, la agregamos
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [ARBITRUM_SEPOLIA_PARAMS],
        });
      } else {
        throw switchError;
      }
    }
  }
}

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const router = useRouter();

  // Check if MetaMask is available
  const isMetaMaskInstalled = useCallback(() => {
    return typeof window !== "undefined" && window.ethereum?.isMetaMask === true;
  }, []);

  // Handle account changes
  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      setAddress(null);
      router.push("/");
    } else if (accounts[0] !== address) {
      setAddress(accounts[0]);
    }
  }, [address, router]);

  // Handle chain changes
  const handleChainChanged = useCallback(() => {
    // Reload the page when chain changes
    window.location.reload();
  }, []);

  useEffect(() => {
    // Solo conectar automáticamente si el usuario lo pidió
    const shouldAutoConnect = typeof window !== 'undefined' && localStorage.getItem('walletConnected') === 'true';
    if (shouldAutoConnect && isMetaMaskInstalled() && window.ethereum?.selectedAddress) {
      setAddress(window.ethereum.selectedAddress);
    }

    // Set up event listeners
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      // Clean up event listeners
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [handleAccountsChanged, handleChainChanged, isMetaMaskInstalled]);

  const connect = async (): Promise<void> => {
    if (isConnecting) return;
    setIsConnecting(true);
    try {
      if (!isMetaMaskInstalled()) {
        throw new Error(ERROR_MESSAGES.METAMASK_NOT_INSTALLED);
      }
      // Forzar red Arbitrum Sepolia
      await switchToArbitrumSepolia();
      const accounts = await window.ethereum!.request({ 
        method: "eth_requestAccounts" 
      });
      if (accounts.length === 0) {
        throw new Error("No accounts returned from MetaMask");
      }
      setAddress(accounts[0]);
      // Guardar flag de conexión
      if (typeof window !== 'undefined') {
        localStorage.setItem('walletConnected', 'true');
      }
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      if (error instanceof Error && !error.message.includes("User rejected")) {
        alert(error.message || ERROR_MESSAGES.NETWORK_ERROR);
      }
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = useCallback(async () => {
    try {
      setAddress(null);
      // Eliminar flag de conexión
      if (typeof window !== 'undefined') {
        localStorage.removeItem('walletConnected');
        sessionStorage.removeItem('walletAddress');
      }
      router.push("/");
      console.log('Wallet disconnected. For complete disconnection, please disconnect from MetaMask extension.');
    } catch (error) {
      console.error('Error during disconnect:', error);
      setAddress(null);
      router.push("/");
    }
  }, [router]);

  const value: WalletContextType = {
    address,
    connect,
    disconnect,
    isConnecting,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}; 