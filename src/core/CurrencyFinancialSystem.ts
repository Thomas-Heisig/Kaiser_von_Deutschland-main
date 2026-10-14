/**
 * Currency and Financial System
 * 
 * Manages monetary evolution, banking, and financial markets:
 * - Historical currency systems (coin minting to cryptocurrency)
 * - Banking and stock exchange mechanics
 * - Financial crises and economic bubbles
 * - Inflation/deflation (extends existing EconomicSystemsManager)
 * 
 * Integrates with:
 * - Economic system for trade and commerce
 * - Technology system for financial innovations
 * - Policy system for monetary policy
 * 
 * Scalability:
 * - Financial transactions aggregated at market level
 * - Stock prices use efficient time-series data
 * - Crisis effects propagate through economic cohorts
 */

/**
 * Historical currency type
 */
export interface Currency {
  /** Unique ID */
  id: string;
  /** Currency name */
  name: string;
  /** Symbol */
  symbol: string;
  /** Period of use */
  period: {
    start: number;
    end: number | null;
  };
  /** Base value (relative to gold standard) */
  baseValue: number;
  /** Material (for coins) */
  material: string | null;
  /** Issuing authority */
  issuingAuthority: string;
  /** Acceptance regions */
  acceptedRegions: string[];
  /** Inflation rate (annual %) */
  inflationRate: number;
  /** Is fiat currency? */
  isFiat: boolean;
}

/**
 * Banking institution
 */
export interface Bank {
  /** Bank ID */
  id: string;
  /** Bank name */
  name: string;
  /** Founded year */
  foundedYear: number;
  /** Location */
  location: string;
  /** Bank type */
  type: 'central' | 'commercial' | 'investment' | 'savings';
  /** Total assets */
  assets: number;
  /** Interest rate offered */
  interestRate: number;
  /** Loan capacity */
  loanCapacity: number;
  /** Solvency (0-100) */
  solvency: number;
  /** Historical importance */
  isHistorical: boolean;
}

/**
 * Stock exchange
 */
export interface StockExchange {
  /** Exchange ID */
  id: string;
  /** Exchange name */
  name: string;
  /** Founded year */
  foundedYear: number;
  /** Location */
  location: string;
  /** Market capitalization */
  marketCap: number;
  /** Number of listed companies */
  listedCompanies: number;
  /** Trading volume */
  tradingVolume: number;
  /** Stock index value */
  indexValue: number;
  /** Volatility (0-100) */
  volatility: number;
}

/**
 * Financial crisis event
 */
export interface FinancialCrisis {
  /** Crisis ID */
  id: string;
  /** Crisis name */
  name: string;
  /** Type */
  type: 'banking' | 'currency' | 'debt' | 'speculative_bubble' | 'sovereign_debt';
  /** Year started */
  yearStarted: number;
  /** Duration (years) */
  duration: number;
  /** Severity (0-100) */
  severity: number;
  /** Causes */
  causes: string[];
  /** Economic impact */
  economicImpact: {
    gdpDecline: number;
    unemploymentIncrease: number;
    bankruptcies: number;
    wealthDestruction: number;
  };
  /** Recovery measures */
  recoveryMeasures: string[];
  /** Historical status */
  isHistorical: boolean;
}

/**
 * Cryptocurrency (from 2009)
 */
export interface Cryptocurrency {
  /** Crypto ID */
  id: string;
  /** Name */
  name: string;
  /** Symbol */
  symbol: string;
  /** Launch year */
  launchYear: number;
  /** Technology */
  technology: 'blockchain' | 'dag' | 'other';
  /** Market cap */
  marketCap: number;
  /** Price (in gold) */
  price: number;
  /** Volatility (0-100) */
  volatility: number;
  /** Adoption rate (%) */
  adoptionRate: number;
  /** Is decentralized? */
  isDecentralized: boolean;
}

/**
 * Currency and Financial System class
 */
export class CurrencyFinancialSystem {
  private currencies: Map<string, Currency> = new Map();
  private banks: Map<string, Bank> = new Map();
  private stockExchanges: Map<string, StockExchange> = new Map();
  private cryptocurrencies: Map<string, Cryptocurrency> = new Map();
  private financialCrises: Map<string, FinancialCrisis> = new Map();
  private activeCrisis: FinancialCrisis | null = null;

  /**
   * Initialize the currency financial system
   */
  async initialize(): Promise<void> {
    try {
      const response = await fetch('/src/data/json/currency-financial-system.json');
      const data = await response.json();

      // Load currencies
      data.currencies.forEach((currency: Currency) => {
        this.currencies.set(currency.id, currency);
      });

      // Load banks
      if (data.banks) {
        data.banks.forEach((bank: Bank) => {
          this.banks.set(bank.id, bank);
        });
      }

      // Load stock exchanges
      if (data.stockExchanges) {
        data.stockExchanges.forEach((exchange: StockExchange) => {
          this.stockExchanges.set(exchange.id, exchange);
        });
      }

      // Load cryptocurrencies
      if (data.cryptocurrencies) {
        data.cryptocurrencies.forEach((crypto: Cryptocurrency) => {
          this.cryptocurrencies.set(crypto.id, crypto);
        });
      }

      // Load financial crises
      if (data.financialCrises) {
        data.financialCrises.forEach((crisis: FinancialCrisis) => {
          this.financialCrises.set(crisis.id, crisis);
        });
      }

      console.log(`Currency Financial System initialized: ${this.currencies.size} currencies, ${this.banks.size} banks, ${this.stockExchanges.size} exchanges`);
    } catch (error) {
      console.error('Failed to load currency financial data:', error);
    }
  }

