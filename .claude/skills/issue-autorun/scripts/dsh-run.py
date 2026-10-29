"""Run one DSH headless task, stop it when it stalls or overruns, and print a short summary.

A crashed run exits on its own; a hung one does not, so the event log's last write time is
the liveness signal. The Claude Code provider can hang on exit after its final reply, so a run
that has written its final event is stopped after a short grace period and counts as finished.
Exit codes: 0 finished, 1 DSH reported an error, 2 stalled, 3 overran.

Usage:
  python -I dsh-run.py <task.md> <log-path-without-extension> [--session-id ID] [--cwd DIR]
                       [--executor deepseek|sonnet]
"""

import argparse
import glob
import json
import os
import re
import subprocess
import time

DSH = os.path.join(
    os.environ['LOCALAPPDATA'], 'Programs', 'DeepSeek Harness', 'resources', 'runtime', 'cli', 'bin', 'dsh.cmd'
)
REPO = r'C:\Users\windy\Documents\GitHub\windy10v10ai'
STALL_SECONDS = 30 * 60
MAX_SECONDS = 2 * 60 * 60
FINAL_GRACE_SECONDS = 30
POLL_SECONDS = 10
SONNET_PATCH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dsh-sonnet.patch.yml')


def summarize(events_path):
    info = {
        'session': None, 'final': None, 'error': None, 'tools': 0,
        'tokens_in': 0, 'tokens_out': 0, 'cache_read': 0, 'cache_write': 0,
    }
    with open(events_path, encoding='utf-8-sig', errors='replace') as f:
        for line in f:
            try:
                e = json.loads(line)
            except ValueError:
                continue
            kind = e.get('type')
            if kind == 'session':
                info['session'] = e.get('sessionId')
            elif kind == 'tool_call':
                info['tools'] += 1
            elif kind == 'final':
                info['final'] = e.get('text')
            elif kind == 'error':
                info['error'] = e.get('message')
            elif kind == 'status':
                usage = e.get('usage') or {}
                info['tokens_in'] += usage.get('inputTokens', 0)
                info['tokens_out'] += usage.get('outputTokens', 0)
                info['cache_read'] += usage.get('cacheReadTokens', 0)
                info['cache_write'] += usage.get('cacheWriteTokens', 0)
                reason = e.get('reason') or {}
                if reason.get('kind') == 'error':
                    info['error'] = (reason.get('error') or {}).get('message')
    return info


def claude_usage(cwd, since):
    """Sum the Claude Code transcripts a Sonnet run wrote: the provider reports only partial usage."""
    folder = os.path.join(os.path.expanduser('~'), '.claude', 'projects', re.sub(r'[^A-Za-z0-9]', '-', cwd))
    info = {'tools': 0, 'tokens_in': 0, 'tokens_out': 0, 'cache_read': 0, 'cache_write': 0}
    for path in glob.glob(os.path.join(folder, '*.jsonl')):
        if os.path.getctime(path) < since:
            continue
        seen = set()
        with open(path, encoding='utf-8', errors='replace') as f:
            for line in f:
                try:
                    msg = json.loads(line).get('message') or {}
                except ValueError:
                    continue
                usage = msg.get('usage')
                if not usage or msg.get('id') in seen:
                    continue
                seen.add(msg.get('id'))
                info['tools'] += sum(1 for c in msg.get('content') or [] if isinstance(c, dict) and c.get('type') == 'tool_use')
                info['tokens_in'] += usage.get('input_tokens', 0)
                info['tokens_out'] += usage.get('output_tokens', 0)
                info['cache_read'] += usage.get('cache_read_input_tokens', 0)
                info['cache_write'] += usage.get('cache_creation_input_tokens', 0)
    return info


def has_final(events_path):
    with open(events_path, 'rb') as f:
        f.seek(max(0, os.path.getsize(events_path) - 65536))
        return b'"type":"final"' in f.read()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('task')
    parser.add_argument('log')
    parser.add_argument('--session-id')
    parser.add_argument('--cwd', default=REPO)
    parser.add_argument('--executor', choices=['deepseek', 'sonnet'], default='deepseek')
    args = parser.parse_args()

    cmd = [DSH, '--profile', 'headless']
    if args.executor == 'sonnet':
        cmd += ['--patch', SONNET_PATCH]
    cmd.append('--json')
    if args.session_id:
        cmd += ['--session-id', args.session_id]
    cmd.append('-')
    env = dict(os.environ, DSH_PERMISSION_MODE='danger-full-access')
    events = args.log + '.jsonl'

    start = time.time()
    stop = None
    final_at = None
    with open(args.task, 'rb') as stdin, open(events, 'wb') as stdout, open(args.log + '.err', 'wb') as stderr:
        proc = subprocess.Popen(cmd, cwd=args.cwd, env=env, stdin=stdin, stdout=stdout, stderr=stderr)
        while proc.poll() is None:
            time.sleep(POLL_SECONDS)
            now = time.time()
            if final_at is None and has_final(events):
                final_at = now
            if final_at is not None and now - final_at >= FINAL_GRACE_SECONDS:
                stop = 'hung-after-final'
            elif now - os.path.getmtime(events) >= STALL_SECONDS:
                stop = 'stalled'
            elif now - start >= MAX_SECONDS:
                stop = 'overran'
            if stop:
                subprocess.run(['taskkill', '/T', '/F', '/PID', str(proc.pid)], capture_output=True)
                proc.wait()
                break

    info = summarize(events)
    if args.executor == 'sonnet':
        info.update(claude_usage(args.cwd, start))
    minutes = round((time.time() - start) / 60, 1)
    print(
        f"session={info['session']} minutes={minutes} tools={info['tools']} "
        f"tokens_in={info['tokens_in']} tokens_out={info['tokens_out']} "
        f"cache_read={info['cache_read']} cache_write={info['cache_write']} "
        f"executor={args.executor} stop={stop}"
    )
    if info['error']:
        print('error:', info['error'])
    if info['final']:
        print(info['final'][:4000])

    if stop == 'stalled':
        raise SystemExit(2)
    if stop == 'overran':
        raise SystemExit(3)
    if info['error'] or (stop is None and proc.returncode != 0):
        raise SystemExit(1)


if __name__ == '__main__':
    main()
