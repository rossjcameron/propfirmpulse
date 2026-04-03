import React, { createContext, useContext, useMemo, useState } from 'react';
import {
    Alert,
    applyTradeToAccount,
    BestPath,
    bestPathToFunded,
    generateAlerts,
    isDailyLossSafe,
    PathStyle,
    remainingR,
} from '../services/ruleEngine';
import { Account, Trade } from '../types';

type AppContextType = {
  accounts: Account[];
  trades: Trade[];
  alerts: Alert[];
  pathStyle: PathStyle;
  setPathStyle: (style: PathStyle) => void;

  profileUsername: string;
  setProfileUsername: (username: string) => void;
  profileImageUri: string | null;
  setProfileImageUri: (uri: string | null) => void;

  addTrade: (trade: Omit<Trade, 'id' | 'createdAt'>) => void;
  addAccount: (account: Omit<Account, 'id'>) => void;
  removeAccount: (accountId: string) => void;
  getRemainingR: (account: Account) => number;
  getBestPath: (account: Account) => BestPath | null;
  canTradeSafely: (account: Account, proposedPnl: number) => boolean;
  getDayPnL: (accountId: string) => number;
  getTotalDayPnL: () => number;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function dayPnLForAccount(accountId: string, trades: Trade[]): number {
  const today = todayKey();
  return trades
    .filter(
      (t) =>
        t.accountIds.includes(accountId) &&
        t.createdAt.slice(0, 10) === today
    )
    .reduce((sum, t) => sum + t.pnl, 0);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [pathStyle, setPathStyle] = useState<PathStyle>('normal');

  const [profileUsername, setProfileUsername] = useState('Trader');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);

  const addTrade = (trade: Omit<Trade, 'id' | 'createdAt'>) => {
    const newTrade: Trade = {
      ...trade,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updatedTrades = [newTrade, ...trades];
    setTrades(updatedTrades);

    setAccounts((prev) =>
      prev.map((account) => {
        if (!trade.accountIds.includes(account.id)) return account;

        if (account.status === 'Failed' || account.status === 'Funded') {
          return account;
        }

        const update = applyTradeToAccount(account, trade.pnl, updatedTrades);

        return {
          ...account,
          ...update,
        };
      })
    );
  };

  const addAccount = (account: Omit<Account, 'id'>) => {
    const newAccount: Account = {
      ...account,
      id: Date.now().toString(),
    };
    setAccounts((prev) => [...prev, newAccount]);
  };

  const removeAccount = (accountId: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== accountId));
  };

  const alerts = useMemo(() => {
    return accounts.flatMap((account) => generateAlerts(account, trades));
  }, [accounts, trades]);

  const getRemainingR = (account: Account): number => {
    return remainingR(account);
  };

  const getBestPath = (account: Account): BestPath | null => {
    return bestPathToFunded(account, pathStyle);
  };

  const canTradeSafely = (account: Account, proposedPnl: number): boolean => {
    if (account.status === 'Failed' || account.status === 'Funded') return false;
    return isDailyLossSafe(account, trades, proposedPnl);
  };

  const getDayPnL = (accountId: string): number => {
    return dayPnLForAccount(accountId, trades);
  };

  const getTotalDayPnL = (): number => {
    return accounts.reduce(
      (sum, account) => sum + dayPnLForAccount(account.id, trades),
      0
    );
  };

  const value = useMemo(
    () => ({
      accounts,
      trades,
      alerts,
      pathStyle,
      setPathStyle,
      profileUsername,
      setProfileUsername,
      profileImageUri,
      setProfileImageUri,
      addTrade,
      addAccount,
      removeAccount,
      getRemainingR,
      getBestPath,
      canTradeSafely,
      getDayPnL,
      getTotalDayPnL,
    }),
    [accounts, trades, alerts, pathStyle, profileUsername, profileImageUri]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useApp must be used inside AppProvider');
  }

  return context;
}