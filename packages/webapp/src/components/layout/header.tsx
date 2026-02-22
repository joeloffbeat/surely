"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ConnectButton,
  useActiveAccount,
  useActiveWallet,
  useActiveWalletChain,
  useDisconnect,
} from "thirdweb/react";
import { avalancheFuji } from "thirdweb/chains";
import { thirdwebClient } from "@/lib/thirdweb";
import { useCZUSDBalance } from "@/lib/hooks/use-contracts";
import { formatCZUSD } from "@/lib/czusd";
import { DepositDialog } from "@/components/deposit-dialog";
import { Wallet, Copy, Plus, LogOut, ChevronDown } from "lucide-react";

const NAV_LINKS = [
  { href: "/policies", label: "Policies" },
  { href: "/coverage", label: "Coverage" },
  { href: "/create", label: "Create" },
];

const AVAX_LOGO =
  "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png";

// AVAX_LOGO used in dropdown chain indicator
function WalletDropdown() {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const activeChain = useActiveWalletChain();
  const { disconnect } = useDisconnect();
  const { data: czusdBalance } = useCZUSDBalance(account?.address);
  const [open, setOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const truncated = account
    ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}`
    : "";
  const chainName =
    activeChain?.id === 43113
      ? "Avalanche Fuji"
      : `Chain ${activeChain?.id ?? "?"}`;

  return (
    <>
      <div className="flex items-center gap-2">
        {/* CZUSD balance pill */}
        <div className="hidden items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-2 md:flex">
          <img
            src="/czusd-logo.png"
            alt="CZUSD"
            className="h-4 w-4 rounded-full"
          />
          <span className="font-mono text-sm text-primary">
            {czusdBalance !== undefined ? formatCZUSD(czusdBalance) : "..."}
          </span>
        </div>

        {/* Wallet button + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 items-center gap-2 rounded-lg border border-border bg-secondary px-2.5 text-sm transition-colors hover:border-primary/40"
          >
            <img
              src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${account?.address || "0x0"}`}
              alt="avatar"
              className="h-6 w-6 shrink-0 rounded-full"
            />
            <span className="font-mono text-xs text-primary">{truncated}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-fg" />
          </button>

          {open && (
            <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-md border border-border bg-card p-1 shadow-md">
              {/* Chain + CZUSD balance header */}
              <div className="flex items-center justify-between px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <img
                    src={AVAX_LOGO}
                    alt="Avalanche"
                    className="h-4 w-4 rounded-full"
                  />
                  <span className="text-xs text-muted-fg">{chainName}</span>
                </div>
                {czusdBalance !== undefined && (
                  <div className="flex items-center gap-1">
                    <img
                      src="/czusd-logo.png"
                      alt="CZUSD"
                      className="h-3.5 w-3.5 rounded-full"
                    />
                    <span className="text-xs font-medium text-primary">
                      {formatCZUSD(czusdBalance)}
                    </span>
                  </div>
                )}
              </div>
              <div className="my-1 h-px bg-border" />

              <button
                onClick={() => {
                  setOpen(false);
                  window.open(
                    `https://testnet.snowtrace.io/address/${account?.address}`,
                    "_blank",
                  );
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-fg transition-colors hover:bg-secondary hover:text-primary"
              >
                <Wallet className="h-4 w-4" />
                View on Explorer
              </button>

              <button
                onClick={() => {
                  setOpen(false);
                  if (account?.address)
                    navigator.clipboard.writeText(account.address);
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-fg transition-colors hover:bg-secondary hover:text-primary"
              >
                <Copy className="h-4 w-4" />
                Copy Address
              </button>

              <button
                onClick={() => {
                  setOpen(false);
                  setDepositOpen(true);
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-fg transition-colors hover:bg-secondary hover:text-primary"
              >
                <Plus className="h-4 w-4" />
                Deposit CZUSD
              </button>

              <div className="my-1 h-px bg-border" />

              <button
                onClick={() => {
                  setOpen(false);
                  if (wallet) disconnect(wallet);
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-red-400 transition-colors hover:bg-secondary"
              >
                <LogOut className="h-4 w-4" />
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>

      <DepositDialog open={depositOpen} onOpenChange={setDepositOpen} />
    </>
  );
}

export default function Header() {
  const pathname = usePathname();
  const account = useActiveAccount();

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background/80 px-6 py-4 backdrop-blur-sm">
      <div className="flex items-center gap-8">
        <Link
          href="/policies"
          className="font-mono text-xl font-bold tracking-tight text-primary"
        >
          Surely
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors ${
                pathname?.startsWith(link.href)
                  ? "text-primary"
                  : "text-muted-fg hover:text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {account?.address ? (
          <WalletDropdown />
        ) : thirdwebClient ? (
          <ConnectButton
            client={thirdwebClient}
            theme="dark"
            chain={avalancheFuji}
            accountAbstraction={{
              chain: avalancheFuji,
              sponsorGas: true,
            }}
            connectButton={{
              style: { height: "40px" },
            }}
          />
        ) : (
          <div className="rounded-lg border border-border px-4 py-2.5 text-sm text-dim">
            Connect Wallet
          </div>
        )}
      </div>
    </header>
  );
}
