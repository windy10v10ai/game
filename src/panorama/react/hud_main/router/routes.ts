import { PageId } from './types';

/**
 * 路由表的元数据：标题、是否需要在 manifest 默认隐藏等。
 * PageRouter 实际负责组件渲染；这里集中定义元信息便于外部 UI 查询。
 */
export interface PageMeta {
  id: PageId;
  title: string;
}

export const PAGE_META: Record<PageId, PageMeta> = {
  profile: { id: 'profile', title: '个人中心' },
  shop: { id: 'shop', title: '商店' },
  leaderboard: { id: 'leaderboard', title: '排行榜' },
};
