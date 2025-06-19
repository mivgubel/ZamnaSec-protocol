"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createWalletClient, custom } from "viem";
import { mainnet } from "viem/chains";
import { useRouter } from "next/navigation";

interface WalletContextType {
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnecting: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if already connected
    if (typeof window !== "undefined" && (window as any).ethereum && (window as any).ethereum.selectedAddress) {
      setAddress((window as any).ethereum.selectedAddress);
    }
  }, []);

  const connect = async () => {
    setIsConnecting(true);
    try {
      if (typeof window === "undefined" || !(window as any).ethereum) {
        alert("MetaMask is not installed");
        setIsConnecting(false);
        return;
      }
      const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
      setAddress(accounts[0]);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
    router.push("/");
  };

  return (
    <WalletContext.Provider value={{ address, connect, disconnect, isConnecting }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within a WalletProvider");
  return context;
}; 