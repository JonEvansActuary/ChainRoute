"use client";

import { useState } from "react";
import Link from "next/link";
import { WalletConnect } from "@/components/WalletConnect";
import { useNetwork } from "@/components/NetworkContext";
import { NETWORKS, type NetworkId } from "@/lib/chainroute/constants";
import { useTheme } from "@/components/ThemeContext";
import { Menu, X, Sun, Moon } from "lucide-react";

type Page = "home" | "create" | "continue" | "verify" | "chain";

const NAV_ITEMS: { page: Page; label: string; href: string }[] = [
  { page: "home", label: "Home", href: "/" },
  { page: "create", label: "Create", href: "/create" },
  { page: "continue", label: "Continue", href: "/continue" },
  { page: "verify", label: "Verify", href: "/verify" },
];

export function Header({ activePage }: { activePage: Page }) {
  const { networkId, setNetworkId } = useNetwork();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 text-lg font-bold tracking-tight">
          Chain<span className="text-chain-neon">Route</span>-Forge
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 sm:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.page}
              href={item.href}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activePage === item.page
                  ? "bg-chain-neon/15 text-chain-neon"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Network toggle */}
          <select
            value={networkId}
            onChange={(e) => setNetworkId(e.target.value as NetworkId)}
            className="hidden rounded-md border border-border bg-transparent px-2 py-1 text-xs text-muted-foreground sm:block"
          >
            {(Object.keys(NETWORKS) as NetworkId[]).map((id) => (
              <option key={id} value={id}>
                {id === "amoy" ? "Amoy" : "Mainnet"}
              </option>
            ))}
          </select>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="hidden rounded-md border border-border p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground sm:block"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>

          <WalletConnect compact />

          {/* Mobile hamburger */}
          <button
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent sm:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="border-t border-border/50 px-4 py-2 sm:hidden">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.page}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                activePage === item.page
                  ? "bg-chain-neon/15 text-chain-neon"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-2 flex items-center gap-2 px-3">
            <select
              value={networkId}
              onChange={(e) => setNetworkId(e.target.value as NetworkId)}
              className="flex-1 rounded-md border border-border bg-transparent px-2 py-1.5 text-xs text-muted-foreground"
            >
              {(Object.keys(NETWORKS) as NetworkId[]).map((id) => (
                <option key={id} value={id}>
                  {NETWORKS[id].name}
                </option>
              ))}
            </select>
            <button
              onClick={toggleTheme}
              className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
