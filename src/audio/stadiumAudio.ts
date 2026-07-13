export class StadiumAudio {
  private context?: AudioContext;
  private master?: GainNode;
  private murmur?: GainNode;
  private roar?: GainNode;
  private recordedCrowd?: GainNode;
  private music?: GainNode;
  private started = false;
  private raceMode = false;
  private lastStep = 0;
  private masterVolume = .72;
  private crowdVolume = .9;
  private musicVolume = .65;
  private paused = false;

  setMix(master: number, crowd: number, music: number) {
    this.masterVolume = Math.max(0, Math.min(1, master));
    this.crowdVolume = Math.max(0, Math.min(1, crowd));
    this.musicVolume = Math.max(0, Math.min(1, music));
    if (!this.context) return;
    const now = this.context.currentTime;
    this.master?.gain.setTargetAtTime(this.paused ? this.masterVolume * .24 : this.masterVolume, now, .08);
    this.music?.gain.setTargetAtTime(this.raceMode ? 0 : .16 * this.musicVolume, now, .12);
    if (this.raceMode) this.recordedCrowd?.gain.setTargetAtTime(.28 * this.crowdVolume, now, .12);
  }

  setPaused(paused: boolean) {
    this.paused = paused;
    if (!this.context || !this.master) return;
    this.master.gain.setTargetAtTime(this.masterVolume * (paused ? .24 : 1), this.context.currentTime, .08);
  }

  async enable() {
    if (!this.context) this.setup();
    if (this.context?.state === 'suspended') await this.context.resume();
  }

  async playMenuMusic() {
    await this.enable();
    if (!this.context || !this.music) return;
    this.raceMode = false;
    const now = this.context.currentTime;
    this.music.gain.setTargetAtTime(0.16 * this.musicVolume, now, 0.45);
    this.recordedCrowd?.gain.setTargetAtTime(0, now, 0.35);
    this.murmur?.gain.setTargetAtTime(0.015, now, 0.35);
    this.roar?.gain.setTargetAtTime(0, now, 0.35);
  }

  private setup() {
    const context = new AudioContext();
    const master = context.createGain();
    master.gain.value = this.masterVolume;
    master.connect(context.destination);
    this.context = context;
    this.master = master;

    const music = context.createGain();
    music.gain.value = 0;
    music.connect(master);
    const musicSource = context.createBufferSource();
    musicSource.buffer = this.makeThemeMusic();
    musicSource.loop = true;
    musicSource.connect(music);
    musicSource.start();
    this.music = music;

    const murmur = context.createGain();
    const murmurFilter = context.createBiquadFilter();
    murmurFilter.type = 'bandpass';
    murmurFilter.frequency.value = 520;
    murmurFilter.Q.value = 0.45;
    murmur.gain.value = 0.015;
    murmur.connect(murmurFilter).connect(master);
    this.loopNoise(murmur, 8, 0.82);
    this.murmur = murmur;

    const roar = context.createGain();
    const roarFilter = context.createBiquadFilter();
    roarFilter.type = 'bandpass';
    roarFilter.frequency.value = 1150;
    roarFilter.Q.value = 0.32;
    roar.gain.value = 0;
    roar.connect(roarFilter).connect(master);
    this.loopNoise(roar, 7, 0.55);
    this.roar = roar;
    this.started = true;
    void this.loadRecordedCrowd();
  }

  private async loadRecordedCrowd() {
    try {
      const response = await fetch(new URL('./audio/stadium-crowd.wav', document.baseURI));
      if (!response.ok) throw new Error(`crowd audio: ${response.status}`);
      const buffer = await this.context!.decodeAudioData(await response.arrayBuffer());
      const source = this.context!.createBufferSource();
      const gain = this.context!.createGain();
      gain.gain.value = this.raceMode ? 0.36 * this.crowdVolume : 0;
      source.buffer = buffer;
      source.loop = true;
      source.connect(gain).connect(this.master!);
      source.start(0, Math.random() * Math.max(0.1, buffer.duration - 0.1));
      this.recordedCrowd = gain;
    } catch (error) {
      console.warn('실제 관중음 파일을 불러오지 못해 합성 관중음을 사용합니다.', error);
      if (this.raceMode && this.murmur && this.roar) {
        this.murmur.gain.value = 0.14;
        this.roar.gain.value = 0.08;
      }
    }
  }

  private makeThemeMusic() {
    const context = this.context!;
    const seconds = 8;
    const buffer = context.createBuffer(2, context.sampleRate * seconds, context.sampleRate);
    const melody = [220, 261.63, 329.63, 392, 329.63, 440, 392, 329.63, 246.94, 293.66, 369.99, 440, 369.99, 493.88, 440, 369.99];
    const bass = [110, 110, 123.47, 123.47, 98, 98, 123.47, 123.47];
    for (let channel = 0; channel < 2; channel += 1) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < data.length; i += 1) {
        const time = i / context.sampleRate;
        const melodyStep = Math.floor(time / 0.5) % melody.length;
        const bassStep = Math.floor(time) % bass.length;
        const local = time % 0.5;
        const envelope = Math.min(1, local * 18) * Math.exp(-local * 2.7);
        const lead = Math.sin(time * Math.PI * 2 * melody[melodyStep]) * envelope * 0.16;
        const harmony = Math.sin(time * Math.PI * 4 * melody[melodyStep]) * envelope * 0.045;
        const bassWave = Math.sin(time * Math.PI * 2 * bass[bassStep]) * 0.13;
        const beatTime = time % 0.5;
        const kick = Math.sin(2 * Math.PI * (74 - beatTime * 95) * beatTime) * Math.exp(-beatTime * 22) * 0.3;
        const stereo = channel === 0 ? 1 : 0.94 + Math.sin(time * 1.7) * 0.04;
        data[i] = (lead + harmony + bassWave + kick) * stereo;
      }
    }
    return buffer;
  }

  private makeNoise(seconds: number, smoothing: number) {
    const context = this.context!;
    const buffer = context.createBuffer(2, context.sampleRate * seconds, context.sampleRate);
    for (let channel = 0; channel < 2; channel += 1) {
      const data = buffer.getChannelData(channel);
      let value = 0;
      for (let i = 0; i < data.length; i += 1) {
        value = value * smoothing + (Math.random() * 2 - 1) * (1 - smoothing);
        data[i] = value * (0.68 + 0.24 * Math.sin(i / context.sampleRate * (1.3 + channel * 0.17)));
      }
    }
    return buffer;
  }

  private loopNoise(destination: AudioNode, seconds: number, smoothing: number) {
    const source = this.context!.createBufferSource();
    source.buffer = this.makeNoise(seconds, smoothing);
    source.loop = true;
    source.connect(destination);
    source.start();
  }

  beginRace() {
    void this.enable();
    if (!this.context || !this.murmur || !this.roar) return;
    this.raceMode = true;
    this.lastStep = 0;
    const now = this.context.currentTime;
    this.music?.gain.setTargetAtTime(0, now, 0.3);
    this.recordedCrowd?.gain.setTargetAtTime(0.28 * this.crowdVolume, now, 0.6);
    this.murmur.gain.setTargetAtTime(0.035, now, 0.5);
    this.roar.gain.setTargetAtTime(0.012, now, 0.5);
  }

  update(progress: number, raceTime: number) {
    if (!this.started || !this.context || !this.murmur || !this.roar) return;
    const now = this.context.currentTime;
    const excitement = Math.pow(Math.max(0, Math.min(1, progress)), 1.7);
    this.recordedCrowd?.gain.setTargetAtTime((0.28 + excitement * 0.22) * this.crowdVolume, now, 0.3);
    this.murmur.gain.setTargetAtTime((0.035 + excitement * 0.045) * this.crowdVolume, now, 0.18);
    this.roar.gain.setTargetAtTime((0.012 + excitement * 0.12) * this.crowdVolume, now, 0.12);
    if (raceTime > 0 && raceTime - this.lastStep > Math.max(0.095, 0.15 - progress * 0.035)) {
      this.lastStep = raceTime;
      this.footstep(0.018 + progress * 0.015);
    }
  }

  cue(frequency = 330) {
    void this.enable();
    if (!this.context || !this.master) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + 0.15);
  }

  gun() {
    void this.enable();
    if (!this.context || !this.master) return;
    const now = this.context.currentTime;
    const source = this.context.createBufferSource();
    source.buffer = this.makeNoise(0.42, 0.15);
    const filter = this.context.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 750;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    source.connect(filter).connect(gain).connect(this.master);
    source.start(now);
  }

  specialCue(boost: boolean) {
    void this.enable();
    if (!this.context || !this.master) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = boost ? 'sawtooth' : 'square';
    oscillator.frequency.setValueAtTime(boost ? 130 : 105, now);
    oscillator.frequency.exponentialRampToValueAtTime(boost ? 720 : 48, now + .34);
    gain.gain.setValueAtTime(.11, now);
    gain.gain.exponentialRampToValueAtTime(.001, now + .36);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(now); oscillator.stop(now + .38);
  }

  finishCheer() {
    if (!this.context || !this.roar) return;
    const now = this.context.currentTime;
    this.recordedCrowd?.gain.setTargetAtTime(0.58 * this.crowdVolume, now, 0.12);
    this.roar.gain.setTargetAtTime(0.22 * this.crowdVolume, now, 0.12);
  }

  private footstep(volume: number) {
    const context = this.context!;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(82 + Math.random() * 24, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(42, context.currentTime + 0.055);
    gain.gain.setValueAtTime(volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.06);
    oscillator.connect(gain).connect(this.master!);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.065);
  }
}
