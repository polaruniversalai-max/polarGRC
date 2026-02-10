export interface ChainConfig {
  id: string;
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  nativeToken: string;
  nativeTokenDecimals: number;
  faucetUrl?: string;
  isTestnet: boolean;
  logoColor?: string;
  category?: 'evm' | 'move';
}

export const SUPPORTED_CHAINS: ChainConfig[] = [
  {
    id: "sepolia",
    name: "Sepolia",
    chainId: 11155111,
    rpcUrl: "https://rpc.sepolia.org",
    explorerUrl: "https://sepolia.etherscan.io",
    nativeToken: "ETH",
    nativeTokenDecimals: 18,
    faucetUrl: "https://sepoliafaucet.com",
    isTestnet: true,
    logoColor: "#627EEA",
    category: 'evm',
  },
  {
    id: "berachain",
    name: "Berachain bArtio",
    chainId: 80084,
    rpcUrl: "https://bartio.rpc.berachain.com",
    explorerUrl: "https://bartio.beratrail.io",
    nativeToken: "BERA",
    nativeTokenDecimals: 18,
    faucetUrl: "https://bartio.faucet.berachain.com",
    isTestnet: true,
    logoColor: "#D4A574",
    category: 'evm',
  },
  {
    id: "monad",
    name: "Monad Testnet",
    chainId: 10143,
    rpcUrl: "https://testnet-rpc.monad.xyz",
    explorerUrl: "https://testnet.monadexplorer.com",
    nativeToken: "MON",
    nativeTokenDecimals: 18,
    faucetUrl: "https://faucet.monad.xyz",
    isTestnet: true,
    logoColor: "#836EF9",
    category: 'evm',
  },
  {
    id: "story",
    name: "Story Testnet",
    chainId: 1513,
    rpcUrl: "https://testnet.storyrpc.io",
    explorerUrl: "https://testnet.storyscan.xyz",
    nativeToken: "IP",
    nativeTokenDecimals: 18,
    faucetUrl: "https://faucet.story.foundation",
    isTestnet: true,
    logoColor: "#FF6B35",
    category: 'evm',
  },
  {
    id: "abstract",
    name: "Abstract Testnet",
    chainId: 11124,
    rpcUrl: "https://api.testnet.abs.xyz",
    explorerUrl: "https://explorer.testnet.abs.xyz",
    nativeToken: "ETH",
    nativeTokenDecimals: 18,
    faucetUrl: "https://faucet.abs.xyz",
    isTestnet: true,
    logoColor: "#00D4AA",
    category: 'evm',
  },
  {
    id: "hyperliquid",
    name: "Hyperliquid Testnet",
    chainId: 998,
    rpcUrl: "https://api.hyperliquid-testnet.xyz/evm",
    explorerUrl: "https://explorer.hyperliquid-testnet.xyz",
    nativeToken: "HYPE",
    nativeTokenDecimals: 18,
    faucetUrl: "https://app.hyperliquid-testnet.xyz/drip",
    isTestnet: true,
    logoColor: "#00FF88",
    category: 'evm',
  },
  {
    id: "base-sepolia",
    name: "Base Sepolia",
    chainId: 84532,
    rpcUrl: "https://sepolia.base.org",
    explorerUrl: "https://sepolia.basescan.org",
    nativeToken: "ETH",
    nativeTokenDecimals: 18,
    faucetUrl: "https://www.coinbase.com/faucets/base-ethereum-goerli-faucet",
    isTestnet: true,
    logoColor: "#0052FF",
    category: 'evm',
  },
  {
    id: "arbitrum-sepolia",
    name: "Arbitrum Sepolia",
    chainId: 421614,
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    explorerUrl: "https://sepolia.arbiscan.io",
    nativeToken: "ETH",
    nativeTokenDecimals: 18,
    faucetUrl: "https://faucet.quicknode.com/arbitrum/sepolia",
    isTestnet: true,
    logoColor: "#28A0F0",
    category: 'evm',
  },
  {
    id: "polygon-amoy",
    name: "Polygon Amoy",
    chainId: 80002,
    rpcUrl: "https://rpc-amoy.polygon.technology",
    explorerUrl: "https://amoy.polygonscan.com",
    nativeToken: "MATIC",
    nativeTokenDecimals: 18,
    faucetUrl: "https://faucet.polygon.technology",
    isTestnet: true,
    logoColor: "#8247E5",
    category: 'evm',
  },
  {
    id: "scroll-sepolia",
    name: "Scroll Sepolia",
    chainId: 534351,
    rpcUrl: "https://sepolia-rpc.scroll.io",
    explorerUrl: "https://sepolia.scrollscan.com",
    nativeToken: "ETH",
    nativeTokenDecimals: 18,
    faucetUrl: "https://scroll.io/bridge",
    isTestnet: true,
    logoColor: "#FFEEDA",
    category: 'evm',
  },
  {
    id: "linea-sepolia",
    name: "Linea Sepolia",
    chainId: 59141,
    rpcUrl: "https://rpc.sepolia.linea.build",
    explorerUrl: "https://sepolia.lineascan.build",
    nativeToken: "ETH",
    nativeTokenDecimals: 18,
    faucetUrl: "https://www.infura.io/faucet/linea",
    isTestnet: true,
    logoColor: "#61DFFF",
    category: 'evm',
  },
  {
    id: "zksync-sepolia",
    name: "zkSync Sepolia",
    chainId: 300,
    rpcUrl: "https://sepolia.era.zksync.dev",
    explorerUrl: "https://sepolia.explorer.zksync.io",
    nativeToken: "ETH",
    nativeTokenDecimals: 18,
    faucetUrl: "https://portal.zksync.io/faucet",
    isTestnet: true,
    logoColor: "#8C8DFC",
    category: 'evm',
  },
  {
    id: "optimism-sepolia",
    name: "Optimism Sepolia",
    chainId: 11155420,
    rpcUrl: "https://sepolia.optimism.io",
    explorerUrl: "https://sepolia-optimism.etherscan.io",
    nativeToken: "ETH",
    nativeTokenDecimals: 18,
    faucetUrl: "https://app.optimism.io/faucet",
    isTestnet: true,
    logoColor: "#FF0420",
    category: 'evm',
  },
  {
    id: "movement",
    name: "Movement Testnet",
    chainId: 30732,
    rpcUrl: "https://aptos.testnet.porto.movementlabs.xyz/v1",
    explorerUrl: "https://explorer.testnet.movementnetwork.xyz",
    nativeToken: "MOVE",
    nativeTokenDecimals: 8,
    faucetUrl: "https://faucet.movementlabs.xyz",
    isTestnet: true,
    logoColor: "#E4FF1A",
    category: 'move',
  },
];

