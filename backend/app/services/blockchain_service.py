"""
Blockchain Service Abstraction Layer
=====================================
Provides unified interface for blockchain data providers.
Designed to support multiple providers:
- Free APIs (Etherscan, Blockchair, Tronscan)
- Chainalysis (Sanctions Screening - FREE, KYT/Reactor - PAID)
- Future providers (Elliptic, CipherTrace, etc.)

Author: InvestiGate
Version: 1.0.0
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from enum import Enum
import httpx
import asyncio
import os
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


# ==================== DATA CLASSES ====================

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
    UNKNOWN = "unknown"


@dataclass
class WalletInfo:
    """Wallet information from blockchain"""
    address: str
    blockchain: str
    balance: float = 0.0
    balance_usd: float = 0.0
    total_received: float = 0.0
    total_sent: float = 0.0
    tx_count: int = 0
    first_tx_date: Optional[str] = None
    last_tx_date: Optional[str] = None
    is_contract: bool = False
    labels: List[str] = field(default_factory=list)
    risk_score: int = 0
    risk_level: RiskLevel = RiskLevel.UNKNOWN
    provider: str = "unknown"


@dataclass
class TransactionInfo:
    """Transaction information from blockchain"""
    tx_hash: str
    blockchain: str
    block_number: Optional[int] = None
    timestamp: Optional[str] = None
    from_address: str = ""
    to_address: str = ""
    amount: float = 0.0
    amount_usd: float = 0.0
    fee: float = 0.0
    status: str = "success"
    is_contract_interaction: bool = False
    method_name: Optional[str] = None
    provider: str = "unknown"


@dataclass
class RiskFactor:
    """Risk factor detected by analysis"""
    type: str
    severity: str
    description: str
    score: int = 0


@dataclass
class ScreeningResult:
    """Sanctions/Risk screening result"""
    address: str
    blockchain: str
    is_sanctioned: bool = False
    sanction_source: Optional[str] = None  # e.g., "OFAC"
    risk_level: RiskLevel = RiskLevel.UNKNOWN
    risk_score: int = 0
    risk_factors: List[RiskFactor] = field(default_factory=list)
    labels: List[str] = field(default_factory=list)  # e.g., ["Exchange", "Mixer", "Darknet"]
    provider: str = "unknown"
    raw_response: Optional[Dict] = None


# ==================== ABSTRACT PROVIDER ====================

class BlockchainProvider(ABC):
    """Abstract base class for blockchain data providers"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.name = "BaseProvider"
        self._rate_limit_delay = 0.5  # seconds between requests
        self._last_request_time = 0
    
    async def _rate_limit(self):
        """Enforce rate limiting between requests"""
        import time
        now = time.time()
        elapsed = now - self._last_request_time
        if elapsed < self._rate_limit_delay:
            await asyncio.sleep(self._rate_limit_delay - elapsed)
        self._last_request_time = time.time()
    
    @abstractmethod
    async def get_wallet_info(self, address: str, blockchain: str) -> Optional[WalletInfo]:
        """Get wallet information"""
        pass
    
    @abstractmethod
    async def get_transactions(self, address: str, blockchain: str, limit: int = 100) -> List[TransactionInfo]:
        """Get transactions for a wallet"""
        pass
    
    @abstractmethod
    async def screen_address(self, address: str, blockchain: str) -> Optional[ScreeningResult]:
        """Screen address for sanctions/risk"""
        pass
    
    @abstractmethod
    def is_available(self) -> bool:
        """Check if provider is configured and available"""
        pass


# ==================== FREE API PROVIDER ====================

