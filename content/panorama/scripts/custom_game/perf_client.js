'use strict';

// 后期卡顿排查：服务器采样器开启时，客户端按真实时间记录画面帧间隔，和服务器 tick 数据写进同一份控制台日志
(function () {
  if (!Game.IsInToolsMode()) return;

  var REPORT_MS = 10000;
  // 与服务器侧尖峰阈值一致，便于两边对照
  var SLOW_FRAME_MS = 100;
  // 后期最慢一帧也在 2 秒内，超过就当作回调链停住了
  var STALL_MS = 3000;
  var running = false;
  var windowStart = 0;
  var lastFrame = 0;
  var frames = 0;
  var maxFrame = 0;
  var slowFrames = 0;

  function resetWindow(now) {
    windowStart = now;
    lastFrame = now;
    frames = 0;
    maxFrame = 0;
    slowFrames = 0;
  }

  // 带上所属实验段名，汇总时不必靠日志先后猜归属
  function report(phase, now) {
    var elapsed = now - windowStart;
    if (frames > 0) {
      $.Msg(
        '[perf-client] phase=' +
          phase +
          ' fps=' +
          ((frames * 1000) / elapsed).toFixed(1) +
          ' frameMs=' +
          (elapsed / frames).toFixed(1) +
          ' maxFrame=' +
          maxFrame +
          ' slow=' +
          slowFrames +
          ' sec=' +
          (elapsed / 1000).toFixed(1),
      );
    }
    resetWindow(now);
  }

  // 每次重启换一代，旧的回调链自然结束，不会出现两条链同时计帧
  var generation = 0;
  var currentPhase = '';

  function startLoop() {
    var current = ++generation;
    resetWindow(Date.now());
    $.Schedule(0, function tick() {
      if (!running || current !== generation) return;
      onFrame();
      $.Schedule(0, tick);
    });
  }

  function onFrame() {
    var now = Date.now();
    var gap = now - lastFrame;
    lastFrame = now;
    frames++;
    if (gap > maxFrame) maxFrame = gap;
    if (gap > SLOW_FRAME_MS) slowFrames++;
    if (now - windowStart >= REPORT_MS) report(currentPhase, now);
  }

  // 逐帧回调在开局后可能一直不触发，服务器开局时暂停一下可以恢复；心跳用来发现漏网的停顿并留下记录
  GameEvents.Subscribe('perf_client', function (data) {
    if (data.enabled !== 1) {
      running = false;
      return;
    }
    if (!running) {
      running = true;
      startLoop();
      return;
    }
    // 服务器切换实验段时发来刚结束那段的名字，当场结算
    if (data.flush !== undefined) {
      report(data.flush, Date.now());
      currentPhase = data.next;
      return;
    }
    var stalled = Date.now() - lastFrame;
    if (stalled > STALL_MS) {
      $.Msg('[perf-client] restart stalledMs=' + stalled);
      startLoop();
    }
  });
})();
