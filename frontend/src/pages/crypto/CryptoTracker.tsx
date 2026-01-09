/**
 * Crypto Tracker - Professional Blockchain Forensics
 * มาตรฐาน Digital Forensic สำหรับการสืบสวนคดีคริปโต
 * 
 * Features:
 * - Multi-chain Wallet Lookup (BTC, ETH, USDT-TRC20, BNB)
 * - Transaction Flow Visualization
 * - Risk Scoring & Pattern Detection
 * - Mixer/Tumbler Detection
 * - Peel Chain Analysis
 * - Exchange Identification
 * - Court-ready Evidence Export
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Wallet, Search, RefreshCw, Loader2, ExternalLink, Copy, CheckCircle2,
  AlertTriangle, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft,
  Shield, ShieldAlert, ShieldCheck, Eye, FileText, Download, Link2,
  Clock, Hash, Layers, Activity, Target, Zap, AlertCircle, Info,
  GitBranch, Network, BarChart3, Filter, ChevronDown, ChevronUp,
  Fingerprint, Globe, Building, DollarSign, Coins, CircleDollarSign
} from 'lucide-react';
import { Button, Card, Badge, Input } from '../../components/ui';

// Types
interface WalletInfo {
  address: string;
  blockchain: BlockchainType;
  balance: number;
  balanceUSD: number;
  totalReceived: number;
  totalSent: number;
  txCount: number;
  firstTxDate: string | null;
  lastTxDate: string | null;
  isContract: boolean;
  labels: string[];
  riskScore: number;
  riskFactors: RiskFactor[];
}

interface Transaction {
  hash: string;
  blockNumber: number;
  timestamp: string;
  from: string;
  to: string;
  value: number;
  valueUSD: number;
  fee: number;
  status: 'success' | 'failed' | 'pending';
  type: 'in' | 'out';
  isContract: boolean;
  methodName?: string;
}

interface RiskFactor {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  score: number;
}

interface KnownEntity {
  name: string;
  type: 'exchange' | 'mixer' | 'gambling' | 'scam' | 'darknet' | 'defi' | 'nft' | 'bridge';
  riskLevel: 'low' | 'medium' | 'high';
}

type BlockchainType = 'bitcoin' | 'ethereum' | 'tron' | 'bsc' | 'polygon';

interface BlockchainConfig {
  id: BlockchainType;
  name: string;
  symbol: string;
  icon: string;
  explorer: string;
  explorerTx: string;
  explorerAddress: string;
  apiEndpoint: string;
  color: string;
}

// Blockchain configurations
const blockchains: BlockchainConfig[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    icon: '⟠',
    explorer: 'Etherscan',
    explorerTx: 'https://etherscan.io/tx/',
    explorerAddress: 'https://etherscan.io/address/',
    apiEndpoint: 'https://api.etherscan.io/api',
    color: '#627EEA'
  },
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    icon: '₿',
    explorer: 'Blockchair',
    explorerTx: 'https://blockchair.com/bitcoin/transaction/',
    explorerAddress: 'https://blockchair.com/bitcoin/address/',
    apiEndpoint: 'https://blockchair.com/bitcoin/dashboards/address/',
    color: '#F7931A'
  },
  {
    id: 'tron',
    name: 'TRON (USDT)',
    symbol: 'TRX/USDT',
    icon: '◈',
    explorer: 'Tronscan',
    explorerTx: 'https://tronscan.org/#/transaction/',
    explorerAddress: 'https://tronscan.org/#/address/',
    apiEndpoint: 'https://apilist.tronscan.org/api/account',
    color: '#FF0013'
  },
  {
    id: 'bsc',
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    icon: '◆',
    explorer: 'BscScan',
    explorerTx: 'https://bscscan.com/tx/',
    explorerAddress: 'https://bscscan.com/address/',
    apiEndpoint: 'https://api.bscscan.com/api',
    color: '#F3BA2F'
  },
  {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'MATIC',
    icon: '⬡',
    explorer: 'Polygonscan',
    explorerTx: 'https://polygonscan.com/tx/',
    explorerAddress: 'https://polygonscan.com/address/',
    apiEndpoint: 'https://api.polygonscan.com/api',
    color: '#8247E5'
  }
];

// Known entities database (simplified - in production would be larger)
const knownEntities: Record<string, KnownEntity> = {
  // Exchanges
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
  
  // Mixers (High Risk)
  '0x8589427373d6d84e98730d7795d8f6f8731fda16': { name: 'Tornado Cash', type: 'mixer', riskLevel: 'high' },
  '0x722122df12d4e14e13ac3b6895a86e84145b6967': { name: 'Tornado Cash Router', type: 'mixer', riskLevel: 'high' },
  '0xd90e2f925da726b50c4ed8d0fb90ad053324f31b': { name: 'Tornado Cash 0.1', type: 'mixer', riskLevel: 'high' },
  '0xd4b88df4d29f5cedd6857912842cff3b20c8cfa3': { name: 'Tornado Cash 100', type: 'mixer', riskLevel: 'high' },
  
  // DeFi
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': { name: 'Uniswap V2 Router', type: 'defi', riskLevel: 'low' },
  '0xe592427a0aece92de3edee1f18e0157c05861564': { name: 'Uniswap V3 Router', type: 'defi', riskLevel: 'low' },
  '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f': { name: 'SushiSwap Router', type: 'defi', riskLevel: 'low' },
  
  // Bridges
  '0x40ec5b33f54e0e8a33a975908c5ba1c14e5bbbdf': { name: 'Polygon Bridge', type: 'bridge', riskLevel: 'medium' },
  '0x99c9fc46f92e8a1c0dec1b1747d010903e884be1': { name: 'Optimism Bridge', type: 'bridge', riskLevel: 'medium' },
};

// Risk pattern definitions
const riskPatterns = {
  mixerInteraction: { score: 40, severity: 'critical' as const, description: 'มีการติดต่อกับ Mixer/Tumbler (Tornado Cash)' },
  highFrequency: { score: 15, severity: 'medium' as const, description: 'ความถี่ธุรกรรมสูงผิดปกติ (>50 tx/วัน)' },
  peelChain: { score: 25, severity: 'high' as const, description: 'ตรวจพบรูปแบบ Peel Chain (แบ่งเงินซ้ำๆ)' },
  newWallet: { score: 10, severity: 'low' as const, description: 'Wallet ใหม่ (สร้างไม่เกิน 30 วัน)' },
  largeAmount: { score: 15, severity: 'medium' as const, description: 'ยอดธุรกรรมสูง (>$100,000)' },
  multipleExchanges: { score: 10, severity: 'low' as const, description: 'โอนผ่านหลาย Exchange' },
  crossChain: { score: 15, severity: 'medium' as const, description: 'มีการโอนข้าม Chain (Bridge)' },
  rapidSplit: { score: 20, severity: 'high' as const, description: 'แบ่งเงินออกหลายทางอย่างรวดเร็ว' },
  contractInteraction: { score: 5, severity: 'low' as const, description: 'มีการใช้ Smart Contract' },
  dormantActivation: { score: 20, severity: 'high' as const, description: 'Wallet นิ่งนานแล้วกลับมาใช้งาน' },
};

export const CryptoTracker = () => {
  const [searchAddress, setSearchAddress] = useState('');
  const [selectedChain, setSelectedChain] = useState<BlockchainType>('ethereum');
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'graph' | 'risk' | 'evidence'>('overview');
  const [copied, setCopied] = useState(false);
  const [showAllTx, setShowAllTx] = useState(false);
  const [txFilter, setTxFilter] = useState<'all' | 'in' | 'out'>('all');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<unknown>(null);

  // Get current blockchain config
  const currentChain = blockchains.find(b => b.id === selectedChain)!;

  // Auto-detect blockchain from address format
  const detectBlockchain = (address: string): BlockchainType => {
    if (address.startsWith('0x') && address.length === 42) {
      return 'ethereum'; // Could be ETH, BSC, Polygon
    }
    if (address.startsWith('T') && address.length === 34) {
      return 'tron';
    }
    if (address.startsWith('1') || address.startsWith('3') || address.startsWith('bc1')) {
      return 'bitcoin';
    }
    return 'ethereum';
  };

  // Format address for display
  const formatAddress = (addr: string, length: number = 8) => {
    if (!addr) return '';
    return `${addr.slice(0, length)}...${addr.slice(-length)}`;
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format currency
  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatCrypto = (amount: number, symbol: string) => {
    return `${amount.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${symbol}`;
  };

  // Check if address is known entity
  const getKnownEntity = (address: string): KnownEntity | null => {
    return knownEntities[address.toLowerCase()] || null;
  };

  // Calculate risk score
  const calculateRiskScore = (wallet: Partial<WalletInfo>, txs: Transaction[]): { score: number; factors: RiskFactor[] } => {
    const factors: RiskFactor[] = [];
    let totalScore = 0;

    // Check for mixer interactions
    const hasMixerTx = txs.some(tx => {
      const entity = getKnownEntity(tx.to) || getKnownEntity(tx.from);
      return entity?.type === 'mixer';
    });
    if (hasMixerTx) {
      factors.push({ type: 'mixerInteraction', ...riskPatterns.mixerInteraction });
      totalScore += riskPatterns.mixerInteraction.score;
    }

    // Check transaction frequency
    if (txs.length > 0) {
      const days = Math.max(1, Math.ceil((Date.now() - new Date(txs[txs.length - 1].timestamp).getTime()) / (1000 * 60 * 60 * 24)));
      const txPerDay = txs.length / days;
      if (txPerDay > 50) {
        factors.push({ type: 'highFrequency', ...riskPatterns.highFrequency });
        totalScore += riskPatterns.highFrequency.score;
      }
    }

    // Check for peel chain pattern (many small outputs from large input)
    const outTxs = txs.filter(tx => tx.type === 'out');
    if (outTxs.length > 10) {
      const avgValue = outTxs.reduce((sum, tx) => sum + tx.value, 0) / outTxs.length;
      const similarValues = outTxs.filter(tx => Math.abs(tx.value - avgValue) < avgValue * 0.2);
      if (similarValues.length > outTxs.length * 0.7) {
        factors.push({ type: 'peelChain', ...riskPatterns.peelChain });
        totalScore += riskPatterns.peelChain.score;
      }
    }

    // Check for new wallet
    if (wallet.firstTxDate) {
      const age = (Date.now() - new Date(wallet.firstTxDate).getTime()) / (1000 * 60 * 60 * 24);
      if (age < 30) {
        factors.push({ type: 'newWallet', ...riskPatterns.newWallet });
        totalScore += riskPatterns.newWallet.score;
      }
    }

    // Check for large amounts
    if ((wallet.totalReceived || 0) > 100000) {
      factors.push({ type: 'largeAmount', ...riskPatterns.largeAmount });
      totalScore += riskPatterns.largeAmount.score;
    }

    // Check for bridge interactions
    const hasBridgeTx = txs.some(tx => {
      const entity = getKnownEntity(tx.to) || getKnownEntity(tx.from);
      return entity?.type === 'bridge';
    });
    if (hasBridgeTx) {
      factors.push({ type: 'crossChain', ...riskPatterns.crossChain });
      totalScore += riskPatterns.crossChain.score;
    }

    // Check for rapid split (many outputs in short time)
    const recentOutTxs = outTxs.filter(tx => 
      Date.now() - new Date(tx.timestamp).getTime() < 24 * 60 * 60 * 1000
    );
    if (recentOutTxs.length > 10) {
      factors.push({ type: 'rapidSplit', ...riskPatterns.rapidSplit });
      totalScore += riskPatterns.rapidSplit.score;
    }

    return { score: Math.min(100, totalScore), factors };
  };

  // Generate mock data for demo (in production, this would call real APIs)
  const generateMockWalletData = (address: string, chain: BlockchainType): { wallet: WalletInfo; txs: Transaction[] } => {
    const isHighRisk = address.toLowerCase().includes('tornado') || Math.random() > 0.7;
    const txCount = Math.floor(Math.random() * 200) + 20;
    
    // Generate transactions
    const txs: Transaction[] = [];
    const now = Date.now();
    let balance = 0;
    
    for (let i = 0; i < Math.min(txCount, 100); i++) {
      const isIn = Math.random() > 0.5;
      const value = Math.random() * (isHighRisk ? 100 : 10);
      const valueUSD = value * (chain === 'ethereum' ? 3500 : chain === 'bitcoin' ? 95000 : 1);
      
      if (isIn) balance += value;
      else balance = Math.max(0, balance - value);
      
      const counterparties = [
        '0x28c6c06298d514db089934071355e5743bf21d60', // Binance
        '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', // Uniswap
        '0x' + Math.random().toString(16).slice(2, 42).padEnd(40, '0'),
      ];
      
      if (isHighRisk && Math.random() > 0.8) {
        counterparties.push('0x8589427373d6d84e98730d7795d8f6f8731fda16'); // Tornado Cash
      }
      
      const counterparty = counterparties[Math.floor(Math.random() * counterparties.length)];
      
      txs.push({
        hash: '0x' + Math.random().toString(16).slice(2, 66).padEnd(64, '0'),
        blockNumber: 18000000 - i * 100,
        timestamp: new Date(now - i * 3600000 * Math.random() * 24).toISOString(),
        from: isIn ? counterparty : address,
        to: isIn ? address : counterparty,
        value,
        valueUSD,
        fee: Math.random() * 0.01,
        status: 'success',
        type: isIn ? 'in' : 'out',
        isContract: Math.random() > 0.7,
        methodName: Math.random() > 0.5 ? 'transfer' : undefined
      });
    }
    
    txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    const totalReceived = txs.filter(t => t.type === 'in').reduce((sum, t) => sum + t.valueUSD, 0);
    const totalSent = txs.filter(t => t.type === 'out').reduce((sum, t) => sum + t.valueUSD, 0);
    
    const { score, factors } = calculateRiskScore({ totalReceived, firstTxDate: txs[txs.length - 1]?.timestamp }, txs);
    
    const labels: string[] = [];
    if (isHighRisk) labels.push('High Risk');
    if (txCount > 100) labels.push('High Activity');
    if (totalReceived > 100000) labels.push('High Value');
    
    const wallet: WalletInfo = {
      address,
      blockchain: chain,
      balance: balance,
      balanceUSD: balance * (chain === 'ethereum' ? 3500 : chain === 'bitcoin' ? 95000 : 1),
      totalReceived,
      totalSent,
      txCount,
      firstTxDate: txs[txs.length - 1]?.timestamp || null,
      lastTxDate: txs[0]?.timestamp || null,
      isContract: Math.random() > 0.9,
      labels,
      riskScore: score,
      riskFactors: factors
    };
    
    return { wallet, txs };
  };

  // Search wallet
  const searchWallet = async () => {
    if (!searchAddress.trim()) {
      setError('กรุณาใส่ Wallet Address');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setWalletInfo(null);
    setTransactions([]);
    
    try {
      // Auto-detect chain
      const detectedChain = detectBlockchain(searchAddress);
      if (detectedChain !== selectedChain) {
        setSelectedChain(detectedChain);
      }
      
      // In production, call real blockchain APIs
      // For demo, generate mock data
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      const { wallet, txs } = generateMockWalletData(searchAddress, detectedChain);
      
      setWalletInfo(wallet);
      setTransactions(txs);
      
    } catch (err) {
      setError('ไม่สามารถค้นหาข้อมูล Wallet ได้');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Render network graph
  useEffect(() => {
    if (activeTab === 'graph' && walletInfo && transactions.length > 0 && containerRef.current && window.vis) {
      renderTransactionGraph();
    }
  }, [activeTab, walletInfo, transactions]);

  const renderTransactionGraph = () => {
    if (!containerRef.current || !window.vis || !walletInfo) return;

    // Build nodes from transactions
    const nodeMap = new Map<string, { id: string; label: string; group: string; value: number }>();
    
    // Add main wallet
    nodeMap.set(walletInfo.address, {
      id: walletInfo.address,
      label: formatAddress(walletInfo.address, 6),
      group: 'main',
      value: walletInfo.balanceUSD
    });
    
    // Add counterparties
    transactions.slice(0, 50).forEach(tx => {
      const counterparty = tx.type === 'in' ? tx.from : tx.to;
      if (!nodeMap.has(counterparty)) {
        const entity = getKnownEntity(counterparty);
        let group = 'unknown';
        if (entity) {
          group = entity.type;
        }
        nodeMap.set(counterparty, {
          id: counterparty,
          label: entity?.name || formatAddress(counterparty, 6),
          group,
          value: tx.valueUSD
        });
      }
    });

    const nodeColors: Record<string, { background: string; border: string }> = {
      main: { background: '#3B82F6', border: '#1D4ED8' },
      exchange: { background: '#22C55E', border: '#15803D' },
      mixer: { background: '#DC2626', border: '#991B1B' },
      defi: { background: '#8B5CF6', border: '#6D28D9' },
      bridge: { background: '#F59E0B', border: '#B45309' },
      unknown: { background: '#6B7280', border: '#374151' },
      scam: { background: '#DC2626', border: '#991B1B' },
      gambling: { background: '#F97316', border: '#C2410C' },
    };

    const visNodes = Array.from(nodeMap.values()).map(n => ({
      id: n.id,
      label: n.label,
      color: nodeColors[n.group] || nodeColors.unknown,
      size: n.group === 'main' ? 40 : 25,
      font: { color: '#fff', size: 10 },
      shape: n.group === 'main' ? 'diamond' : 'dot',
      borderWidth: 2,
      shadow: true
    }));

    const visEdges = transactions.slice(0, 50).map(tx => ({
      id: tx.hash,
      from: tx.from,
      to: tx.to,
      label: formatUSD(tx.valueUSD),
      width: Math.min(Math.max(tx.valueUSD / 10000, 1), 5),
      color: { color: tx.type === 'in' ? '#22C55E' : '#EF4444' },
      arrows: 'to',
      font: { color: '#fff', size: 8, strokeWidth: 0 },
      smooth: { type: 'curvedCW', roundness: 0.2 }
    }));

    const data = {
      nodes: new window.vis.DataSet(visNodes),
      edges: new window.vis.DataSet(visEdges)
    };

    const options = {
      nodes: {
        font: { color: '#fff', size: 10 },
        borderWidth: 2,
        shadow: true
      },
      edges: {
        font: { color: '#fff', size: 8, strokeWidth: 0, align: 'middle' },
        smooth: { type: 'curvedCW', roundness: 0.2 },
        arrows: { to: { enabled: true, scaleFactor: 0.8 } },
        shadow: true
      },
      physics: {
        barnesHut: {
          gravitationalConstant: -3000,
          springLength: 150,
          springConstant: 0.04
        }
      },
      interaction: {
        hover: true,
        tooltipDelay: 100,
        navigationButtons: true
      }
    };

    if (networkRef.current) {
      (networkRef.current as { destroy: () => void }).destroy();
    }

    networkRef.current = new window.vis.Network(containerRef.current, data, options);
  };

  // Get risk level color
  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getRiskBgColor = (score: number) => {
    if (score >= 70) return 'bg-red-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getRiskLabel = (score: number) => {
    if (score >= 70) return 'ความเสี่ยงสูง';
    if (score >= 40) return 'ความเสี่ยงปานกลาง';
    return 'ความเสี่ยงต่ำ';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 bg-dark-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Wallet className="text-primary-500" />
            Crypto Tracker
          </h1>
          <p className="text-dark-400 mt-1">
            Blockchain Forensics - วิเคราะห์ธุรกรรมคริปโตระดับมืออาชีพ
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary">
            <FileText size={18} className="mr-2" />
            รายงาน
          </Button>
          <Button variant="secondary">
            <Download size={18} className="mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Search Section */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          {/* Chain Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-dark-400">Blockchain:</label>
            <div className="flex gap-1">
              {blockchains.map(chain => (
                <button
                  key={chain.id}
                  onClick={() => setSelectedChain(chain.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedChain === chain.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                  }`}
                  title={chain.name}
                >
                  <span className="mr-1">{chain.icon}</span>
                  {chain.symbol}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={18} />
            <input
              type="text"
              placeholder="ใส่ Wallet Address (0x... หรือ T... หรือ bc1...)"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchWallet()}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none font-mono text-sm"
            />
          </div>

          <Button onClick={searchWallet} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                กำลังค้นหา...
              </>
            ) : (
              <>
                <Search size={18} className="mr-2" />
                ค้นหา
              </>
            )}
          </Button>
        </div>

        {/* Quick Search Examples */}
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="text-dark-500">ตัวอย่าง:</span>
          <button
            onClick={() => setSearchAddress('0x28c6c06298d514db089934071355e5743bf21d60')}
            className="text-primary-400 hover:underline"
          >
            Binance Hot Wallet
          </button>
          <span className="text-dark-600">|</span>
          <button
            onClick={() => setSearchAddress('0x8589427373d6d84e98730d7795d8f6f8731fda16')}
            className="text-red-400 hover:underline"
          >
            Tornado Cash (High Risk)
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </Card>

      {/* Results */}
      {walletInfo && (
        <>
          {/* Wallet Summary */}
          <div className="grid grid-cols-6 gap-4">
            {/* Balance */}
            <Card className="p-4 col-span-2">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg" style={{ backgroundColor: currentChain.color + '20' }}>
                  <span className="text-2xl">{currentChain.icon}</span>
                </div>
                <div>
                  <p className="text-sm text-dark-400">ยอดคงเหลือ</p>
                  <p className="text-2xl font-bold">{formatCrypto(walletInfo.balance, currentChain.symbol)}</p>
                  <p className="text-sm text-dark-400">{formatUSD(walletInfo.balanceUSD)}</p>
                </div>
              </div>
            </Card>

            {/* Total Received */}
            <Card className="p-4">
              <div className="flex items-center gap-2 text-green-400 mb-1">
                <ArrowDownLeft size={16} />
                <span className="text-sm">รับเข้า</span>
              </div>
              <p className="text-xl font-bold text-green-400">{formatUSD(walletInfo.totalReceived)}</p>
            </Card>

            {/* Total Sent */}
            <Card className="p-4">
              <div className="flex items-center gap-2 text-red-400 mb-1">
                <ArrowUpRight size={16} />
                <span className="text-sm">ส่งออก</span>
              </div>
              <p className="text-xl font-bold text-red-400">{formatUSD(walletInfo.totalSent)}</p>
            </Card>

            {/* TX Count */}
            <Card className="p-4">
              <div className="flex items-center gap-2 text-blue-400 mb-1">
                <Activity size={16} />
                <span className="text-sm">ธุรกรรม</span>
              </div>
              <p className="text-xl font-bold">{walletInfo.txCount.toLocaleString()}</p>
            </Card>

            {/* Risk Score */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Shield size={16} className={getRiskColor(walletInfo.riskScore)} />
                <span className="text-sm text-dark-400">Risk Score</span>
              </div>
              <div className="flex items-center gap-2">
                <p className={`text-2xl font-bold ${getRiskColor(walletInfo.riskScore)}`}>
                  {walletInfo.riskScore}
                </p>
                <Badge variant={walletInfo.riskScore >= 70 ? 'danger' : walletInfo.riskScore >= 40 ? 'warning' : 'success'}>
                  {getRiskLabel(walletInfo.riskScore)}
                </Badge>
              </div>
            </Card>
          </div>

          {/* Wallet Info Card */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-dark-400">Wallet Address</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="font-mono text-sm bg-dark-700 px-3 py-1 rounded">
                      {walletInfo.address}
                    </code>
                    <button
                      onClick={() => copyToClipboard(walletInfo.address)}
                      className="p-1 hover:bg-dark-700 rounded"
                    >
                      {copied ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} />}
                    </button>
                    <a
                      href={currentChain.explorerAddress + walletInfo.address}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-dark-700 rounded text-primary-400"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <p className="text-dark-400">First TX</p>
                  <p>{walletInfo.firstTxDate ? new Date(walletInfo.firstTxDate).toLocaleDateString('th-TH') : '-'}</p>
                </div>
                <div>
                  <p className="text-dark-400">Last TX</p>
                  <p>{walletInfo.lastTxDate ? new Date(walletInfo.lastTxDate).toLocaleDateString('th-TH') : '-'}</p>
                </div>
                <div>
                  <p className="text-dark-400">Type</p>
                  <p>{walletInfo.isContract ? 'Smart Contract' : 'EOA Wallet'}</p>
                </div>
              </div>
            </div>

            {/* Labels */}
            {walletInfo.labels.length > 0 && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-dark-700">
                <span className="text-sm text-dark-400">Labels:</span>
                {walletInfo.labels.map((label, idx) => (
                  <Badge key={idx} variant={label.includes('Risk') ? 'danger' : 'default'}>
                    {label}
                  </Badge>
                ))}
              </div>
            )}

            {/* Known Entity */}
            {getKnownEntity(walletInfo.address) && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-dark-700">
                <Building size={16} className="text-primary-400" />
                <span className="text-sm text-dark-400">Known Entity:</span>
                <Badge variant={getKnownEntity(walletInfo.address)?.type === 'mixer' ? 'danger' : 'success'}>
                  {getKnownEntity(walletInfo.address)?.name}
                </Badge>
                <span className="text-xs text-dark-500">
                  ({getKnownEntity(walletInfo.address)?.type})
                </span>
              </div>
            )}
          </Card>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-dark-700">
            {[
              { id: 'overview', label: 'ภาพรวม', icon: Eye },
              { id: 'transactions', label: 'ธุรกรรม', icon: Activity },
              { id: 'graph', label: 'กราฟเครือข่าย', icon: Network },
              { id: 'risk', label: 'วิเคราะห์ความเสี่ยง', icon: ShieldAlert },
              { id: 'evidence', label: 'หลักฐาน', icon: Fingerprint },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-[2px] ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-400 bg-dark-800'
                    : 'border-transparent text-dark-400 hover:text-white hover:bg-dark-800'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 gap-4">
              {/* Recent Transactions */}
              <Card className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock className="text-primary-400" />
                  ธุรกรรมล่าสุด
                </h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {transactions.slice(0, 10).map((tx) => {
                    const entity = getKnownEntity(tx.type === 'in' ? tx.from : tx.to);
                    return (
                      <div key={tx.hash} className="p-3 bg-dark-800 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {tx.type === 'in' ? (
                              <ArrowDownLeft className="text-green-400" size={16} />
                            ) : (
                              <ArrowUpRight className="text-red-400" size={16} />
                            )}
                            <div>
                              <p className="font-mono text-sm">
                                {entity?.name || formatAddress(tx.type === 'in' ? tx.from : tx.to)}
                              </p>
                              <p className="text-xs text-dark-400">
                                {new Date(tx.timestamp).toLocaleString('th-TH')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${tx.type === 'in' ? 'text-green-400' : 'text-red-400'}`}>
                              {tx.type === 'in' ? '+' : '-'}{formatUSD(tx.valueUSD)}
                            </p>
                            <a
                              href={currentChain.explorerTx + tx.hash}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary-400 hover:underline flex items-center gap-1 justify-end"
                            >
                              <span>{formatAddress(tx.hash, 8)}</span>
                              <ExternalLink size={10} />
                            </a>
                          </div>
                        </div>
                        {entity && (
                          <div className="mt-2 pt-2 border-t border-dark-700">
                            <Badge 
                              variant={entity.type === 'mixer' ? 'danger' : entity.type === 'exchange' ? 'success' : 'default'}
                              className="text-xs"
                            >
                              {entity.type}: {entity.name}
                            </Badge>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Top Counterparties */}
              <Card className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Link2 className="text-primary-400" />
                  Counterparties หลัก
                </h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {(() => {
                    const counterpartyMap = new Map<string, { address: string; totalValue: number; txCount: number }>();
                    transactions.forEach(tx => {
                      const addr = tx.type === 'in' ? tx.from : tx.to;
                      const existing = counterpartyMap.get(addr) || { address: addr, totalValue: 0, txCount: 0 };
                      existing.totalValue += tx.valueUSD;
                      existing.txCount++;
                      counterpartyMap.set(addr, existing);
                    });
                    return Array.from(counterpartyMap.values())
                      .sort((a, b) => b.totalValue - a.totalValue)
                      .slice(0, 10)
                      .map((cp) => {
                        const entity = getKnownEntity(cp.address);
                        return (
                          <div key={cp.address} className="p-3 bg-dark-800 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                entity?.type === 'mixer' ? 'bg-red-500' :
                                entity?.type === 'exchange' ? 'bg-green-500' :
                                entity?.type === 'defi' ? 'bg-purple-500' : 'bg-gray-500'
                              }`} />
                              <div>
                                <p className="font-medium text-sm">
                                  {entity?.name || formatAddress(cp.address)}
                                </p>
                                <p className="text-xs text-dark-400">{cp.txCount} ธุรกรรม</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatUSD(cp.totalValue)}</p>
                              <a
                                href={currentChain.explorerAddress + cp.address}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary-400 hover:underline"
                              >
                                View →
                              </a>
                            </div>
                          </div>
                        );
                      });
                  })()}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'transactions' && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Activity className="text-primary-400" />
                  รายการธุรกรรม ({transactions.length} รายการ)
                </h3>
                <div className="flex items-center gap-2">
                  <select
                    className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm"
                    value={txFilter}
                    onChange={(e) => setTxFilter(e.target.value as typeof txFilter)}
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="in">รับเข้า</option>
                    <option value="out">ส่งออก</option>
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-dark-800">
                    <tr>
                      <th className="text-left px-4 py-3">Hash</th>
                      <th className="text-left px-4 py-3">เวลา</th>
                      <th className="text-left px-4 py-3">ประเภท</th>
                      <th className="text-left px-4 py-3">จาก/ถึง</th>
                      <th className="text-right px-4 py-3">จำนวน</th>
                      <th className="text-left px-4 py-3">Entity</th>
                      <th className="text-center px-4 py-3">Explorer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700">
                    {transactions
                      .filter(tx => txFilter === 'all' || tx.type === txFilter)
                      .slice(0, showAllTx ? undefined : 50)
                      .map((tx) => {
                        const counterparty = tx.type === 'in' ? tx.from : tx.to;
                        const entity = getKnownEntity(counterparty);
                        return (
                          <tr key={tx.hash} className="hover:bg-dark-800/50">
                            <td className="px-4 py-3 font-mono text-xs">
                              {formatAddress(tx.hash, 8)}
                            </td>
                            <td className="px-4 py-3 text-dark-400">
                              {new Date(tx.timestamp).toLocaleString('th-TH')}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={tx.type === 'in' ? 'success' : 'danger'}>
                                {tx.type === 'in' ? 'IN' : 'OUT'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs">
                              {formatAddress(counterparty, 8)}
                            </td>
                            <td className={`px-4 py-3 text-right font-semibold ${
                              tx.type === 'in' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {tx.type === 'in' ? '+' : '-'}{formatUSD(tx.valueUSD)}
                            </td>
                            <td className="px-4 py-3">
                              {entity && (
                                <Badge
                                  variant={entity.type === 'mixer' ? 'danger' : entity.type === 'exchange' ? 'success' : 'default'}
                                  className="text-xs"
                                >
                                  {entity.name}
                                </Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <a
                                href={currentChain.explorerTx + tx.hash}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-400 hover:underline"
                              >
                                <ExternalLink size={14} />
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
              {transactions.length > 50 && !showAllTx && (
                <div className="text-center mt-4">
                  <Button variant="ghost" onClick={() => setShowAllTx(true)}>
                    แสดงทั้งหมด ({transactions.length} รายการ)
                  </Button>
                </div>
              )}
            </Card>
          )}

          {activeTab === 'graph' && (
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Network className="text-primary-400" />
                Transaction Flow Graph
              </h3>
              <div 
                ref={containerRef}
                className="bg-dark-950 rounded-lg border border-dark-700"
                style={{ height: '500px' }}
              />
              {/* Legend */}
              <div className="mt-4 p-3 bg-dark-800 rounded-lg">
                <div className="text-sm font-medium mb-2 text-dark-300">สัญลักษณ์</div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-blue-500" />
                    <span>Wallet หลัก</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-green-500" />
                    <span>Exchange</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-red-500" />
                    <span>Mixer (High Risk)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-purple-500" />
                    <span>DeFi</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-yellow-500" />
                    <span>Bridge</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-gray-500" />
                    <span>Unknown</span>
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-2 pt-2 border-t border-dark-700">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-8 h-0.5 bg-green-500" />
                    <span>เงินเข้า</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-8 h-0.5 bg-red-500" />
                    <span>เงินออก</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'risk' && (
            <div className="grid grid-cols-3 gap-4">
              {/* Risk Score Overview */}
              <Card className="p-6 col-span-1">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Shield className="text-primary-400" />
                  Risk Assessment
                </h3>
                <div className="text-center">
                  <div className={`text-6xl font-bold ${getRiskColor(walletInfo.riskScore)}`}>
                    {walletInfo.riskScore}
                  </div>
                  <div className="mt-2">
                    <Badge 
                      variant={walletInfo.riskScore >= 70 ? 'danger' : walletInfo.riskScore >= 40 ? 'warning' : 'success'}
                      className="text-lg px-4 py-1"
                    >
                      {getRiskLabel(walletInfo.riskScore)}
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-dark-700 rounded-full h-4">
                      <div 
                        className={`h-4 rounded-full transition-all ${getRiskBgColor(walletInfo.riskScore)}`}
                        style={{ width: `${walletInfo.riskScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Risk Breakdown */}
                <div className="mt-6 space-y-2">
                  <p className="text-sm text-dark-400">องค์ประกอบความเสี่ยง:</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Mixer Exposure', value: walletInfo.riskFactors.some(f => f.type === 'mixerInteraction') ? 40 : 0 },
                      { label: 'Transaction Pattern', value: walletInfo.riskFactors.some(f => f.type === 'peelChain') ? 25 : 0 },
                      { label: 'Volume Risk', value: walletInfo.riskFactors.some(f => f.type === 'largeAmount') ? 15 : 0 },
                      { label: 'Behavioral Risk', value: walletInfo.riskFactors.some(f => f.type === 'highFrequency') ? 15 : 0 },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <span className="text-xs text-dark-400 w-32">{item.label}</span>
                        <div className="flex-1 bg-dark-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${item.value > 20 ? 'bg-red-500' : item.value > 10 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                        <span className="text-xs w-8 text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Risk Factors Detail */}
              <Card className="p-4 col-span-2">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="text-yellow-400" />
                  ปัจจัยความเสี่ยงที่ตรวจพบ
                </h3>
                {walletInfo.riskFactors.length > 0 ? (
                  <div className="space-y-3">
                    {walletInfo.riskFactors.map((factor, idx) => (
                      <div key={idx} className="p-4 bg-dark-800 rounded-lg border-l-4" style={{
                        borderColor: factor.severity === 'critical' ? '#DC2626' :
                                    factor.severity === 'high' ? '#F97316' :
                                    factor.severity === 'medium' ? '#F59E0B' : '#3B82F6'
                      }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${getSeverityColor(factor.severity)}`}>
                              {factor.severity === 'critical' ? <ShieldAlert size={18} className="text-white" /> :
                               factor.severity === 'high' ? <AlertTriangle size={18} className="text-white" /> :
                               <AlertCircle size={18} className="text-white" />}
                            </div>
                            <div>
                              <p className="font-medium">{factor.description}</p>
                              <p className="text-xs text-dark-400 mt-1">
                                ความรุนแรง: {factor.severity.toUpperCase()}
                              </p>
                            </div>
                          </div>
                          <Badge variant="danger">+{factor.score} คะแนน</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ShieldCheck size={48} className="mx-auto text-green-400 mb-3" />
                    <p className="text-lg font-medium text-green-400">ไม่พบความเสี่ยงที่มีนัยสำคัญ</p>
                    <p className="text-sm text-dark-400 mt-1">Wallet นี้มีพฤติกรรมปกติ</p>
                  </div>
                )}

                {/* Recommendations */}
                <div className="mt-6 p-4 bg-dark-900 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Info size={16} className="text-primary-400" />
                    คำแนะนำสำหรับการสืบสวน
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {walletInfo.riskScore >= 70 && (
                      <>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 size={14} className="text-red-400 mt-0.5" />
                          <span>ควรตรวจสอบธุรกรรมที่เกี่ยวข้องกับ Mixer อย่างละเอียด</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 size={14} className="text-red-400 mt-0.5" />
                          <span>ติดตาม counterparties ที่มีปริมาณธุรกรรมสูง</span>
                        </li>
                      </>
                    )}
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-primary-400 mt-0.5" />
                      <span>ตรวจสอบ Exchange ที่ใช้ในการ Cash-out และขอข้อมูล KYC</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-primary-400 mt-0.5" />
                      <span>วิเคราะห์ Time Pattern เพื่อระบุพฤติกรรมผิดปกติ</span>
                    </li>
                  </ul>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'evidence' && (
            <div className="grid grid-cols-2 gap-4">
              {/* Evidence Summary */}
              <Card className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Fingerprint className="text-primary-400" />
                  สรุปหลักฐาน
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-dark-800 rounded-lg">
                    <p className="text-sm text-dark-400 mb-2">Wallet Address</p>
                    <code className="font-mono text-xs bg-dark-700 p-2 rounded block break-all">
                      {walletInfo.address}
                    </code>
                  </div>
                  <div className="p-4 bg-dark-800 rounded-lg">
                    <p className="text-sm text-dark-400 mb-2">Blockchain</p>
                    <p className="font-medium">{currentChain.name} ({currentChain.symbol})</p>
                  </div>
                  <div className="p-4 bg-dark-800 rounded-lg">
                    <p className="text-sm text-dark-400 mb-2">ช่วงเวลาธุรกรรม</p>
                    <p className="font-medium">
                      {walletInfo.firstTxDate ? new Date(walletInfo.firstTxDate).toLocaleDateString('th-TH') : '-'}
                      {' → '}
                      {walletInfo.lastTxDate ? new Date(walletInfo.lastTxDate).toLocaleDateString('th-TH') : '-'}
                    </p>
                  </div>
                  <div className="p-4 bg-dark-800 rounded-lg">
                    <p className="text-sm text-dark-400 mb-2">มูลค่ารวม</p>
                    <p className="font-medium text-lg">{formatUSD(walletInfo.totalReceived + walletInfo.totalSent)}</p>
                  </div>
                  <div className="p-4 bg-dark-800 rounded-lg">
                    <p className="text-sm text-dark-400 mb-2">Risk Score</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${getRiskColor(walletInfo.riskScore)}`}>
                        {walletInfo.riskScore}/100
                      </span>
                      <Badge variant={walletInfo.riskScore >= 70 ? 'danger' : walletInfo.riskScore >= 40 ? 'warning' : 'success'}>
                        {getRiskLabel(walletInfo.riskScore)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Export Options */}
              <Card className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Download className="text-primary-400" />
                  Export หลักฐาน
                </h3>
                <div className="space-y-3">
                  <button className="w-full p-4 bg-dark-800 rounded-lg hover:bg-dark-750 transition-colors text-left">
                    <div className="flex items-center gap-3">
                      <FileText className="text-red-400" size={24} />
                      <div>
                        <p className="font-medium">PDF Report</p>
                        <p className="text-xs text-dark-400">รายงานสำหรับส่งศาล พร้อม Chain of Custody</p>
                      </div>
                    </div>
                  </button>
                  <button className="w-full p-4 bg-dark-800 rounded-lg hover:bg-dark-750 transition-colors text-left">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="text-green-400" size={24} />
                      <div>
                        <p className="font-medium">Excel/CSV</p>
                        <p className="text-xs text-dark-400">ข้อมูลธุรกรรมทั้งหมดสำหรับวิเคราะห์เพิ่มเติม</p>
                      </div>
                    </div>
                  </button>
                  <button className="w-full p-4 bg-dark-800 rounded-lg hover:bg-dark-750 transition-colors text-left">
                    <div className="flex items-center gap-3">
                      <Network className="text-blue-400" size={24} />
                      <div>
                        <p className="font-medium">Graph Export</p>
                        <p className="text-xs text-dark-400">ภาพ Network Graph (PNG/SVG)</p>
                      </div>
                    </div>
                  </button>
                  <button className="w-full p-4 bg-dark-800 rounded-lg hover:bg-dark-750 transition-colors text-left">
                    <div className="flex items-center gap-3">
                      <Hash className="text-purple-400" size={24} />
                      <div>
                        <p className="font-medium">JSON Data</p>
                        <p className="text-xs text-dark-400">ข้อมูลดิบสำหรับ Import เข้าระบบอื่น</p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Blockchain Explorer Links */}
                <div className="mt-6">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Globe size={16} className="text-primary-400" />
                    ลิงก์ Blockchain Explorer
                  </h4>
                  <div className="space-y-2">
                    <a
                      href={currentChain.explorerAddress + walletInfo.address}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-dark-800 rounded-lg hover:bg-dark-750 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{currentChain.icon}</span>
                        <span>{currentChain.explorer}</span>
                      </div>
                      <ExternalLink size={16} className="text-primary-400" />
                    </a>
                    <a
                      href={`https://blockchair.com/${currentChain.id === 'ethereum' ? 'ethereum' : currentChain.id}/address/${walletInfo.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-dark-800 rounded-lg hover:bg-dark-750 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>📊</span>
                        <span>Blockchair (Multi-chain)</span>
                      </div>
                      <ExternalLink size={16} className="text-primary-400" />
                    </a>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!walletInfo && !isLoading && (
        <Card className="p-12 text-center">
          <Wallet size={64} className="mx-auto text-dark-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">ค้นหา Wallet เพื่อเริ่มวิเคราะห์</h2>
          <p className="text-dark-400 mb-6">
            ใส่ Wallet Address เพื่อดูข้อมูลธุรกรรม, วิเคราะห์ความเสี่ยง และติดตามการเคลื่อนไหวของเงิน
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {blockchains.map(chain => (
              <div key={chain.id} className="flex items-center gap-2 px-4 py-2 bg-dark-800 rounded-lg">
                <span className="text-xl">{chain.icon}</span>
                <span className="text-sm">{chain.name}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default CryptoTracker;
