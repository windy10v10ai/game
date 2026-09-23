import { ApiClient } from './api-client';
import { ApiHtmlProxy } from './api-html-proxy';
import { type ApiTarget } from './api-route';
import { base64UrlEncode } from '../utils/base64url';

const ORDER_CREATE_PATH = '/alipay/order/create';
const ORDER_QUERY_PATH = '/alipay/order/query';
const PROXY_ORDER_CREATE_PATH = '/proxy/alipay-order-create-post';
const PROXY_ORDER_QUERY_PATH = '/proxy/alipay-order-query';

/** 把支付宝下单与订单状态查询转成对应的代发路由 */
export class AlipayProxy {
  public static Register(): void {
    ApiClient.RegisterProxyHandler(ORDER_CREATE_PATH, (target, apiParameter, _, callback) =>
      AlipayProxy.Send(
        target,
        PROXY_ORDER_CREATE_PATH,
        { body: base64UrlEncode(json.encode(apiParameter.body ?? {})) },
        callback,
      ),
    );
    ApiClient.RegisterProxyHandler(ORDER_QUERY_PATH, (target, apiParameter, _, callback) =>
      AlipayProxy.Send(target, PROXY_ORDER_QUERY_PATH, apiParameter.querys ?? {}, callback),
    );
  }

  // 查询不沿用直连的短超时：代发超时会拉黑代发玩家，游廊里客户端加载慢于直连是常态
  private static Send(
    target: ApiTarget,
    proxyPath: string,
    querys: { [key: string]: string },
    callbackFunc: (result: CScriptHTTPResponse) => void,
  ): void {
    ApiHtmlProxy.Send(
      target,
      proxyPath,
      querys,
      (data) => {
        callbackFunc({ StatusCode: 200, Body: data } as CScriptHTTPResponse);
      },
      (reason) => {
        print(`[AlipayProxy] ${proxyPath} failed: ${reason}`);
        callbackFunc({ StatusCode: 0, Body: '' } as CScriptHTTPResponse);
      },
    );
  }
}
