import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const BalanceContext = createContext({
  balance: 0,
  loading: false,
  refresh: async () => {},
  redeem:  async () => ({ ok: false }),
  spend:   async () => ({ ok: false }),
});

export function BalanceProvider({ children }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) { setBalance(0); return; }
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', user.id)
      .maybeSingle();
    setBalance(data?.balance ?? 0);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // Redeem a single-use gift card code. Returns { ok, amount?, error? }.
  const redeem = useCallback(async (code) => {
    if (!code || !code.trim()) return { ok: false, error: 'missing_code' };
    const { data, error } = await supabase.rpc('redeem_gift_card', { p_code: code.trim().toUpperCase() });
    if (error) return { ok: false, error: error.message };
    const row = Array.isArray(data) ? data[0] : data;
    setBalance(row?.new_balance ?? 0);
    return { ok: true, amount: row?.redeemed_amount ?? 0, newBalance: row?.new_balance ?? 0 };
  }, []);

  // Spend kr from the user's balance. Server enforces non-negative balance.
  const spend = useCallback(async (amount, ref) => {
    if (!user) return { ok: false, error: 'not_authenticated' };
    if (!amount || amount <= 0) return { ok: false, error: 'invalid_amount' };
    const { data, error } = await supabase.rpc('spend_balance', { p_amount: amount, p_ref: ref ?? null });
    if (error) return { ok: false, error: error.message };
    setBalance(data ?? 0);
    return { ok: true, newBalance: data ?? 0 };
  }, [user]);

  // Refund — direct credit back to balance. Used to roll back a failed spend.
  const refund = useCallback(async (amount, ref) => {
    if (!user || !amount || amount <= 0) return { ok: false };
    await supabase.from('profiles').update({ balance: balance + amount }).eq('id', user.id);
    await supabase.from('wallet_transactions').insert({
      user_id: user.id, amount, kind: 'refund', ref: ref ?? null,
    });
    setBalance(b => b + amount);
    return { ok: true };
  }, [user, balance]);

  return (
    <BalanceContext.Provider value={{ balance, loading, refresh, redeem, spend, refund }}>
      {children}
    </BalanceContext.Provider>
  );
}

export const useBalance = () => useContext(BalanceContext);
