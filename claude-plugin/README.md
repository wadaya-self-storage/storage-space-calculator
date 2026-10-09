# Wadaya Storage Prep

[العربية](README.ar.md)

Prepare your furniture and belongings for long-term storage while you are abroad. Tell Claude what you plan to store and when you leave. The plugin helps you make a checklist and a numbered box inventory, then calculates packed volume from your measurements.

We made this plugin at Wadaya Self Storage. We provide [self storage in Tubli, Bahrain](https://www.wadayaselfstorage.com/) for household belongings and business stock, with air conditioning around the clock and monthly rentals.

## Make a checklist and inventory

Claude lists the next three tasks, followed by the remaining preparation steps. Each box gets a number and a record of its room and contents. Write the same number on the box, and keep a copy of the inventory that you can open while you are away.

For a long stay, describe contents clearly. “Photo albums and framed family pictures” will be easier to search later than “living room things”. If someone may collect an item for you, record where its box sits in the unit too.

## Work out how much storage you need

Enter the outer measurements of packed boxes and furniture as they will be stored. The plugin adds up their volume in cubic metres on your computer.

Use the total as a starting point when comparing units. Furniture layout, stacking height and room to reach things also affect the floor space you need. Choosing a suitable size can reduce the monthly cost over a long rental. If you are storing with Wadaya, the team can help you compare sizes.

## Plan for the time you are away

For long-term storage in Bahrain, ask about air conditioning, humidity monitoring and security. At Wadaya, air conditioning runs around the clock at a setting of 25°C, with sensors monitoring temperature and humidity.

Rentals run month to month, so you can continue storing if your return date changes. Payments can be made online, monthly or in advance, while you are abroad.

## Using it in Claude Code

Install the plugin from Claude's plugin directory, or start Claude Code with a local copy:

```bash
claude --plugin-dir ./wadaya-moving-kit
```

Then tell Claude about your plans in your own words, or call either skill by name:

```text
/wadaya-moving-kit:plan-move
/wadaya-moving-kit:packing-volume
```

`plan-move` builds the checklist and the numbered box list from what you tell Claude. `packing-volume` totals the packed volume from your measurements or from a CSV of your boxes, using a small Python script that runs locally; it needs Python 3.10 or later and installs nothing. Both skills work in English and Arabic, and the plugin sends nothing to Wadaya.

Free to use under the MIT licence. For questions about the plugin, or about storing in Bahrain, write to [hello@wadayaselfstorage.com](mailto:hello@wadayaselfstorage.com).
