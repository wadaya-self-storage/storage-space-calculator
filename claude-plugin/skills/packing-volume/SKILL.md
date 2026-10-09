---
name: packing-volume
description: Calculate packed volume from measured outer dimensions or summarize a local moving-inventory CSV by room.
license: MIT
---

# Calculate packed volume

1. Establish whether the user wants one item calculation or a local CSV summary. Ask for measured outer length, width and height in centimetres and a positive whole-number quantity when those inputs are missing. Keep private contents out of chat by using an anonymized inventory; a user can run the script directly for local-only results.
2. Run the bundled Python tool in Claude Code:

   ```bash
   python3 "${CLAUDE_PLUGIN_ROOT}/scripts/moving-kit.py" volume 60 40 40 --quantity 1
   python3 "${CLAUDE_PLUGIN_ROOT}/scripts/moving-kit.py" summary "./redacted-inventory.csv" --json
   ```

   Substitute the user's values and selected file. Python 3.10+ is required. If it is unavailable, show the formula and the exact command they can run on a suitable machine.
3. Report the packed volume in m³ and room totals when available. Explain that outer volume is a planning estimate; actual fit depends on stacking, gaps, access and doorways. Use one ID per labeled box. Quantities above one identify aggregate item groups.
4. For CSV issues, identify the missing measurement or duplicate ID and help correct that row. Accept the Moving Kit schema or Wadaya planner headers; planner metadata is ignored and every row counts as one box.

Example: 60 × 40 × 40 cm gives 0.096 m³ for one box, or 0.384 m³ for four. Refer to [the checklist](../../resources/moving-checklist.md) when the user also needs packing steps.

## العربية

أجب باللغة التي يطلبها المستخدم. عند العمل بالعربية، استخدم [قائمة التحقق العربية](../../resources/moving-checklist.ar.md) بدل القائمة الإنجليزية في الخطوات أعلاه، واكتب أسماء الغرف والمحتويات في الأمثلة بالعربية. أبقِ أسماء الأوامر وأعمدة CSV ومعرّفات الصناديق ثابتة، واحفظ لغة البيانات الموجودة في قائمة المستخدم.
