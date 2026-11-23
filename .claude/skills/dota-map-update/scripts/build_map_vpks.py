#!/usr/bin/env python3
"""Turn the freshly compiled dota.vpk into the shipped dota.vpk with the Immortal Gardens effects.

Usage: python build_map_vpks.py [--work DIR] [--raw RAW.vpk]
Without --raw it reads game/maps/dota.vpk (the resourcecompiler output) and keeps a copy
in the work dir as dota_raw.vpk, so the script can be re-run without recompiling.

Steps: unpack the raw vpk and the official dota_coloseum.vpk, overlay the official
package on our files (Immortal Gardens effects), put our entities back on top, then write
dota.vpk. hard.vpk / custom.vpk are the plain resourcecompiler outputs and are left alone:
the engine looks the world up under maps/<map name>/ and the manifest names the original
path, so the effect package cannot be reused under another map name (see SKILL.md).
"""
import argparse
import shutil
import subprocess
from pathlib import Path

S2V = Path(r"C:\App\Source2Viewer\Source2Viewer-CLI.exe")
DOTA = Path(r"C:\Program Files (x86)\Steam\steamapps\common\dota 2 beta")
COLOSEUM = DOTA / r"game\dota\maps\dota_coloseum.vpk"


def s2v(*args):
    subprocess.run([str(S2V), *map(str, args), "-q"], check=True, stdout=subprocess.DEVNULL)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--work", default="map_build")
    ap.add_argument("--raw")
    ap.add_argument("--maps-dir", default=str(Path(__file__).resolve().parents[4] / "game" / "maps"))
    a = ap.parse_args()
    work, maps = Path(a.work).resolve(), Path(a.maps_dir)
    work.mkdir(parents=True, exist_ok=True)
    raw = Path(a.raw) if a.raw else work / "dota_raw.vpk"
    if not a.raw:
        shutil.copyfile(maps / "dota.vpk", raw)

    base, colo, merged = work / "base", work / "coloseum", work / "merged"
    for d in (base, colo, merged):
        shutil.rmtree(d, ignore_errors=True)
    s2v("-i", raw, "-o", base)
    s2v("-i", COLOSEUM, "-o", colo)

    shutil.copytree(base, merged)
    shutil.copytree(colo, merged, dirs_exist_ok=True)
    # The official entry file is a different map; ours stays the entry.
    (merged / "maps" / "dota_coloseum.vmap_c").unlink()
    # Our entities carry the hand edits (ancient camps, full-map shop).
    shutil.copytree(base / "maps" / "dota" / "entities", merged / "maps" / "dota" / "entities", dirs_exist_ok=True)

    def pack(src, name):
        out = work / (name + ".vpk")
        out.unlink(missing_ok=True)
        s2v("-i", src, "--vpk_create", out)
        shutil.copyfile(out, maps / (name + ".vpk"))
        print("wrote", maps / (name + ".vpk"), out.stat().st_size)

    pack(merged, "dota")


if __name__ == "__main__":
    main()
