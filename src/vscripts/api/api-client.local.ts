import type { ApiTargetPreference } from './api-route';

export function GetApiTarget(): ApiTargetPreference {
  return 'direct';
}

export function GetLocalHostAPIKEY(): string {
  return '';
}