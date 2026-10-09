"use strict";

(() => {
  const kit = globalThis.WadayaInventory;
  const translations = globalThis.WadayaMovingCopy;
  const form = document.querySelector("#item-form");
  const status = document.querySelector("#status");
  const error = document.querySelector("#form-error");
  const body = document.querySelector("#inventory-body");
  const total = document.querySelector("#total-volume");
  const languageSelect = document.querySelector("#language");
  let language = "en";
  let copy = translations.en;
  let formatter;
  let items = [];
  let announcement;
  let currentError;

  function nextId() {
    let index = 1;
    while (items.some(item => item.item_id === `B${String(index).padStart(3, "0")}`)) index++;
    return `B${String(index).padStart(3, "0")}`;
  }

  function translated(key, value) {
    return typeof copy[key] === "function" ? copy[key](value) : copy[key];
  }

  function showError(problem) {
    currentError = problem;
    const message = problem && (copy.errors[problem.code] || copy.errors.unexpected);
    error.textContent = typeof message === "function" ? message(problem.details || {}) : message || "";
    error.hidden = !problem;
  }

  function cell(text, className, direction) {
    const td = document.createElement("td");
    td.textContent = text;
    if (className) td.className = className;
    if (direction) td.dir = direction;
    return td;
  }

  function render(message) {
    if (message !== undefined) announcement = message;
    const summary = kit.summarize(items);
    total.textContent = summary.volume > 0 && summary.volume < 0.000001 ? "<0.000001" : formatter.format(summary.volume);
    document.querySelector("#item-count").textContent = copy.count(summary.count, items.length);
    const roomList = document.querySelector("#room-totals");
    roomList.replaceChildren();
    for (const [room, volume] of [...summary.rooms].sort(([a], [b]) => a.localeCompare(b, language))) {
      const li = document.createElement("li");
      const name = document.createElement("span"); name.textContent = room; name.dir = "auto";
      const amount = document.createElement("span"); amount.textContent = `${formatter.format(volume)} ${copy.unit}`; amount.dir = "auto";
      li.append(name, amount); roomList.append(li);
    }
    if (!items.length) {
      const li = document.createElement("li"); li.className = "muted"; li.textContent = copy.noRooms; roomList.append(li);
    }
    body.replaceChildren();
    for (const item of items) {
      const row = document.createElement("tr");
      const description = cell(item.description, null, "auto");
      const room = document.createElement("small"); room.textContent = item.room; room.dir = "auto"; description.append(room);
      const actions = document.createElement("td");
      const remove = document.createElement("button");
      remove.type = "button"; remove.className = "remove"; remove.textContent = copy.remove;
      remove.setAttribute("aria-label", copy.removeLabel(item.item_id));
      remove.addEventListener("click", () => {
        items = items.filter(value => value.item_id !== item.item_id);
        render({ key: "removed", value: item.item_id });
        form.elements.item_id.value = nextId();
        document.querySelector("#inventory-title").scrollIntoView({ block: "nearest" });
      });
      actions.append(remove);
      row.append(cell(item.item_id, null, "ltr"), description, cell(`${item.length_cm} × ${item.width_cm} × ${item.height_cm}`, null, "ltr"), cell(item.quantity, "numeric", "ltr"), cell(formatter.format(kit.packedVolume(item)), "numeric", "ltr"), actions);
      body.append(row);
    }
    document.querySelector("#empty-state").hidden = items.length > 0;
    document.querySelector("#table-container").hidden = !items.length;
    document.querySelector("#export-button").disabled = !items.length;
    document.querySelector("#clear-button").disabled = !items.length;
    document.querySelector("#example-button").disabled = items.length > 0;
    status.textContent = announcement ? translated(announcement.key, announcement.value) : "";
  }

  function setLanguage(value) {
    language = value === "ar" ? "ar" : "en";
    copy = translations[language];
    formatter = new Intl.NumberFormat(language === "ar" ? "ar-BH" : "en", { minimumFractionDigits: 3, maximumFractionDigits: 6 });
    document.documentElement.lang = language === "ar" ? "ar-BH" : "en";
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.title = copy.title;
    document.querySelector('meta[name="description"]').content = copy.metaDescription;
    const website = `https://www.wadayaselfstorage.com/${language === "ar" ? "ar" : ""}`;
    document.querySelector(".brand").href = website;
    document.querySelector(".provider-link").href = website;
    languageSelect.value = language;
    for (const element of document.querySelectorAll("[data-i18n]")) element.textContent = copy[element.dataset.i18n];
    if (language === "en") document.querySelector("#page-title").replaceChildren("Give your move", document.createElement("br"), "a little more order.");
    for (const element of document.querySelectorAll("[data-i18n-placeholder]")) element.placeholder = copy[element.dataset.i18nPlaceholder];
    for (const element of document.querySelectorAll("[data-i18n-aria-label]")) element.setAttribute("aria-label", copy[element.dataset.i18nAriaLabel]);
    document.querySelector("#rooms").replaceChildren(...copy.rooms.map(room => {
      const option = document.createElement("option"); option.value = room; return option;
    }));
    showError(currentError);
    render();
  }

  form.addEventListener("invalid", event => {
    event.preventDefault();
    const first = form.querySelector(":invalid");
    const code = first.name === "item_id" ? "itemId" : ["room", "description"].includes(first.name) ? "requiredText" : first.name === "quantity" ? "quantity" : "dimensions";
    showError({ code });
    if (event.target === first) first.focus();
  }, true);
  form.addEventListener("input", () => showError(null));
  form.addEventListener("submit", event => {
    event.preventDefault(); showError(null);
    try {
      const item = kit.normalizeItem(Object.fromEntries(new FormData(form)));
      items = kit.validateInventory([...items, item]);
      render({ key: "added", value: item.item_id });
      form.elements.item_id.value = nextId();
      form.elements.description.value = "";
      form.elements.description.focus();
    } catch (problem) { showError(problem); }
  });

  document.querySelector("#example-button").addEventListener("click", () => {
    const roomIndexes = [0, 1, 1, 1, 2, 2, 3, 3];
    items = kit.validateInventory(copy.exampleNames.map((description, index) => ({
      item_id: `B${String(index + 1).padStart(3, "0")}`, room: copy.rooms[roomIndexes[index]], description,
      length_cm: index < 4 ? 60 : 40, width_cm: index < 4 ? 40 : 30, height_cm: index < 4 ? 40 : 30, quantity: 1,
    })));
    form.elements.item_id.value = nextId(); showError(null);
    render({ key: "exampleLoaded" });
  });

  document.querySelector("#clear-button").addEventListener("click", () => {
    if (!window.confirm(copy.confirmClear)) return;
    items = []; form.elements.item_id.value = nextId(); showError(null); render({ key: "cleared" });
  });

  document.querySelector("#export-button").addEventListener("click", () => {
    const url = URL.createObjectURL(new Blob([kit.toCsv(items)], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "wadaya-moving-inventory.csv";
    document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    announcement = { key: "downloaded" };
    status.textContent = translated(announcement.key);
  });

  document.querySelector("#csv-file").addEventListener("change", async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      const imported = kit.fromCsv(await file.text(), copy);
      if (items.length && !window.confirm(copy.confirmReplace)) return;
      items = imported; form.elements.item_id.value = nextId(); showError(null);
      render({ key: "opened", value: items.length });
    } catch (problem) { showError(copy.errors[problem.code] ? problem : { code: "readFile" }); }
    finally { event.target.value = ""; }
  });

  languageSelect.addEventListener("change", event => setLanguage(event.target.value));
  const requested = new URLSearchParams(window.location.search).get("lang");
  setLanguage(requested || "en");
})();
