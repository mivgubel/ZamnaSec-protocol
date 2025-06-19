"use client"
import { mainnet, mantleSepoliaTestnet } from "viem/chains";
import { useEffect, useState } from "react";
import { createWalletClient, custom } from "viem";
import { useWallet } from "./components/WalletContext";



function WalletIcon({ className = "w-8 h-8 text-blue-600" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className}>
      <path d="M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-224c0-35.3-28.7-64-64-64L80 128c-8.8 0-16-7.2-16-16s7.2-16 16-16l368 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L64 32zM416 272a32 32 0 1 1 0 64 32 32 0 1 1 0-64z" />
    </svg>
  );
}

export default function Home() {
  const { address, connect, isConnecting } = useWallet();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white via-blue-50 to-blue-300 font-sans text-slate-800 text-sm">
      <div className="w-full max-w-sm">
        <div className="border border-blue-200 rounded-2xl p-7 shadow-xl bg-white/95 flex flex-col items-center">
          <div className="flex flex-col items-center mb-6">
            <span className="bg-blue-100 rounded-full p-3 mb-2 shadow flex items-center justify-center">
              <WalletIcon className="w-8 h-8 text-blue-600" />
            </span>
            <h1 className="text-lg font-bold text-blue-900 mb-1">Connect your Wallet</h1>
          </div>
          {address ? (
            <div className="w-full flex flex-col items-center mb-2">
              <span className="text-xs text-blue-900 font-mono bg-blue-50 border border-blue-200 rounded px-2 py-1 mb-2">{address}</span>
              <span className="text-green-600 font-bold">Wallet Connected</span>
            </div>
          ) : (
            <button
              className="w-full py-2 px-4 text-sm bg-gradient-to-r from-yellow-400 to-orange-300 hover:from-yellow-500 hover:to-orange-400 text-slate-900 font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow mb-2"
              onClick={connect}
              disabled={isConnecting}
            >
              <WalletIcon className="w-5 h-5 text-yellow-500 mr-2" />
              {isConnecting ? "Connecting..." : "Connect with MetaMask"}
            </button>
          )}
          <p className="mt-5 text-xs text-slate-500 text-center">Make sure Metamask is installed.<br/>Problems? <a href="#" className="underline text-blue-600 hover:text-blue-500">Support</a></p>
        </div>
      </div>
    </div>
  );
}
