# VerifyAI - Project Context

## Current Status
**Build:** ✅ Passing
**Version:** 0.1.0
**Platform:** Chrome Extension (Manifest V3)

## What's Done
- ✅ Model selection system (Haiku, Sonnet, Opus)
- ✅ Latest Anthropic API models integrated
- ✅ Session management with tier-based throttling
- ✅ Screenshot capture and processing
- ✅ Claude API integration with error handling
- ✅ Runtime model ID debugging display
- ✅ UI with Settings, Session Status, Screenshot, Prompt, Response cards

## Architecture Overview

### Entry Points
- **Side Panel UI:** `src/panel.tsx` (React) → `dist/panel.js`
- **Service Worker:** `src/background.ts` → `dist/background.js`
- **Extension Manifest:** `manifest.json` (Chrome Manifest V3)

### Key Modules
- `src/adapters/claude-api.ts` - Anthropic SDK integration, image handling
- `src/session-manager.ts` - Usage tracking, tier logic, throttling
- `src/utils/usage-tracker.ts` - Daily limit reset, counter increments
- `src/utils/storage.ts` - Chrome storage + localStorage sync
- `src/utils/screenshot.ts` - Tab capture API

### Message Flow
```
Panel (UI) → chrome.runtime.sendMessage
           ↓
Background (Service Worker) → Routes to handler
           ↓
Returns updated ExtensionState → Panel re-renders
```

## Pricing Tiers
| Tier | Daily Limit | Throttle | Cost |
|------|-------------|----------|------|
| Free | 50 | 5s | $0 |
| Pro | 100 | 3s | $20/mo |
| Max | ∞ | 0s | $99/mo |

## Next Steps for Building

### Immediate (Quick Wins)
1. **Test extension locally in Chrome**
   - Load `dist/` as unpacked extension
   - Verify Ctrl+Shift+S hotkey works
   - Test each model selection
   
2. **Verify runtime behavior**
   - Check that correct model API ID shows in footer
   - Verify API calls use correct model
   - Test throttling at tier limits

3. **Add token tracking** (Optional)
   - Display input/output tokens in response
   - Show cost estimation by model

### Medium Term
1. **Conversation history** - Save/load past verifications
2. **Batch verification** - Process multiple screenshots at once
3. **Custom hotkeys** - Let users rebind capture key
4. **Settings persistence** - Remember UI preferences

### Later Phases
1. **Backend integration** - Replace localStorage with `/api/usage/*`
2. **Authentication** - User accounts, subscriptions via Stripe
3. **Multi-model chat** - Send to 2-3 models simultaneously
4. **Annotations** - Highlight, draw, blur before sending

## Key Files for Changes
- `src/panel.tsx` - UI and user interactions
- `src/background.ts` - Message routing and logic
- `src/adapters/claude-api.ts` - API calls
- `manifest.json` - Permissions and extension config

## Build/Dev Commands
```bash
npm run build      # One-time build
npm run watch      # Watch mode (file changes auto-rebuild)
npm run typecheck  # Type check only
npm run dev        # Alias for watch
```

## Testing Checklist Before Release
- [ ] Extension loads in Chrome without errors
- [ ] Hotkey captures screenshot correctly
- [ ] Each model returns different responses (verify via API ID)
- [ ] Tier limits work (50/100/∞)
- [ ] Throttling kicks in at soft ceilings
- [ ] Error messages display properly (no API key, rate limit, etc.)
- [ ] Reset countdown timer is accurate
- [ ] Switching tiers updates UI immediately
- [ ] Screenshot preview renders correctly
