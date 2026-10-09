# Wadaya Storage Space Calculator

**English** · [العربية](README.ar.md)

Measure your boxes and furniture, record them by room and add up their volume in cubic metres. This helps you prepare an inventory before choosing a storage unit. The calculator works in your browser in English or Arabic. A Python library and command-line tool provide the same calculations without dependencies.

We built it at [Wadaya Self Storage](https://www.wadayaselfstorage.com/), where we rent air-conditioned storage units in Tubli, Bahrain. Measuring what you plan to store helps you compare sizes and avoid paying for more space than you need.

## Measure what you're storing

Open `web/index.html` in a modern browser and add items as you measure them, or select **Try an example inventory** to see a finished list: eight boxes from a kitchen, a bedroom, a living room and an office, totalling **0.528 m³**.

Measure each box after it's packed, and measure furniture with its wrapping on. That's the space it will actually take. An item's volume is its outer length × width × height, so a box of **60 × 40 × 40 cm** is **0.096 m³**.

Your list lives in the current tab, so download the CSV before you close it, and use **Open CSV** to pick it up again later. Switching between English and Arabic keeps everything you've entered.

Give each box its own ID, such as B001, with a quantity of 1, and write the same ID on the box. Identical items you don't need to tell apart can share a row: a group ID such as BEDDING with a quantity of 3 means three items in that group.

## Choose a storage unit size

The calculator gives packed volume in cubic metres. Storage units are rented by floor area in square metres, so the total is a starting point rather than a unit recommendation.

For boxes that can be stacked, divide the volume by the stacking height to estimate the floor area. For example, 3 m³ stacked 1.5 m high covers about 2 m² before allowing for gaps and access. Use a height that the boxes can support and that lets you lift them down safely.

Furniture needs more thought. Check that your longest pieces fit inside the unit and that every piece fits through the doorway. A sofa or wardrobe needs floor space even when the space above it is hard to use. Measure dismantled furniture as separate pieces, the way you will store it.

Our units range from 1.5 to 25 m². Leave room to reach things you will collect during storage. If you are unsure about a size, mark out its floor area at home and check how your largest pieces fit.

For business stock, measure what you expect to hold at the busiest time of year, including packaging and returns. For furniture storage during a renovation, measure what will be out of the house at the same time.

## What's in this repository

- `web/`: the calculator, a static page in English and Arabic that opens and downloads CSV files. No build step, remote scripts, tracking, accounts or uploads.
- `src/wadaya_moving_kit/`: the Python 3.10+ library and command-line tool, with no runtime dependencies.
- `examples/example-inventory.csv`: a fictional inventory of eight boxes, B001 to B008.
- `claude-plugin/`: a Claude Code plugin with two skills, checklists in English and Arabic, and a local Python launcher.
- `tests/`: checks for the arithmetic, invalid input, CSV handling and spreadsheet safety.

## Python package and command line

Install a downloaded wheel, or install from the project folder. The wheel brings no dependencies.

```bash
python3 -m pip install ./wadaya_moving_kit-0.1.0-py3-none-any.whl
wadaya-moving-kit volume 60 40 40 --quantity 4
wadaya-moving-kit summary examples/example-inventory.csv
wadaya-moving-kit summary examples/example-inventory.csv --json
wadaya-moving-kit export examples/example-inventory.csv my-inventory.csv
```

`volume` returns `0.384 m³` for four boxes of that size. `export` creates a new file and refuses to replace an existing one; input files are never changed.

To run from an unpacked copy without installing:

```bash
PYTHONPATH=src python3 -m wadaya_moving_kit summary examples/example-inventory.csv
```

To use the same calculation in your own Python code, import `packed_volume_m3` and `summarize` from `wadaya_moving_kit`.

## CSV format

```csv
item_id,room,description,length_cm,width_cm,height_cm,quantity
B001,Kitchen,Serving dishes and trays,60,40,40,1
```

Each `item_id` is unique, 1–32 characters long, made of letters, digits, hyphens or underscores, and starts with a letter or digit. `room` and `description` are required. Dimensions are positive numbers in centimetres, and `quantity` is a positive whole number. Export adds a calculated `packed_volume_m3` column; import ignores it and recalculates from the dimensions.

The calculator and the CLI also open `box-inventory.csv` from the Wadaya planner directly. They read `Box ID`, `Room`, `Contents`, `Length (cm)`, `Width (cm)` and `Height (cm)`, and count every row as one box, whatever its `Decision`. The planner's other columns stay in the planner file.

If a room or description starts with `=`, `+`, `-` or `@`, export puts an apostrophe in front so spreadsheet software reads it as text, not a formula.

## Privacy

The library, the CLI and the calculator contain no code that sends anything over the network. The calculator holds your list in page memory and doesn't save it to browser storage, and files you download stay on your device. The example inventory is fictional; if you publish a copy of this project, keep real inventories out of it.

The Claude plugin also calculates locally, but Claude may process anything you paste into the chat or ask it to read, so use an inventory with personal details removed. The plugin sends no data to Wadaya and declares no connector or remote server.

MIT licensed. Questions are welcome at [hello@wadayaselfstorage.com](mailto:hello@wadayaselfstorage.com).
