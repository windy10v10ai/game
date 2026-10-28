"""File DSH headless sessions into the repository's workspace, or archive them.

DSH groups sessions by explicit id lists in storages/workspace.json, so headless runs
land in "ungrouped" unless listed. Two workspaces sharing one path make the desktop app
drop the whole workspace list, so sessions go into the workspace that already owns the
repository path. The desktop app rewrites this file from memory, so edits are refused
while it is running.

Usage:
  python -I dsh-sessions.py file <session-id>...
  python -I dsh-sessions.py archive <session-id>...
"""

import json
import os
import shutil
import subprocess
import sys
import uuid
from datetime import datetime, timezone

STORE = os.path.join(os.path.expanduser('~'), '.dsh', 'storages', 'workspace.json')
WORKSPACE_PATH = r'C:\Users\windy\Documents\GitHub\windy10v10ai'


def dsh_running():
    out = subprocess.run(
        ['tasklist', '/FI', 'IMAGENAME eq DeepSeek Harness.exe', '/NH'],
        capture_output=True,
        text=True,
    ).stdout
    return 'DeepSeek Harness.exe' in out


def now():
    return datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')


def dispatch_workspace(store):
    workspaces = store['tables']['workspaces']
    for wid, ws in workspaces.items():
        if os.path.normcase(ws.get('path', '')) == os.path.normcase(WORKSPACE_PATH):
            return ws
    wid = str(uuid.uuid4())
    title = os.path.basename(WORKSPACE_PATH)
    ws = {'path': WORKSPACE_PATH, 'title': title, 'sessionIds': [], 'createdAt': now(), 'updatedAt': now()}
    workspaces[wid] = ws
    store['global']['workspaceIds'].append(wid)
    return ws


def main():
    if len(sys.argv) < 3 or sys.argv[1] not in ('file', 'archive'):
        sys.exit(__doc__)
    if dsh_running():
        sys.exit('DeepSeek Harness is running; close it first, otherwise it overwrites workspace.json')
    action, ids = sys.argv[1], sys.argv[2:]
    with open(STORE, encoding='utf-8') as f:
        store = json.load(f)
    if action == 'file':
        for ws in store['tables']['workspaces'].values():
            ws['sessionIds'] = [s for s in ws.get('sessionIds', []) if s not in ids]
        ws = dispatch_workspace(store)
        ws['sessionIds'] = ids + ws['sessionIds']
        ws['updatedAt'] = now()
    else:
        archived = store['global']['archivedSessionIds']
        archived.extend(s for s in ids if s not in archived)
    shutil.copyfile(STORE, STORE + '.bak')
    with open(STORE + '.tmp', 'w', encoding='utf-8') as f:
        json.dump(store, f, ensure_ascii=False, indent=2)
    os.replace(STORE + '.tmp', STORE)
    print(f'{action}: {len(ids)} session(s)')


if __name__ == '__main__':
    main()
