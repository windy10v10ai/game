// 游廊对局里服务端拿不到 HTTP 请求对象时，由这个客户端代发白名单请求：
// 建一个隐藏的 DOTAHTMLPanel 加载服务端拼好的网址，响应经由 HTMLTitle 事件读回。
(function () {
  'use strict';

  var REQUEST_TIMEOUT_SECONDS = 10;

  function removePanel(panel) {
    if (panel && panel.IsValid()) panel.DeleteAsync(0);
  }

  function onProxyRequest(event) {
    var requestId = String(event.requestId);
    var url = String(event.url);
    var finished = false;

    var panel = $.CreatePanel('DOTAHTMLPanel', $.GetContextPanel(), 'ApiProxy_' + requestId);
    panel.style.width = '1px';
    panel.style.height = '1px';
    panel.style.opacity = '0.01';

    function finish() {
      if (finished) return;
      finished = true;
      removePanel(panel);
    }

    $.RegisterEventHandler('HTMLTitle', panel, function (_sourcePanel, title) {
      if (finished || typeof title !== 'string') return;
      var separatorIndex = title.indexOf('|');
      if (separatorIndex < 0) return;
      var receivedRequestId = title.substr(0, separatorIndex);
      if (receivedRequestId !== requestId) return;

      var data = title.substr(separatorIndex + 1);
      finish();
      GameEvents.SendCustomGameEventToServer('api_proxy_response', {
        requestId: requestId,
        data: data,
      });
    });

    panel.SetURL(url);

    $.Schedule(REQUEST_TIMEOUT_SECONDS, function () {
      if (finished) return;
      finish();
      GameEvents.SendCustomGameEventToServer('api_proxy_failure', {
        requestId: requestId,
        reason: 'client_timeout',
      });
    });
  }

  GameEvents.Subscribe('api_proxy_request', onProxyRequest);
  GameEvents.SendCustomGameEventToServer('api_proxy_ready', {});
  $.Msg('[ApiProxy] ready');
})();
