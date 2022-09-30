

export class ApiClient {
	private static TIMEOUT_SECONDS = 10;
	private static RETRY_TIMES = 6;
	private static VERSION = "v1.43";
	private static HOST_NAME: string = (() => {
		return IsInToolsMode() ? "http://localhost:5000/api" : "https://windy10v10ai.web.app/api"
	})();


	public static get(url: string, params: { [key: string]: string }, callback: (data: string) => void) {
		print(`[ApiClient] get ${ApiClient.HOST_NAME}${url} with ${json.encode(params)}`);
		const request = CreateHTTPRequestScriptVM("GET", ApiClient.HOST_NAME + url);
		const key = GetDedicatedServerKeyV2(ApiClient.VERSION);

		// get Script_GetMatchID id
		const matchId = GameRules.Script_GetMatchID();
		// set matchId string to params
		params["matchId"] = matchId.toString();
		print(`[ApiClient] matchId ${params["matchId"]}`);
		print(`[ApiClient] key ${key}`);
		for (const key in params) {
			request.SetHTTPRequestGetOrPostParameter(key, params[key]);
		}
		// set matchId to query
		request.SetHTTPRequestNetworkActivityTimeout(ApiClient.TIMEOUT_SECONDS);
		request.SetHTTPRequestHeaderValue("x-api-key", key);
		request.Send((result: CScriptHTTPResponse) => {
			if (result.StatusCode == 200) {
				callback(result.Body);
			} else {
				print(`[ApiClient] get error: ${result.StatusCode}`);
				callback("error");
			}
		});
	}

	// retry 3 times if get error
	public static getWithRetry(url: string, params: { [key: string]: string }, callback: (data: string) => void) {
		let retryCount = 0;
		const retry = () => {
			this.get(url, params, (data: string) => {
				if (data == "error") {
					retryCount++;
					if (retryCount < ApiClient.RETRY_TIMES) {
						print(`[ApiClient] getWithRetry retry ${retryCount}`);
						retry();
					}
				} else {
					callback(data);
				}
			});
		}
		retry();
	}
}
