import csv
from decimal import Decimal
import io
import unittest

from wadaya_moving_kit import InventoryItem, packed_volume_m3, read_inventory, summarize, write_inventory


class InventoryTests(unittest.TestCase):
    def test_dimensions_and_quantity_in_cubic_metres(self):
        self.assertEqual(packed_volume_m3(60, 40, 40), Decimal("0.096"))
        self.assertEqual(packed_volume_m3("60.5", "40", "40", 3), Decimal("0.2904"))

    def test_invalid_measurements_and_quantities_are_rejected(self):
        for value in (0, -1, "NaN", "Infinity", True, "", "large"):
            with self.subTest(value=value), self.assertRaises(ValueError):
                packed_volume_m3(value, 40, 40)
        for count in (0, -1, 1.5, True, "2"):
            with self.subTest(count=count), self.assertRaises(ValueError):
                packed_volume_m3(60, 40, 40, count)

    def test_room_totals_and_unique_ids(self):
        items = [InventoryItem("B001", "Kitchen", "Box", 60, 40, 40),
                 InventoryItem("B002", "Kitchen", "Boxes", 60, 40, 40, 3),
                 InventoryItem("B003", "Office", "Archive boxes", 40, 30, 30, 2)]
        result = summarize(items)
        self.assertEqual(result["items"], 6)
        self.assertEqual(result["packed_volume_m3"], Decimal("0.456"))
        self.assertEqual(result["rooms"], {"Kitchen": Decimal("0.384"), "Office": Decimal("0.072")})
        with self.assertRaisesRegex(ValueError, "unique"):
            summarize([items[0], items[0]])

    def test_csv_round_trip_handles_quotes_commas_and_newlines(self):
        item = InventoryItem("B001", "Kitchen", 'Cups, "plates"\nand bowls', "60.5", 40, 40, 2)
        stream = io.StringIO(newline="")
        write_inventory([item], stream)
        stream.seek(0)
        self.assertEqual(read_inventory(stream), [item])

    def test_csv_import_recalculates_instead_of_trusting_a_total(self):
        stream = io.StringIO("\ufeffitem_id,room,description,length_cm,width_cm,height_cm,quantity,packed_volume_m3\nB001,Kitchen,Box,60,40,40,1,999\n")
        self.assertEqual(read_inventory(stream)[0].volume_m3, Decimal("0.096"))

    def test_bad_csv_headers_rows_and_duplicate_ids_fail(self):
        header = "item_id,room,description,length_cm,width_cm,height_cm,quantity\n"
        samples = ["room,description\nKitchen,Box\n", header + "B001,Kitchen,Box,60,40,40\n",
                   header + "B001,Kitchen,Box,60,40,40,1,extra\n",
                   header + "B001,Kitchen,Box,60,40,40,1\nB001,Office,Box,60,40,40,1\n"]
        for value in samples:
            with self.subTest(value=value), self.assertRaises(ValueError):
                read_inventory(io.StringIO(value))

    def test_formula_like_text_is_neutralized_for_spreadsheets(self):
        for text in ('=HYPERLINK("https://example.invalid")', "+SUM(1,2)", "-1+2", "@SUM(1,2)", "\t=1+2"):
            stream = io.StringIO(newline="")
            write_inventory([InventoryItem("B001", text, text, 60, 40, 40)], stream)
            row = list(csv.reader(io.StringIO(stream.getvalue())))[1]
            self.assertTrue(row[1].startswith("'"))
            self.assertTrue(row[2].startswith("'"))

    def test_planner_csv_import_defaults_to_one_box_and_requires_measurements(self):
        header = "Box ID,Room,Decision,Contents,Open first,Length (cm),Width (cm),Height (cm),Volume (m3),Packed,Location,Notes\n"
        row = "B001,Kitchen,Store,Cups,No,60,40,40,999,Yes,Shelf 1,Handle carefully\n"
        item = read_inventory(io.StringIO(header + row))[0]
        self.assertEqual(item.quantity, 1)
        self.assertEqual(item.description, "Cups")
        self.assertEqual(item.volume_m3, Decimal("0.096"))
        with self.assertRaisesRegex(ValueError, "Fill in length, width and height for B001"):
            read_inventory(io.StringIO(header + row.replace(",60,40,40,", ",,40,40,")))

    def test_unclosed_csv_quote_is_rejected(self):
        with self.assertRaises(csv.Error):
            read_inventory(io.StringIO('item_id,room,description,length_cm,width_cm,height_cm,quantity\nB001,Kitchen,"unfinished'))


if __name__ == "__main__":
    unittest.main()
