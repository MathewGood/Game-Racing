import { describe, expect, it } from 'vitest';
import { defaultSettings, loadSettings, saveSettings } from '../src/core/settings';

describe('commercial game settings', () => {
  it('uses safe defaults for corrupt storage', () => {
    expect(loadSettings({ getItem: () => '{broken' })).toEqual(defaultSettings);
  });

  it('clamps volume and rejects unknown quality values', () => {
    const loaded = loadSettings({ getItem: () => JSON.stringify({
      graphics: 'impossible', masterVolume: 3, crowdVolume: -2, musicVolume: .4,
      showNameTags: false, reducedMotion: true,
    }) });
    expect(loaded.graphics).toBe('balanced');
    expect(loaded.masterVolume).toBe(1);
    expect(loaded.crowdVolume).toBe(0);
    expect(loaded.musicVolume).toBe(.4);
    expect(loaded.showNameTags).toBe(false);
    expect(loaded.reducedMotion).toBe(true);
  });

  it('persists the complete settings object', () => {
    let saved = '';
    saveSettings(defaultSettings, { setItem: (_key, value) => { saved = value; } });
    expect(JSON.parse(saved)).toEqual(defaultSettings);
  });
});
