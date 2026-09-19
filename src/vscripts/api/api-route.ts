export type ApiTarget = 'local' | 'direct' | 'cn-proxy';
export type ApiTargetPreference = ApiTarget | 'auto';

const baseUrls: Record<ApiTarget, string> = {
  local: 'http://localhost:3001/api',
  direct: 'https://api.windy10v10ai.com/api',
  'cn-proxy': 'https://1491237865-455d5j25yx.ap-guangzhou.tencentscf.com/api',
};

export class ApiRoute {
  private static target: ApiTarget = 'direct';

  public static GetTarget(): ApiTarget {
    return this.target;
  }

  public static SetTarget(target: ApiTarget): void {
    this.target = target;
  }

  public static GetBaseUrl(target = this.target): string {
    return baseUrls[target];
  }

  public static ChooseTarget(
    directCountry: string | undefined,
    cnProxyAvailable: boolean,
  ): ApiTarget {
    if (directCountry && directCountry !== 'CN') {
      return 'direct';
    }
    if (cnProxyAvailable) {
      return 'cn-proxy';
    }
    return 'direct';
  }
}
