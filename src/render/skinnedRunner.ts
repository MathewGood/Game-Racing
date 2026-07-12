import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { Appearance, Gender, SpecialMove } from '../core/simulation';
import { AthleteAnimator } from './athleteAnimator';

// ─────────────────────────────────────────────────────────────
// Optional photoreal runner: drop rigged, animated glTF models at
//   src/public/models/runner_m.glb      (used for male athletes)
//   src/public/models/runner_f.glb      (optional female variant)
// Any Mixamo character with a "Run" (or run-like) clip works, as does
// the three.js example Soldier.glb. When the file is missing the game
// safely falls back to the built-in procedural athletes.
// ─────────────────────────────────────────────────────────────

const MODEL_YAW = -Math.PI / 2; // model authored facing -Z → rotate to face +X
const START_X = -50;
const laneZ = (i: number) => -7 + i * 2;

export type RunnerTemplate = { scene: THREE.Group; clips: THREE.AnimationClip[] };

const pickClip = (clips: THREE.AnimationClip[], words: string[]) =>
  clips.find(clip => words.some(word => clip.name.toLowerCase().includes(word)));

export async function loadRunnerTemplates(): Promise<{ male: RunnerTemplate | null; female: RunnerTemplate | null }> {
  const loader = new GLTFLoader();
  const tryLoad = async (url: string): Promise<RunnerTemplate | null> => {
    try {
      const gltf = await loader.loadAsync(url);
      if (!pickClip(gltf.animations, ['run', 'sprint', 'jog', 'walk'])) {
        console.warn(`[Running 100m] ${url}: 달리기 애니메이션이 없어 절차형 선수를 사용합니다.`);
        return null;
      }
      // The three.js Vanguard/Soldier demo is an armoured combat model rather
      // than a sprinter and its legacy Blender axes place it outside our lanes.
      // Reject it so the anatomically proportioned built-in athlete is used.
      let incompatibleDemoModel = false;
      gltf.scene.traverse(object => {
        if (/vanguard|soldier/i.test(object.name)) incompatibleDemoModel = true;
      });
      if (incompatibleDemoModel) {
        console.warn(`[Running 100m] ${url}: Soldier/Vanguard 샘플은 육상선수가 아니므로 사용하지 않습니다.`);
        return null;
      }
      return { scene: gltf.scene, clips: gltf.animations };
    } catch {
      return null; // missing or invalid model → procedural athletes
    }
  };
  const male = (await tryLoad('./models/runner_m.glb')) ?? (await tryLoad('./models/runner.glb'));
  const female = (await tryLoad('./models/runner_f.glb')) ?? male;
  if (!male) console.info('[Running 100m] 실사 runner_m.glb가 없어 관절형 고품질 선수를 사용합니다.');
  return { male, female };
}

/** Skinned glTF athlete with the same interface as the procedural Runner. */
export class SkinnedRunner {
  root = new THREE.Group();
  phase = 0; blend = 0; v = 0; prevX = 0;
  finishT: number | null = null; v0 = 11; winner = false;
  private animator: AthleteAnimator;
  private model: THREE.Object3D;
  private pivot = new THREE.Group(); // lean pivot at the feet (root space, +X = forward)
  private animationAccumulator = 0;
  private skinMaterials: THREE.MeshPhysicalMaterial[] = [];
  private special: SpecialMove | null = null;
  private rocketFlames = new THREE.Group();

