---
name: plan-move
description: Build a practical moving checklist and labeled room-by-room packing inventory for a household or small office.
license: MIT
---

# Plan a move

1. Establish the moving date or target window, rooms involved, who is moving the items, and whether any items will go into storage. Use the information already given; mark unresolved details clearly.
2. Read [the moving checklist](../../resources/moving-checklist.md). Adapt its sequence to the user's move. Return a compact list grouped by preparation, packing, moving day and arrival, with the next three actions first.
3. Offer a local inventory in the schema below. Assign a different B001-style ID to each labeled box, record the actual room and contents, and leave unmeasured dimensions blank. For example rows, label them fictional. Keep sensitive addresses, access codes and personal documents outside the inventory.

   ```csv
   item_id,room,description,length_cm,width_cm,height_cm,quantity
   B001,Kitchen,Example packed plates,60,40,40,1
   ```

4. If the user wants a packed-volume total, use measured dimensions with the `packing-volume` skill's bundled script. Complete the plan with owners or dates only when known. Include items requiring confirmation with the building, mover or storage provider as explicit follow-ups.

The result is a checklist the user can act on and an inventory they can maintain locally. The toolkit does not supply prices, facility claims, promised unit fit or handling eligibility.

## العربية

أجب باللغة التي يطلبها المستخدم. عند العمل بالعربية، استخدم [قائمة التحقق العربية](../../resources/moving-checklist.ar.md) بدل القائمة الإنجليزية في الخطوات أعلاه، واكتب أسماء الغرف والمحتويات في الأمثلة بالعربية. أبقِ أسماء الأوامر وأعمدة CSV ومعرّفات الصناديق ثابتة، واحفظ لغة البيانات الموجودة في قائمة المستخدم.
