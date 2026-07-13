import { describe, expect, it } from 'vitest';
import { profiles } from '../src/data/profiles';
import { makeAthlete, makeHeats, qualify, simulate } from '../src/core/simulation';

const athletes = Array.from({ length: 50 }, (_, index) => makeAthlete(
  `A${index}`,
  profiles[index % profiles.length],
  `a${index}`,
  index % 2 ? 'female' : 'male',
));

describe('competition core', () => {
  it('balances fifty athletes into heats of no more than eight', () => {
    const sizes = makeHeats(athletes).map(heat => heat.length);
    expect(sizes).toEqual([8, 7, 7, 7, 7, 7, 7]);
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
  });

  it('sends eight or fewer athletes directly to one final', () => {
    expect(makeHeats(athletes.slice(0, 8))).toHaveLength(1);
  });

  it('is deterministic for the same seed', () => {
    expect(simulate(athletes.slice(0, 8), 42)).toEqual(simulate(athletes.slice(0, 8), 42));
  });

  it('keeps appearance and hairstyle purely visual', () => {
    const eastAsian = makeAthlete('Visual A', profiles[0], 'v1', 'male', 'eastAsian', 'crop');
    const african = makeAthlete('Visual B', profiles[0], 'v2', 'male', 'african', 'afro');
    const a = simulate([eastAsian], 77).results[0];
    const b = simulate([african], 77).results[0];
    expect(a.time).toBe(b.time);
    expect(a.reaction).toBe(b.reaction);
    expect(a.splits).toEqual(b.splits);
  });

  it('produces varied special-move results without an eight-second finish', () => {
    const times = new Set<number>();
    for (let seed = 1; seed <= 20; seed += 1) {
      simulate(athletes.slice(0, 8), seed).results.forEach(result => {
        times.add(result.time);
        expect(result.time).toBeGreaterThan(8);
        expect(result.time).toBeLessThanOrEqual(12.5);
      });
    }
    expect(times.size).toBeGreaterThan(20);
  });

  it('assigns one randomly timed special move per athlete without duplicates in an eight-runner heat', () => {
    const race = simulate(athletes.slice(0, 8), 901);
    expect(new Set(race.results.map(result => result.special.kind)).size).toBe(8);
    race.results.forEach(result => {
      expect(result.special.trigger).toBeGreaterThanOrEqual(1.15);
      expect(result.special.trigger).toBeLessThanOrEqual(6.15);
      expect(result.special.duration).toBeGreaterThan(0);
    });
    expect(race.results.some(result => result.special.multiplier > 1)).toBe(true);
    expect(race.results.some(result => result.special.multiplier < 1)).toBe(true);
  });

  it('makes all ten special moves reachable and never allows a sub-eight finish', () => {
    const allKinds = new Set(simulate(athletes, 1204).results.map(result => result.special.kind));
    expect(allKinds.size).toBe(10);
    for (let seed = 1; seed <= 100; seed += 1) {
      simulate(athletes.slice(0, 8), seed).results.forEach(result => expect(result.time).toBeGreaterThan(8));
    }
  });

  it('never generates reactions below the legal minimum', () => {
    for (let seed = 1; seed <= 100; seed += 1) {
      simulate(athletes.slice(0, 8), seed).results.forEach(result => {
        expect(result.reaction).toBeGreaterThanOrEqual(0.1);
      });
    }
  });

  it('qualifies an eight-athlete final from fifty entrants', () => {
    const races = makeHeats(athletes).map((heat, index) => simulate(heat, 100 + index));
    expect(qualify(races)).toHaveLength(8);
  });
});
