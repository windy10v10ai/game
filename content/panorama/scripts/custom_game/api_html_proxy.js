// Dota 2 7.42 起服务端拿不到 HTTP 请求对象，由这个客户端代发白名单请求：
// 控件只有创建时的第一次导航有效，所以脚本在加载界面阶段就建好几个隐藏的 DOTAHTMLPanel，
// 各自加载后端返回的中转页，之后每次请求只改网址 # 片段，页面用同源 fetch 发请求，响应经 HTMLTitle 事件读回。
// 脚本必须挂在加载界面布局，别处创建的控件加载不了中转页。
(function () {
  'use strict';

  var REQUEST_TIMEOUT_SECONDS = 10;
  var READY_RETRY_SECONDS = 1;
  var READY_MAX_ATTEMPTS = 60;

  // 只有这一条线路：国内网关给每个响应强加 Content-Disposition: attachment，控件加载不了中转页
  var API_ORIGIN = 'https://api.windy10v10ai.com';
  var CHANNEL_COUNT = 3;
  var BRIDGE_PATH = '/api/proxy/bridge';
  var BRIDGE_READY_TITLE = 'bridge|ready';

  var cancelers = {};
  var channels = [];
  var readyAttempts = 0;
  var readyLoopRunning = false;
  var ackedChannels = -1;

  function createPanel(id) {
    var panel = $.CreatePanel('DOTAHTMLPanel', $.GetContextPanel(), id);
    panel.style.width = '1px';
    panel.style.height = '1px';
    panel.style.opacity = '0.01';
    panel.hittest = false;
    return panel;
  }

  function readyCount() {
    var count = 0;
    for (var i = 0; i < channels.length; i++) {
      if (channels[i].ready && channels[i].panel.IsValid()) count++;
    }
    return count;
  }

  // 脚本随自定义 UI 加载，比玩家槽位分配还早，最初几条 ready 到服务端时 PlayerID 是 -1
  // 会被丢弃；一直重发到服务端回执与当前通道数一致为止
  function reportReady() {
    readyAttempts = 0;
    if (readyLoopRunning) return;
    readyLoopRunning = true;
    readyTick();
  }

  function readyTick() {
    var count = readyCount();
    if (ackedChannels === count) {
      readyLoopRunning = false;
      return;
    }
    readyAttempts++;
    if (readyAttempts > READY_MAX_ATTEMPTS) {
      readyLoopRunning = false;
      return;
    }
    GameEvents.SendCustomGameEventToServer('api_html_proxy_ready', { channels: count });
    $.Schedule(READY_RETRY_SECONDS, readyTick);
  }

  function onProxyAck(event) {
    ackedChannels = Number(event.channels);
  }

  function initChannels() {
    for (var i = 0; i < CHANNEL_COUNT; i++) {
      var id = 'ApiHtmlProxyBridge_' + i;
      var channel = { panel: createPanel(id), ready: false, current: null };
      $.RegisterEventHandler('HTMLTitle', channel.panel, makeTitleHandler(channel, id));
      channel.panel.SetURL(API_ORIGIN + BRIDGE_PATH);
      channels.push(channel);
    }
    $.Msg('[ApiHtmlProxy] bridge channels created count=' + channels.length);
  }

  function makeTitleHandler(channel, id) {
    return function (_sourcePanel, title) {
      if (typeof title !== 'string') return;
      if (title === BRIDGE_READY_TITLE) {
        channel.ready = true;
        $.Msg('[ApiHtmlProxy] bridge channel ' + id + ' ready');
        reportReady();
        return;
      }
      if (channel.current) handleTitle(channel.current, title);
    };
  }

  function handleTitle(job, title) {
    if (job.finished) return;
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

  function acquireChannel() {
    for (var i = 0; i < channels.length; i++) {
      var channel = channels[i];
      if (channel.ready && !channel.current && channel.panel.IsValid()) return channel;
    }
    return null;
  }

  function reportFailure(requestId, reason) {
    GameEvents.SendCustomGameEventToServer('api_html_proxy_failure', {
      requestId: requestId,
      reason: reason,
    });
  }

  function onProxyRequest(event) {
    var requestId = String(event.requestId);
    var url = String(event.url);
    // 服务端按通道数限流，正常不会没有空闲通道；真没有就报错让服务端重排
    var channel = url.indexOf(API_ORIGIN + '/') === 0 ? acquireChannel() : null;
    $.Msg(
      '[ApiHtmlProxy] request ' + requestId + ' urlLength=' + url.length + ' channel=' + !!channel,
    );
    if (!channel) {
      reportFailure(requestId, 'no_channel');
      return;
    }

    var job = { requestId: requestId, finished: false, finish: null };
    job.finish = function () {
      if (job.finished) return;
      job.finished = true;
      delete cancelers[requestId];
      channel.current = null;
    };
    cancelers[requestId] = function () {
      if (job.finished) return;
      job.finish();
      $.Msg('[ApiHtmlProxy] cancel ' + requestId);
    };

    channel.current = job;
    var path = url.substr(API_ORIGIN.length);
    channel.panel.SetURL(
      API_ORIGIN + BRIDGE_PATH + '#' + encodeURIComponent(requestId + '|' + path),
    );

    $.Schedule(REQUEST_TIMEOUT_SECONDS, function () {
      if (job.finished) return;
      job.finish();
      $.Msg('[ApiHtmlProxy] timeout ' + requestId);
      reportFailure(requestId, 'client_timeout');
    });
  }

  GameEvents.Subscribe('api_html_proxy_request', onProxyRequest);
  GameEvents.Subscribe('api_html_proxy_ack', onProxyAck);
  GameEvents.Subscribe('api_html_proxy_cancel', function (event) {
    var cancel = cancelers[String(event.requestId)];
    if (cancel) cancel();
  });
  initChannels();
})();
