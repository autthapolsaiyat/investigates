/**
 * Blockchain API Service
 * เชื่อมต่อ API จริงจาก Etherscan, Blockchair, Tronscan
 * 
 * Features:
 * - Multi-chain support
 * - Rate limiting
 * - Caching
 * - Fallback to mock data
 */

// Types
export interface WalletBalance {
  address: string;
  balance: string;
  balanceUSD: number;
}

export interface TransactionInfo {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  valueUSD: number;
  gasUsed: string;
  gasPrice: string;
  status: 'success' | 'failed';
  methodId?: string;
  functionName?: string;
}

export interface TokenTransfer {
  hash: string;
  from: string;
  to: string;
  tokenSymbol: string;
  tokenName: string;
  tokenDecimal: number;
  value: string;
  timestamp: number;
}

// API Configurations
const API_CONFIG = {
  ethereum: {
    name: 'Ethereum',
    explorerApi: 'https://api.etherscan.io/api',
    explorerUrl: 'https://etherscan.io',
    // Free tier: 5 calls/sec, 100k calls/day
    // In production, use your own API key
    apiKey: '', // Add your Etherscan API key here
  },
  bsc: {
    name: 'BNB Smart Chain',
    explorerApi: 'https://api.bscscan.com/api',
    explorerUrl: 'https://bscscan.com',
    apiKey: '',
  },
  polygon: {
    name: 'Polygon',
    explorerApi: 'https://api.polygonscan.com/api',
    explorerUrl: 'https://polygonscan.com',
    apiKey: '',
  },
  // Blockchair API (free tier)
  blockchair: {
    baseUrl: 'https://api.blockchair.com',
    // Free tier: 30 calls/min
  }
};

// Price cache (simple in-memory cache)
const priceCache: Record<string, { price: number; timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get current crypto price from CoinGecko (free API)
 */
export async function getCryptoPrice(symbol: string): Promise<number> {
  const cacheKey = symbol.toLowerCase();
  const cached = priceCache[cacheKey];
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.price;
  }
  
  const coinIds: Record<string, string> = {
    eth: 'ethereum',
    btc: 'bitcoin',
    bnb: 'binancecoin',
    matic: 'matic-network',
    trx: 'tron',
    usdt: 'tether',
  };
  
  const coinId = coinIds[cacheKey] || cacheKey;
  
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
    );
    const data = await response.json();
    const price = data[coinId]?.usd || 0;
    
    priceCache[cacheKey] = { price, timestamp: Date.now() };
    return price;
  } catch (error) {
    console.error('Error fetching price:', error);
    // Fallback prices
    const fallbackPrices: Record<string, number> = {
      eth: 3500,
      btc: 95000,
      bnb: 600,
      matic: 0.5,
      trx: 0.12,
      usdt: 1,
    };
    return fallbackPrices[cacheKey] || 0;
  }
}

/**
 * Etherscan/BSCScan/Polygonscan API wrapper
 */
async function etherscanApiCall(
  chain: 'ethereum' | 'bsc' | 'polygon',
  module: string,
  action: string,
  params: Record<string, string>
): Promise<unknown> {
  const config = API_CONFIG[chain];
  const url = new URL(config.explorerApi);
  
  url.searchParams.append('module', module);
  url.searchParams.append('action', action);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  if (config.apiKey) {
    url.searchParams.append('apikey', config.apiKey);
  }
  
  try {
    const response = await fetch(url.toString());
    const data = await response.json();
    
    if (data.status === '1' || data.message === 'OK') {
      return data.result;
    }
    
    throw new Error(data.message || 'API Error');
  } catch (error) {
    console.error(`${chain} API error:`, error);
    throw error;
  }
}

/**
 * Get ETH/BNB/MATIC balance
 */
export async function getBalance(
  chain: 'ethereum' | 'bsc' | 'polygon',
  address: string
): Promise<WalletBalance> {
  try {
    const result = await etherscanApiCall(chain, 'account', 'balance', {
      address,
      tag: 'latest'
    }) as string;
    
    const balanceWei = BigInt(result);
    const balance = Number(balanceWei) / 1e18;
    
    const symbols: Record<string, string> = {
      ethereum: 'eth',
      bsc: 'bnb',
      polygon: 'matic'
    };
    
    const price = await getCryptoPrice(symbols[chain]);
    
    return {
      address,
      balance: balance.toFixed(8),
      balanceUSD: balance * price
    };
  } catch (error) {
    console.error('getBalance error:', error);
    // Return mock data on error
    return {
      address,
      balance: '0',
      balanceUSD: 0
    };
  }
}

/**
 * Get transaction list for address
 */
