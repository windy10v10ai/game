
// enum http methods
export enum HttpMethod {
	GET = "GET",
	POST = "POST",
	PUT = "PUT",
	DELETE = "DELETE",
}

export class ApiClient {
	private static TIMEOUT_SECONDS = 10;
	private static RETRY_TIMES = 6;
	private static VERSION = "v1.43";
	private static HOST_NAME: string = (() => {
		return IsInToolsMode() ? "http://localhost:5000/api" : "https://windy10v10ai.web.app/api"
	})();

	public static send(method: HttpMethod, path: string, params: { [key: string]: string } | null, body: Object | null, callback: (data: string) => void) {
		print(`[ApiClient] ${method} ${ApiClient.HOST_NAME}${path} with params ${json.encode(params)} body ${json.encode(body)}`);
		const request = CreateHTTPRequestScriptVM(method, ApiClient.HOST_NAME + path);
		const key = GetDedicatedServerKeyV2(ApiClient.VERSION);

		if (params) {
			for (const key in params) {
				request.SetHTTPRequestGetOrPostParameter(key, params[key]);
			}
		}
		request.SetHTTPRequestNetworkActivityTimeout(ApiClient.TIMEOUT_SECONDS);
		request.SetHTTPRequestHeaderValue("x-api-key", key);
		if (body) {
			request.SetHTTPRequestRawPostBody("application/json", json.encode(body));
		}
		request.Send((result: CScriptHTTPResponse) => {
			// if 20X
			if (result.StatusCode >= 200 && result.StatusCode < 300) {
				callback(result.Body);
			} else {
				print(`[ApiClient] get error: ${result.StatusCode}`);
				callback("error");
			}
		});
	}

	public static sendWithRetry(method: HttpMethod, path: string, params: { [key: string]: string } | null, body: Object | null, callback: (data: string) => void) {
		let retryCount = 0;
		const retry = () => {
			this.send(method, path, params, body, (data: string) => {
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
