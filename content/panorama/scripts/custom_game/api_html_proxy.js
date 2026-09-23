// 游廊对局里服务端拿不到 HTTP 请求对象时，由这个客户端代发白名单请求：
// 建一个隐藏的 DOTAHTMLPanel 加载服务端拼好的网址，响应经由 HTMLTitle 事件读回。
(function () {
  'use strict';

  var REQUEST_TIMEOUT_SECONDS = 10;
  var READY_RETRY_SECONDS = 1;
  var READY_MAX_ATTEMPTS = 60;

  var readyAcked = false;
  var readyAttempts = 0;

  function removePanel(panel) {
    if (panel && panel.IsValid()) panel.DeleteAsync(0);
  }

  // 脚本随自定义 UI 加载，比玩家槽位分配还早，最初几条 ready 到服务端时 PlayerID 是 -1
  // 会被丢弃；一直重发到服务端回执为止
  function sendReady() {
    if (readyAcked) return;
    readyAttempts++;
    GameEvents.SendCustomGameEventToServer('api_html_proxy_ready', {});
    if (readyAttempts >= READY_MAX_ATTEMPTS) return;
    $.Schedule(READY_RETRY_SECONDS, sendReady);
  }

  function onProxyAck() {
    readyAcked = true;
  }

  function onProxyRequest(event) {
    var requestId = String(event.requestId);
    var url = String(event.url);
    var finished = false;
    $.Msg('[ApiHtmlProxy] request ' + requestId + ' urlLength=' + url.length);

    var panel = $.CreatePanel('DOTAHTMLPanel', $.GetContextPanel(), 'ApiHtmlProxy_' + requestId);
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
      $.Msg('[ApiHtmlProxy] response ' + requestId + ' length=' + data.length);
      GameEvents.SendCustomGameEventToServer('api_html_proxy_response', {
        requestId: requestId,
        data: data,
      });
    });

    panel.SetURL(url);

    $.Schedule(REQUEST_TIMEOUT_SECONDS, function () {
      if (finished) return;
      finish();
      $.Msg('[ApiHtmlProxy] timeout ' + requestId);
      GameEvents.SendCustomGameEventToServer('api_html_proxy_failure', {
        requestId: requestId,
        reason: 'client_timeout',
      });
    });
  }

  GameEvents.Subscribe('api_html_proxy_request', onProxyRequest);
  GameEvents.Subscribe('api_html_proxy_ack', onProxyAck);
  sendReady();
})();
