import React, { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { PageId, PageHistoryEntry } from '../router/types';
import { useClientEvent } from '../../shared/hooks/useClientEvent';

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

  // 监听跨 entry 事件：其他 entry（如 hud_lottery）通过 SendEventClientSide 触发
  useClientEvent('hud_open_page', (data) => {
    openPage(data.page as PageId, data.param);
  });

  useClientEvent('hud_close_page', () => {
    closePage();
  });

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
