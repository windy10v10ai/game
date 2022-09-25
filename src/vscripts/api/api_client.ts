

export class ApiClient {
	private static TIMEOUT_SECONDS = 10;
	private static RETRY_TIMES = 6;
	private static HOST_NAME: string = (() => {
		return IsInToolsMode() ? "http://localhost:5000/api" : "https://windy10v10ai.web.app/api"
	})();


	public static get(url: string, params: { [key: string]: string }, callback: (data: string) => void) {
		print(`[ApiClient] get ${ApiClient.HOST_NAME}${url} with ${json.encode(params)}`);
		const request = CreateHTTPRequestScriptVM("GET", ApiClient.HOST_NAME + url);
		for (const key in params) {
			request.SetHTTPRequestGetOrPostParameter(key, params[key]);
		}
		request.SetHTTPRequestNetworkActivityTimeout(ApiClient.TIMEOUT_SECONDS);
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