  constructor(template: RunnerTemplate, lane: number, color: string, _gender: Gender, appearance: Appearance, nameTag: THREE.Object3D) {
    this.model = cloneSkeleton(template.scene);
    this.model.rotation.y = MODEL_YAW;
    // Normalise every compatible Mixamo export around its feet. Recomputing
    // the box after scaling is essential for files with nested unit scales.
    this.model.updateMatrixWorld(true);
    const sourceBounds = new THREE.Box3().setFromObject(this.model);
    const height = Math.max(.01, sourceBounds.max.y - sourceBounds.min.y);
    const scale = 1.85 / height;
    this.model.scale.setScalar(scale);
    this.model.updateMatrixWorld(true);
    const scaledBounds = new THREE.Box3().setFromObject(this.model);
    const center = scaledBounds.getCenter(new THREE.Vector3());
    this.model.position.x -= center.x;
    this.model.position.y -= scaledBounds.min.y;
    this.model.position.z -= center.z;
    this.model.updateMatrixWorld(true);
    const tint = new THREE.Color(color);
    const identityTone = new THREE.Color({ eastAsian: '#cb9270', european: '#d8a184', african: '#70442f' }[appearance]);
    this.model.traverse(object => {
      const mesh = object as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.frustumCulled = true;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const clones = materials.map(source => {
          const original = source as THREE.MeshStandardMaterial;
          const isSkin = /skin|body|face|head|arm|leg/i.test(`${source.name} ${mesh.name}`);
          const material = new THREE.MeshPhysicalMaterial({
            name: source.name,
            color: original.color?.clone() ?? new THREE.Color('#ffffff'),
            map: original.map ?? null,
            normalMap: original.normalMap ?? null,
            roughnessMap: original.roughnessMap ?? null,
            metalnessMap: original.metalnessMap ?? null,
            roughness: isSkin ? .53 : Math.max(.4, original.roughness ?? .5),
            metalness: original.metalness ?? 0,
            clearcoat: isSkin ? .04 : 0,
            sheen: isSkin ? .22 : .38,
            sheenColor: isSkin ? original.color?.clone() ?? new THREE.Color('#d59b7d') : tint,
          });
          if (!isSkin) material.color.lerp(tint, .18);
          if (isSkin) { material.color.lerp(identityTone, .24); this.skinMaterials.push(material); }
          return material;
        });
        mesh.material = Array.isArray(mesh.material) ? clones : clones[0];
      }
    });
    this.pivot.add(this.model);
    this.root.add(this.pivot);
    this.root.add(nameTag);
    const flameMaterial = new THREE.MeshBasicMaterial({ color: '#ff6a20', transparent: true, opacity: .9 });
    for (const z of [-.07, .07]) {
      const flame = new THREE.Mesh(new THREE.ConeGeometry(.07, .5, 10), flameMaterial);
      flame.rotation.z = Math.PI / 2; flame.position.set(-.25, .82, z); this.rocketFlames.add(flame);
    }
    this.rocketFlames.visible = false; this.root.add(this.rocketFlames);
    this.root.position.set(START_X, 0, laneZ(lane));

    this.animator = new AthleteAnimator(this.model, template.clips);
  }

  setSpecial(special: SpecialMove) { this.special = special; }

  ceremony(t: number, rank: number) {
    this.model.rotation.y = MODEL_YAW - Math.PI / 2; // race yaw is +X; back off 90° to face the main stand (+Z)
    this.pivot.rotation.z = 0;
    this.animator.updateCeremony(rank === 0, 1 / 60);
    if (rank === 0) this.pivot.rotation.x = Math.sin(t * 3.4) * .02;
  }

  update(dist: number, t: number, dt: number) {
    if (this.finishT === null && dist >= 99.99) { this.finishT = t; this.v0 = Math.max(6, this.v); }
    let x = dist;
    if (this.finishT !== null) {
      const k = .5, dtf = Math.max(0, t - this.finishT);
      x = 100 + (this.v0 / k) * (1 - Math.exp(-k * dtf));
      this.v = this.v0 * Math.exp(-k * dtf);
    } else {
      const raw = dt > 1e-4 ? (x - this.prevX) / dt : 0;
      this.v += (Math.max(0, raw) - this.v) * Math.min(1, dt * 8);
    }
    this.prevX = x;
    this.root.position.x = START_X + x;
    this.root.position.y = 0;

    const moving = this.v > .4;
    // forward lean out of the blocks (pivot z: +X-forward rig, negative = lean forward)
    this.pivot.rotation.x = 0;
    this.pivot.rotation.z = this.finishT === null && x < 14 && moving ? -(.3 - x * .018) : 0;
    const specialActive = !!this.special && t >= this.special.trigger && t < this.special.trigger + this.special.duration;
    const kind = specialActive ? this.special!.kind : null;
    this.rocketFlames.visible = kind === 'rocketFire';
    if (kind === 'flying') this.root.position.y = 1.05 + Math.sin(t * 9) * .09;
    else if (kind === 'springShoes') this.root.position.y = Math.abs(Math.sin(t * 9.5)) * .72;
    else if (kind === 'lieDown') this.pivot.rotation.z = -1.42;
    else if (kind === 'horseRun') this.pivot.rotation.z = -.72;
    else if (kind === 'rocketFire') { this.root.position.y = .16; this.pivot.rotation.z = -.48; }
    else if (kind === 'danceBreak') this.pivot.rotation.x = Math.sin(t * 10) * .25;
    else if (kind === 'headwind') this.pivot.rotation.z = .24;
    const effort = THREE.MathUtils.clamp(x / 100, 0, 1);
    this.skinMaterials.forEach(material => {
      material.roughness = THREE.MathUtils.lerp(.53, .31, effort);
      material.clearcoat = THREE.MathUtils.lerp(.04, .22, effort);
    });
    // High-poly characters update at 30 Hz while transforms and camera remain 60 Hz.
    this.animationAccumulator += dt;
    if (this.animationAccumulator >= 1 / 30) {
      this.animator.updateRace(x, this.v, this.finishT !== null, this.winner, this.animationAccumulator);
      this.animationAccumulator = 0;
    }
  }
}
