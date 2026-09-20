import type { ApiTargetPreference } from './api-route';

export function GetApiTarget(): ApiTargetPreference {
  return 'auto';
}

export function GetLocalHostAPIKEY(): string {
  return '';
}

// 调试开关：Dota Tools 里服务端本来能直连，改成 true 可强制走客户端代理验证代理链路
export function GetForceProxy(): boolean {
  return false;
}
