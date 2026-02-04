import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { ChainConfig, toHexChainId } from "@/lib/chains";

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

export interface DeploymentResult {
  success: boolean;
  contractAddress?: string;
  transactionHash?: string;
  error?: string;
}

export interface DeploymentStatus {
  chainId: string;
  status: "idle" | "connecting" | "switching" | "deploying" | "success" | "error";
  contractAddress?: string;
  transactionHash?: string;
  error?: string;
}

export interface UseWeb3DeploymentReturn {
  isMetaMaskInstalled: boolean;
  isConnected: boolean;
  account: string | null;
  currentChainId: number | null;
  deploymentStatuses: Record<string, DeploymentStatus>;
  connect: () => Promise<string | null>;
  disconnect: () => void;
  switchNetwork: (chain: ChainConfig) => Promise<boolean>;
  deployContract: (
    chain: ChainConfig,
    bytecode: string,
    abi: ethers.InterfaceAbi,
    constructorArgs?: unknown[]
  ) => Promise<DeploymentResult>;
  resetStatus: (chainId: string) => void;
}

export function useWeb3Deployment(): UseWeb3DeploymentReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  const [deploymentStatuses, setDeploymentStatuses] = useState<Record<string, DeploymentStatus>>({});

  const isMetaMaskInstalled = typeof window !== "undefined" && Boolean(window.ethereum?.isMetaMask);

  const updateStatus = useCallback((chainId: string, update: Partial<DeploymentStatus>) => {
    setDeploymentStatuses(prev => ({
      ...prev,
      [chainId]: { ...prev[chainId], chainId, ...update },
    }));
  }, []);

  const resetStatus = useCallback((chainId: string) => {
    updateStatus(chainId, { status: "idle", error: undefined });
  }, [updateStatus]);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const accts = accounts as string[];
      if (accts.length === 0) {
        setIsConnected(false);
        setAccount(null);
      } else {
        setAccount(accts[0]);
        setIsConnected(true);
      }
    };

    const handleChainChanged = (chainId: unknown) => {
      setCurrentChainId(parseInt(chainId as string, 16));
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
      const accts = accounts as string[];
      if (accts.length > 0) {
        setAccount(accts[0]);
        setIsConnected(true);
      }
    });

    window.ethereum.request({ method: "eth_chainId" }).then((chainId) => {
      setCurrentChainId(parseInt(chainId as string, 16));
    });

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  const connect = useCallback(async (): Promise<string | null> => {
    if (!window.ethereum) {
      return null;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      }) as string[];

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        return accounts[0];
      }
      return null;
    } catch (error) {
      console.error("Failed to connect:", error);
      return null;
    }
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setAccount(null);
  }, []);

  const switchNetwork = useCallback(async (chain: ChainConfig): Promise<boolean> => {
    if (!window.ethereum) return false;

    const hexChainId = toHexChainId(chain.chainId);

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexChainId }],
      });
      setCurrentChainId(chain.chainId);
      return true;
    } catch (switchError: unknown) {
      const error = switchError as { code?: number };
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: hexChainId,
              chainName: chain.name,
              nativeCurrency: {
                name: chain.nativeToken,
                symbol: chain.nativeToken,
                decimals: chain.nativeTokenDecimals,
              },
              rpcUrls: [chain.rpcUrl],
              blockExplorerUrls: [chain.explorerUrl],
            }],
          });
          setCurrentChainId(chain.chainId);
          return true;
        } catch (addError) {
          console.error("Failed to add network:", addError);
          return false;
        }
      }
      console.error("Failed to switch network:", switchError);
      return false;
    }
  }, []);

  const deployContract = useCallback(async (
    chain: ChainConfig,
    bytecode: string,
    abi: ethers.InterfaceAbi,
    constructorArgs: unknown[] = []
  ): Promise<DeploymentResult> => {
    if (!window.ethereum || !account) {
      return { success: false, error: "Wallet not connected" };
    }

    updateStatus(chain.id, { status: "connecting" });

    try {
      updateStatus(chain.id, { status: "switching" });
      const switched = await switchNetwork(chain);
      if (!switched) {
        updateStatus(chain.id, { status: "error", error: "Failed to switch network" });
        return { success: false, error: "Failed to switch network" };
      }

      updateStatus(chain.id, { status: "deploying" });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const factory = new ethers.ContractFactory(abi, bytecode, signer);
      const contract = await factory.deploy(...constructorArgs);
      
      await contract.waitForDeployment();
      
      const contractAddress = await contract.getAddress();
      const deployTx = contract.deploymentTransaction();
      const transactionHash = deployTx?.hash;

      updateStatus(chain.id, {
        status: "success",
        contractAddress,
        transactionHash,
      });

      return {
        success: true,
        contractAddress,
        transactionHash,
      };
    } catch (error: unknown) {
      const err = error as Error;
      const errorMessage = err.message || "Deployment failed";
      updateStatus(chain.id, { status: "error", error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [account, switchNetwork, updateStatus]);

  return {
    isMetaMaskInstalled,
    isConnected,
    account,
    currentChainId,
    deploymentStatuses,
    connect,
    disconnect,
    switchNetwork,
    deployContract,
    resetStatus,
  };
}
