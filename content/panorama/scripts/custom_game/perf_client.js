'use strict';

// 后期卡顿排查：服务器采样器开启时，客户端按真实时间记录画面帧间隔，和服务器 tick 数据写进同一份控制台日志
(function () {
  if (!Game.IsInToolsMode()) return;

  var REPORT_MS = 10000;
  // 与服务器侧尖峰阈值一致，便于两边对照
  var SLOW_FRAME_MS = 100;
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

  function onFrame() {
    if (!running) return;
    var now = Date.now();
    var gap = now - lastFrame;
    lastFrame = now;
    frames++;
    if (gap > maxFrame) maxFrame = gap;
    if (gap > SLOW_FRAME_MS) slowFrames++;
    var elapsed = now - windowStart;
    if (elapsed >= REPORT_MS) {
      $.Msg(
        '[perf-client] fps=' +
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
      resetWindow(now);
    }
    $.Schedule(0, onFrame);
  }

  GameEvents.Subscribe('perf_client', function (data) {
    var enabled = data.enabled === 1;
    if (enabled === running) return;
    running = enabled;
    if (running) {
      resetWindow(Date.now());
      $.Schedule(0, onFrame);
    }
  });
})();
