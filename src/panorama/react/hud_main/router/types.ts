// hud_main 路由可达的页面 ID。
// 新增页面时在此追加，并在 PageRouter.tsx 中实现对应 Page 组件。
export type PageId = 'profile' | 'shop' | 'leaderboard';

export interface PageHistoryEntry {
  page: PageId;
  param?: string;
}
