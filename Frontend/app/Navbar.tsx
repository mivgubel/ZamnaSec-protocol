"use client";
import Link from 'next/link';
import { useState } from "react";
import { useWallet } from "./components/WalletContext";
import { WalletIcon, DisconnectIcon } from "./components/icons";
import { formatAddress } from "./utils/formatting";
import Button from "./components/ui/Button";
import { useResponsive } from "./hooks/useResponsive";

export default function Navbar() {
  const { address, disconnect } = useWallet();
  const { isMobile } = useResponsive();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);
  const toggleMenu = () => setMenuOpen(prev => !prev);

  const handleDisconnect = async () => {
    try {
      await disconnect();
      closeMenu();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      closeMenu();
    }
  };

  return (
    <nav 
      className="fixed top-0 w-full z-40 bg-white/80 backdrop-blur border-b border-blue-100 shadow transition-colors"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-1 flex justify-center sm:justify-start items-center">
            <img 
              src="/logo.png" 
              alt="ZamnaSec Logo" 
              className="h-10 w-auto" 
              loading="eager"
            />
            <Link 
              href="/" 
              className="font-sans text-2xl font-bold ml-2 hover:opacity-80 transition-opacity" 
              style={{ color: '#1d293b' }}
            >
              Zamna<span className="text-yellow-600">Sec</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          {isMobile && (
            <button
              className="flex flex-col justify-center items-center w-10 h-10 ml-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              onClick={toggleMenu}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              <span className={`block w-6 h-0.5 bg-blue-900 mb-1 transition-all ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
              <span className={`block w-6 h-0.5 bg-blue-900 mb-1 transition-all ${menuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`block w-6 h-0.5 bg-blue-900 transition-all ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
            </button>
          )}

          {/* Navigation menu */}
          <div className={`
            flex-col sm:flex-row flex items-center space-x-0 sm:space-x-3 
            absolute sm:static top-16 left-0 w-full sm:w-auto 
            bg-white/95 sm:bg-transparent shadow-lg sm:shadow-none 
            border-b sm:border-0 border-blue-100 sm:flex z-30 
            transition-all duration-200 
            ${menuOpen ? 'flex' : 'hidden sm:flex'} 
            ${menuOpen ? 'gap-3 flex-col py-4' : ''}
          `}>
            <div className="flex flex-col gap-3 w-full sm:flex-row sm:gap-3 sm:w-auto items-center">
              {/* Dashboard Link - only show when connected */}
              {address && (
                <Link
                  href="/dashboard"
                  className="font-sans text-sm text-blue-950 rounded-lg hover:bg-blue-100 hover:text-yellow-900 w-full sm:w-auto px-3 py-4 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={closeMenu}
                >
                  Dashboard
                </Link>
              )}

              {/* Docs Link */}
              <Link
                href="/docs"
                className="font-sans text-sm text-blue-950 rounded-lg hover:bg-blue-100 hover:text-yellow-900 w-full sm:w-auto px-3 py-4 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={closeMenu}
              >
                Docs
              </Link>

              {/* Wallet section */}
              <div className="flex items-center gap-2">
                <WalletIcon className="w-5 h-5 text-blue-950" />
                {address && (
                  <>
                    <span className="font-mono text-xs bg-blue-50 border border-blue-200 rounded px-2 py-1 text-blue-900">
                      {formatAddress(address)}
                    </span>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleDisconnect}
                      className="flex items-center gap-1"
                      aria-label="Disconnect wallet"
                    >
                      <DisconnectIcon className="w-4 h-4" />
                      <span>Disconnect</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 