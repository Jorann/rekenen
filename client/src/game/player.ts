import { useMemo } from 'react';
import { itemById, owns, type PurchaseDecision } from '../../../shared/catalog.ts';
import { sanitizeLook, type Look } from '../avatar/look.ts';
import { sanitizeHome, type HomeState } from '../home/home.ts';
import type { Profile } from './ledger.ts';
import { profileStore, useProfile } from './profile.ts';

export interface Player {
  name: string;
  profile: Profile;
  look: Look;
  home: HomeState;
  /** The item she is saving for, if any. */
  goal: string | null;
  has: (itemId: string) => boolean;
  buy: (itemId: string) => PurchaseDecision;
  saveLook: (look: Look) => void;
  saveHome: (home: HomeState) => void;
  setGoal: (itemId: string | null) => void;
}

export function usePlayer(name: string): Player {
  const profile = useProfile(name);
  return useMemo(() => {
    const store = profileStore(name);
    const goalValue = profile.state.goal?.value;
    const goal = typeof goalValue === 'string' && itemById(goalValue) ? goalValue : null;
    const has = (itemId: string) => {
      const item = itemById(itemId);
      return !!item && owns(item, profile.owned);
    };
    return {
      name,
      profile,
      look: sanitizeLook(profile.state.avatar?.value, profile.owned),
      home: sanitizeHome(profile.state.home?.value, profile.owned),
      // A wish she has bought is done (buying it also clears it; this covers a purchase made elsewhere).
      goal: goal && !(has(goal) && !itemById(goal)!.stackable) ? goal : null,
      has,
      buy: (itemId) => store.buy(itemId),
      saveLook: (look) => store.setState('avatar', look),
      saveHome: (home) => store.setState('home', home),
      setGoal: (itemId) => store.setState('goal', itemId),
    };
  }, [name, profile]);
}
