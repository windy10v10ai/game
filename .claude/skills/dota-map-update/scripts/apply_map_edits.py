#!/usr/bin/env python3
"""Redo the hand edits on a fresh official dota_pvp_prefab.vmap, then verify.

Usage: python apply_map_edits.py --baseline OLD_PREFAB.vmap [--work DIR] [--official-dir DIR] [--out-dir DIR]

OLD_PREFAB is the previous prefab that carries the hand edits (save
`git show develop:content/maps/prefabs/dota_pvp_prefab.vmap` to a file before running).
The script copies the official dota.vmap, converts the official prefab to text with
dmxconvert, turns 6 camps into ancient camps, moves the two fountain trigger_shop
geometries over from OLD_PREFAB, writes the binary prefab, converts it back and
prints a report. The report asserts that the geometry is vertex-for-vertex identical
to OLD_PREFAB and that nothing else changed.
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


def mesh_vertices(region):
    """Per child mesh: (world origin, local vertex list)."""
    res = []
    for p in region.split('"CMapMesh"\n')[1:]:
        vi = p.index('"name" "string" "position:0"')
        a = p.index("[", vi) + 1
        verts = [tuple(map(float, s.strip().strip('",').split()))
                 for s in p[a:p.index("]", a)].strip().split("\n")]
        o = tuple(map(float, re.search(r'\n\t\t\t"origin" "vector3" "([^"]*)"', p).group(1).split()))
        res.append((o, verts))
    return res


def shop_entities(text):
    """Every trigger_shop entity with the text range of its child meshes."""
    starts = [m.start() for m in re.finditer(r'"CMapEntity"\n', text)]
    out = []
    for m in re.finditer(r'"classname" "string" "trigger_shop"', text):
        i = max(s for s in starts if s < m.start())
        j = min([s for s in starts if s > m.start()] + [len(text)])
        seg = text[i:j]
        eo = tuple(map(float, re.search(r'\n\t"origin" "vector3" "([^"]*)"', seg).group(1).split()))
        a = i + seg.index('"CMapMesh"\n')
        b = i + seg.index('\n\t]\n\t"variableTargetKeys"')
        world = [sorted(tuple(round(o[ax] + v[ax], 3) for ax in range(3)) for v in verts)
                 for o, verts in mesh_vertices(text[a:b])]
        lo = [min(p[ax] for w in world for p in w) for ax in range(3)]
        hi = [max(p[ax] for w in world for p in w) for ax in range(3)]
        vol = (hi[0] - lo[0]) * (hi[1] - lo[1]) * (hi[2] - lo[2])
        out.append({"origin": eo, "a": a, "b": b, "world": world, "lo": lo, "hi": hi, "volume": vol})
    return out


def fountain_shops(text):
    """Radiant fountain (entity origin x < 0) and dire fountain (largest trigger on the x > 0 side)."""
    ents = shop_entities(text)
    rad = [e for e in ents if e["origin"][0] < 0]
    dire = [e for e in ents if e["origin"][0] > 0]
    assert len(rad) == 1, len(rad)
    return {"radiant": rad[0], "dire": max(dire, key=lambda e: e["volume"])}


def edit_shop(text, baseline):
    """Move the fountain triggers' child meshes (world-space geometry) over from the baseline."""
    old, new = fountain_shops(baseline), fountain_shops(text)
    # Replace the later entity first so earlier offsets stay valid.
    for role in sorted(new, key=lambda r: -new[r]["a"]):
        o, n = old[role], new[role]
        old_parts = baseline[o["a"]:o["b"]].split('"CMapMesh"\n')
        new_parts = text[n["a"]:n["b"]].split('"CMapMesh"\n')
        assert len(old_parts) == len(new_parts), (role, len(old_parts), len(new_parts))
        # Keep the new file's node ids so nothing collides with the rest of the map.
        for k in range(1, len(old_parts)):
            for pat in (r'"nodeID" "int" "\d+"', r'"referenceID" "uint64" "0x[0-9a-f]+"'):
                keep = re.search(pat, new_parts[k]).group(0)
                old_parts[k] = re.sub(pat, lambda _m, keep=keep: keep, old_parts[k], count=1)
        text = text[:n["a"]] + '"CMapMesh"\n'.join(old_parts) + text[n["b"]:]
    return text


def camps(text):
    out = {}
    for m in re.finditer(r'"classname" "string" "npc_dota_neutral_spawner"([^}]*)\}', text):
        props = dict(re.findall(r'"(\w+)" "string" "([^"]*)"', m.group(1)))
        out[props["VolumeName"]] = props
    return out


def report(official_txt, final_txt, baseline_txt):
    co, cf = camps(official_txt), camps(final_txt)
    print("== camps (name: NeutralType PullType Min Max), * = changed vs official")
    for k in sorted(cf):
        row = [cf[k][x] for x in ("NeutralType", "PullType", "MinSpawnType", "MaxSpawnType")]
        print("%s%-22s %s" % ("*" if cf[k] != co[k] else " ", k, row))
    changed = {k for k in cf if cf[k] != co[k]}
    assert len(cf) == 28 and changed <= set(ANCIENT_CAMPS), changed
    print("camps total", len(cf), "changed", len(changed))

    print("== fountain trigger_shop (world bounding boxes), * = differs from official")
    fo, ff, fb = fountain_shops(official_txt), fountain_shops(final_txt), fountain_shops(baseline_txt)
    for role in ("radiant", "dire"):
        same = ff[role]["world"] == fb[role]["world"]
        print("%s %s entity %s min %s max %s, vertices identical to baseline: %s" % (
            "*" if ff[role]["world"] != fo[role]["world"] else " ", role, ff[role]["origin"],
            [round(x) for x in ff[role]["lo"]], [round(x) for x in ff[role]["hi"]], same))
        assert same, role
    fa = {e["a"] for e in ff.values()}
    others_f = [e["world"] for e in shop_entities(final_txt) if e["a"] not in fa]
    oa = {e["a"] for e in fo.values()}
    others_o = [e["world"] for e in shop_entities(official_txt) if e["a"] not in oa]
    assert others_f == others_o, "other trigger_shop changed"
    print("other trigger_shop entities unchanged:", len(others_f))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--baseline", required=True, help="previous prefab .vmap with the hand edits")
    ap.add_argument("--work", default=".", help="scratch dir for text files")
    ap.add_argument("--official-dir", default=str(DOTA / r"content\dota\maps"))
    ap.add_argument("--out-dir", default=str(Path(__file__).resolve().parents[4] / "content" / "maps"))
    a = ap.parse_args()
    work, off, out = Path(a.work), Path(a.official_dir), Path(a.out_dir)
    work.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(off / "dota.vmap", out / "dota.vmap")
    dmx(off / "prefabs" / "dota_pvp_prefab.vmap", work / "official_prefab.txt", "keyvalues2")
    dmx(a.baseline, work / "baseline_prefab.txt", "keyvalues2")
    text, baseline = read(work / "official_prefab.txt"), read(work / "baseline_prefab.txt")
    (work / "edited_prefab.txt").write_text(edit_shop(edit_camps(text), baseline), encoding="utf8", newline="\n")
    target = out / "prefabs" / "dota_pvp_prefab.vmap"
    dmx(work / "edited_prefab.txt", target, "binary")
    dmx(target, work / "final_prefab.txt", "keyvalues2")
    report(text, read(work / "final_prefab.txt"), baseline)
    print("wrote", target)


if __name__ == "__main__":
    sys.exit(main())
