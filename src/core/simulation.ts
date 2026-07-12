import type { Profile } from '../data/profiles';
import { RNG } from './random';

export type Gender = 'male' | 'female';
export type Appearance = 'eastAsian' | 'european' | 'african';
export type HairStyle = 'buzz' | 'crop' | 'sidePart' | 'waves' | 'curls' | 'afro' | 'braids' | 'ponytail' | 'bun' | 'undercut';
export type SpecialMoveKind = 'horseRun' | 'giantStride' | 'flying' | 'rocketFire' | 'lieDown' | 'potion' | 'springShoes' | 'ninjaDash' | 'danceBreak' | 'headwind';
export type SpecialMove = {
  kind: SpecialMoveKind;
  name: string;
  trigger: number;
  duration: number;
  multiplier: number;
};
export type Athlete = {
  id: string;
  name: string;
  profile: Profile;
  color: string;
  gender: Gender;
  appearance: Appearance;
  hairStyle: HairStyle;
};
export type Result = {
  athlete: Athlete;
  lane: number;
  time: number;
  display: string;
  splits: number[];
  reaction: number;
  baseTime: number;
  special: SpecialMove;
};
export type Frame = { time: number; distances: number[] };
export type Race = { results: Result[]; frames: Frame[]; duration: number };

const colors = ['#27d8ff', '#ffcf4a', '#ff5a7d', '#a779ff', '#2ee6a6', '#ff8a3d', '#f5f7ff', '#57a0ff'];
const specialMoveCatalog: ReadonlyArray<Omit<SpecialMove, 'trigger'>> = [
  { kind: 'horseRun', name: '사족 말 질주', duration: 1.5, multiplier: 1.52 },
  { kind: 'giantStride', name: '거인 보폭', duration: 1.8, multiplier: 1.35 },
  { kind: 'flying', name: '활공 비행', duration: 1.6, multiplier: 1.42 },
  { kind: 'rocketFire', name: '로켓 파이어', duration: 1.2, multiplier: 1.65 },
  { kind: 'lieDown', name: '돌연 휴식', duration: 1.5, multiplier: 0 },
  { kind: 'potion', name: '미스터리 포션', duration: 1.7, multiplier: 1.28 },
  { kind: 'springShoes', name: '스프링 슈즈', duration: 1.8, multiplier: 1.25 },
  { kind: 'ninjaDash', name: '닌자 잔상 대시', duration: 1.05, multiplier: 1.4 },
  { kind: 'danceBreak', name: '댄스 브레이크', duration: 1.3, multiplier: .25 },
  { kind: 'headwind', name: '강제 역풍', duration: 1.5, multiplier: .55 },
];

function finishTime(baseTime: number, reaction: number, special: SpecialMove) {
  const baseRun = baseTime - reaction;
  const start = Math.max(.35, special.trigger - reaction);
  if (baseRun <= start) return baseTime;
  const poweredDistance = special.duration * special.multiplier;
  const runTime = special.multiplier > 0 && baseRun <= start + poweredDistance
    ? start + (baseRun - start) / special.multiplier
    : start + special.duration + Math.max(0, baseRun - start - poweredDistance);
  // Specials can create spectacular records, but never a sub/equal-eight-second finish.
  return Math.max(8.01, reaction + runTime);
}

function distanceAt(time: number, entry: Result) {
  if (time <= entry.reaction) return 0;
  const elapsed = time - entry.reaction;
  const start = Math.max(.35, entry.special.trigger - entry.reaction);
  const active = Math.max(0, Math.min(entry.special.duration, elapsed - start));
  const after = Math.max(0, elapsed - start - entry.special.duration);
  const effective = elapsed <= start ? elapsed : start + active * entry.special.multiplier + after;
  const u = Math.min(1, effective / (entry.baseTime - entry.reaction));
  return 100 * (u < .28 ? .3 * Math.pow(u / .28, 1.65) : .3 + .7 * ((u - .28) / .72));
}

export const makeAthlete = (
  name: string,
  profile: Profile,
  id: string,
  gender: Gender = 'male',
  appearance: Appearance = 'eastAsian',
  hairStyle: HairStyle = 'crop',
): Athlete => ({
  id,
  name,
  profile,
  gender,
  appearance,
  hairStyle,
  color: colors[Number(id.replace(/\D/g, '')) % colors.length],
});

/** Elite final calibration. Gender is visual-only so mixed fields remain competitively fair. */
function calibratedTime(profile: Profile, reaction: number, condition: number) {
  return 9.98
    + (reaction - 0.13)
    + (0.95 - profile.accel) * 0.8
    + (11.9 - profile.topSpeed) * 0.22
    + (0.97 - profile.endurance) * 0.45
    + condition;
}

export function simulate(athletes: Athlete[], seed = 1): Race {
  const rng = new RNG(seed);
  const deck = specialMoveCatalog.map(move => ({ ...move }));
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const other = Math.floor(rng.next() * (index + 1));
    [deck[index], deck[other]] = [deck[other], deck[index]];
  }
  const entries = athletes.map((athlete, lane): Result => {
    const reaction = Math.max(0.1, athlete.profile.reaction + rng.range(-0.012, 0.012));
    const condition = rng.range(-athlete.profile.variance, athlete.profile.variance);
    const baseTime = Math.min(10.30, Math.max(9.58, calibratedTime(athlete.profile, reaction, condition)));
    const template = deck[lane % deck.length];
    const special: SpecialMove = { ...template, trigger: rng.range(1.15, 6.15) };
    const time = finishTime(baseTime, reaction, special);
    return { athlete, lane: lane + 1, time, display: time.toFixed(2), splits: [], reaction, baseTime, special };
  });

  const duration = Math.max(1, ...entries.map(entry => entry.time)) + 1;
  const frames: Frame[] = [];

  for (let time = 0; time <= duration; time += 1 / 120) {
    frames.push({
      time,
      distances: entries.map(entry => distanceAt(time, entry)),
    });
  }
  entries.forEach((entry, lane) => {
    entry.splits = Array.from({ length: 10 }, (_, index) => {
      const target = (index + 1) * 10;
      if (target === 100) return entry.time;
      const frameIndex = frames.findIndex(frame => frame.distances[lane] >= target);
      if (frameIndex <= 0) return frames[Math.max(0, frameIndex)]?.time ?? entry.time;
      const before = frames[frameIndex - 1], after = frames[frameIndex];
      const span = after.distances[lane] - before.distances[lane];
      const blend = span > 0 ? (target - before.distances[lane]) / span : 0;
      return before.time + (after.time - before.time) * blend;
    });
  });
  const results = entries.slice().sort((a, b) => a.time - b.time);
  return { results, frames, duration };
}

export function makeHeats(athletes: Athlete[]) {
  if (athletes.length <= 8) return [athletes];
  const heatCount = Math.ceil(athletes.length / 8);
  const heats: Athlete[][] = Array.from({ length: heatCount }, () => []);
  athletes.forEach((athlete, index) => heats[index % heatCount].push(athlete));
  return heats;
}

export function qualify(races: Race[], limit = 8) {
  const automatic: Result[] = [];
  const remaining: Result[] = [];
  const perHeat = races.length === 1 ? limit : Math.max(1, Math.floor(limit / races.length) - 1);
  races.forEach(race => {
    automatic.push(...race.results.slice(0, perHeat));
    remaining.push(...race.results.slice(perHeat));
  });
  return [...automatic, ...remaining.sort((a, b) => a.time - b.time)]
    .slice(0, limit)
    .map(result => result.athlete);
}
