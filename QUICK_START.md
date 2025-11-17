# Quick Start Guide

Get your Plotta extension running in 5 minutes!

## Prerequisites

- Node.js installed (v16+)
- Chrome, Arc, or another Chromium-based browser
- A Plotta account (or create one through the extension)

## Setup Steps

### 1. Install Dependencies

```bash
cd plotta-ext
npm install
```

### 2. Add Icons (Temporary Placeholders)

For now, you can use any PNG images. Just rename them and place in the `icons/` folder:
- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

Or create simple colored squares using any image editor.

### 3. Build the Extension

```bash
npm run build
```

This creates a `dist/` folder with all the files needed.

### 4. Load in Browser

**Chrome/Arc/Brave:**

1. Open `chrome://extensions/`
2. Toggle "Developer mode" ON (top right)
3. Click "Load unpacked"
4. Select the `dist` folder inside `plotta-ext`

**Edge:**

1. Open `edge://extensions/`
2. Follow same steps as Chrome

### 5. Test It Out

1. Click the extension icon in your toolbar
2. Sign in with your Plotta account
3. Try capturing the current page or some selected text
4. Check your Plotta web app to see the new sticky note!

## Development Mode

To work on the extension with auto-rebuild:

```bash
npm run dev
```

This watches for changes and rebuilds automatically. You'll still need to click the reload button in `chrome://extensions/` after each rebuild.

## Common Issues

### "Module not found" error
Run `npm install` again

### Extension icon not showing
Make sure you have icon files in the `icons/` folder

### Can't sign in
- Check your internet connection
- Verify Supabase credentials in `.env` file
- Try signing up for a new account

### Changes not reflecting
- Rebuild: `npm run build`
- Go to `chrome://extensions/`
- Click the reload icon on the Plotta extension card

## Next Steps

- Customize the colors and styles in `styles.css`
- Add your own branding/icons
- Test all features (tags, projects, priorities)
- Share feedback or contribute!

## Need Help?

Check the main README.md for detailed documentation.