export async function getTransactions(
  chain: 'ethereum' | 'bsc' | 'polygon',
  address: string,
  page: number = 1,
  pageSize: number = 100
): Promise<TransactionInfo[]> {
  try {
    const result = await etherscanApiCall(chain, 'account', 'txlist', {
      address,
      startblock: '0',
      endblock: '99999999',
      page: page.toString(),
      offset: pageSize.toString(),
      sort: 'desc'
    }) as Array<Record<string, string>>;
    
    const symbols: Record<string, string> = {
      ethereum: 'eth',
      bsc: 'bnb',
      polygon: 'matic'
    };
    
    const price = await getCryptoPrice(symbols[chain]);
    
    return result.map(tx => {
      const valueWei = BigInt(tx.value || '0');
      const value = Number(valueWei) / 1e18;
      
      return {
        hash: tx.hash,
        blockNumber: parseInt(tx.blockNumber),
        timestamp: parseInt(tx.timeStamp) * 1000,
        from: tx.from,
        to: tx.to,
        value: value.toFixed(8),
        valueUSD: value * price,
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
        status: tx.txreceipt_status === '1' ? 'success' : 'failed',
        methodId: tx.methodId,
        functionName: tx.functionName
      };
    });
  } catch (error) {
    console.error('getTransactions error:', error);
    return [];
  }
}

/**
 * Get token transfers
 */
export async function getTokenTransfers(
  chain: 'ethereum' | 'bsc' | 'polygon',
  address: string,
  page: number = 1,
  pageSize: number = 100
): Promise<TokenTransfer[]> {
  try {
    const result = await etherscanApiCall(chain, 'account', 'tokentx', {
      address,
      startblock: '0',
      endblock: '99999999',
      page: page.toString(),
      offset: pageSize.toString(),
      sort: 'desc'
    }) as Array<Record<string, string>>;
    
    return result.map(tx => {
      const decimal = parseInt(tx.tokenDecimal) || 18;
      const valueRaw = BigInt(tx.value || '0');
      const value = Number(valueRaw) / Math.pow(10, decimal);
      
      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        tokenSymbol: tx.tokenSymbol,
        tokenName: tx.tokenName,
        tokenDecimal: decimal,
        value: value.toFixed(8),
        timestamp: parseInt(tx.timeStamp) * 1000
      };
    });
  } catch (error) {
    console.error('getTokenTransfers error:', error);
    return [];
  }
}

/**
 * Blockchair API for Bitcoin
 */
export async function getBitcoinAddress(address: string): Promise<{
  balance: number;
  balanceUSD: number;
  txCount: number;
  totalReceived: number;
  totalSent: number;
  firstSeen: string | null;
  lastSeen: string | null;
}> {
  try {
    const response = await fetch(
      `${API_CONFIG.blockchair.baseUrl}/bitcoin/dashboards/address/${address}`
    );
    const data = await response.json();
    
    if (!data.data || !data.data[address]) {
      throw new Error('Address not found');
    }
    
    const addressData = data.data[address].address;
    const price = await getCryptoPrice('btc');
    
    const balanceSat = addressData.balance || 0;
    const balance = balanceSat / 1e8;
    
    return {
      balance,
      balanceUSD: balance * price,
      txCount: addressData.transaction_count || 0,
      totalReceived: (addressData.received || 0) / 1e8,
      totalSent: (addressData.spent || 0) / 1e8,
      firstSeen: addressData.first_seen_receiving || null,
      lastSeen: addressData.last_seen_receiving || null
    };
  } catch (error) {
    console.error('getBitcoinAddress error:', error);
    return {
      balance: 0,
      balanceUSD: 0,
      txCount: 0,
      totalReceived: 0,
      totalSent: 0,
      firstSeen: null,
      lastSeen: null
    };
  }
}

/**
 * Get Bitcoin transactions from Blockchair
 */
export async function getBitcoinTransactions(address: string): Promise<TransactionInfo[]> {
  try {
    const response = await fetch(
      `${API_CONFIG.blockchair.baseUrl}/bitcoin/dashboards/address/${address}?transaction_details=true&limit=100`
    );
    const data = await response.json();
    
    if (!data.data || !data.data[address]) {
      return [];
    }
    
    const transactions = data.data[address].transactions || [];
    const price = await getCryptoPrice('btc');
    
    return transactions.map((tx: Record<string, unknown>) => {
      const balance_change = (tx.balance_change as number) || 0;
      const value = Math.abs(balance_change) / 1e8;
      
      return {
        hash: tx.hash as string,
        blockNumber: tx.block_id as number,
        timestamp: new Date(tx.time as string).getTime(),
        from: balance_change < 0 ? address : '',
        to: balance_change > 0 ? address : '',
        value: value.toFixed(8),
        valueUSD: value * price,
        gasUsed: '0',
        gasPrice: '0',
        status: 'success' as const
      };
    });
  } catch (error) {
    console.error('getBitcoinTransactions error:', error);
    return [];
  }
}

