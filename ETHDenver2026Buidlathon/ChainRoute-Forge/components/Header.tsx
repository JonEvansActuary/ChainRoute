"use client";

import Link from "next/link";
import { WalletConnect } from "./WalletConnect";
import { NetworkSwitcher } from "./NetworkSwitcher";
import { NetworkGuard } from "./NetworkGuard";

type ActivePage = "home" | "create" | "verify" | "continue" | "chain";

export function Header({ activePage }: { activePage?: ActivePage }) {
  return (
    <>
      <header className="border-b border-border bg-card/50 px-4 py-3">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2">
          <Link href="/" className="text-lg font-bold text-chain-neon sm:text-xl">
            ChainRoute-Forge
          </Link>
          <nav className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Link
              href="/create"
              className={`text-sm ${
                activePage === "create"
                  ? "font-medium text-chain-neon"
                  : "text-muted-foreground hover:text-chain-neon"
              }`}
            >
              Create
            </Link>
            <Link
              href="/continue"
              className={`text-sm ${
                activePage === "continue"
                  ? "font-medium text-chain-neon"
                  : "text-muted-foreground hover:text-chain-neon"
              }`}
            >
              Continue
            </Link>
            <Link
              href="/verify"
              className={`text-sm ${
                activePage === "verify"
                  ? "font-medium text-chain-neon"
                  : "text-muted-foreground hover:text-chain-neon"
              }`}
            >
              Verify
            </Link>
            <NetworkSwitcher />
            <WalletConnect compact />
          </nav>
        </div>
      </header>
      <NetworkGuard />
    </>
  );
}
