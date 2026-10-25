# Point Board Editor

This is a dependency-free, development-only editor for human-authored Regionwright point boards. Open `index.html` in a modern browser. It creates no deer or forest artwork: the author manually lights and erases cells, adds frames and layers, and exports the resulting JSON board data.

The exported format is validated by the H&G source helper and by `npm run build:hunting-gathering`. The editable JSON is the artwork; the module renderer turns those authored cells into cached Canvas frames. PNG downloads are visual previews only.

The editor autosaves in the current browser profile. Use **Download board JSON** to make a portable source copy before clearing or replacing a board. Keep accepted source JSON under `art-source/<Foundry module ID>/`; copy only the versioned runtime board JSON to the owning module's `assets/` directory. The editor is outside the module build and is not shipped to Foundry users.
