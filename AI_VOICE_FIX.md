# Fix AI Voice - Manual Steps

## Problem
The AI page is using the old `ttsService` instead of `isaVoiceService`, which means it doesn't respect user voice preferences.

## Solution
Replace these lines in `/root/INOVAFINANCE/src/pages/AI.tsx`:

### Line 310 (inside speak function):
**FROM:**
```typescript
await speakTts(processedText);
```

**TO:**
```typescript
await isaSpeak(processedText, 'ai');
```

### Line 319 (inside handleStopSpeaking):
**FROM:**
```typescript
stopTtsSpeaking();
```

**TO:**
```typescript
inovaStop();
```

### Line 258 (inside useEffect cleanup):
**FROM:**
```typescript
stopTtsSpeaking();
```

**TO:**
```typescript
inovaStop();
```

### Line 165 (voiceEnabled initialization):
**FROM:**
```typescript
const [voiceEnabled, setVoiceEnabled] = useState(true);
```

**TO:**
```typescript
const [voiceEnabled, setVoiceEnabled] = useState(() => isVoiceEnabled());
```

## Result
After these changes, the AI will use the INOVA voice system which:
- Respects user preference (ElevenLabs vs Browser)
- Respects voice gender selection
- Uses the same voice as other pages
