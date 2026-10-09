"use strict";

globalThis.WadayaInventory = (() => {
  const inputFields = ["item_id", "room", "description", "length_cm", "width_cm", "height_cm", "quantity"];
  const exportFields = [...inputFields, "packed_volume_m3"];
  const plannerFields = { item_id: "Box ID", room: "Room", description: "Contents", length_cm: "Length (cm)", width_cm: "Width (cm)", height_cm: "Height (cm)" };
  const plannerMetadata = ["Decision", "Open first", "Volume (m3)", "Packed", "Location", "Notes"];

  function inputError(code, message, details = {}) {
    return Object.assign(new Error(message), { code, details });
  }

  function normalizeItem(raw) {
    const item = {
      item_id: String(raw.item_id ?? "").trim(), room: String(raw.room ?? "").trim(),
      description: String(raw.description ?? "").trim(), length_cm: Number(raw.length_cm),
      width_cm: Number(raw.width_cm), height_cm: Number(raw.height_cm), quantity: Number(raw.quantity),
    };
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$/.test(item.item_id)) throw inputError("itemId", "Use a unique item ID with 1–32 letters, digits, hyphens or underscores.");
    if (!item.room || !item.description) throw inputError("requiredText", "Enter a room and item name.");
    if ([item.length_cm, item.width_cm, item.height_cm].some(value => !Number.isFinite(value) || value <= 0)) throw inputError("dimensions", "Enter positive, finite outer dimensions in centimetres.");
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) throw inputError("quantity", "Quantity must be a positive whole number.");
    const volume = packedVolume(item);
    if (!Number.isFinite(volume) || volume <= 0) throw inputError("itemRange", "These dimensions are outside the calculation range.");
    return item;
  }

  function packedVolume(item) {
    return item.length_cm * item.width_cm * item.height_cm * item.quantity / 1_000_000;
  }

  function validateInventory(items) {
    const result = items.map(normalizeItem);
    if (new Set(result.map(item => item.item_id)).size !== result.length) throw inputError("duplicateId", "Each inventory row needs a unique item ID.");
    if (!Number.isFinite(result.reduce((total, item) => total + packedVolume(item), 0))) throw inputError("totalRange", "The inventory total is outside the calculation range.");
    return result;
  }

  function summarize(items) {
    const rooms = new Map();
    let volume = 0;
    let count = 0;
    for (const item of items) {
      const value = packedVolume(item);
      volume += value;
      count += item.quantity;
      rooms.set(item.room, (rooms.get(item.room) ?? 0) + value);
    }
    return { volume, count, rooms };
  }

  function csvCell(value, isText = false) {
    let text = String(value);
    if (isText && /^[=+\-@]/.test(text.trimStart())) text = "'" + text;
    return /[",\r\n]/.test(text) ? '"' + text.replaceAll('"', '""') + '"' : text;
  }

  function toCsv(items) {
    const valid = validateInventory(items);
    const rows = valid.map(item => exportFields.map(field => csvCell(field === "packed_volume_m3" ? packedVolume(item) : item[field], field === "room" || field === "description")).join(","));
    return [exportFields.join(","), ...rows, ""].join("\r\n");
  }

  function fromCsv(text, labels = {}) {
    text = text.replace(/^\uFEFF/, "");
    const rows = [];
    let row = [], value = "", quoted = false, closedQuote = false;
    const finishRow = () => {
      row.push(value);
      if (row.some(cell => cell !== "")) rows.push(row);
      row = []; value = ""; closedQuote = false;
    };
    for (let index = 0; index < text.length; index++) {
      const char = text[index];
      if (quoted) {
        if (char === '"' && text[index + 1] === '"') { value += '"'; index++; }
        else if (char === '"') { quoted = false; closedQuote = true; }
        else value += char;
      } else if (char === ",") { row.push(value); value = ""; closedQuote = false; }
      else if (char === "\n" || char === "\r") {
        if (char === "\r" && text[index + 1] === "\n") index++;
        finishRow();
      } else if (char === '"' && value === "" && !closedQuote) quoted = true;
      else if (closedQuote || char === '"') throw inputError("invalidQuote", "CSV contains an invalid quoted field.");
      else value += char;
    }
    if (quoted) throw inputError("unclosedQuote", "CSV has a quoted field that never closes.");
    if (row.length || value !== "" || closedQuote) finishRow();
    const fields = rows.shift() ?? [];
    const planner = Object.values(plannerFields).every(field => fields.includes(field));
    const required = planner ? Object.values(plannerFields) : inputFields;
    const allowed = planner ? [...required, ...plannerMetadata] : exportFields;
    if (new Set(fields).size !== fields.length || required.some(field => !fields.includes(field)) || fields.some(field => !allowed.includes(field))) throw inputError("columns", "Use a Moving Kit CSV or a Wadaya planner CSV with its box ID, room, contents and dimension columns.");
    return validateInventory(rows.map((cells, index) => {
      if (cells.length !== fields.length) throw inputError("rowLength", `CSV row ${index + 2} does not match the header.`, { row: index + 2 });
      let raw = Object.fromEntries(fields.map((field, i) => [field, cells[i]]));
      if (planner) {
        raw = Object.fromEntries(Object.entries(plannerFields).map(([field, column]) => [field, raw[column]]));
        raw.quantity = "1";
        raw.room = raw.room.trim() || labels.unspecifiedRoom || "Unspecified room";
        raw.description = raw.description.trim() || labels.unspecifiedContents || "Box (contents not listed)";
      }
      if (["length_cm", "width_cm", "height_cm"].some(field => !raw[field].trim())) throw inputError("missingDimensions", `CSV row ${index + 2}: fill in length, width and height for ${raw.item_id || "this unlabeled row"} before calculating.`, { row: index + 2, id: raw.item_id });
      if (!/^\d+$/.test(raw.quantity.trim())) throw inputError("rowQuantity", `CSV row ${index + 2} needs a positive whole-number quantity.`, { row: index + 2 });
      return raw;
    }));
  }

  return { normalizeItem, validateInventory, packedVolume, summarize, toCsv, fromCsv };
})();
