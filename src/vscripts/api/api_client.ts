
// enum http methods
export enum HttpMethod {
	GET = "GET",
	POST = "POST",
	PUT = "PUT",
	DELETE = "DELETE",
}

export interface ApiParameter {
	method: HttpMethod,
	path: string,
	querys?: { [key: string]: string },
	body?: Object,
	successFunc: (data: string) => void,
	failureFunc?: (data: string) => void,
	retryTimes?: number,
}

export class ApiClient {

	public static GAME_START_URL = "/game/start";
	public static ADD_PLAYER_PROPERTY_URL = "/game/addPlayerProperty";
	public static POST_GAME_URL = "/game/end";

	private static LOCAL_APIKEY = "Invalid_NotOnDedicatedServer";
	private static TIMEOUT_SECONDS = 10;
	private static RETRY_TIMES = 3;
	private static VERSION = "v1.43";
	private static HOST_NAME: string = (() => {
		return IsInToolsMode() ? "http://localhost:5000/api" : "https://windy10v10ai.web.app/api"
	})();

	public static send(method: HttpMethod, path: string, querys: { [key: string]: string } | undefined, body: Object | undefined, callbackFunc: (result: CScriptHTTPResponse) => void) {
		print(`[ApiClient] ${method} ${ApiClient.HOST_NAME}${path} with querys ${json.encode(querys)} body ${json.encode(body)}`);
		const request = CreateHTTPRequestScriptVM(method, ApiClient.HOST_NAME + path);
		const key = GetDedicatedServerKeyV2(ApiClient.VERSION);

		if (key == ApiClient.LOCAL_APIKEY && !IsInToolsMode()) {
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
		request.SetHTTPRequestNetworkActivityTimeout(ApiClient.TIMEOUT_SECONDS);
		request.SetHTTPRequestHeaderValue("x-api-key", key);
		if (body) {
			request.SetHTTPRequestRawPostBody("application/json", json.encode(body));
		}
		request.Send((result: CScriptHTTPResponse) => {
			callbackFunc(result);
		});
	}

	public static sendWithRetry(apiParameter: ApiParameter) {
		let retryCount = 0;
		const maxRetryTimes = apiParameter.retryTimes || ApiClient.RETRY_TIMES;
		const retry = () => {
			this.send(apiParameter.method, apiParameter.path, apiParameter.querys, apiParameter.body, (result: CScriptHTTPResponse) => {

				// if 20X
				print(`[ApiClient] return with status code: ${result.StatusCode}`);
				if (result.StatusCode >= 200 && result.StatusCode < 300) {
					apiParameter.successFunc(result.Body);
				} else if (result.StatusCode == 401) {
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
		}
		retry();
	}
}
