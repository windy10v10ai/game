#!/usr/bin/env python3
"""Rebuild the two hand edits on a fresh official dota_pvp_prefab.vmap, then verify.

Usage: python apply_map_edits.py [--work DIR] [--official-dir DIR] [--out-dir DIR]
Copies official dota.vmap, converts the official prefab to text with dmxconvert,
applies the edits, writes the binary prefab, converts it back and prints a report.
"""
import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path

DOTA = Path(r"C:\Program Files (x86)\Steam\steamapps\common\dota 2 beta")
DMX = DOTA / r"game\bin\win64\dmxconvert.exe"

ANCIENT_CAMPS = [
    "neutralcamp_evil_12", "neutralcamp_evil_13", "neutralcamp_evil_20",
    "neutralcamp_good_12", "neutralcamp_good_16", "neutralcamp_good_20",
]
ANCIENT_PROPS = {"NeutralType": "3", "MinSpawnType": "1", "MaxSpawnType": "5"}

# Radiant fountain trigger_shop is identified by its entity origin.
FOUNTAIN_ORIGIN = "-7584 -6688"
# World-space centre and half extents of the two child meshes. The meshes must span the
# whole map in xy and the high ground to river drop in z (see content/maps/readme.md).
SHOP_MESHES = [
    ((-4015.4841308594, -360.0, 368.0539550781), (5648.515625, 8920.0, 443.8538818359)),
    ((5200.5166015625, -360.0, 368.0539550781), (3567.4836425781, 8920.0, 443.8538818359)),
]


def dmx(src, dst, enc):
    subprocess.run([str(DMX), "-i", str(src), "-o", str(dst), "-oe", enc],
                   check=True, stdout=subprocess.DEVNULL)


def read(p):
    return Path(p).read_text(encoding="utf8")


def edit_camps(text):
    done = set()

    def sub(m):
        body = m.group(0)
        vm = re.search(r'"VolumeName" "string" "([^"]*)"', body)
        if not vm or vm.group(1) not in ANCIENT_CAMPS:
            return body
        for k, v in ANCIENT_PROPS.items():
            body, n = re.subn(r'("%s" "string" )"[^"]*"' % k, r'\1"%s"' % v, body)
            assert n == 1, (vm.group(1), k)
        done.add(vm.group(1))
        return body

    text = re.sub(r'"classname" "string" "npc_dota_neutral_spawner"[^}]*\}', sub, text)
    assert done == set(ANCIENT_CAMPS), set(ANCIENT_CAMPS) - done
    return text


def fmt(x):
    return ("%.10f" % x).rstrip("0").rstrip(".")


def edit_shop(text):
    starts = [m.start() for m in re.finditer(r'"CMapEntity"\n', text)]
    for m in re.finditer(r'"classname" "string" "trigger_shop"', text):
        i = max(s for s in starts if s < m.start())
        j = min([s for s in starts if s > m.start()] + [len(text)])
        seg = text[i:j]
        if re.search(r'\n\t+"origin" "vector3" "%s ' % FOUNTAIN_ORIGIN, seg) is None:
            continue
        parts = seg.split('"CMapMesh"\n')
        assert len(parts) == 1 + len(SHOP_MESHES), len(parts)
        for k, (centre, half) in enumerate(SHOP_MESHES, 1):
            p = parts[k]
            vi = p.index('"name" "string" "position:0"')
            a = p.index("[", vi) + 1
            b = p.index("]", a)
            verts = [tuple(map(float, s.strip().strip('",').split())) for s in p[a:b].strip().split("\n")]
            cur = [max(abs(v[ax]) for v in verts) for ax in range(3)]
            new = ['\n\t\t\t\t\t\t\t\t"%s"' % " ".join(
                fmt(v[ax] * half[ax] / cur[ax]) for ax in range(3)) for v in verts]
            p = p[:a] + ",".join(new) + "\n\t\t\t\t\t\t\t" + p[b:]
            p, n = re.subn(r'(\n\t\t\t"origin" "vector3" )"[^"]*"', r'\1"%s"' % " ".join(map(fmt, centre)), p, count=1)
            assert n == 1
            parts[k] = p
        return text[:i] + '"CMapMesh"\n'.join(parts) + text[j:]
    raise SystemExit("fountain trigger_shop not found")


