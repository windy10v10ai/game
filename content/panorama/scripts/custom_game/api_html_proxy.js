// 游廊对局里服务端拿不到 HTTP 请求对象时，由这个客户端代发白名单请求：
// 建一个隐藏的 DOTAHTMLPanel 加载服务端拼好的网址，响应经由 HTMLTitle 事件读回。
(function () {
  'use strict';

  var REQUEST_TIMEOUT_SECONDS = 10;
  var READY_RETRY_SECONDS = 1;
  var READY_MAX_ATTEMPTS = 60;

  var cancelers = {};
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

  // 控件只有创建时的第一次导航有效，所以脚本在加载界面阶段就建好控件并加载中转页，
  // 之后每次请求只改网址 # 片段；脚本必须挂在加载界面布局，别处创建的控件加载不了中转页
  var API_ORIGIN = 'https://api.windy10v10ai.com';
  var BRIDGE_URL = API_ORIGIN + '/bridge.html';
  var BRIDGE_READY_TITLE = 'bridge|ready';
  var POOL_SIZE = 2;
  var pool = [];

  function createPanel(id) {
    var panel = $.CreatePanel('DOTAHTMLPanel', $.GetContextPanel(), id);
    panel.style.width = '1px';
    panel.style.height = '1px';
    panel.style.opacity = '0.01';
    panel.hittest = false;
    return panel;
  }

  function initPool() {
    for (var i = 0; i < POOL_SIZE; i++) {
      var slot = { panel: createPanel('ApiHtmlProxyBridge_' + i), ready: false, current: null };
      $.RegisterEventHandler('HTMLTitle', slot.panel, makeTitleHandler(slot, i));
      slot.panel.SetURL(BRIDGE_URL);
      pool.push(slot);
    }
    $.Msg('[ApiHtmlProxy] bridge pool created size=' + POOL_SIZE);
  }

  function makeTitleHandler(slot, index) {
    return function (_sourcePanel, title) {
      if (typeof title !== 'string') return;
      if (title === BRIDGE_READY_TITLE) {
        slot.ready = true;
        $.Msg('[ApiHtmlProxy] bridge panel ' + index + ' ready');
        return;
      }
      if (slot.current) handleTitle(slot.current, title);
    };
  }

  function handleTitle(job, title) {
    if (job.finished || typeof title !== 'string') return;
    var separatorIndex = title.indexOf('|');
    if (separatorIndex < 0) return;
    if (title.substr(0, separatorIndex) !== job.requestId) return;

    var data = title.substr(separatorIndex + 1);
    job.finish();
    $.Msg('[ApiHtmlProxy] response ' + job.requestId + ' length=' + data.length);
    GameEvents.SendCustomGameEventToServer('api_html_proxy_response', {
      requestId: job.requestId,
      data: data,
    });
  }

  function acquireSlot(url) {
    if (url.indexOf(API_ORIGIN + '/') !== 0) return null;
    for (var i = 0; i < pool.length; i++) {
      if (pool[i].ready && !pool[i].current && pool[i].panel.IsValid()) return pool[i];
    }
    return null;
  }

  function onProxyRequest(event) {
    var requestId = String(event.requestId);
    var url = String(event.url);
    var slot = acquireSlot(url);
    // 没有就绪的中转控件时退回按需新建整页请求
    var panel = slot ? slot.panel : createPanel('ApiHtmlProxy_' + requestId);
    $.Msg(
      '[ApiHtmlProxy] request ' + requestId + ' urlLength=' + url.length + ' bridged=' + !!slot,
    );

    var job = { requestId: requestId, finished: false, finish: null };
    job.finish = function () {
      if (job.finished) return;
      job.finished = true;
      delete cancelers[requestId];
      if (slot) {
        slot.current = null;
      } else {
        removePanel(panel);
      }
    };
    cancelers[requestId] = function () {
      if (job.finished) return;
      job.finish();
      $.Msg('[ApiHtmlProxy] cancel ' + requestId);
    };

    if (slot) {
      slot.current = job;
      var path = url.substr(API_ORIGIN.length);
      panel.SetURL(BRIDGE_URL + '#' + encodeURIComponent(requestId + '|' + path));
    } else {
      $.RegisterEventHandler('HTMLTitle', panel, function (_sourcePanel, title) {
        handleTitle(job, title);
      });
      panel.SetURL(url);
    }

    $.Schedule(REQUEST_TIMEOUT_SECONDS, function () {
      if (job.finished) return;
      job.finish();
      $.Msg('[ApiHtmlProxy] timeout ' + requestId);
      GameEvents.SendCustomGameEventToServer('api_html_proxy_failure', {
        requestId: requestId,
        reason: 'client_timeout',
      });
    });
  }

  GameEvents.Subscribe('api_html_proxy_request', onProxyRequest);
  GameEvents.Subscribe('api_html_proxy_ack', onProxyAck);
  GameEvents.Subscribe('api_html_proxy_cancel', function (event) {
    var cancel = cancelers[String(event.requestId)];
    if (cancel) cancel();
  });
  initPool();
  sendReady();
})();
