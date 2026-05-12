# Audio Technical Notes

This document describes the audio systems that exist in the current codebase.

## Scope

Audio is currently split into three runtime categories:

- `music`: looped background music
- `dialogue`: spoken dialogue audio linked to subtitles
- `sfx`: one-shot interaction and feedback sounds

The shared runtime service is `src/managers/AudioManager.ts`. User-facing volume settings live in `src/managers/stores/useSettingsStore.ts` and are forwarded to `AudioManager` by category.

## AudioManager

`AudioManager` is a singleton side-effect service. It owns browser audio elements, category volumes, pooled one-shot sounds, music playback, and stereo panning for one-shot sounds.

Supported public methods:

- `playMusic(path, volume)`: starts or updates a looped music track.
- `stopMusic()`: stops the active music track.
- `playSound(path, volume, options)`: plays a pooled one-shot sound and returns its `HTMLAudioElement`.
- `setCategoryVolume(category, volume)`: updates `music`, `sfx`, or `dialogue` volume.
- `getCategoryVolume(category)`: reads the current category volume.
- `destroy()`: stops music, clears pools, closes the audio context, and resets the singleton.

One-shot sounds are pooled by path with a maximum pool size per sound. If every element in a pool is busy, the pool grows until the limit, then recycles an existing element.

Browser autoplay restrictions are handled in `playMusic()`: if playback is blocked by the browser, the manager waits for a user `pointerdown` or `keydown`, then retries the music.

## Music

Runtime music is mounted by `src/world/GameMusic.tsx`.

Current behavior:

- `GameMusic` calls `AudioManager.getInstance().playMusic()` on mount.
- The current music path is `/sounds/musique/test.mp3`.
- The base music volume is `0.33` before category volume is applied.
- On unmount, `GameMusic` calls `stopMusic()`.

Effective music volume is:

```txt
base music volume * settings music volume
```

Use `music` only for long-running looped background tracks. Do not use `playSound()` for music, because one-shot pooling is designed for short overlapping sounds.

## Sound Effects

SFX are short one-shot sounds. They should use `AudioManager.playSound()` with the default category or with `{ category: "sfx" }`.

Example:

```ts
AudioManager.getInstance().playSound("/sounds/sfx/click.mp3", 0.8, {
  category: "sfx",
  pan: 0,
});
```

Useful options:

- `category`: `sfx` or `dialogue`; defaults to `sfx`.
- `pan`: stereo panning from `-1` left to `1` right.
- `playbackRate`: playback speed multiplier.

SFX volume is controlled by the settings menu through the `sfx` category volume.

## Dialogues

Runtime dialogue data lives under `public/sounds/dialogue/`.

```txt
public/
└── sounds/
    └── dialogue/
        ├── dialogues.json
        └── subtitles/
            ├── fr/
            │   ├── narrateur.srt
            │   ├── fermier.srt
            │   └── electricienne.srt
            └── en/
                ├── narrateur.srt
                ├── fermier.srt
                └── electricienne.srt
```

The dialogue manifest shape is defined in `src/types/dialogues/dialogues.ts`.

Each dialogue entry contains:

- `id`: stable dialogue identifier
- `voice`: voice group, currently `narrateur`, `fermier`, or `electricienne`
- `audio`: runtime audio path
- `subtitleCueIndex`: cue number inside that voice/language SRT file
- `timecode`: optional global trigger time in seconds from scene start

Dialogues are played through `src/utils/dialogues/playDialogue.ts`.

Important functions:

- `playDialogueById(manifest, dialogueId)`: plays a dialogue from an already loaded manifest.
- `queueDialogueById(manifest, dialogueId)`: queues dialogue playback so multiple requests do not overlap.
- `playGameplayDialogueById(dialogueId)`: loads the gameplay manifest once and queues a dialogue by ID.
- `clearQueuedDialogues()`: resolves pending dialogue requests and clears the queue.

Dialogue audio uses `AudioManager.playSound()` with `{ category: "dialogue" }`, so it follows the dialogue volume setting.

## Dialogue And SRT Link

The subtitle model is one SRT file per voice and language, not one SRT file per dialogue.

A dialogue chooses its subtitle by combining:

1. `voice`
2. selected subtitle language from settings
3. `subtitleCueIndex`

For example, this dialogue:

```json
{
  "id": "narrateur_bienvenueaaltera",
  "voice": "narrateur",
  "audio": "/sounds/dialogue/narrateur/bienvenueaaltera.mp3",
  "subtitleCueIndex": 1
}
```

loads cue `1` from:

```txt
public/sounds/dialogue/subtitles/fr/narrateur.srt
```

when the subtitle language is French, or from:

```txt
public/sounds/dialogue/subtitles/en/narrateur.srt
```

when the subtitle language is English.

If the selected language is missing, the loader falls back to French. Missing English SRT files are warnings during validation, not runtime errors.

SRT timecodes are relative to the dialogue audio file. They are not relative to the game clock and not relative to a cinematic timeline.

## Subtitle Runtime

`playDialogueById()` loads the matching subtitle cue with `loadDialogueSubtitleCue()` before playing the audio.

While audio plays:

- `timeupdate` checks `audio.currentTime`
- the active subtitle is written to `useSubtitleStore`
- `src/components/ui/Subtitles.tsx` renders the current speaker and text
- `ended` and `pause` clear the subtitle

The subtitle overlay respects settings from `useSettingsStore`, including visibility and selected language.

## Global Timecode Dialogues

`src/world/GameDialogues.tsx` loads the dialogue manifest and triggers entries that define `timecode`.

This is useful for simple global scene timing. It should not be used for dialogue that belongs to a cinematic. Cinematic-owned dialogue should be triggered by `dialogueCues` in `public/cinematics.json` instead, otherwise the same dialogue can play twice.

## Cinematic Dialogue Cues

`public/cinematics.json` can include `dialogueCues`.

Each cue contains:

- `time`: seconds relative to the cinematic start
- `dialogueId`: ID from `dialogues.json`

`src/world/GameCinematics.tsx` uses those cues to play dialogue during camera timelines. This keeps camera movement and dialogue playback synchronized without relying on global scene time.

## Editor Tooling

The `/editor` route provides three audio-related tools:

- `Dialogues`: edits `public/sounds/dialogue/dialogues.json` and previews dialogue playback.
- `SRT`: edits one SRT file at a time and validates dialogue assets.
- `Cinematics`: links dialogue IDs to cinematic timelines through `dialogueCues`.

Dev-only Vite endpoints in `vite.config.ts` support local saves:

- `POST /api/save-dialogues`
- `POST /api/save-srt`
- `GET /api/validate-dialogues`
- `POST /api/save-cinematics`

These endpoints are local development helpers. They are not production APIs.

## Validation

`GET /api/validate-dialogues` validates:

- manifest shape
- referenced dialogue audio files
- French SRT files
- referenced subtitle cue indexes
- optional English SRT files as warnings

Run validation after adding or renaming dialogue audio, changing cue indexes, or editing SRT files.

## Known Limitations

- There is no production persistence for audio manifests or SRT files.
- Dialogue branching is not implemented.
- Dialogue interruption and priority rules are minimal; playback is queue-based.
- SRT editing is text-based and does not yet provide waveform editing.
- Music currently supports one active looped track at a time.
