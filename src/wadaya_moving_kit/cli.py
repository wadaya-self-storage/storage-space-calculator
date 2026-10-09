"""Local-only command line entry point."""

import argparse
import csv
import json
from pathlib import Path
import sys

from .inventory import packed_volume_m3, read_inventory, summarize, write_inventory


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Estimate packed volume and work with a local moving inventory.")
    commands = parser.add_subparsers(dest="command", required=True)
    volume = commands.add_parser("volume", help="Calculate the outer volume of identical items, in cm.")
    for dimension in ("length", "width", "height"):
        volume.add_argument(dimension)
    volume.add_argument("--quantity", type=int, default=1)
    summary = commands.add_parser("summary", help="Show inventory counts and packed volume by room.")
    summary.add_argument("csv", type=Path)
    summary.add_argument("--json", action="store_true", help="Write decimal values as JSON strings.")
    export = commands.add_parser("export", help="Create a spreadsheet-safe CSV with calculated volumes.")
    export.add_argument("input", type=Path)
    export.add_argument("output", type=Path, help="A new output file; existing files are kept.")
    args = parser.parse_args(argv)
    try:
        if args.command == "volume":
            result = packed_volume_m3(args.length, args.width, args.height, args.quantity)
            print(f"{result} m³ packed volume (planning estimate)")
            return 0
        path = args.csv if args.command == "summary" else args.input
        with path.open(encoding="utf-8-sig", newline="") as stream:
            items = read_inventory(stream)
        if args.command == "export":
            with args.output.open("x", encoding="utf-8", newline="") as stream:
                write_inventory(items, stream)
            print(f"Saved {len(items)} rows to {args.output}")
            return 0
        result = summarize(items)
        if args.json:
            print(json.dumps(result, default=str, indent=2, ensure_ascii=False))
        else:
            print(f"{result['items']} items in {result['rows']} inventory rows")
            print(f"{result['packed_volume_m3']} m³ packed volume (planning estimate)")
            for room, value in result["rooms"].items():
                print(f"  {room}: {value} m³")
            print("This does not predict unit fit, stacking, access space or rent.")
        return 0
    except (OSError, ValueError, csv.Error) as error:
        print(f"Error: {error}", file=sys.stderr)
        return 2
