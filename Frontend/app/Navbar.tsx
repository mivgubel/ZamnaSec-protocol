"use client";
import Link from 'next/link'
import { useWallet } from "./components/WalletContext";
import { useState } from "react";

function WalletIcon({ className = "w-5 h-5 text-blue-900" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className}>
      <path fill="currentColor" d="M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-224c0-35.3-28.7-64-64-64L80 128c-8.8 0-16-7.2-16-16s7.2-16 16-16l368 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L64 32zM416 272a32 32 0 1 1 0 64 32 32 0 1 1 0-64z" />
    </svg>
  );
}

function DisconnectIcon({ className = "w-5 h-5" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
      <path fill="currentColor" d="M16 13v-2H7V8l-5 4 5 4v-3z M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1z"/>
    </svg>
  );
}

export default function Navbar() {
  const { address, disconnect } = useWallet();
  const shortAddress = address ? `${address.slice(0, 8)}...${address.slice(-4)}` : null;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-40 bg-white/80 backdrop-blur border-b border-blue-100 shadow transition-colors">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
        <div className="flex-1 flex justify-center sm:justify-start items-center">
            <img src="/logo.png" alt="ZamnaSec Logo" className="h-10 w-auto" />
            <Link href="/" className="font-sans text-2xl font-bold ml-2" style={{ color: '#1d293b' }}>
              Zamna<span className="text-yellow-600">Sec</span>
            </Link>
          </div>
          <button
            className="sm:hidden flex flex-col justify-center items-center w-10 h-10 ml-2 focus:outline-none"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Open menu"
          >
            <span className={`block w-6 h-0.5 bg-blue-900 mb-1 transition-all ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-blue-900 mb-1 transition-all ${menuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-blue-900 transition-all ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
          </button>
          <div className={`flex-col sm:flex-row flex items-center space-x-0 sm:space-x-3 absolute sm:static top-16 left-0 w-full sm:w-auto bg-white/95 sm:bg-transparent shadow-lg sm:shadow-none border-b sm:border-0 border-blue-100 sm:flex z-30 transition-all duration-200 ${menuOpen ? 'flex' : 'hidden sm:flex'} ${menuOpen ? 'gap-3 flex-col' : ''}`}>
            <div className="flex flex-col gap-3 w-full sm:flex-row sm:gap-3 sm:w-auto items-center">
              {address && (
                <Link
                  href="/dashboard"
                  className="font-sans text-sm text-blue-950 rounded-lg hover:bg-blue-100 hover:text-yellow-900 w-full sm:w-auto px-3 text-center sm:py-5 sm:min-w-[90px]"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              <Link
                href="/docs"
                className="font-sans text-sm text-blue-950 rounded-lg hover:bg-blue-100 hover:text-yellow-900 w-full sm:w-auto px-3 text-center sm:py-5 sm:min-w-[90px]"
                onClick={() => setMenuOpen(false)}
              >
                Docs
              </Link>
              <WalletIcon className="w-5 h-5 text-blue-900" />
              {address && (
                <>
                  <span className="font-mono text-xs bg-blue-50 border border-blue-200 rounded px-2 py-1 text-blue-900">
                    {shortAddress}
                  </span>
                  <button
                    onClick={() => { disconnect(); setMenuOpen(false); }}
                    className="flex items-center space-x-1 text-xs text-black hover:text-yellow-800 bg-red-50 hover:bg-red-100 border border-red-300 rounded px-2 py-1 transition-colors"
                  >
                    <DisconnectIcon className="w-4 h-4" />
                    <span>Disconnect</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 