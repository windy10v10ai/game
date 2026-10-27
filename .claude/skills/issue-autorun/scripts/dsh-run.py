"""Run one DSH headless task, stop it when it stalls or overruns, and print a short summary.

A crashed run exits on its own; a hung one does not, so the event log's last write time is
the liveness signal. Exit codes: 0 finished, 1 DSH reported an error, 2 stalled, 3 overran.

Usage:
  python -I dsh-run.py <task.md> <log-path-without-extension> [--session-id ID] [--cwd DIR]
"""

import argparse
import json
import os
import subprocess
import time

DSH = os.path.join(
    os.environ['LOCALAPPDATA'], 'Programs', 'DeepSeek Harness', 'resources', 'runtime', 'cli', 'bin', 'dsh.cmd'
)
REPO = r'C:\Users\windy\Documents\GitHub\windy10v10ai'
STALL_SECONDS = 30 * 60
MAX_SECONDS = 2 * 60 * 60


def summarize(events_path):
    info = {'session': None, 'final': None, 'error': None, 'tools': 0, 'tokens_in': 0, 'tokens_out': 0}
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
                reason = e.get('reason') or {}
                if reason.get('kind') == 'error':
                    info['error'] = (reason.get('error') or {}).get('message')
    return info


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('task')
    parser.add_argument('log')
    parser.add_argument('--session-id')
    parser.add_argument('--cwd', default=REPO)
    args = parser.parse_args()

    cmd = [DSH, '--profile', 'headless', '--json']
    if args.session_id:
        cmd += ['--session-id', args.session_id]
    cmd.append('-')
    env = dict(os.environ, DSH_PERMISSION_MODE='danger-full-access')
    events = args.log + '.jsonl'

    start = time.time()
    stop = None
    with open(args.task, 'rb') as stdin, open(events, 'wb') as stdout, open(args.log + '.err', 'wb') as stderr:
        proc = subprocess.Popen(cmd, cwd=args.cwd, env=env, stdin=stdin, stdout=stdout, stderr=stderr)
        while proc.poll() is None:
            time.sleep(60)
            now = time.time()
            if now - os.path.getmtime(events) >= STALL_SECONDS:
                stop = 'stalled'
            elif now - start >= MAX_SECONDS:
                stop = 'overran'
            if stop:
                subprocess.run(['taskkill', '/T', '/F', '/PID', str(proc.pid)], capture_output=True)
                proc.wait()
                break

    info = summarize(events)
    minutes = round((time.time() - start) / 60, 1)
    print(
        f"session={info['session']} minutes={minutes} tools={info['tools']} "
        f"tokens_in={info['tokens_in']} tokens_out={info['tokens_out']} stop={stop}"
    )
    if info['error']:
        print('error:', info['error'])
    if info['final']:
        print(info['final'][:4000])

    if stop == 'stalled':
        raise SystemExit(2)
    if stop == 'overran':
        raise SystemExit(3)
    if info['error'] or proc.returncode != 0:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