  /**
   * Update financial system for current year
   */
  update(year: number, deltaTime: number): void {
    // Update current currency
    this.updateCurrentCurrency(year);

    // Update banks
    this.updateBanks(year, deltaTime);

    // Update stock exchanges
    this.updateStockExchanges(year, deltaTime);

    // Update cryptocurrencies
    if (year >= 2009) {
      this.updateCryptocurrencies(year, deltaTime);
    }

    // Check for financial crises
    this.checkFinancialCrises(year);

    // Update active crisis
    if (this.activeCrisis) {
      this.updateActiveCrisis(year);
    }
  }

  /**
   * Get current currency for the year
   */
  getCurrentCurrency(year: number): Currency | null {
    for (const currency of this.currencies.values()) {
      if (currency.period.start <= year && (currency.period.end === null || currency.period.end >= year)) {
        return currency;
      }
    }
    return null;
  }

  /**
   * Get all currencies
   */
  getAllCurrencies(): Currency[] {
    return Array.from(this.currencies.values());
  }

  /**
   * Get active banks for the year
   */
  getActiveBanks(year: number): Bank[] {
    return Array.from(this.banks.values()).filter(bank => {
      return bank.foundedYear <= year;
    });
  }

  /**
   * Get active stock exchanges
   */
  getActiveStockExchanges(year: number): StockExchange[] {
    return Array.from(this.stockExchanges.values()).filter(exchange => {
      return exchange.foundedYear <= year;
    });
  }

  /**
   * Get active cryptocurrencies
   */
  getActiveCryptocurrencies(year: number): Cryptocurrency[] {
    if (year < 2009) return [];
    return Array.from(this.cryptocurrencies.values()).filter(crypto => {
      return crypto.launchYear <= year;
    });
  }

  /**
   * Get financial crisis history
   */
  getHistoricalCrises(): FinancialCrisis[] {
    return Array.from(this.financialCrises.values());
  }

  /**
   * Get active financial crisis
   */
  getActiveCrisis(): FinancialCrisis | null {
    return this.activeCrisis;
  }

  /**
   * Create a new bank
   */
  createBank(
    name: string,
    location: string,
    year: number,
    type: Bank['type']
  ): Bank {
    const bank: Bank = {
      id: `bank_${Date.now()}_${Math.random()}`,
      name,
      foundedYear: year,
      location,
      type,
      assets: type === 'central' ? 1000000 : 100000,
      interestRate: 5,
      loanCapacity: type === 'central' ? 500000 : 50000,
      solvency: 100,
      isHistorical: false
    };

    this.banks.set(bank.id, bank);
    return bank;
  }

  /**
   * Create a stock exchange
   */
  createStockExchange(
    name: string,
    location: string,
    year: number
  ): StockExchange {
    const exchange: StockExchange = {
      id: `exchange_${Date.now()}_${Math.random()}`,
      name,
      foundedYear: year,
      location,
      marketCap: 1000000,
      listedCompanies: 10,
      tradingVolume: 10000,
      indexValue: 1000,
      volatility: 20
    };

    this.stockExchanges.set(exchange.id, exchange);
    return exchange;
  }

  /**
   * Trigger a financial crisis
   */
  triggerCrisis(type: FinancialCrisis['type'], severity: number, year: number): FinancialCrisis {
    const crisis: FinancialCrisis = {
      id: `crisis_${Date.now()}_${Math.random()}`,
      name: `${type} Crisis ${year}`,
      type,
      yearStarted: year,
      duration: Math.ceil(severity / 20) + 1,
      severity,
      causes: [],
      economicImpact: {
        gdpDecline: severity * 0.5,
        unemploymentIncrease: severity * 0.3,
        bankruptcies: Math.floor(severity * 10),
        wealthDestruction: severity * 1000000
      },
      recoveryMeasures: [],
      isHistorical: false
    };

    this.activeCrisis = crisis;
    return crisis;
  }

  /**
   * Get total banking sector assets
   */
  getBankingAssets(): number {
    let total = 0;
    for (const bank of this.banks.values()) {
      total += bank.assets;
    }
    return total;
  }

  /**
   * Get total stock market capitalization
   */
  getStockMarketCap(): number {
    let total = 0;
    for (const exchange of this.stockExchanges.values()) {
      total += exchange.marketCap;
    }
    return total;
  }

  /**
   * Get total cryptocurrency market cap
   */
  getCryptoMarketCap(): number {
    let total = 0;
    for (const crypto of this.cryptocurrencies.values()) {
      total += crypto.marketCap;
    }
    return total;
  }

