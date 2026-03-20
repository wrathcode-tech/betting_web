/**
 * Bet slip state – selections, stake, place bet.
 * Use from match list or odds view to add selection, then place from slip UI.
 * Balance updates via socket (betUpdate / balance) and BalanceContext.
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import * as sportsbookApi from '../api/services/sportsbookApi';
import { useBalance } from './BalanceContext';
import { useAuth } from './AuthContext';
import { alertErrorMessage } from '../customComponents/CustomAlertMessage';

const BetSlipContext = createContext(null);

const defaultSlip = {
  selections: [],
  stake: '',
  placeError: null,
  placing: false,
  lastResult: null,
};

/**
 * One selection in the slip.
 * @typedef {{
 *   id: string,
 *   sport: string,
 *   gameId: string,
 *   eventName: string,
 *   marketType: string,
 *   marketId: string,
 *   selectionId: string,
 *   selectionName: string,
 *   betType: 'back'|'lay',
 *   odds: number
 * }} SlipSelection
 */

export function BetSlipProvider({ children }) {
  const { setBalance } = useBalance();
  const { isDemo } = useAuth();
  const [slip, setSlip] = useState(defaultSlip);
  const placingRef = useRef(false);

  const addSelection = useCallback((selection) => {
    const s = {
      id: selection.id ?? `slip-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      sport: selection.sport || 'cricket',
      gameId: selection.gameId,
      eventName: selection.eventName ?? '',
      marketType: selection.marketType || 'match_odds',
      marketId: selection.marketId ?? '',
      selectionId: selection.selectionId ?? '',
      selectionName: selection.selectionName ?? '',
      betType: selection.betType === 'lay' ? 'lay' : 'back',
      odds: Number(selection.odds) || 0,
    };
    setSlip((prev) => {
      const exists = prev.selections.some((x) => x.id === s.id);
      if (exists) return prev;
      return { ...prev, selections: [...prev.selections, s], placeError: null };
    });
  }, []);

  const removeSelection = useCallback((id) => {
    setSlip((prev) => ({
      ...prev,
      selections: prev.selections.filter((x) => x.id !== id),
      placeError: null,
    }));
  }, []);

  const setStake = useCallback((value) => {
    setSlip((prev) => ({ ...prev, stake: value, placeError: null }));
  }, []);

  const clearSlip = useCallback(() => {
    setSlip(defaultSlip);
  }, []);

  const placeBet = useCallback(async () => {
    if (isDemo) {
      const msg = 'Demo mode — sportsbook betting is disabled. Login with a real account to place bets.';
      alertErrorMessage(msg);
      setSlip((prev) => ({ ...prev, placeError: msg }));
      return { success: false, message: msg };
    }
    if (placingRef.current) return { success: false, message: 'Already placing' };
    const { selections, stake } = slip;
    const stakeNum = Number(stake);
    if (!selections.length || !Number.isFinite(stakeNum) || stakeNum <= 0) {
      setSlip((prev) => ({ ...prev, placeError: 'Add selection and enter a valid stake' }));
      return { success: false, message: 'Invalid slip' };
    }

    placingRef.current = true;
    setSlip((prev) => ({ ...prev, placing: true, placeError: null, lastResult: null }));

    try {
      const body = {
        sport: selections[0].sport,
        gameId: selections[0].gameId,
        eventName: selections[0].eventName,
        marketType: selections[0].marketType,
        marketId: selections[0].marketId,
        selectionId: selections[0].selectionId,
        selectionName: selections[0].selectionName,
        betType: selections[0].betType,
        odds: selections[0].odds,
        stake: stakeNum,
      };
      const res = await sportsbookApi.placeBet(body);
      const ok = res?.success !== false && !String(res?.message || '').toLowerCase().includes('fail');

      if (ok) {
        if (res?.balance != null) setBalance(res.balance);
        if (res?.balanceAfter != null) setBalance(res.balanceAfter);
        setSlip((prev) => ({ ...defaultSlip, lastResult: res }));
        return res;
      }

      const errorMsg = isDemo
        ? 'Demo account cannot place bets. Please login with mobile/email to continue.'
        : (res?.message || 'Insufficient balance');
      setSlip((prev) => ({
        ...prev,
        placing: false,
        placeError: errorMsg,
        lastResult: res,
      }));
      return { success: false, message: errorMsg, ...res };
    } catch (e) {
      const msg = isDemo
        ? 'Demo account cannot place bets. Please login with mobile/email to continue.'
        : (e?.message || 'Failed to place bet');
      setSlip((prev) => ({
        ...prev,
        placing: false,
        placeError: msg,
        lastResult: { success: false, message: msg },
      }));
      return { success: false, message: msg };
    } finally {
      placingRef.current = false;
    }
  }, [slip, setBalance, isDemo]);

  const value = {
    selections: slip.selections,
    stake: slip.stake,
    placeError: slip.placeError,
    placing: slip.placing,
    lastResult: slip.lastResult,
    addSelection,
    removeSelection,
    setStake,
    clearSlip,
    placeBet,
  };

  return <BetSlipContext.Provider value={value}>{children}</BetSlipContext.Provider>;
}

export function useBetSlip() {
  const ctx = useContext(BetSlipContext);
  if (!ctx) {
    return {
      selections: [],
      stake: '',
      placeError: null,
      placing: false,
      lastResult: null,
      addSelection: () => {},
      removeSelection: () => {},
      setStake: () => {},
      clearSlip: () => {},
      placeBet: async () => ({ success: false, message: 'BetSlipProvider not mounted' }),
    };
  }
  return ctx;
}