export const EVM_DEPLOYMENT_CHAINS = SUPPORTED_CHAINS.filter(c => c.category === 'evm' && c.isTestnet);
export const MOVE_CHAINS = SUPPORTED_CHAINS.filter(c => c.category === 'move');

export function getChainById(chainId: string): ChainConfig | undefined {
  return SUPPORTED_CHAINS.find(chain => chain.id === chainId);
}

export function getChainByChainId(chainId: number): ChainConfig | undefined {
  return SUPPORTED_CHAINS.find(chain => chain.chainId === chainId);
}

export function getExplorerAddressUrl(chain: ChainConfig, address: string): string {
  return `${chain.explorerUrl}/address/${address}`;
}

export function getExplorerTxUrl(chain: ChainConfig, txHash: string): string {
  return `${chain.explorerUrl}/tx/${txHash}`;
}

export function toHexChainId(chainId: number): string {
  return `0x${chainId.toString(16)}`;
}

export interface TechStackPartner {
  id: string;
  name: string;
  category: 'security' | 'data' | 'ai' | 'desci' | 'identity';
  description: string;
  color: string;
  status: 'active' | 'integrating' | 'planned';
}

export const TECH_STACK_PARTNERS: TechStackPartner[] = [
  {
    id: 'eigenlayer',
    name: 'EigenLayer',
    category: 'security',
    description: 'Shared Security (AVS)',
    color: '#1E40AF',
    status: 'active',
  },
  {
    id: 'celestia',
    name: 'Celestia',
    category: 'data',
    description: 'Data Availability',
    color: '#7C3AED',
    status: 'active',
  },
  {
    id: 'humanity',
    name: 'Humanity Protocol',
    category: 'identity',
    description: 'Proof of Personhood',
    color: '#059669',
    status: 'integrating',
  },
  {
    id: 'eigenpie',
    name: 'EigenPie',
    category: 'security',
    description: 'Liquid Restaking',
    color: '#DC2626',
    status: 'active',
  },
  {
    id: 'lido',
    name: 'Lido',
    category: 'security',
    description: 'Liquid Staking',
    color: '#00A3FF',
    status: 'active',
  },
  {
    id: 'fetch',
    name: 'Fetch.ai (FET)',
    category: 'ai',
    description: 'AI Autonomous Auditing',
    color: '#1D4ED8',
    status: 'active',
  },
  {
    id: 'render',
    name: 'Render Network',
    category: 'ai',
    description: 'GPU Compute / Modeling',
    color: '#F97316',
    status: 'active',
  },
  {
    id: 'icp',
    name: 'Internet Computer',
    category: 'desci',
    description: 'Permanent Storage',
    color: '#29ABE2',
    status: 'integrating',
  },
  {
    id: 'researchcoin',
    name: 'ResearchCoin (RSC)',
    category: 'desci',
    description: 'Scientific Peer Review',
    color: '#10B981',
    status: 'integrating',
  },
];

export interface NetworkHealth {
  chainId: string;
  blockHeight: number;
  latency: number;
  status: 'healthy' | 'degraded' | 'offline';
  lastChecked: number;
  airdropMultiplier: number;
}

export function getDefaultNetworkHealth(): Record<string, NetworkHealth> {
  const health: Record<string, NetworkHealth> = {};
  
  const airdropMultipliers: Record<string, number> = {
    'movement': 3.0,
    'monad': 2.5,
    'hyperliquid': 2.2,
    'berachain': 2.0,
    'abstract': 1.8,
    'story': 1.8,
    'scroll-sepolia': 1.7,
    'linea-sepolia': 1.7,
    'zksync-sepolia': 1.6,
    'base-sepolia': 1.5,
    'arbitrum-sepolia': 1.5,
    'optimism-sepolia': 1.5,
    'polygon-amoy': 1.4,
    'sepolia': 1.2,
  };
  
  SUPPORTED_CHAINS.forEach(chain => {
    health[chain.id] = {
      chainId: chain.id,
      blockHeight: Math.floor(Math.random() * 10000000) + 1000000,
      latency: Math.floor(Math.random() * 100) + 20,
      status: Math.random() > 0.1 ? 'healthy' : 'degraded',
      lastChecked: Date.now(),
      airdropMultiplier: airdropMultipliers[chain.id] || 1.5,
    };
  });
  
  return health;
}
