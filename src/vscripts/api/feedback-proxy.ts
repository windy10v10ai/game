import { ApiClient } from './api-client';
import { ApiHtmlProxy } from './api-html-proxy';
import { FEEDBACK_PATH } from './feedback';
import { base64UrlEncode } from '../utils/base64url';

const PROXY_FEEDBACK_PATH = '/proxy/feedback-post';
const RATE_LIMIT_CODES = ['too_many_reports', 'daily_limit_reached'];

/** 把游戏内反馈转成代发路由，限频错误码原样带回，让玩家看到与直连相同的提示 */
export class FeedbackProxy {
  public static Register(): void {
    ApiClient.RegisterProxyHandler(FEEDBACK_PATH, (target, apiParameter, _, callback) =>
      ApiHtmlProxy.Send(
        target,
        PROXY_FEEDBACK_PATH,
        { body: base64UrlEncode(json.encode(apiParameter.body ?? {})) },
        (data) => {
          callback({ StatusCode: 200, Body: data } as CScriptHTTPResponse);
        },
        (reason) => {
          print(`[FeedbackProxy] failed: ${reason}`);
          const statusCode = RATE_LIMIT_CODES.includes(reason) ? 429 : 0;
          callback({ StatusCode: statusCode, Body: reason } as CScriptHTTPResponse);
        },
      ),
    );
  }
}
