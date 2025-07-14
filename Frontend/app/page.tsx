"use client";
import { useWallet } from "./components/WalletContext";
import { WalletIcon } from "./components/icons";
import Button from "./components/ui/Button";

export default function Home() {
  const { address, connect, isConnecting } = useWallet();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white via-blue-50 to-blue-300 font-sans text-slate-800 text-sm">
      <div className="w-full max-w-sm">
        <div className="border border-blue-200 rounded-2xl p-7 shadow-xl bg-white/95 flex flex-col items-center">
          <div className="flex flex-col items-center mb-6">
            <span className="bg-blue-100 rounded-full p-3 mb-2 shadow flex items-center justify-center">
              <WalletIcon className="w-8 h-8 text-black" />
            </span>
            <h1 className="text-lg font-bold text-blue-900 mb-1">
              Connect your Wallet
            </h1>
          </div>
          
          {address ? (
            <div className="w-full flex flex-col items-center mb-2">
              <span className="text-xs text-blue-900 font-mono bg-blue-50 border border-blue-200 rounded px-2 py-1 mb-2">
                {address}
              </span>
              <span className="text-green-600 font-bold">Wallet Connected</span>
            </div>
          ) : (
            <Button
              onClick={connect}
              isLoading={isConnecting}
              className="w-full gap-2 mb-2"
              aria-label="Connect wallet with MetaMask"
            >
              <WalletIcon className="w-5 h-5 text-black" />
              {isConnecting ? "Connecting..." : "Connect with MetaMask"}
            </Button>
          )}
          
          <p className="mt-5 text-xs text-slate-500 text-center">
            Make sure MetaMask is installed.
            <br />
            <a
              href="https://metamask.io/"
              className=" text-blue-600 hover:text-blue-800"
            >
              MetaMask
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
