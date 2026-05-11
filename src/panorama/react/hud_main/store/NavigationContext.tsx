import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { PageId, PageHistoryEntry } from '../router/types';

interface NavigationState {
  currentPage: PageId | null;
  currentParam?: string;
  history: PageHistoryEntry[];
}

interface NavigationContextValue extends NavigationState {
  openPage: (page: PageId, param?: string) => void;
  closePage: () => void;
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NavigationState>({
    currentPage: null,
    currentParam: undefined,
    history: [],
  });

  const openPage = useCallback((page: PageId, param?: string) => {
    setState((prev) => {
      // 避免在已是同页且参数相同时重复入栈
      if (prev.currentPage === page && prev.currentParam === param) {
        return prev;
      }
      const newHistory = prev.currentPage
        ? [...prev.history, { page: prev.currentPage, param: prev.currentParam }]
        : prev.history;
      return {
        currentPage: page,
        currentParam: param,
        history: newHistory,
      };
    });
  }, []);

  const closePage = useCallback(() => {
    setState({ currentPage: null, currentParam: undefined, history: [] });
  }, []);

  const goBack = useCallback(() => {
    setState((prev) => {
      if (prev.history.length === 0) {
        return { currentPage: null, currentParam: undefined, history: [] };
      }
      const newHistory = prev.history.slice(0, -1);
      const last = prev.history[prev.history.length - 1];
      return {
        currentPage: last.page,
        currentParam: last.param,
        history: newHistory,
      };
    });
  }, []);

  useEffect(() => {
    const listener = GameEvents.Subscribe('hud_open_page', (data) => {
      const d = data as { page?: string; param?: string; playerId?: PlayerID };
      if (d.page && d.playerId === Game.GetLocalPlayerID()) {
        openPage(d.page as PageId, d.param);
      }
    });
    return () => {
      GameEvents.Unsubscribe(listener);
    };
  }, [openPage]);

  return (
    <NavigationContext.Provider
      value={{
        currentPage: state.currentPage,
        currentParam: state.currentParam,
        history: state.history,
        openPage,
        closePage,
        goBack,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error('useNavigation must be used inside <NavigationProvider>');
  }
  return ctx;
}
