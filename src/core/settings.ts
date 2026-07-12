export type GraphicsQuality = 'performance' | 'balanced' | 'cinematic';

export type GameSettings = {
  graphics: GraphicsQuality;
  masterVolume: number;
  crowdVolume: number;
  musicVolume: number;
  showNameTags: boolean;
  reducedMotion: boolean;
};

export const defaultSettings: GameSettings = {
  graphics: 'balanced',
  masterVolume: .72,
  crowdVolume: .9,
  musicVolume: .65,
  showNameTags: true,
  reducedMotion: false,
};

const clamp01 = (value: unknown, fallback: number) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : fallback;
};

export function loadSettings(storage: Pick<Storage, 'getItem'> = localStorage): GameSettings {
  try {
    const value = JSON.parse(storage.getItem('running100m-settings') || '{}') as Partial<GameSettings>;
    const graphics = ['performance', 'balanced', 'cinematic'].includes(value.graphics ?? '')
      ? value.graphics as GraphicsQuality
      : defaultSettings.graphics;
    return {
      graphics,
      masterVolume: clamp01(value.masterVolume, defaultSettings.masterVolume),
      crowdVolume: clamp01(value.crowdVolume, defaultSettings.crowdVolume),
      musicVolume: clamp01(value.musicVolume, defaultSettings.musicVolume),
      showNameTags: typeof value.showNameTags === 'boolean' ? value.showNameTags : defaultSettings.showNameTags,
      reducedMotion: typeof value.reducedMotion === 'boolean' ? value.reducedMotion : defaultSettings.reducedMotion,
    };
  } catch {
    return { ...defaultSettings };
  }
}

export function saveSettings(settings: GameSettings, storage: Pick<Storage, 'setItem'> = localStorage) {
  storage.setItem('running100m-settings', JSON.stringify(settings));
}
