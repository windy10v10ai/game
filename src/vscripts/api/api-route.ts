export type ApiTarget = 'local' | 'direct' | 'cn-proxy';
export type ApiTargetPreference = ApiTarget | 'auto';

const baseUrls: Record<ApiTarget, string> = {
  local: 'http://localhost:3001/api',
  direct: 'https://api.windy10v10ai.com/api',
  'cn-proxy': 'https://43.135.77.42/api',
};

export class ApiRoute {
  private static target: ApiTarget = 'direct';
  private static locked = false;

  public static GetTarget(): ApiTarget {
    return this.target;
  }

  public static SetTarget(target: ApiTarget): void {
    this.target = target;
  }

  /** Fixes the target for the whole match, used when a developer forces a route. */
  public static LockTarget(target: ApiTarget): void {
    this.target = target;
    this.locked = true;
  }

  /** The other remote line for a retry, or the same target when there is nothing to switch to. */
  public static GetRetryTarget(current: ApiTarget): ApiTarget {
    if (this.locked || current === 'local') return current;
    return current === 'direct' ? 'cn-proxy' : 'direct';
  }

  /** Makes the line that just answered the current one, so later requests start on it. */
  public static AdoptTarget(target: ApiTarget): void {
    if (this.locked || target === 'local') return;
    this.target = target;
  }

  public static GetBaseUrl(target = this.target): string {
    return baseUrls[target];
  }

  public static IsProxyCountry(country: string | undefined): boolean {
    return country === 'CN';
  }

  public static ChooseTarget(
    directProbeAvailable: boolean,
    directCountry: string | undefined,
    cnProxyAvailable: boolean,
  ): ApiTarget {
    if (directProbeAvailable && !this.IsProxyCountry(directCountry)) {
      return 'direct';
    }
    if (cnProxyAvailable) {
      return 'cn-proxy';
    }
    return 'direct';
  }
}
