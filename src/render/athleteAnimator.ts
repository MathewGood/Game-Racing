import * as THREE from 'three';

export type AthleteMotion = 'set' | 'blockStart' | 'drive' | 'sprint' | 'dip' | 'decel' | 'idle' | 'win' | 'wave';

const CLIP_WORDS: Record<AthleteMotion, string[]> = {
  set: ['set', 'starting pose', 'crouch'],
  blockStart: ['blockstart', 'block start', 'start'],
  drive: ['drive', 'acceleration'],
  sprint: ['sprint', 'run', 'jog'],
  dip: ['dip', 'finish', 'lean'],
  decel: ['decel', 'slow down', 'stop'],
  idle: ['idle', 'stand'],
  win: ['win', 'victory', 'celebrate'],
  wave: ['wave', 'greet'],
};

function findClip(clips: THREE.AnimationClip[], state: AthleteMotion) {
  return clips.find(clip => CLIP_WORDS[state].some(word => clip.name.toLowerCase().includes(word)));
}

/** Cross-faded athletics motion graph for mocap-ready GLB characters. */
export class AthleteAnimator {
  private mixer: THREE.AnimationMixer;
  private actions = new Map<AthleteMotion, THREE.AnimationAction>();
  private current: AthleteMotion | null = null;
  private runAction: THREE.AnimationAction | null = null;

  constructor(model: THREE.Object3D, clips: THREE.AnimationClip[]) {
    this.mixer = new THREE.AnimationMixer(model);
    (Object.keys(CLIP_WORDS) as AthleteMotion[]).forEach(state => {
      const clip = findClip(clips, state);
      if (!clip) return;
      const action = this.mixer.clipAction(clip);
      action.enabled = true;
      action.clampWhenFinished = state === 'blockStart' || state === 'dip' || state === 'win';
      action.setLoop(action.clampWhenFinished ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
      this.actions.set(state, action);
    });
    this.runAction = this.actions.get('sprint') ?? null;
    this.setState(this.actions.has('idle') ? 'idle' : 'sprint', 0);
  }

  private available(requested: AthleteMotion): AthleteMotion | null {
    if (this.actions.has(requested)) return requested;
    if (['blockStart', 'drive', 'dip', 'decel'].includes(requested) && this.actions.has('sprint')) return 'sprint';
    if (['set', 'win', 'wave'].includes(requested) && this.actions.has('idle')) return 'idle';
    return this.actions.has('sprint') ? 'sprint' : this.actions.has('idle') ? 'idle' : null;
  }

  setState(requested: AthleteMotion, fade = .18) {
    const state = this.available(requested);
    if (!state || state === this.current) return;
    const next = this.actions.get(state)!;
    const previous = this.current ? this.actions.get(this.current) : undefined;
    next.reset().setEffectiveWeight(1).play();
    if (previous && fade > 0) previous.crossFadeTo(next, fade, true);
    else previous?.stop();
    this.current = state;
  }

  updateRace(distance: number, speed: number, finished: boolean, winner: boolean, dt: number) {
    let state: AthleteMotion;
    if (finished) state = speed < 2.4 && winner ? 'win' : 'decel';
    else if (distance <= .001) state = 'set';
    else if (distance < 3) state = 'blockStart';
    else if (distance < 24) state = 'drive';
    else if (distance > 96) state = 'dip';
    else state = 'sprint';
    this.setState(state);
    if (this.runAction && ['blockStart', 'drive', 'sprint', 'dip', 'decel'].includes(state)) {
      this.runAction.setEffectiveTimeScale(THREE.MathUtils.clamp(speed / 5.6, .62, 2.15));
    }
    this.mixer.update(dt);
  }

  updateCeremony(winner: boolean, dt: number) {
    this.setState(winner ? 'win' : 'wave', .3);
    this.mixer.update(dt);
  }
}
