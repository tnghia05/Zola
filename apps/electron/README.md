# Zola Desktop (Electron)

Desktop application for Zola built with Electron.

## Features

- ✅ Full desktop app with native window controls
- ✅ Camera & Microphone permissions handling
- ✅ Auto-update via GitHub Releases
- ✅ Deep link support (`zola://invite/...`)
- ✅ System tray integration
- ✅ Screen sharing support
- ✅ Native notifications
- ✅ WebRTC/LiveKit integration for calls

## Development

### Prerequisites

- Node.js 18+
- pnpm

### Setup

```bash
# Install dependencies
pnpm install

# Run development mode
pnpm dev
```

This will:
1. Start Vite dev server for renderer (port 5173)
2. Launch Electron with hot reload

### Project Structure

```
apps/electron/
├── main/           # Main process (Electron)
│   ├── main.js     # Main entry point
│   └── preload.js  # Preload script (exposes electronAPI)
├── renderer/       # Renderer process (React + Vite)
│   └── src/        # React app source
└── package.json    # Root package with build config
```

## Building

### Development Build

```bash
pnpm build
```

### Production Build

```bash
# Build installer (NSIS)
pnpm build:installer

# Build portable
pnpm build:portable

# Build both
pnpm build:electron
```

Build outputs will be in `apps/electron/dist-electron/`.

## Configuration

### Auto-Update

See [AUTO_UPDATE_SETUP.md](./AUTO_UPDATE_SETUP.md) for detailed instructions on setting up GitHub Releases auto-update.

### Deep Links

The app supports deep links with format:
- `zola://invite/{inviteCode}`
- `zola://?code={inviteCode}`

### Environment Variables

- `GH_TOKEN`: GitHub Personal Access Token for auto-update (production builds)
- `NODE_ENV`: Set to `development` for dev mode

## WebRTC Compatibility

See [WEBRTC_COMPATIBILITY.md](./WEBRTC_COMPATIBILITY.md) for details on WebRTC socket event formats and compatibility across platforms.

## Troubleshooting

### Permissions Issues

- On Windows, ensure the app has camera/microphone permissions in Windows Settings
- The app will request permissions automatically when needed

### Build Issues

- Ensure `electron-builder` is installed: `pnpm install`
- Check that all dependencies are installed: `pnpm install`

### Auto-Update Not Working

- Verify `GH_TOKEN` is set
- Check `publish.owner` and `publish.repo` in `package.json`
- Ensure version in `package.json` is incremented

## Notes

- DevTools are enabled in development mode
- Production builds use file:// protocol for better Windows permission handling
- System tray is only available on Windows/Linux (not macOS)

