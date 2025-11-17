# Plotta Browser Extension

A minimalistic browser extension for quickly capturing web content as sticky notes in Plotta.

## Features

- **Quick Capture**: Save current page or selected text as sticky notes
- **Full Supabase Auth**: Secure authentication with your Plotta account
- **Rich Customization**:
  - 8 color options
  - Priority levels (Low, Medium, High)
  - Tag management
  - Project organization
- **Right-click Context Menu**: Save selections directly from any webpage
- **Keyboard Shortcuts**: Quick save with Cmd+Shift+S (or Ctrl+Shift+S)

## Installation

### For Developers

1. **Clone the repository**:
   ```bash
   git clone https://github.com/daniellauding/plotta-ext.git
   cd plotta-ext
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the extension**:
   ```bash
   npm run build
   ```

4. **Load in Chrome/Arc**:
   - Open `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder

### For Safari

Safari requires additional steps:
1. Convert the extension using Xcode's web extension converter
2. See: https://developer.apple.com/documentation/safariservices/safari_web_extensions

## Usage

### First Time Setup

1. Click the Plotta extension icon in your browser toolbar
2. Sign in with your Plotta account (or create a new account)
3. Your projects will automatically load

### Creating Sticky Notes

**From Extension Popup**:
1. Click the extension icon
2. Enter title and content
3. Choose color, priority, and tags
4. Select a project
5. Click "Create Sticky Note"

**Capture Current Page**:
- Click "Current Page" button to auto-fill page title and URL

**Capture Selection**:
- Select text on any webpage
- Click "Selection" button to capture it

**Right-click Context Menu**:
- Select any text on a webpage
- Right-click → "Save to Plotta"
- Note is automatically created in your default project

**Keyboard Shortcut**:
- Select text and press `Cmd+Shift+S` (Mac) or `Ctrl+Shift+S` (Windows/Linux)

## Development

### Project Structure

```
plotta-ext/
├── src/
│   ├── popup.js          # Popup UI logic
│   ├── background.js     # Background service worker
│   ├── content.js        # Content script for page interaction
│   └── supabase.js       # Supabase client configuration
├── popup.html            # Popup HTML
├── styles.css            # Styles
├── manifest.json         # Extension manifest
├── webpack.config.js     # Webpack configuration
└── icons/                # Extension icons
```

### Available Scripts

- `npm run build` - Build for production
- `npm run dev` - Build and watch for changes

### Environment Variables

Create a `.env` file (already configured):
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
```

## Features in Detail

### Color Picker
8 predefined colors matching the Plotta app:
- Yellow, Orange, Red, Pink
- Purple, Blue, Sky, Green

### Priority Levels
- Low: For reference material
- Medium: Default priority
- High: Urgent or important notes

### Tags
- Add tags by typing and pressing Enter
- Tags are synced with your Plotta account
- Click × to remove a tag

### Projects
- Automatically syncs with your Plotta projects
- Creates a "Drafts" project if none exists
- All notes are organized by project

## Browser Compatibility

- ✅ Chrome (88+)
- ✅ Arc Browser
- ✅ Edge (88+)
- ✅ Brave
- ⚠️ Safari (requires conversion)
- ❌ Firefox (requires manifest v2 adaptation)

## Permissions Explained

- `activeTab`: Access current tab info when you click the extension
- `storage`: Store authentication session
- `contextMenus`: Add right-click menu options
- `https://*.supabase.co/*`: Connect to Supabase backend

## Troubleshooting

### Extension won't load
- Make sure you've run `npm run build` first
- Check that you're loading the `dist` folder, not the root folder

### Can't sign in
- Verify your Supabase credentials in `.env`
- Check browser console for errors
- Make sure you have an internet connection

### Notes not appearing in Plotta app
- Verify you're signed in with the same account
- Check that the correct project is selected
- Refresh your Plotta web app

## Security

- Authentication tokens are stored securely using Chrome's storage API
- All communication with Supabase is encrypted (HTTPS)
- No data is stored locally except authentication session

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use and modify!

## Support

For issues or questions:
- GitHub Issues: https://github.com/daniellauding/plotta-ext/issues
- Main Plotta App: https://app.plotta.io

---

Made with ❤️ for Plotta users