class FreeApiProvider(BlockchainProvider):
    """Provider using free blockchain APIs (Etherscan, Blockchair, etc.)"""
    
    def __init__(self):
        super().__init__()
        self.name = "FreeAPI"
        self.etherscan_key = os.getenv("ETHERSCAN_API_KEY", "")
        self.blockchair_key = os.getenv("BLOCKCHAIR_API_KEY", "")
        self._rate_limit_delay = 0.3  # 300ms for free APIs
        
        # Known entity labels
        self.known_entities = {
            # Exchanges
            "0x28c6c06298d514db089934071355e5743bf21d60": ("Binance Hot Wallet", "exchange"),
            "0x21a31ee1afc51d94c2efccaa2092ad1028285549": ("Binance", "exchange"),
            "0xdfd5293d8e347dfe59e90efd55b2956a1343963d": ("Binance", "exchange"),
            "0x974caa59e49682cda0ad2bbe82983419a2ecc400": ("Bitkub Hot Wallet", "exchange"),
            # Mixers (HIGH RISK)
            "0x8589427373d6d84e98730d7795d8f6f8731fda16": ("Tornado Cash", "mixer"),
            "0x722122df12d4e14e13ac3b6895a86e84145b6967": ("Tornado Cash Router", "mixer"),
            "0xd90e2f925da726b50c4ed8d0fb90ad053324f31b": ("Tornado Cash", "mixer"),
            # DeFi
            "0x7a250d5630b4cf539739df2c5dacb4c659f2488d": ("Uniswap V2 Router", "defi"),
            "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45": ("Uniswap V3 Router", "defi"),
        }
    
    def is_available(self) -> bool:
        return True  # Always available (with rate limits)
    
    async def get_wallet_info(self, address: str, blockchain: str) -> Optional[WalletInfo]:
        """Get wallet info from free APIs"""
        await self._rate_limit()
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                if blockchain == "ethereum":
                    return await self._get_ethereum_wallet(client, address)
                elif blockchain == "bitcoin":
                    return await self._get_bitcoin_wallet(client, address)
                elif blockchain == "tron":
                    return await self._get_tron_wallet(client, address)
                else:
                    # Default: return basic info
                    return WalletInfo(
                        address=address,
                        blockchain=blockchain,
                        provider=self.name
                    )
        except Exception as e:
            logger.error(f"FreeAPI get_wallet_info error: {e}")
            return None
    
    async def _get_ethereum_wallet(self, client: httpx.AsyncClient, address: str) -> Optional[WalletInfo]:
        """Get Ethereum wallet info from Etherscan"""
        if not self.etherscan_key:
            return None
        
        # Get balance
        url = f"https://api.etherscan.io/api?module=account&action=balance&address={address}&tag=latest&apikey={self.etherscan_key}"
        response = await client.get(url)
        
        if response.status_code != 200:
            return None
        
        data = response.json()
        if data.get("status") != "1":
            return None
        
        balance_wei = int(data.get("result", 0))
        balance = balance_wei / 1e18
        
        # Get tx count
        tx_url = f"https://api.etherscan.io/api?module=account&action=txlist&address={address}&startblock=0&endblock=99999999&page=1&offset=1&sort=asc&apikey={self.etherscan_key}"
        tx_response = await client.get(tx_url)
        tx_count = 0
        first_tx = None
        
        if tx_response.status_code == 200:
            tx_data = tx_response.json()
            if tx_data.get("status") == "1" and tx_data.get("result"):
                first_tx = tx_data["result"][0].get("timeStamp")
        
        # Check known entity
        labels = []
        entity = self.known_entities.get(address.lower())
        if entity:
            labels.append(entity[0])
        
        return WalletInfo(
            address=address,
            blockchain="ethereum",
            balance=balance,
            balance_usd=balance * 3000,  # Approximate
            tx_count=tx_count,
            first_tx_date=datetime.fromtimestamp(int(first_tx)).isoformat() if first_tx else None,
            labels=labels,
            provider=self.name
        )
    
    async def _get_bitcoin_wallet(self, client: httpx.AsyncClient, address: str) -> Optional[WalletInfo]:
        """Get Bitcoin wallet info from Blockchair"""
        url = f"https://api.blockchair.com/bitcoin/dashboards/address/{address}"
        if self.blockchair_key:
            url += f"?key={self.blockchair_key}"
        
        response = await client.get(url)
        if response.status_code != 200:
            return None
        
        data = response.json()
        addr_data = data.get("data", {}).get(address, {}).get("address", {})
        
        return WalletInfo(
            address=address,
            blockchain="bitcoin",
            balance=addr_data.get("balance", 0) / 1e8,
            balance_usd=addr_data.get("balance_usd", 0),
            total_received=addr_data.get("received", 0) / 1e8,
            total_sent=addr_data.get("spent", 0) / 1e8,
            tx_count=addr_data.get("transaction_count", 0),
            first_tx_date=addr_data.get("first_seen_receiving"),
            last_tx_date=addr_data.get("last_seen_receiving"),
            provider=self.name
        )
    
    async def _get_tron_wallet(self, client: httpx.AsyncClient, address: str) -> Optional[WalletInfo]:
        """Get TRON wallet info from Tronscan"""
        url = f"https://apilist.tronscanapi.com/api/accountv2?address={address}"
        
        response = await client.get(url)
        if response.status_code != 200:
            return None
        
        data = response.json()
        
        return WalletInfo(
            address=address,
            blockchain="tron",
            balance=data.get("balance", 0) / 1e6,
            tx_count=data.get("transactions", 0),
            provider=self.name
        )
    
    async def get_transactions(self, address: str, blockchain: str, limit: int = 100) -> List[TransactionInfo]:
        """Get transactions - placeholder for now"""
        return []
    
    async def screen_address(self, address: str, blockchain: str) -> Optional[ScreeningResult]:
        """Basic screening using known entities"""
        entity = self.known_entities.get(address.lower())
        
        risk_factors = []
        labels = []
        risk_score = 0
        is_sanctioned = False
        
        if entity:
            labels.append(entity[0])
            entity_type = entity[1]
            
            if entity_type == "mixer":
                is_sanctioned = True  # Tornado Cash is sanctioned by OFAC
                risk_score = 100
                risk_factors.append(RiskFactor(
                    type="mixer",
                    severity="critical",
                    description=f"Address associated with {entity[0]} - OFAC Sanctioned",
                    score=100
                ))
            elif entity_type == "exchange":
                risk_score = 10
        
        return ScreeningResult(
            address=address,
            blockchain=blockchain,
            is_sanctioned=is_sanctioned,
            sanction_source="OFAC" if is_sanctioned else None,
            risk_level=RiskLevel.CRITICAL if risk_score >= 80 else RiskLevel.HIGH if risk_score >= 60 else RiskLevel.MEDIUM if risk_score >= 40 else RiskLevel.LOW,
            risk_score=risk_score,
            risk_factors=risk_factors,
            labels=labels,
            provider=self.name
        )


