import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Wallet, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  AlertTriangle,
  Rocket,
  Globe,
  Copy,
  Check
} from "lucide-react";
import { ChainConfig, getExplorerAddressUrl, getExplorerTxUrl } from "@/lib/chains";
import { useWeb3Deployment, DeploymentStatus } from "@/hooks/use-web3-deployment";
import { ethers } from "ethers";

export interface ContractConfig {
  name: string;
  bytecode: string;
  abi: ethers.InterfaceAbi;
  constructorArgs?: (ownerAddress: string) => unknown[];
}

export interface DeploymentModalProps {
  contract: ContractConfig;
  chains: ChainConfig[];
  onDeploymentComplete?: (chainId: string, contractAddress: string) => void;
  trigger?: React.ReactNode;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      className="h-6 w-6"
      onClick={handleCopy}
      data-testid="button-copy-address"
    >
      {copied ? <Check className="w-3 h-3 text-[hsl(var(--neon-green))]" /> : <Copy className="w-3 h-3" />}
    </Button>
  );
}

function ChainDeploymentRow({
  chain,
  status,
  isConnected,
  account,
  onDeploy,
  onReset,
}: {
  chain: ChainConfig;
  status: DeploymentStatus | undefined;
  isConnected: boolean;
  account: string | null;
  onDeploy: (chain: ChainConfig) => void;
  onReset: (chainId: string) => void;
}) {
  const currentStatus = status?.status || "idle";

  const getStatusBadge = () => {
    switch (currentStatus) {
      case "connecting":
        return <Badge className="text-[8px] font-mono bg-cyan/20 text-cyan border-cyan/30"><Loader2 className="w-3 h-3 mr-1 animate-spin" />CONNECTING</Badge>;
      case "switching":
        return <Badge className="text-[8px] font-mono bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30"><Loader2 className="w-3 h-3 mr-1 animate-spin" />SWITCHING</Badge>;
      case "deploying":
        return <Badge className="text-[8px] font-mono bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30"><Loader2 className="w-3 h-3 mr-1 animate-spin" />DEPLOYING</Badge>;
      case "success":
        return <Badge className="text-[8px] font-mono bg-[hsl(var(--neon-green))]/20 text-[hsl(var(--neon-green))] border-[hsl(var(--neon-green))]/30"><CheckCircle2 className="w-3 h-3 mr-1" />DEPLOYED</Badge>;
      case "error":
        return <Badge className="text-[8px] font-mono bg-[hsl(var(--danger))]/20 text-[hsl(var(--danger))] border-[hsl(var(--danger))]/30"><XCircle className="w-3 h-3 mr-1" />FAILED</Badge>;
      default:
        return <Badge className="text-[8px] font-mono bg-[hsl(var(--muted))]/50 text-muted-foreground border-muted">READY</Badge>;
    }
  };

  const isDeploying = ["connecting", "switching", "deploying"].includes(currentStatus);

  return (
    <div 
      className="p-3 rounded-md border border-[rgba(56,189,248,0.15)] bg-[hsl(var(--muted))]"
      data-testid={`deploy-chain-${chain.id}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan" />
          <span className="text-sm font-mono font-semibold text-foreground">{chain.name}</span>
          <span className="text-[10px] font-mono text-muted-foreground">({chain.nativeToken})</span>
        </div>
        {getStatusBadge()}
      </div>

      {currentStatus === "success" && status?.contractAddress && (
        <div className="mb-2 p-2 bg-[hsl(var(--deep-navy))] rounded text-[10px] font-mono">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Contract:</span>
            <div className="flex items-center gap-1">
              <span className="text-[hsl(var(--neon-green))]">{status.contractAddress.slice(0, 10)}...{status.contractAddress.slice(-8)}</span>
              <CopyButton text={status.contractAddress} />
              <a 
                href={getExplorerAddressUrl(chain, status.contractAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan hover:text-cyan/80"
                data-testid={`link-explorer-${chain.id}`}
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          {status.transactionHash && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-muted-foreground">Tx:</span>
              <a 
                href={getExplorerTxUrl(chain, status.transactionHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan hover:text-cyan/80"
              >
                {status.transactionHash.slice(0, 10)}...{status.transactionHash.slice(-8)}
              </a>
            </div>
          )}
        </div>
      )}

      {currentStatus === "error" && status?.error && (
        <div className="mb-2 p-2 bg-[hsl(var(--danger))]/10 rounded">
          <p className="text-[10px] font-mono text-[hsl(var(--danger))]">{status.error.slice(0, 100)}</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        {currentStatus === "idle" || currentStatus === "error" ? (
          <>
            <Button
              size="sm"
              onClick={() => onDeploy(chain)}
              disabled={!isConnected || !account}
              className="flex-1 text-[10px] font-mono uppercase"
              data-testid={`button-deploy-${chain.id}`}
            >
              <Rocket className="w-3 h-3 mr-1" />
              DEPLOY
            </Button>
            {chain.faucetUrl && (
              <a href={chain.faucetUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="text-[10px] font-mono uppercase">
                  FAUCET
                </Button>
              </a>
            )}
          </>
        ) : currentStatus === "success" ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onReset(chain.id)}
            className="flex-1 text-[10px] font-mono uppercase"
          >
            REDEPLOY
          </Button>
        ) : (
          <div className="flex-1 text-center">
            <span className="text-[10px] font-mono text-muted-foreground">Confirm in MetaMask...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function DeploymentModal({
  contract,
  chains,
  onDeploymentComplete,
  trigger,
}: DeploymentModalProps) {
  const [open, setOpen] = useState(false);
  const {
    isMetaMaskInstalled,
    isConnected,
    account,
    connect,
    deployContract,
    deploymentStatuses,
    resetStatus,
  } = useWeb3Deployment();

  const handleDeploy = async (chain: ChainConfig) => {
    if (!account) return;

    const constructorArgs = contract.constructorArgs 
      ? contract.constructorArgs(account) 
      : [account];

    const result = await deployContract(
      chain,
      contract.bytecode,
      contract.abi,
      constructorArgs
    );

    if (result.success && result.contractAddress && onDeploymentComplete) {
      onDeploymentComplete(chain.id, result.contractAddress);
    }
  };

  const deployedCount = Object.values(deploymentStatuses).filter(s => s.status === "success").length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="text-xs font-mono uppercase" data-testid="button-open-deploy-modal">
            <Rocket className="w-4 h-4 mr-2" />
            DEPLOY CONTRACTS
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-[hsl(var(--deep-navy))] border-cyan/30 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-mono uppercase tracking-widest text-foreground flex items-center gap-2">
            <Rocket className="w-5 h-5 text-cyan" />
            MULTI-CHAIN DEPLOYMENT
          </DialogTitle>
          <DialogDescription className="text-sm font-mono text-muted-foreground">
            Deploy {contract.name} to multiple chains via MetaMask
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {!isMetaMaskInstalled ? (
            <div className="p-4 rounded-md border border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/10">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-[hsl(var(--warning))]" />
                <span className="text-sm font-mono font-semibold text-[hsl(var(--warning))]">MetaMask Required</span>
              </div>
              <p className="text-xs font-mono text-muted-foreground mb-2">
                Install MetaMask browser extension to deploy contracts.
              </p>
              <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="text-xs font-mono uppercase">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  INSTALL METAMASK
                </Button>
              </a>
            </div>
          ) : !isConnected ? (
            <div className="p-4 rounded-md border border-cyan/30 bg-cyan/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-cyan" />
                  <span className="text-sm font-mono text-foreground">Connect your wallet to deploy</span>
                </div>
                <Button 
                  onClick={connect}
                  className="text-xs font-mono uppercase"
                  data-testid="button-connect-metamask"
                >
                  CONNECT METAMASK
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-md border border-[hsl(var(--neon-green))]/30 bg-[hsl(var(--neon-green))]/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[hsl(var(--neon-green))]" />
                  <span className="text-xs font-mono text-foreground">
                    Connected: {account?.slice(0, 6)}...{account?.slice(-4)}
                  </span>
                </div>
                <Badge className="text-[8px] font-mono bg-[hsl(var(--neon-green))]/20 text-[hsl(var(--neon-green))] border-[hsl(var(--neon-green))]/30">
                  {deployedCount}/{chains.length} DEPLOYED
                </Badge>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">TARGET NETWORKS</span>
              <span className="text-[10px] font-mono text-muted-foreground">{chains.length} chains</span>
            </div>
            
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {chains.map((chain) => (
                <ChainDeploymentRow
                  key={chain.id}
                  chain={chain}
                  status={deploymentStatuses[chain.id]}
                  isConnected={isConnected}
                  account={account}
                  onDeploy={handleDeploy}
                  onReset={resetStatus}
                />
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[rgba(56,189,248,0.15)]">
            <p className="text-[9px] font-mono text-muted-foreground text-center">
              Each deployment requires gas fees paid in the network's native token. Get free testnet tokens from each faucet.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