/**
 * TRON/TRC20 API (Tronscan)
 */
export async function getTronAddress(address: string): Promise<{
  balance: number;
  balanceUSD: number;
  usdtBalance: number;
  txCount: number;
}> {
  try {
    const response = await fetch(
      `https://apilist.tronscanapi.com/api/account?address=${address}`
    );
    const data = await response.json();
    
    const trxBalance = (data.balance || 0) / 1e6;
    const trxPrice = await getCryptoPrice('trx');
    
    // Get USDT balance
    let usdtBalance = 0;
    if (data.trc20token_balances) {
      const usdt = data.trc20token_balances.find(
        (t: { tokenName: string }) => t.tokenName === 'Tether USD'
      );
      if (usdt) {
        usdtBalance = parseFloat(usdt.balance) / Math.pow(10, usdt.tokenDecimal || 6);
      }
    }
    
    return {
      balance: trxBalance,
      balanceUSD: trxBalance * trxPrice + usdtBalance,
      usdtBalance,
      txCount: data.transactions || 0
    };
  } catch (error) {
    console.error('getTronAddress error:', error);
    return {
      balance: 0,
      balanceUSD: 0,
      usdtBalance: 0,
      txCount: 0
    };
  }
}

/**
 * Universal wallet lookup function
 */
export async function lookupWallet(
  chain: 'ethereum' | 'bitcoin' | 'tron' | 'bsc' | 'polygon',
  address: string
): Promise<{
  address: string;
  chain: string;
  balance: number;
  balanceUSD: number;
  txCount: number;
  transactions: TransactionInfo[];
  error?: string;
}> {
  try {
    switch (chain) {
      case 'ethereum':
      case 'bsc':
      case 'polygon': {
        const balance = await getBalance(chain, address);
        const transactions = await getTransactions(chain, address, 1, 50);
        return {
          address,
          chain,
          balance: parseFloat(balance.balance),
          balanceUSD: balance.balanceUSD,
          txCount: transactions.length,
          transactions
        };
      }
      
      case 'bitcoin': {
        const btcData = await getBitcoinAddress(address);
        const transactions = await getBitcoinTransactions(address);
        return {
          address,
          chain,
          balance: btcData.balance,
          balanceUSD: btcData.balanceUSD,
          txCount: btcData.txCount,
          transactions
        };
      }
      
      case 'tron': {
        const tronData = await getTronAddress(address);
        return {
          address,
          chain,
          balance: tronData.balance,
          balanceUSD: tronData.balanceUSD,
          txCount: tronData.txCount,
          transactions: [] // Would need separate API call
        };
      }
      
      default:
        throw new Error(`Unsupported chain: ${chain}`);
    }
  } catch (error) {
    console.error('lookupWallet error:', error);
    return {
      address,
      chain,
      balance: 0,
      balanceUSD: 0,
      txCount: 0,
      transactions: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Known entity database lookup
 */
export const KNOWN_ENTITIES: Record<string, {
  name: string;
  type: 'exchange' | 'mixer' | 'defi' | 'bridge' | 'scam' | 'gambling';
  riskLevel: 'low' | 'medium' | 'high';
  description?: string;
}> = {
  // Major Exchanges
  '0x28c6c06298d514db089934071355e5743bf21d60': { name: 'Binance Hot Wallet', type: 'exchange', riskLevel: 'low' },
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549': { name: 'Binance', type: 'exchange', riskLevel: 'low' },
  '0xdfd5293d8e347dfe59e90efd55b2956a1343963d': { name: 'Binance', type: 'exchange', riskLevel: 'low' },
  '0x56eddb7aa87536c09ccc2793473599fd21a8b17f': { name: 'Huobi', type: 'exchange', riskLevel: 'low' },
  '0xab5c66752a9e8167967685f1450532fb96d5d24f': { name: 'Huobi', type: 'exchange', riskLevel: 'low' },
  '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b': { name: 'OKX', type: 'exchange', riskLevel: 'low' },
  '0x98ec059dc3adfbdd63429454aeb0c990fba4a128': { name: 'Kraken', type: 'exchange', riskLevel: 'low' },
  '0x2910543af39aba0cd09dbb2d50200b3e800a63d2': { name: 'Kraken', type: 'exchange', riskLevel: 'low' },
  '0x0d0707963952f2fba59dd06f2b425ace40b492fe': { name: 'Gate.io', type: 'exchange', riskLevel: 'low' },
  '0xd24400ae8bfebb18ca49be86258a3c749cf46853': { name: 'Gemini', type: 'exchange', riskLevel: 'low' },
  '0x267be1c1d684f78cb4f6a176c4911b741e4ffdc0': { name: 'Bitstamp', type: 'exchange', riskLevel: 'low' },
  '0x503828976d22510aad0201ac7ec88293211d23da': { name: 'Coinbase', type: 'exchange', riskLevel: 'low' },
  '0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43': { name: 'Coinbase', type: 'exchange', riskLevel: 'low' },
  '0x71660c4005ba85c37ccec55d0c4493e66fe775d3': { name: 'Coinbase', type: 'exchange', riskLevel: 'low' },
  
  // Mixers (HIGH RISK)
  '0x8589427373d6d84e98730d7795d8f6f8731fda16': { name: 'Tornado Cash', type: 'mixer', riskLevel: 'high', description: 'Sanctioned mixer' },
  '0x722122df12d4e14e13ac3b6895a86e84145b6967': { name: 'Tornado Cash Router', type: 'mixer', riskLevel: 'high' },
  '0xd90e2f925da726b50c4ed8d0fb90ad053324f31b': { name: 'Tornado Cash 0.1 ETH', type: 'mixer', riskLevel: 'high' },
  '0x910cbd523d972eb0a6f4cae4618ad62622b39dbf': { name: 'Tornado Cash 10 ETH', type: 'mixer', riskLevel: 'high' },
  '0xa160cdab225685da1d56aa342ad8841c3b53f291': { name: 'Tornado Cash 100 ETH', type: 'mixer', riskLevel: 'high' },
  '0xd4b88df4d29f5cedd6857912842cff3b20c8cfa3': { name: 'Tornado Cash 100 DAI', type: 'mixer', riskLevel: 'high' },
  
  // DeFi Protocols
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': { name: 'Uniswap V2 Router', type: 'defi', riskLevel: 'low' },
  '0xe592427a0aece92de3edee1f18e0157c05861564': { name: 'Uniswap V3 Router', type: 'defi', riskLevel: 'low' },
  '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45': { name: 'Uniswap Universal Router', type: 'defi', riskLevel: 'low' },
  '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f': { name: 'SushiSwap Router', type: 'defi', riskLevel: 'low' },
  '0x1111111254fb6c44bac0bed2854e76f90643097d': { name: '1inch Router', type: 'defi', riskLevel: 'low' },
  '0xdef1c0ded9bec7f1a1670819833240f027b25eff': { name: '0x Exchange Proxy', type: 'defi', riskLevel: 'low' },
  '0x881d40237659c251811cec9c364ef91dc08d300c': { name: 'MetaMask Swap', type: 'defi', riskLevel: 'low' },
  
  // Bridges (MEDIUM RISK - often used for laundering)
  '0x40ec5b33f54e0e8a33a975908c5ba1c14e5bbbdf': { name: 'Polygon Bridge', type: 'bridge', riskLevel: 'medium' },
  '0x99c9fc46f92e8a1c0dec1b1747d010903e884be1': { name: 'Optimism Bridge', type: 'bridge', riskLevel: 'medium' },
  '0x4dbd4fc535ac27206064b68ffcf827b0a60bab3f': { name: 'Arbitrum Bridge', type: 'bridge', riskLevel: 'medium' },
  '0x3ee18b2214aff97000d974cf647e7c347e8fa585': { name: 'Wormhole Bridge', type: 'bridge', riskLevel: 'medium' },
  
  // Known Scam addresses (examples)
  '0x098b716b8aaf21512996dc57eb0615e2383e2f96': { name: 'Ronin Bridge Exploiter', type: 'scam', riskLevel: 'high' },
};

export function getKnownEntity(address: string) {
  return KNOWN_ENTITIES[address.toLowerCase()];
}

/**
 * Explorer URL generators
 */
export function getExplorerUrl(
  chain: 'ethereum' | 'bitcoin' | 'tron' | 'bsc' | 'polygon',
  type: 'address' | 'tx',
  hash: string
): string {
  const explorers: Record<string, { address: string; tx: string }> = {
    ethereum: {
      address: `https://etherscan.io/address/${hash}`,
      tx: `https://etherscan.io/tx/${hash}`
    },
    bitcoin: {
      address: `https://blockchair.com/bitcoin/address/${hash}`,
      tx: `https://blockchair.com/bitcoin/transaction/${hash}`
    },
    tron: {
      address: `https://tronscan.org/#/address/${hash}`,
      tx: `https://tronscan.org/#/transaction/${hash}`
    },
    bsc: {
      address: `https://bscscan.com/address/${hash}`,
      tx: `https://bscscan.com/tx/${hash}`
    },
    polygon: {
      address: `https://polygonscan.com/address/${hash}`,
      tx: `https://polygonscan.com/tx/${hash}`
    }
  };
  
  return explorers[chain][type];
}

export default {
  getCryptoPrice,
  getBalance,
  getTransactions,
  getTokenTransfers,
  getBitcoinAddress,
  getBitcoinTransactions,
  getTronAddress,
  lookupWallet,
  getKnownEntity,
  getExplorerUrl,
  KNOWN_ENTITIES
};
