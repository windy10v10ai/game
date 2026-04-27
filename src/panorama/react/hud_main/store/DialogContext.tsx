import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

interface DialogEntry {
  id: number;
  node: ReactNode;
}

interface DialogContextValue {
  /** 打开一个对话框，返回该对话框的 id（可用于精准 close）。 */
  pushDialog: (node: ReactNode) => number;
  /** 关闭最顶部对话框。 */
  popDialog: () => void;
  /** 关闭指定 id 的对话框。 */
  closeDialog: (id: number) => void;
  /** 关闭所有对话框。 */
  clearDialogs: () => void;
  /** 当前对话框栈。一般业务代码不需要直接读，由 DialogStack 渲染。 */
  dialogs: DialogEntry[];
}

const DialogContext = createContext<DialogContextValue | null>(null);

let nextId = 1;

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialogs, setDialogs] = useState<DialogEntry[]>([]);

  const pushDialog = useCallback((node: ReactNode) => {
    const id = nextId++;
    setDialogs((prev) => [...prev, { id, node }]);
    return id;
  }, []);

  const popDialog = useCallback(() => {
    setDialogs((prev) => prev.slice(0, -1));
  }, []);

  const closeDialog = useCallback((id: number) => {
    setDialogs((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const clearDialogs = useCallback(() => {
    setDialogs([]);
  }, []);

  const value = useMemo(
    () => ({ pushDialog, popDialog, closeDialog, clearDialogs, dialogs }),
    [pushDialog, popDialog, closeDialog, clearDialogs, dialogs],
  );

  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
}

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error('useDialog must be used inside <DialogProvider>');
  }
  return ctx;
}

/**
 * 渲染当前对话框栈。挂在 HudMain 顶层。
 * 每个对话框包一层 modal-backdrop，最上面那层吃住交互。
 */
export function DialogStack() {
  const { dialogs } = useDialog();
  if (dialogs.length === 0) return null;

  return (
    <React.Fragment>
      {dialogs.map((d) => (
        <Panel key={d.id} className="modal-backdrop">
          {d.node}
        </Panel>
      ))}
    </React.Fragment>
  );
}