# ==================== CHAINALYSIS PROVIDER ====================

class ChainalysisProvider(BlockchainProvider):
    """
    Chainalysis API Provider
    
    Products:
    - Sanctions Screening API (FREE) - Check OFAC sanctions
    - KYT API (PAID) - Know Your Transaction
    - Reactor API (PAID) - Investigation tool
    
    To get API key: https://www.chainalysis.com/free-cryptocurrency-sanctions-screening-tools/
    """
    
    def __init__(self):
        super().__init__()
        self.name = "Chainalysis"
        self.sanctions_api_key = os.getenv("CHAINALYSIS_SANCTIONS_API_KEY", "")
        self.kyt_api_key = os.getenv("CHAINALYSIS_KYT_API_KEY", "")
        self._rate_limit_delay = 0.1  # Chainalysis allows 5000 req/5min
        
        # API endpoints
        self.sanctions_url = "https://public.chainalysis.com/api/v1/address"
        self.kyt_url = "https://api.chainalysis.com/api/kyt/v2"
    
    def is_available(self) -> bool:
        """Check if Chainalysis is configured"""
        return bool(self.sanctions_api_key) or bool(self.kyt_api_key)
    
    def is_sanctions_available(self) -> bool:
        """Check if Sanctions Screening API is available (FREE)"""
        return bool(self.sanctions_api_key)
    
    def is_kyt_available(self) -> bool:
        """Check if KYT API is available (PAID)"""
        return bool(self.kyt_api_key)
    
    async def get_wallet_info(self, address: str, blockchain: str) -> Optional[WalletInfo]:
        """
        Get wallet info - requires KYT API (PAID)
        Falls back to screening result if only sanctions API available
        """
        if not self.is_kyt_available():
            # If only sanctions API, return basic info with screening
            screening = await self.screen_address(address, blockchain)
            if screening:
                return WalletInfo(
                    address=address,
                    blockchain=blockchain,
                    labels=screening.labels,
                    risk_score=screening.risk_score,
                    risk_level=screening.risk_level,
                    provider=self.name
                )
            return None
        
        # TODO: Implement KYT API call when license is available
        # This requires a paid Chainalysis KYT license
        logger.info("Chainalysis KYT API call - requires paid license")
        return None
    
    async def get_transactions(self, address: str, blockchain: str, limit: int = 100) -> List[TransactionInfo]:
        """
        Get transactions - requires KYT API (PAID)
        """
        if not self.is_kyt_available():
            return []
        
        # TODO: Implement KYT API transaction fetch
        logger.info("Chainalysis KYT transactions - requires paid license")
        return []
    
    async def screen_address(self, address: str, blockchain: str) -> Optional[ScreeningResult]:
        """
        Screen address for sanctions using FREE Sanctions Screening API
        
        API Docs: https://auth-developers.chainalysis.com/sanctions-screening/api-reference/api-overview
        """
        if not self.is_sanctions_available():
            return None
        
        await self._rate_limit()
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Map blockchain to Chainalysis format
                chain_map = {
                    "ethereum": "ETH",
                    "bitcoin": "BTC",
                    "tron": "TRX",
                    "bsc": "BSC",
                    "polygon": "MATIC"
                }
                chain_code = chain_map.get(blockchain, blockchain.upper())
                
                # Call Chainalysis Sanctions API
                headers = {
                    "X-API-Key": self.sanctions_api_key,
                    "Accept": "application/json"
                }
                
                url = f"{self.sanctions_url}/{address}"
                response = await client.get(url, headers=headers)
                
                if response.status_code == 404:
                    # Address not found in sanctions list = clean
                    return ScreeningResult(
                        address=address,
                        blockchain=blockchain,
                        is_sanctioned=False,
                        risk_level=RiskLevel.LOW,
                        risk_score=0,
                        provider=self.name
                    )
                
                if response.status_code != 200:
                    logger.error(f"Chainalysis API error: {response.status_code}")
                    return None
                
                data = response.json()
                
                # Parse response
                identifications = data.get("identifications", [])
                is_sanctioned = len(identifications) > 0
                
                risk_factors = []
                labels = []
                
                for ident in identifications:
                    category = ident.get("category", "Unknown")
                    name = ident.get("name", "Unknown Entity")
                    description = ident.get("description", "")
                    
                    labels.append(f"{name} ({category})")
                    risk_factors.append(RiskFactor(
                        type="sanctions",
                        severity="critical",
                        description=f"OFAC Sanctioned: {name} - {description}",
                        score=100
                    ))
                
                return ScreeningResult(
                    address=address,
                    blockchain=blockchain,
                    is_sanctioned=is_sanctioned,
                    sanction_source="OFAC" if is_sanctioned else None,
                    risk_level=RiskLevel.CRITICAL if is_sanctioned else RiskLevel.LOW,
                    risk_score=100 if is_sanctioned else 0,
                    risk_factors=risk_factors,
                    labels=labels,
                    provider=self.name,
                    raw_response=data
                )
                
        except Exception as e:
            logger.error(f"Chainalysis screening error: {e}")
            return None


