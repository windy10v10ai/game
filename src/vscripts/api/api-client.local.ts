import type { ApiTargetPreference } from './api-route';

export function GetApiTarget(): ApiTargetPreference {
  return 'auto';
}

export function GetLocalHostAPIKEY(): string {
  return '';
}
