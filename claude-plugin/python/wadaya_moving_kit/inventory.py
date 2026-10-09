"""Outer cuboid volumes; no stacking, aisle, doorway or unit-fit model."""

import csv
from dataclasses import dataclass
from decimal import Decimal, DecimalException
import re
from typing import Iterable, TextIO

INPUT_FIELDS = ("item_id", "room", "description", "length_cm", "width_cm", "height_cm", "quantity")
EXPORT_FIELDS = (*INPUT_FIELDS, "packed_volume_m3")
PLANNER_FIELDS = {
    "item_id": "Box ID", "room": "Room", "description": "Contents",
    "length_cm": "Length (cm)", "width_cm": "Width (cm)", "height_cm": "Height (cm)",
}
PLANNER_METADATA = {"Decision", "Open first", "Volume (m3)", "Packed", "Location", "Notes"}
ID_PATTERN = re.compile(r"[A-Za-z0-9][A-Za-z0-9_-]{0,31}\Z")


def _dimension(value: object) -> Decimal:
    if isinstance(value, bool):
        raise ValueError("Dimensions must be positive, finite numbers in centimetres.")
    try:
        result = Decimal(str(value))
    except (DecimalException, ValueError):
        raise ValueError("Dimensions must be positive, finite numbers in centimetres.") from None
    if not result.is_finite() or result <= 0:
        raise ValueError("Dimensions must be positive, finite numbers in centimetres.")
    return result


def _quantity(value: object) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value < 1:
        raise ValueError("Quantity must be a positive whole number.")
    return value


def packed_volume_m3(length_cm: object, width_cm: object, height_cm: object, quantity: int = 1) -> Decimal:
    """Return length × width × height × quantity / 1,000,000 in cubic metres."""
    dimensions = tuple(_dimension(value) for value in (length_cm, width_cm, height_cm))
    count = _quantity(quantity)
    try:
        result = dimensions[0] * dimensions[1] * dimensions[2] * count / Decimal(1_000_000)
    except DecimalException:
        raise ValueError("The dimensions are too large to calculate.") from None
    if not result.is_finite() or result <= 0:
        raise ValueError("The dimensions are outside the calculation range.")
    return result


@dataclass(frozen=True)
class InventoryItem:
    item_id: str
    room: str
    description: str
    length_cm: object
    width_cm: object
    height_cm: object
    quantity: int = 1

    def __post_init__(self) -> None:
        if not isinstance(self.item_id, str) or not ID_PATTERN.fullmatch(self.item_id):
            raise ValueError("Item IDs use 1–32 letters, digits, hyphens or underscores, starting with a letter or digit.")
        for field in ("room", "description"):
            value = getattr(self, field)
            if not isinstance(value, str) or not value.strip():
                raise ValueError(f"{field.capitalize()} is required.")
            object.__setattr__(self, field, value.strip())
        for field in ("length_cm", "width_cm", "height_cm"):
            object.__setattr__(self, field, _dimension(getattr(self, field)))
        _quantity(self.quantity)
        self.volume_m3

    @property
    def volume_m3(self) -> Decimal:
        return packed_volume_m3(self.length_cm, self.width_cm, self.height_cm, self.quantity)


def _items_once(items: Iterable[InventoryItem]) -> list[InventoryItem]:
    result = list(items)
    ids = [item.item_id for item in result]
    if len(ids) != len(set(ids)):
        raise ValueError("Each inventory row must have a unique item ID.")
    return result


def read_inventory(stream: TextIO) -> list[InventoryItem]:
    """Read the shared CSV schema; a calculated packed_volume_m3 column is ignored."""
    reader = csv.DictReader(stream, strict=True)
    fields = reader.fieldnames or []
    if fields and fields[0].startswith("\ufeff"):
        fields[0] = fields[0].lstrip("\ufeff")
    planner = all(field in fields for field in PLANNER_FIELDS.values())
    required = tuple(PLANNER_FIELDS.values()) if planner else INPUT_FIELDS
    allowed = set(PLANNER_FIELDS.values()) | PLANNER_METADATA if planner else set(EXPORT_FIELDS)
    if len(fields) != len(set(fields)) or any(field not in fields for field in required):
        raise ValueError("CSV needs the Moving Kit columns or the Wadaya planner's Box ID, Room, Contents and dimension columns.")
    if set(fields) - allowed:
        raise ValueError("CSV contains an unknown column. Use the documented inventory schema.")
    items = []
    for row in reader:
        try:
            if None in row or any(value is None for value in row.values()):
                raise ValueError("The number of values does not match the CSV header.")
            if planner:
                row = {field: row[column] for field, column in PLANNER_FIELDS.items()}
                row["quantity"] = "1"
                row["room"] = row["room"].strip() or "Unspecified room"
                row["description"] = row["description"].strip() or "Box (contents not listed)"
            if any(not row[field].strip() for field in ("length_cm", "width_cm", "height_cm")):
                raise ValueError(f"Fill in length, width and height for {row['item_id'] or 'this unlabeled row'} before calculating.")
            items.append(InventoryItem(
                item_id=row["item_id"], room=row["room"], description=row["description"],
                length_cm=row["length_cm"], width_cm=row["width_cm"], height_cm=row["height_cm"],
                quantity=int(row["quantity"]),
            ))
        except (ValueError, TypeError) as error:
            raise ValueError(f"CSV line {reader.line_num}: {error}") from None
    return _items_once(items)


def summarize(items: Iterable[InventoryItem]) -> dict:
    """Return row count, item count, exact total volume and room volumes."""
    items = _items_once(items)
    rooms: dict[str, Decimal] = {}
    for item in items:
        rooms[item.room] = rooms.get(item.room, Decimal(0)) + item.volume_m3
    return {
        "rows": len(items), "items": sum(item.quantity for item in items),
        "packed_volume_m3": sum((item.volume_m3 for item in items), Decimal(0)),
        "rooms": dict(sorted(rooms.items())),
    }


def _spreadsheet_text(value: str) -> str:
    # CSV quoting alone does not prevent a spreadsheet from interpreting formulas.
    return "'" + value if value.lstrip().startswith(("=", "+", "-", "@")) else value


def write_inventory(items: Iterable[InventoryItem], stream: TextIO) -> None:
    """Write spreadsheet-safe CSV. Prefix formula-like text with an apostrophe."""
    writer = csv.writer(stream)
    items = _items_once(items)
    writer.writerow(EXPORT_FIELDS)
    for item in items:
        writer.writerow((
            item.item_id, _spreadsheet_text(item.room), _spreadsheet_text(item.description),
            item.length_cm, item.width_cm, item.height_cm, item.quantity, item.volume_m3,
        ))
