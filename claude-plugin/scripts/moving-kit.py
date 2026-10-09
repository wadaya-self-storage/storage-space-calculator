"""Run the bundled library without installation or downloading packages."""

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "python"))

from wadaya_moving_kit.cli import main

raise SystemExit(main())
