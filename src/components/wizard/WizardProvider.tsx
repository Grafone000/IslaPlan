'use client';

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react';
import { isContact } from '@/domain/validation';
import {
  createWizardState,
  wizardReducer,
  type WizardAction,
  type WizardState,
} from '@/domain/wizard';
import { auth, draftStore, type Account } from '@/integrations';

interface WizardContextValue {
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
  // Set only when the account has full contact details, which is what skips the Contact step.
  account: Account | null;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function useWizard(): WizardContextValue | null {
  return useContext(WizardContext);
}

const newState = () => createWizardState(crypto.randomUUID(), new Date().toISOString());

export function WizardProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState<WizardState | null>(null);
  const [account, setAccount] = useState<Account | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    void auth.currentAccount().then((current) => {
      if (!active) return;
      setAccount(current && isContact(current) ? current : null);
      setLoaded(draftStore.load() ?? newState());
    });
    return () => {
      active = false;
    };
  }, []);

  if (!loaded || account === undefined) {
    return null;
  }
  return (
    <LoadedWizard initial={loaded} account={account}>
      {children}
    </LoadedWizard>
  );
}

function LoadedWizard({
  initial,
  account,
  children,
}: {
  initial: WizardState;
  account: Account | null;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(wizardReducer, initial);

  useEffect(() => {
    draftStore.save(state);
  }, [state]);

  return (
    <WizardContext.Provider value={{ state, dispatch, account }}>{children}</WizardContext.Provider>
  );
}
