export type AccountStatus = 'Evaluation' | 'Funded' | 'Failed';

export type RuleHealth = 'green' | 'amber' | 'red';

export interface Account {
  id: string;
  name: string;
  balance: number;
  startingBalance: number;
  profitTarget: number;
  maxDrawdown: number;
  trailingDrawdown: number;
  dailyLossLimit?: number;
  consistencyPercent?: number;
  status: AccountStatus;
  ruleHealth: RuleHealth;
  ruleHealthReason?: string;
  riskPerTrade: number;
  currentProfit: number;
}

export interface Trade {
  id: string;
  accountIds: string[];
  strategy: string;
  direction: 'Long' | 'Short';
  outcome: 'Win' | 'Loss';
  entryTime: string;
  exitTime: string;
  pnl: number;
  r: number;
  screenshotUrl?: string;
  emotionalState?: 'Calm' | 'Focused' | 'Confident' | 'Anxious' | 'FOMO' | 'Revenge';
  confidence?: 'A+' | 'High' | 'Medium' | 'Low';
  notes?: string;
  lessons?: string;
  createdAt: string;
}