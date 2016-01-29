# A Bootstrap based theme for DrupalGap 8

## Setup

1. Enable the Bootstrap Module for DrupalGap: https://github.com/signalpoint/bootstrap
2. Follow the Bootstrap Module's README.md: https://github.com/signalpoint/bootstrap/blob/8.x-1.x/README.md
3. Load the theme in the `<head>` of the `index.html` file, and configure the theme and its blocks in the `settings.js` file:

### index.html

```
<!-- DrupalGap Theme -->
<script src="themes/bean/bean.js"></script>
```

### settings.js

```
// The active theme.
drupalgap.settings.theme = {
  name: 'bean',
  path: 'themes/bean'
};

// Blocks for the "bean" theme.
drupalgap.settings.blocks.bean = {
  /* ... */
};
```