# ==================== SERVICE FACTORY ====================

class BlockchainServiceFactory:
    """
    Factory to get appropriate blockchain provider
    
    Priority:
    1. Chainalysis (if configured)
    2. Free APIs (always available)
    """
    
    _chainalysis: Optional[ChainalysisProvider] = None
    _free_api: Optional[FreeApiProvider] = None
    
    @classmethod
    def get_provider(cls, prefer_chainalysis: bool = True) -> BlockchainProvider:
        """Get the best available provider"""
        if prefer_chainalysis:
            chainalysis = cls.get_chainalysis()
            if chainalysis.is_available():
                return chainalysis
        
        return cls.get_free_api()
    
    @classmethod
    def get_chainalysis(cls) -> ChainalysisProvider:
        """Get Chainalysis provider (singleton)"""
        if cls._chainalysis is None:
            cls._chainalysis = ChainalysisProvider()
        return cls._chainalysis
    
    @classmethod
    def get_free_api(cls) -> FreeApiProvider:
        """Get Free API provider (singleton)"""
        if cls._free_api is None:
            cls._free_api = FreeApiProvider()
        return cls._free_api
    
    @classmethod
    async def screen_address(cls, address: str, blockchain: str) -> Optional[ScreeningResult]:
        """
        Screen address using best available provider
        Tries Chainalysis first, falls back to Free API
        """
        # Try Chainalysis first (more accurate)
        chainalysis = cls.get_chainalysis()
        if chainalysis.is_sanctions_available():
            result = await chainalysis.screen_address(address, blockchain)
            if result:
                return result
        
        # Fallback to free API (basic known entities)
        free_api = cls.get_free_api()
        return await free_api.screen_address(address, blockchain)
    
    @classmethod
    async def get_wallet_info(cls, address: str, blockchain: str) -> Optional[WalletInfo]:
        """Get wallet info using best available provider"""
        # Try Chainalysis KYT first (if available)
        chainalysis = cls.get_chainalysis()
        if chainalysis.is_kyt_available():
            result = await chainalysis.get_wallet_info(address, blockchain)
            if result:
                return result
        
        # Fallback to free API
        free_api = cls.get_free_api()
        return await free_api.get_wallet_info(address, blockchain)
    
    @classmethod
    def get_status(cls) -> Dict[str, Any]:
        """Get status of all providers"""
        chainalysis = cls.get_chainalysis()
        
        return {
            "providers": {
                "chainalysis": {
                    "available": chainalysis.is_available(),
                    "sanctions_api": chainalysis.is_sanctions_available(),
                    "kyt_api": chainalysis.is_kyt_available(),
                },
                "free_api": {
                    "available": True,
                    "etherscan": bool(os.getenv("ETHERSCAN_API_KEY")),
                    "blockchair": bool(os.getenv("BLOCKCHAIR_API_KEY")),
                }
            },
            "recommended_action": (
                "All set! Chainalysis available." if chainalysis.is_available()
                else "Consider adding CHAINALYSIS_SANCTIONS_API_KEY for enhanced screening (FREE)"
            )
        }
