/** 按单位登记事件处理者，供全局监听拿事件里的单位查表分发 */
export class UnitHandlerRegistry<TEvent> {
  private readonly byUnit = new Map<
    EntityIndex,
    Map<object, (this: void, event: TEvent) => void>
  >();

  /** 同一 owner 重复登记时覆盖处理函数 */
  Add(unit: EntityIndex, owner: object, handler: (this: void, event: TEvent) => void): void {
    let handlers = this.byUnit.get(unit);
    if (handlers === undefined) {
      handlers = new Map();
      this.byUnit.set(unit, handlers);
    }
    handlers.set(owner, handler);
  }

  Remove(unit: EntityIndex, owner: object): void {
    const handlers = this.byUnit.get(unit);
    if (handlers === undefined) return;
    handlers.delete(owner);
    if (handlers.size === 0) {
      this.byUnit.delete(unit);
    }
  }

  Dispatch(unit: EntityIndex, event: TEvent): void {
    const handlers = this.byUnit.get(unit);
    if (handlers === undefined) return;
    for (const handler of handlers.values()) {
      handler(event);
    }
  }

  IsEmpty(): boolean {
    return this.byUnit.size === 0;
  }
}
