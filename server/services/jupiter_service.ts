interface TokenPrice {
  id: string;
  mintSymbol: string;
  vsToken: string;
  vsTokenSymbol: string;
  price: number;
  timestamp: number;
}

interface GasEstimate {
  chain: string;
  nativeToken: string;
  nativeTokenPriceUSD: number;
  estimatedGasUnits: number;
  estimatedGasCostNative: number;
  estimatedGasCostUSD: number;
  timestamp: string;
}

interface JupiterPriceResponse {
  data: Record<string, {
    id: string;
    mintSymbol: string;
    vsToken: string;
    vsTokenSymbol: string;
    price: number;
  }>;
  timeTaken: number;
}

const JUPITER_PRICE_API = "https://price.jup.ag/v6/price";

const TOKEN_MINTS: Record<string, string> = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  ETH: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
};

const COINGECKO_API = "https://api.coingecko.com/api/v3";
const COINGECKO_IDS: Record<string, string> = {
  MOVE: "movement",
  MONAD: "monad",
  ETH: "ethereum",
  SOL: "solana",
};

const GAS_ESTIMATES: Record<string, { units: number; pricePerUnit: number }> = {
  solana: { units: 5000, pricePerUnit: 0.000005 },
  movement: { units: 10000, pricePerUnit: 0.0001 },
  ethereum: { units: 21000, pricePerUnit: 0.00000002 },
  polygon: { units: 21000, pricePerUnit: 0.00000003 },
};

const priceCache: Map<string, { price: number; timestamp: number }> = new Map();
const CACHE_TTL_MS = 30000;

