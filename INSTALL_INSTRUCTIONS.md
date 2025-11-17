# Installation Instructions

## Load the Extension in Your Browser

The extension has been built and is ready to use! Follow these steps:

### Chrome / Arc / Brave / Edge

1. **Open Extensions Page**:
   - Chrome: Navigate to `chrome://extensions/`
   - Arc: Navigate to `chrome://extensions/`
   - Brave: Navigate to `brave://extensions/`
   - Edge: Navigate to `edge://extensions/`

2. **Enable Developer Mode**:
   - Look for a toggle switch labeled "Developer mode" in the top right
   - Turn it ON

3. **Load the Extension**:
   - Click the "Load unpacked" button
   - Navigate to: `/Users/daniellauding/Work/instinctly/internal/plotta-ext/dist`
   - Click "Select" or "Open"

4. **Pin the Extension** (Optional but recommended):
   - Click the puzzle piece icon in your browser toolbar
   - Find "Plotta - Quick Notes"
   - Click the pin icon to keep it visible

### First Use

1. Click the Plotta extension icon in your toolbar
2. Sign in with your Plotta account credentials
3. If you don't have an account, click "Sign Up"
4. Once signed in, you're ready to start creating sticky notes!

## Quick Test

1. Select some text on this page
2. Click the Plotta extension icon
3. Click "Selection" button
4. Choose your color, priority, tags, and project
5. Click "Create Sticky Note"
6. Open your Plotta web app to see your new sticky note!

## Troubleshooting

### Icons Not Showing
The current icon files are SVG (not true PNG). For best results:
- Convert the SVG files in `icons/` folder to PNG using:
  - Online converter: https://convertio.co/svg-png/
  - Design tool: Figma, Photoshop, etc.
- Or just use the extension with the current SVG files (works fine)

### Extension Errors
- Check the console in `chrome://extensions/` by clicking "Errors"
- Make sure all dependencies installed: `npm install`
- Rebuild: `npm run build`
- Reload the extension after rebuild

### Can't Sign In
- Verify internet connection
- Check Supabase credentials in `.env` file
- Clear browser cache and try again

## Next Steps

- Customize the design in `styles.css`
- Add your own branding/icons
- Test all features
- Share feedback!

## For Safari

Safari requires additional conversion:
1. Install Xcode from Mac App Store
2. Use Xcode's web extension converter
3. See: https://developer.apple.com/documentation/safariservices/safari_web_extensions

## Support

For issues or questions, check:
- README.md for detailed documentation
- QUICK_START.md for development setup
- GitHub Issues: https://github.com/daniellauding/plotta-ext/issues
