// enum http methods
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export interface ApiParameter {
  method: HttpMethod;
  path: string;
  querys?: { [key: string]: string };
  body?: object;
  successFunc: (data: string) => void;
  failureFunc?: (data: string) => void;
  retryTimes?: number;
  timeoutSeconds?: number;
}

export class ApiClient {
  public static readonly GAME_START_URL = '/game/start';
  public static readonly ADD_PLAYER_PROPERTY_URL = '/game/addPlayerProperty';
  public static readonly RESET_PLAYER_PROPERTY_URL = '/game/resetPlayerProperty';

  private static TIMEOUT_SECONDS = 10;
  private static RETRY_TIMES = 3;

  private static HOST_NAME: string = (() => {
    return IsInToolsMode() ? 'http://localhost:5000/api' : 'https://windy10v10ai.web.app/api';
  })();
  // private static HOST_NAME: string = 'https://windy10v10ai.web.app/api';

  public static LOCAL_APIKEY = 'Invalid_NotOnDedicatedServer';
  // dont change this version, it is used to identify the server
  public static GetServerAuthKey() {
    const keyVersion = 'v2';
    return GetDedicatedServerKeyV3(keyVersion);
  }

  public static IsLocalhost() {
    const apiKey = this.GetServerAuthKey();
    return apiKey === ApiClient.LOCAL_APIKEY && !IsInToolsMode();
  }

  public static async send(
    apiParameter: ApiParameter,
    callbackFunc: (result: CScriptHTTPResponse) => void,
  ) {
    const method = apiParameter.method;
    const path = apiParameter.path;
    const querys = apiParameter.querys;
    const body = apiParameter.body;
    const timeoutSeconds = apiParameter.timeoutSeconds || ApiClient.TIMEOUT_SECONDS;

    print(
      `[ApiClient] ${method} ${ApiClient.HOST_NAME}${path} with querys ${json.encode(
        querys,
      )} body ${json.encode(body)}`,
    );
    const request = CreateHTTPRequestScriptVM(method, ApiClient.HOST_NAME + path);
    const apiKey = this.GetServerAuthKey();

    // 本地主机只发送开局请求
    if (this.IsLocalhost() && path !== ApiClient.GAME_START_URL) {
      callbackFunc({
        StatusCode: 401,
        Body: ApiClient.LOCAL_APIKEY,
        Request: request,
      });
      return;
    }

    if (querys) {
      for (const key in querys) {
        request.SetHTTPRequestGetOrPostParameter(key, querys[key]);
      }
    }
    request.SetHTTPRequestNetworkActivityTimeout(timeoutSeconds);
    request.SetHTTPRequestHeaderValue('x-api-key', apiKey);
    if (body) {
      request.SetHTTPRequestRawPostBody('application/json', json.encode(body));
    }
    request.Send((result: CScriptHTTPResponse) => {
      callbackFunc(result);
    });
  }

  public static sendWithRetry(apiParameter: ApiParameter) {
    let retryCount = 0;
    const maxRetryTimes = apiParameter.retryTimes || ApiClient.RETRY_TIMES;
    const retry = () => {
      this.send(apiParameter, (result: CScriptHTTPResponse) => {
        // if 20X
        print(`[ApiClient] return with status code: ${result.StatusCode}`);
        if (result.StatusCode >= 200 && result.StatusCode < 300) {
          print(`[ApiClient] success: ${result.Body}`);
          apiParameter.successFunc(result.Body);
        } else if (result.StatusCode === 401) {
          if (apiParameter.failureFunc) {
            apiParameter.failureFunc(result.Body);
          }
        } else {
          retryCount++;
          if (retryCount < maxRetryTimes) {
            print(`[ApiClient] getWithRetry retry ${retryCount}`);
            retry();
          } else {
            if (apiParameter.failureFunc) {
              apiParameter.failureFunc(result.Body);
            }
          }
        }
      });
    };
    retry();
  }
}