  /**
   * Calculate current inflation rate
   */
  getInflationRate(year: number): number {
    const currency = this.getCurrentCurrency(year);
    if (!currency) return 0;

    let rate = currency.inflationRate;

    // Crisis impact
    if (this.activeCrisis && this.activeCrisis.type === 'currency') {
      rate += this.activeCrisis.severity * 0.5;
    }

    return rate;
  }

  /**
   * Get summary for UI display
   */
  getSummary(year: number): {
    currentCurrency: Currency | null;
    activeBanks: number;
    activeExchanges: number;
    activeCryptos: number;
    bankingAssets: number;
    stockMarketCap: number;
    cryptoMarketCap: number;
    inflationRate: number;
    activeCrisis: FinancialCrisis | null;
  } {
    return {
      currentCurrency: this.getCurrentCurrency(year),
      activeBanks: this.getActiveBanks(year).length,
      activeExchanges: this.getActiveStockExchanges(year).length,
      activeCryptos: this.getActiveCryptocurrencies(year).length,
      bankingAssets: this.getBankingAssets(),
      stockMarketCap: this.getStockMarketCap(),
      cryptoMarketCap: this.getCryptoMarketCap(),
      inflationRate: this.getInflationRate(year),
      activeCrisis: this.activeCrisis
    };
  }

  /**
   * Private: Update current currency
   */
  private updateCurrentCurrency(_year: number): void {
    // Currency is retrieved on-demand via getCurrentCurrency()
    // No persistent state needed here
  }

  /**
   * Private: Update banks
   */
  private updateBanks(_year: number, deltaTime: number): void {
    for (const bank of this.banks.values()) {
      // Update assets (grow with interest)
      bank.assets = Math.round(bank.assets * (1 + bank.interestRate / 100 * deltaTime));

      // Crisis impact
      if (this.activeCrisis && this.activeCrisis.type === 'banking') {
        bank.solvency = Math.max(0, bank.solvency - this.activeCrisis.severity * deltaTime * 0.1);
        if (bank.solvency < 20) {
          bank.assets = Math.round(bank.assets * 0.9);
        }
      } else {
        // Recovery
        bank.solvency = Math.min(100, bank.solvency + deltaTime * 2);
      }
    }
  }

  /**
   * Private: Update stock exchanges
   */
  private updateStockExchanges(_year: number, deltaTime: number): void {
    for (const exchange of this.stockExchanges.values()) {
      // Random market movements
      const randomChange = (Math.random() - 0.5) * 10 * deltaTime;
      exchange.indexValue = Math.max(100, exchange.indexValue + randomChange);

      // Crisis impact
      if (this.activeCrisis && this.activeCrisis.type === 'speculative_bubble') {
        exchange.indexValue = Math.round(exchange.indexValue * (1 - this.activeCrisis.severity * 0.01 * deltaTime));
        exchange.volatility = Math.min(100, exchange.volatility + this.activeCrisis.severity * deltaTime * 0.1);
      } else {
        // Normal growth
        exchange.marketCap = Math.round(exchange.marketCap * (1 + 0.05 * deltaTime));
        exchange.volatility = Math.max(10, exchange.volatility - deltaTime * 2);
      }
    }
  }

  /**
   * Private: Update cryptocurrencies
   */
  private updateCryptocurrencies(_year: number, deltaTime: number): void {
    for (const crypto of this.cryptocurrencies.values()) {
      // High volatility
      const randomChange = (Math.random() - 0.4) * crypto.volatility * deltaTime;
      crypto.price = Math.max(1, crypto.price * (1 + randomChange / 100));

      // Update market cap
      crypto.marketCap = Math.round(crypto.price * 1000000);

      // Gradual adoption increase
      crypto.adoptionRate = Math.min(100, crypto.adoptionRate + deltaTime * 0.5);
    }
  }

  /**
   * Private: Check for financial crises
   */
  private checkFinancialCrises(year: number): void {
    // Check if a historical crisis should trigger
    for (const crisis of this.financialCrises.values()) {
      if (crisis.isHistorical && crisis.yearStarted === year && !this.activeCrisis) {
        this.activeCrisis = crisis;
        console.log(`Financial crisis triggered: ${crisis.name}`);
      }
    }

    // Random crisis chance (low probability)
    if (!this.activeCrisis && Math.random() < 0.001) {
      const types: FinancialCrisis['type'][] = ['banking', 'currency', 'debt', 'speculative_bubble'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      const severity = Math.random() * 50 + 20;
      this.triggerCrisis(randomType, severity, year);
    }
  }

  /**
   * Private: Update active crisis
   */
  private updateActiveCrisis(year: number): void {
    if (!this.activeCrisis) return;

    // Check if crisis should end
    if (year >= this.activeCrisis.yearStarted + this.activeCrisis.duration) {
      console.log(`Financial crisis ended: ${this.activeCrisis.name}`);
      this.activeCrisis = null;
    }
  }
}