def camps(text):
    out = {}
    for m in re.finditer(r'"classname" "string" "npc_dota_neutral_spawner"([^}]*)\}', text):
        props = dict(re.findall(r'"(\w+)" "string" "([^"]*)"', m.group(1)))
        out[props["VolumeName"]] = props
    return out


def shops(text):
    starts = [m.start() for m in re.finditer(r'"CMapEntity"\n', text)]
    res = []
    for m in re.finditer(r'"classname" "string" "trigger_shop"', text):
        i = max(s for s in starts if s < m.start())
        j = min([s for s in starts if s > m.start()] + [len(text)])
        seg = text[i:j]
        eo = re.search(r'\n\t"origin" "vector3" "([^"]*)"', seg).group(1)
        boxes = []
        for p in seg[:m.start() - i].split('"CMapMesh"\n')[1:]:
            vi = p.index('"name" "string" "position:0"')
            a = p.index("[", vi) + 1
            verts = [tuple(map(float, s.strip().strip('",').split())) for s in p[a:p.index("]", a)].strip().split("\n")]
            o = tuple(map(float, re.search(r'\n\t\t\t"origin" "vector3" "([^"]*)"', p).group(1).split()))
            lo = [o[ax] + min(v[ax] for v in verts) for ax in range(3)]
            hi = [o[ax] + max(v[ax] for v in verts) for ax in range(3)]
            boxes.append((lo, hi))
        res.append((eo, boxes))
    return res


def report(official_txt, final_txt):
    co, cf = camps(official_txt), camps(final_txt)
    print("== camps (name: NeutralType PullType Min Max), * = changed vs official")
    for k in sorted(cf):
        row = [cf[k][x] for x in ("NeutralType", "PullType", "MinSpawnType", "MaxSpawnType")]
        print("%s%-22s %s" % ("*" if cf[k] != co[k] else " ", k, row))
    changed = {k for k in cf if cf[k] != co[k]}
    assert len(cf) == 28 and changed <= set(ANCIENT_CAMPS), changed
    print("camps total", len(cf), "changed", len(changed))
    print("== trigger_shop world boxes (min / max), * = changed vs official")
    so, sf = shops(official_txt), shops(final_txt)
    assert len(so) == len(sf) == 3
    for a, b in zip(so, sf):
        print("%s entity %s" % ("*" if a != b else " ", b[0]))
        for lo, hi in b[1]:
            print("    ", [round(x) for x in lo], [round(x) for x in hi])
    assert sum(a != b for a, b in zip(so, sf)) == 1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--work", default=".", help="scratch dir for text files")
    ap.add_argument("--official-dir", default=str(DOTA / r"content\dota\maps"))
    ap.add_argument("--out-dir", default=str(Path(__file__).resolve().parents[4] / "content" / "maps"))
    a = ap.parse_args()
    work, off, out = Path(a.work), Path(a.official_dir), Path(a.out_dir)
    work.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(off / "dota.vmap", out / "dota.vmap")
    dmx(off / "prefabs" / "dota_pvp_prefab.vmap", work / "official_prefab.txt", "keyvalues2")
    text = read(work / "official_prefab.txt")
    (work / "edited_prefab.txt").write_text(edit_shop(edit_camps(text)), encoding="utf8", newline="\n")
    target = out / "prefabs" / "dota_pvp_prefab.vmap"
    dmx(work / "edited_prefab.txt", target, "binary")
    dmx(target, work / "final_prefab.txt", "keyvalues2")
    report(text, read(work / "final_prefab.txt"))
    print("wrote", target)


if __name__ == "__main__":
    sys.exit(main())