async function fetchCoinGeckoPrice(tokenSymbol: string): Promise<number | null> {
  const coinId = COINGECKO_IDS[tokenSymbol];
  if (!coinId) {
    return null;
  }

  try {
    const url = `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd`;
    const response = await fetch(url, {
      headers: { "Accept": "application/json" },
    });

    if (!response.ok) {
      console.error(`CoinGecko API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const price = data[coinId]?.usd;
    
    if (price) {
      priceCache.set(tokenSymbol, {
        price,
        timestamp: Date.now(),
      });
      return price;
    }

    return null;
  } catch (e) {
    console.error("CoinGecko price fetch failed:", e);
    return null;
  }
}

async function fetchJupiterPrice(tokenSymbol: string): Promise<number | null> {
  const cached = priceCache.get(tokenSymbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.price;
  }

  if (COINGECKO_IDS[tokenSymbol]) {
    const cgPrice = await fetchCoinGeckoPrice(tokenSymbol);
    if (cgPrice !== null) {
      return cgPrice;
    }
  }

  const mintAddress = TOKEN_MINTS[tokenSymbol];
  if (!mintAddress) {
    console.log(`Unknown token symbol: ${tokenSymbol}`);
    return null;
  }

  try {
    const url = `${JUPITER_PRICE_API}?ids=${mintAddress}`;
    const response = await fetch(url, {
      headers: { "Accept": "application/json" },
    });

    if (!response.ok) {
      console.error(`Jupiter API error: ${response.status}`);
      return null;
    }

    const data: JupiterPriceResponse = await response.json();
    const priceData = data.data[mintAddress];
    
    if (priceData && priceData.price) {
      priceCache.set(tokenSymbol, {
        price: priceData.price,
        timestamp: Date.now(),
      });
      return priceData.price;
    }

    return null;
  } catch (e) {
    console.error("Jupiter price fetch failed:", e);
    return null;
  }
}

async function fetchMultiplePrices(symbols: string[]): Promise<Record<string, number | null>> {
  const results: Record<string, number | null> = {};
  
  const mintAddresses: string[] = [];
  const symbolToMint: Record<string, string> = {};
  
  for (const symbol of symbols) {
    const cached = priceCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      results[symbol] = cached.price;
    } else if (TOKEN_MINTS[symbol]) {
      mintAddresses.push(TOKEN_MINTS[symbol]);
      symbolToMint[TOKEN_MINTS[symbol]] = symbol;
    } else {
      results[symbol] = null;
    }
  }

  if (mintAddresses.length === 0) {
    return results;
  }

  try {
    const url = `${JUPITER_PRICE_API}?ids=${mintAddresses.join(",")}`;
    const response = await fetch(url, {
      headers: { "Accept": "application/json" },
    });

    if (!response.ok) {
      for (const mint of mintAddresses) {
        results[symbolToMint[mint]] = null;
      }
      return results;
    }

    const data: JupiterPriceResponse = await response.json();
    
    for (const mint of mintAddresses) {
      const symbol = symbolToMint[mint];
      const priceData = data.data[mint];
      
      if (priceData && priceData.price) {
        priceCache.set(symbol, {
          price: priceData.price,
          timestamp: Date.now(),
        });
        results[symbol] = priceData.price;
      } else {
        results[symbol] = null;
      }
    }

    return results;
  } catch (e) {
    console.error("Jupiter batch price fetch failed:", e);
    for (const mint of mintAddresses) {
      results[symbolToMint[mint]] = null;
    }
    return results;
  }
}

export async function estimateGasCost(
  chain: string,
  operationType: "verify" | "quarantine" | "transfer" = "verify"
): Promise<GasEstimate> {
  const chainLower = chain.toLowerCase();
  const gasConfig = GAS_ESTIMATES[chainLower] || GAS_ESTIMATES.movement;
  
  let gasMultiplier = 1;
  switch (operationType) {
    case "quarantine":
      gasMultiplier = 1.5;
      break;
    case "transfer":
      gasMultiplier = 2;
      break;
    default:
      gasMultiplier = 1;
  }

  const estimatedGasUnits = Math.ceil(gasConfig.units * gasMultiplier);
  const estimatedGasCostNative = estimatedGasUnits * gasConfig.pricePerUnit;

  let nativeToken = "MOVE";
  let nativeTokenPrice: number | null = null;

  switch (chainLower) {
    case "solana":
      nativeToken = "SOL";
      nativeTokenPrice = await fetchJupiterPrice("SOL");
      break;
    case "ethereum":
    case "sepolia":
      nativeToken = "ETH";
      nativeTokenPrice = await fetchJupiterPrice("ETH");
      break;
    case "movement":
    default:
      nativeToken = "MOVE";
      nativeTokenPrice = await fetchJupiterPrice("MOVE");
  }

  const priceUSD = nativeTokenPrice || 0;
  const estimatedGasCostUSD = estimatedGasCostNative * priceUSD;

  return {
    chain: chainLower,
    nativeToken,
    nativeTokenPriceUSD: priceUSD,
    estimatedGasUnits,
    estimatedGasCostNative,
    estimatedGasCostUSD,
    timestamp: new Date().toISOString(),
  };
}

export async function getTokenPrice(symbol: string): Promise<TokenPrice | null> {
  const price = await fetchJupiterPrice(symbol);
  
  if (price === null) {
    return null;
  }

  return {
    id: TOKEN_MINTS[symbol] || symbol,
    mintSymbol: symbol,
    vsToken: TOKEN_MINTS.USDC,
    vsTokenSymbol: "USDC",
    price,
    timestamp: Date.now(),
  };
}

export async function getMultipleTokenPrices(
  symbols: string[]
): Promise<Record<string, TokenPrice | null>> {
  const prices = await fetchMultiplePrices(symbols);
  const results: Record<string, TokenPrice | null> = {};

  for (const symbol of symbols) {
    const price = prices[symbol];
    if (price !== null) {
      results[symbol] = {
        id: TOKEN_MINTS[symbol] || symbol,
        mintSymbol: symbol,
        vsToken: TOKEN_MINTS.USDC,
        vsTokenSymbol: "USDC",
        price,
        timestamp: Date.now(),
      };
    } else {
      results[symbol] = null;
    }
  }

  return results;
}

export async function checkJupiterStatus(): Promise<{
  available: boolean;
  api: string;
  latency_ms?: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${JUPITER_PRICE_API}?ids=${TOKEN_MINTS.SOL}`, {
      headers: { "Accept": "application/json" },
    });

    const latency = Date.now() - startTime;

    if (response.ok) {
      return {
        available: true,
        api: JUPITER_PRICE_API,
        latency_ms: latency,
      };
    }

    return {
      available: false,
      api: JUPITER_PRICE_API,
      latency_ms: latency,
      error: `HTTP ${response.status}`,
    };
  } catch (e: any) {
    return {
      available: false,
      api: JUPITER_PRICE_API,
      error: e.message,
    };
  }
}

export const JupiterService = {
  estimateGasCost,
  getTokenPrice,
  getMultipleTokenPrices,
  checkJupiterStatus,
};

export default JupiterService;
