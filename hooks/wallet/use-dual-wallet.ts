"use client"

import { useAccount, useConnect, useDisconnect } from "wagmi"
import {
  useIsStacksConnected,
  useIsStacksConnecting,
  useStacksWalletActions,
  useStxAddress,
} from "@/lib/providers/wallet-provider"

export type DualWalletState = {
  // Ethereum
  ethAddress: string | undefined
  isEthConnected: boolean
  isEthConnecting: boolean
  connectEth: () => void
  disconnectEth: () => void

  // Stacks
  stacksAddress: string | null
  isStacksConnected: boolean
  isStacksConnecting: boolean
  connectStacks: () => void
  disconnectStacks: () => void

  // Combined states
  areBothConnected: boolean
  isAnyConnecting: boolean
}

export function useDualWallet(): DualWalletState {
  // Ethereum wallet via wagmi (conditionally called on client)
  const isClient = typeof window !== 'undefined';

  const accountData = useAccount();
  const connectData = useConnect();
  const disconnectData = useDisconnect();

  // Only use them if client-side
  const ethAddress = isClient ? accountData.address : undefined;
  const isEthConnected = isClient ? accountData.isConnected : false;
  const connect = isClient ? connectData.connect : () => {};
  const connectors = isClient ? connectData.connectors : [];
  const isEthConnecting = isClient ? connectData.isPending : false;
  const wagmiDisconnect = isClient ? disconnectData.disconnect : () => {};



  // const { address: ethAddress, isConnected: isEthConnected } = isClient ? useAccount() : { address: undefined, isConnected: false };
  // const { connect, connectors, isPending: isEthConnecting } = isClient ? useConnect() : { connect: () => {}, connectors: [], isPending: false };
  // const { disconnect: wagmiDisconnect } = isClient ? useDisconnect() : { disconnect: () => {} };

  // Stacks wallet via Zustand store
  const stxAddress = useStxAddress()
  const isStacksConnected = useIsStacksConnected()
  const isStacksConnecting = useIsStacksConnecting()
  const { connectWallet, disconnectWallet } = useStacksWalletActions()

  const connectEth = () => {
    if (!isClient) return; // Only execute on client
    const injectedConnector = connectors.find((c) => c.id === "injected")
    if (injectedConnector) {
      connect({ connector: injectedConnector })
    }
  }

  const disconnectEth = () => {
    if (!isClient) return; // Only execute on client
    wagmiDisconnect()
  }

  return {
    // Ethereum
    ethAddress,
    isEthConnected,
    isEthConnecting,
    connectEth,
    disconnectEth,

    // Stacks
    stacksAddress: stxAddress || null,
    isStacksConnected,
    isStacksConnecting,
    connectStacks: connectWallet,
    disconnectStacks: disconnectWallet,

    // Combined
    areBothConnected: isEthConnected && isStacksConnected,
    isAnyConnecting: isEthConnecting || isStacksConnecting,
  }
}
