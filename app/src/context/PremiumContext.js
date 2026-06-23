import React, { createContext, useContext, useMemo, useState } from 'react';

// Lightweight in-memory premium-state context. Wire to Supabase / RevenueCat / IAP
// later — the API stays the same so callsites don't change.
const PremiumContext = createContext({
  isPremium:    false,
  setIsPremium: () => {},
  toggle:       () => {},
});

export function PremiumProvider({ children }) {
  const [isPremium, setIsPremium] = useState(false);

  const value = useMemo(() => ({
    isPremium,
    setIsPremium,
    toggle: () => setIsPremium((v) => !v),
  }), [isPremium]);

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremium() {
  return useContext(PremiumContext);
}
