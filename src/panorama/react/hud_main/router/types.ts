// HudPageId 在 src/common/events.d.ts 中作为全局类型声明。
// 这里再 re-export 一个本地别名方便业务代码引用。
export type PageId = HudPageId;

export interface PageHistoryEntry {
  page: PageId;
  param?: string;
}
