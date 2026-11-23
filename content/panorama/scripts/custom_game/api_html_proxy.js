// Since Dota 2 7.42 the server cannot make HTTP requests, so this client relays whitelisted ones.
// A DOTAHTMLPanel only honours its first navigation, so one hidden group per line is created during
// the loading screen and each request later only changes the URL fragment of a matching panel.
// Must be attached to the loading-screen layout; panels created elsewhere cannot load the bridge page.
(function () {
  'use strict';

  var REQUEST_TIMEOUT_SECONDS = 10;
  var READY_RETRY_SECONDS = 1;
  var READY_FAST_ATTEMPTS = 60;
  var READY_SLOW_RETRY_SECONDS = 5;

  // The first URL (query included) is the prefix of every later request because only the fragment can change.
  // Only the main entry's bridge page reports a country code.
  var CHANNEL_COUNT = 3;
  var BRIDGE_PATH = '/api/proxy/bridge';
  var BRIDGE_READY_TITLE = 'bridge|ready';
  var GROUPS = [
    { name: 'main', origin: 'https://api.windy10v10ai.com', bridgeQuery: '?country=1' },
    { name: 'backup', origin: 'https://43.135.77.42', bridgeQuery: '' },
  ];

  var cancelers = {};
  var groups = [];
  var country = '';
  var readyAttempts = 0;
  var readyLoopRunning = false;
  var ackedSignature = '';

  function createPanel(id) {
    var panel = $.CreatePanel('DOTAHTMLPanel', $.GetContextPanel(), id);
    panel.style.width = '1px';
    panel.style.height = '1px';
    panel.style.opacity = '0.01';
    panel.hittest = false;
    return panel;
  }

  function readyCount(group) {
    var count = 0;
    for (var i = 0; i < group.channels.length; i++) {
      var channel = group.channels[i];
      if (channel.ready && channel.panel.IsValid()) count++;
    }
    return count;
  }

  function readyReport() {
    return {
      channels: readyCount(groups[0]),
      backupChannels: readyCount(groups[1]),
      country: country,
    };
  }

  function signatureOf(report) {
    return report.channels + '|' + report.backupChannels + '|' + report.country;
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
    var report = readyReport();
    if (ackedSignature === signatureOf(report)) {
      readyLoopRunning = false;
      return;
    }
    readyAttempts++;
    GameEvents.SendCustomGameEventToServer('api_html_proxy_ready', report);
    // 机械硬盘首次启动，地图加载可能比分配玩家槽位早几分钟，期间服务端认不出这名玩家，
    // 所以不能放弃，只在前期密集、之后放慢，直到回执为止
    $.Schedule(
      readyAttempts > READY_FAST_ATTEMPTS ? READY_SLOW_RETRY_SECONDS : READY_RETRY_SECONDS,
      readyTick,
    );
  }

  function onProxyAck(event) {
    ackedSignature = signatureOf({
      channels: Number(event.channels),
      backupChannels: Number(event.backupChannels),
      country: String(event.country),
    });
  }

  function initChannels() {
    for (var g = 0; g < GROUPS.length; g++) {
      var group = {
        name: GROUPS[g].name,
        origin: GROUPS[g].origin,
        bridgeUrl: GROUPS[g].origin + BRIDGE_PATH + GROUPS[g].bridgeQuery,
        channels: [],
      };
      for (var i = 0; i < CHANNEL_COUNT; i++) {
        var id = 'ApiHtmlProxyBridge_' + group.name + '_' + i;
        var channel = { panel: createPanel(id), ready: false, current: null };
        $.RegisterEventHandler('HTMLTitle', channel.panel, makeTitleHandler(group, channel, id));
        channel.panel.SetURL(group.bridgeUrl);
        group.channels.push(channel);
      }
      groups.push(group);
    }
    $.Msg(
      '[ApiHtmlProxy] bridge channels created count=' + CHANNEL_COUNT + ' groups=' + groups.length,
    );
  }

  // Returns undefined when the title is not a ready title.
  function parseReadyTitle(title) {
    if (title === BRIDGE_READY_TITLE) return '';
    if (title.indexOf(BRIDGE_READY_TITLE + '|') !== 0) return undefined;
    var code = title.substr(BRIDGE_READY_TITLE.length + 1);
    return /^[A-Za-z]{2}$/.test(code) ? code.toUpperCase() : '';
  }

  function makeTitleHandler(group, channel, id) {
    return function (_sourcePanel, title) {
      if (typeof title !== 'string') return;
      var readyCountry = parseReadyTitle(title);
      if (readyCountry !== undefined) {
        channel.ready = true;
        if (group.name === 'main' && readyCountry !== '') country = readyCountry;
        $.Msg(
          '[ApiHtmlProxy] bridge channel ' + id + ' ready country=' + (readyCountry || 'unknown'),
        );
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

  function findGroup(url) {
    for (var i = 0; i < groups.length; i++) {
      if (url.indexOf(groups[i].origin + '/') === 0) return groups[i];
    }
    return null;
  }

  function acquireChannel(group) {
    for (var i = 0; i < group.channels.length; i++) {
      var channel = group.channels[i];
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
    var group = findGroup(url);
    var channel = group ? acquireChannel(group) : null;
    $.Msg(
      '[ApiHtmlProxy] request ' +
        requestId +
        ' group=' +
        (group ? group.name : 'none') +
        ' urlLength=' +
        url.length +
        ' channel=' +
        !!channel,
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
    var path = url.substr(group.origin.length);
    channel.panel.SetURL(group.bridgeUrl + '#' + encodeURIComponent(requestId + '|' + path));

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
