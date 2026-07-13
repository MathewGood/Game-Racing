import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import type { Appearance, Gender, HairStyle, SpecialMove } from '../core/simulation';
import type { GraphicsQuality } from '../core/settings';
import { loadRunnerTemplates, SkinnedRunner, type RunnerTemplate } from './skinnedRunner';

// ─────────────────────────────────────────────────────────────
// Running 100m — fixed press-box stadium renderer
// World axes: runners move along +X. Start x=-50, finish x=+50.
// Lane i (0-7) center: z = -7 + i*2
// ─────────────────────────────────────────────────────────────

const START_X = -50;
const laneZ = (i: number) => -7 + i * 2;
const SKIN_TONES: Record<Appearance, string[]> = {
  eastAsian: ['#d6a17e', '#c58d6d', '#e0b18d', '#b97d5f', '#ce9674'],
  european: ['#e4b493', '#ca9275', '#f0c7a7', '#b97a62', '#d9a486'],
  african: ['#5a3427', '#734631', '#8a573c', '#42271f', '#986548'],
};
const HAIR_PALETTES: Record<Appearance, string[]> = {
  eastAsian: ['#11100f', '#211a17', '#30231c', '#080808'],
  european: ['#1d1713', '#5b3b24', '#9a7444', '#d0b070', '#6f2f22'],
  african: ['#090909', '#17120f', '#241914', '#302018'],
};
const IDENTITY_ACCENTS: Record<Appearance, string> = { eastAsian: '#32dcff', european: '#ffc94d', african: '#d88cff' };
const IDENTITY_SHORT: Record<Appearance, string> = { eastAsian: 'EAS', european: 'EUR', african: 'AFR' };

function makeNameTag(name: string, gender: Gender, lane: number, appearance: Appearance) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 112;
  const context = canvas.getContext('2d')!;
  const displayName = name.length > 12 ? `${name.slice(0, 11)}…` : name;
  context.font = '700 46px "Noto Sans KR", "Apple SD Gothic Neo", sans-serif';
  const label = `${gender === 'female' ? '♀' : '♂'}  ${displayName}  · ${IDENTITY_SHORT[appearance]}`;
  const textWidth = Math.min(460, context.measureText(label).width);
  const left = (canvas.width - textWidth) / 2 - 24;
  const width = textWidth + 48;

  context.fillStyle = 'rgba(3, 13, 23, .88)';
  context.strokeStyle = IDENTITY_ACCENTS[appearance];
  context.lineWidth = 6;
  context.beginPath();
  context.roundRect(left, 9, width, 84, 20);
  context.fill();
  context.stroke();
  context.fillStyle = '#ffffff';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(label, canvas.width / 2, 51, 460);
  context.fillStyle = IDENTITY_ACCENTS[appearance];
  context.beginPath();
  context.moveTo(canvas.width / 2 - 10, 94);
  context.lineTo(canvas.width / 2 + 10, 94);
  context.lineTo(canvas.width / 2, 110);
  context.closePath();
  context.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  // Every lane receives its own vertical band so clustered runners remain identifiable.
  sprite.position.set(0, 2.22 + lane * .48, 0);
  sprite.scale.set(2.65, .58, 1);
  sprite.renderOrder = 100;
  sprite.userData.isNameTag = true;
  return sprite;
}

// ── Track surface painted on a canvas texture ────────────────
function makeTrackTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 2800; c.height = 400; // world: x -60..80, z -10..10  (px=(x+60)*20, py=(z+10)*20)
  const g = c.getContext('2d')!;
  // tartan base with subtle grain
  g.fillStyle = '#9e3b30'; g.fillRect(0, 0, 2800, 400);
  for (let i = 0; i < 26000; i++) {
    g.fillStyle = Math.random() < .5 ? 'rgba(0,0,0,.05)' : 'rgba(255,120,90,.05)';
    g.fillRect(Math.random() * 2800, Math.random() * 400, 2, 2);
  }
  // lane lines (z=-8..8 → py 40..360)
  g.fillStyle = '#f3ead8';
  for (let k = 0; k <= 8; k++) g.fillRect(0, 38 + k * 40, 2800, 4);
  // start / finish lines
  g.fillStyle = '#ffffff';
  g.fillRect(196, 40, 10, 320);           // start x=-50
  g.fillRect(2196, 40, 14, 320);          // finish x=+50
  // 10m split ticks
  g.fillStyle = 'rgba(255,255,255,.35)';
  for (let d = 10; d < 100; d += 10) g.fillRect(198 + d * 20, 40, 3, 320);
  // lane numbers behind the start line (read from behind blocks)
  g.fillStyle = '#ffffff'; g.font = 'bold 30px Arial';
  for (let i = 0; i < 8; i++) {
    g.save(); g.translate(170, 60 + i * 40 + 12); g.rotate(-Math.PI / 2);
    g.textAlign = 'center'; g.fillText(String(i + 1), 0, 10); g.restore();
  }
  // branding on the home straight
  g.save(); g.translate(1200, 206); g.font = 'bold 46px Arial';
  g.fillStyle = 'rgba(255,255,255,.14)'; g.textAlign = 'center';
  g.fillText('R U N N I N G   1 0 0 m', 0, 0); g.restore();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeAdTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = '#0a2740'; g.fillRect(0, 0, 1024, 64);
  g.font = 'bold 34px Arial'; g.fillStyle = '#41d8ff'; g.textBaseline = 'middle';
  g.fillText('RUNNING 100m', 30, 34);
  g.fillStyle = '#ffcf4a'; g.fillText('WORLD ATHLETICS', 330, 34);
  g.fillStyle = '#ffffff'; g.fillText('100M SPRINT', 720, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping; tex.repeat.set(6, 1);
  return tex;
}

// ── Articulated runner rig (procedural animation) ────────────
// Realistic human proportions (~1.86m): ankle .08 · knee .50 · hip .95 ·
// shoulder 1.50 · head centre 1.68. Built facing local +Z, rotated to +X.
function addHairStyle(head: THREE.Group, style: HairStyle, material: THREE.Material) {
  const add = (geometry: THREE.BufferGeometry, position: [number, number, number], scale: [number, number, number], rotation: [number, number, number] = [0, 0, 0]) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position); mesh.scale.set(...scale); mesh.rotation.set(...rotation); head.add(mesh);
    return mesh;
  };
  const cap = () => add(new THREE.SphereGeometry(.108, 18, 12, 0, Math.PI * 2, 0, Math.PI * .58), [0, .055, -.002], [.92, 1.07, .97]);
  if (style === 'buzz') {
    add(new THREE.SphereGeometry(.108, 18, 12, 0, Math.PI * 2, 0, Math.PI * .52), [0, .05, 0], [.9, 1.02, .94]);
  } else if (style === 'crop') {
    cap(); add(new THREE.BoxGeometry(.14, .035, .09), [0, .145, .025], [1, 1, 1], [-.18, 0, 0]);
  } else if (style === 'sidePart') {
    cap(); add(new THREE.CapsuleGeometry(.035, .13, 3, 8), [-.038, .135, .025], [1, 1, 1], [0, 0, 1.18]);
  } else if (style === 'waves' || style === 'curls') {
    const count = style === 'waves' ? 8 : 14;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const radius = style === 'waves' ? .075 : .085;
      add(new THREE.SphereGeometry(style === 'waves' ? .045 : .05, 9, 7), [Math.cos(a) * radius, .09 + (i % 3) * .025, Math.sin(a) * radius - .015], [1, .85, 1]);
    }
  } else if (style === 'afro') {
    add(new THREE.SphereGeometry(.145, 18, 14), [0, .095, -.015], [1, 1.05, 1]);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      add(new THREE.SphereGeometry(.055, 8, 7), [Math.cos(a) * .11, .1 + Math.sin(a * 2) * .025, Math.sin(a) * .1], [1, 1, 1]);
    }
  } else if (style === 'braids') {
    cap();
    for (let i = -2; i <= 2; i++) add(new THREE.CapsuleGeometry(.013, .18 + Math.abs(i) * .015, 3, 7), [i * .035, -.025, -.105], [1, 1, 1], [-.35 + i * .035, 0, 0]);
  } else if (style === 'ponytail') {
    cap(); add(new THREE.CapsuleGeometry(.038, .24, 4, 9), [0, -.015, -.125], [1, 1, 1], [-.55, 0, 0]);
  } else if (style === 'bun') {
    cap(); add(new THREE.SphereGeometry(.068, 12, 10), [0, .105, -.105], [1, 1, 1]);
  } else {
    add(new THREE.SphereGeometry(.108, 18, 10, 0, Math.PI * 2, 0, Math.PI * .43), [0, .065, 0], [.88, 1, .92]);
    add(new THREE.BoxGeometry(.12, .06, .105), [0, .145, .015], [1, 1, 1], [-.12, 0, 0]);
  }
}

class Runner {
  root = new THREE.Group();
  hips = new THREE.Group();     // pelvis: bobs, yaws with the stride
  torso = new THREE.Group();    // lumbar joint: forward lean
  chest = new THREE.Group();    // thoracic joint: counter-rotation
  head = new THREE.Group();     // neck joint: gaze stabilisation
  shoulders: THREE.Group[] = [];
  elbows: THREE.Group[] = [];
  hipJoints: THREE.Group[] = [];
  knees: THREE.Group[] = [];
  ankles: THREE.Group[] = [];
  wrists: THREE.Group[] = [];
  private winnerBadge: THREE.Sprite;
  private skinMaterial: THREE.MeshPhysicalMaterial;
  private kitMaterial: THREE.MeshPhysicalMaterial;
  private special: SpecialMove | null = null;
  private rocketFlames = new THREE.Group();
  private specialAura: THREE.Mesh;
  private potionBottle: THREE.Group;
  phase = Math.random() * 6.28; blend = 0; v = 0; prevX = 0;
  finishT: number | null = null; v0 = 11; winner = false;

  constructor(lane: number, color: string, gender: Gender, name: string, appearance: Appearance, hairStyle: HairStyle) {
    const female = gender === 'female';
    const skinTone = SKIN_TONES[appearance][lane % SKIN_TONES[appearance].length];
    const build = .94 + (lane % 5) * .025;
    const identityVariance = (lane % 5 - 2) * .018;
    const skin = this.skinMaterial = new THREE.MeshPhysicalMaterial({
      color: skinTone, roughness: .54, metalness: 0,
      clearcoat: .03, sheen: .25, sheenColor: skinTone,
    });
    const kit = this.kitMaterial = new THREE.MeshPhysicalMaterial({
      color, roughness: .46, metalness: .02, sheen: .55, sheenColor: color,
    });
    const shorts = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(color).multiplyScalar(.42), roughness: .54, sheen: .42, sheenColor: color });
    const shoe = new THREE.MeshStandardMaterial({ color: '#f2f4f8', roughness: .4 });
    const shoeSole = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(.8), roughness: .5 });
    const hairPalette = HAIR_PALETTES[appearance];
    const hair = new THREE.MeshStandardMaterial({ color: hairPalette[(lane * 3 + (female ? 1 : 0)) % hairPalette.length], roughness: hairStyle === 'waves' ? .72 : .9 });
    const eyeWhite = new THREE.MeshBasicMaterial({ color: '#f4f1ea' });
    const eyeColors = ['#17110c', '#3c281b', '#294052', '#3e4a2d', '#261813'];
    const eyeDark = new THREE.MeshPhysicalMaterial({ color: eyeColors[(lane * 2 + 1) % eyeColors.length], roughness: .2, clearcoat: .35 });
    const heightScale = (female ? .955 : 1) * (.985 + (lane % 4) * .012);

    this.root.rotation.y = Math.PI / 2;
    this.hips.position.y = .95;
    this.root.add(this.hips);

    // pelvis + hip padding (shorts)
    const pelvis = new THREE.Mesh(new THREE.SphereGeometry(.15, 14, 10), shorts);
    pelvis.scale.set((female ? 1.22 : 1.1) * (2 - build), .8, .95 * build);
    this.hips.add(pelvis);
    for (const side of [-1, 1]) {
      const glute = new THREE.Mesh(new THREE.SphereGeometry(.095, 12, 9), shorts);
      glute.scale.set(.9, 1.05, .72);
      glute.position.set(side * .075, -.015, -.105);
      this.hips.add(glute);
    }

    // lumbar → abdomen → thoracic chest → neck → head
    this.torso.position.y = .07;
    this.hips.add(this.torso);
    const abdomen = new THREE.Mesh(new THREE.CapsuleGeometry(female ? .115 : .13, .1, 4, 12), female ? skin : kit);
    abdomen.position.y = .12; abdomen.scale.z = .82; this.torso.add(abdomen);

    this.chest.position.y = .26;
    this.torso.add(this.chest);
    const ribcage = new THREE.Mesh(new THREE.CapsuleGeometry(female ? .135 : .155, .17, 4, 14), kit);
    ribcage.position.y = .1; ribcage.scale.set(build, 1, .78 * build); this.chest.add(ribcage);
    const upperBack = new THREE.Mesh(new THREE.SphereGeometry(female ? .13 : .15, 14, 10), kit);
    upperBack.scale.set(1.08, .72, .7); upperBack.position.set(0, .13, -.035); this.chest.add(upperBack);
    const bib = new THREE.Mesh(new THREE.BoxGeometry(.17, .13, .012), new THREE.MeshBasicMaterial({ color: '#f5f5ee' }));
    bib.position.set(0, .1, female ? .112 : .128); this.chest.add(bib);
    const stripeMaterial = new THREE.MeshStandardMaterial({ color: '#f5f7ff', roughness: .48 });
    for (const side of [-1, 1]) {
      const sideStripe = new THREE.Mesh(new THREE.BoxGeometry(.018, .26, .065), stripeMaterial);
      sideStripe.position.set(side * (female ? .13 : .15), .06, 0); this.chest.add(sideStripe);
    }
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(.045, .055, .1, 10), skin);
    neck.position.y = .27; this.chest.add(neck);
    const traps = new THREE.Mesh(new THREE.SphereGeometry(.1, 12, 8), kit);
    traps.scale.set(1.55, .5, .85); traps.position.y = .22; this.chest.add(traps);

    // head with a simple face: eyes, nose, ears, hair
    this.head.position.y = .36;
    this.chest.add(this.head);
    const face = {
      eastAsian: { skull: [.9, 1.04, .96], jaw: [.9, .7, .84], nose: [.7, .82, 1.02], eyeY: .7, cheek: 1.08, lip: .01 },
      european: { skull: [.86, 1.08, .95], jaw: [.84, .76, .82], nose: [.64, 1.04, 1.34], eyeY: .9, cheek: .94, lip: .009 },
      african: { skull: [.91, 1.06, .97], jaw: [.94, .78, .88], nose: [.88, .88, 1.12], eyeY: .84, cheek: 1.02, lip: .013 },
    }[appearance];
    const skull = new THREE.Mesh(new THREE.SphereGeometry(.105, 22, 16), skin);
    skull.scale.set(face.skull[0] + identityVariance, face.skull[1] - identityVariance * .5, face.skull[2] + identityVariance * .3); skull.position.y = .04; this.head.add(skull);
    const jaw = new THREE.Mesh(new THREE.SphereGeometry(.07, 12, 10), skin);
    jaw.scale.set(...face.jaw as [number, number, number]); jaw.position.set(0, -.028, .022); this.head.add(jaw);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(.026, 8, 6), skin);
    nose.scale.set(face.nose[0] + identityVariance, face.nose[1] - identityVariance, face.nose[2] + identityVariance * 2); nose.position.set(0, .012, appearance === 'european' ? .1 : .095); this.head.add(nose);
    const lipColor = new THREE.Color(skinTone).lerp(new THREE.Color('#7e3440'), .42);
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(.056, face.lip, .009), new THREE.MeshStandardMaterial({ color: lipColor, roughness: .7 }));
    mouth.position.set(0, -.044, .084); this.head.add(mouth);
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(.0155, 8, 6), eyeWhite);
      eye.scale.y = face.eyeY; eye.position.set(s * .036, .043, .082); this.head.add(eye);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(.008, 6, 5), eyeDark);
      pupil.scale.y = face.eyeY; pupil.position.set(s * .036, .043, .095); this.head.add(pupil);
      const brow = new THREE.Mesh(new THREE.BoxGeometry(.035, .007, .009), hair);
      brow.position.set(s * .036, .072, .088); brow.rotation.z = -s * .08; this.head.add(brow);
      const ear = new THREE.Mesh(new THREE.SphereGeometry(.022, 8, 6), skin);
      ear.scale.set(.45, 1, .7); ear.position.set(s * (.087 + (face.skull[0] - .86) * .05), .028, .005); this.head.add(ear);
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(.032, 9, 7), skin);
      cheek.scale.set(.82, .62 * face.cheek, .5); cheek.position.set(s * .052, -.002, .068); this.head.add(cheek);
    }
    addHairStyle(this.head, hairStyle, hair);
    if (!female && lane % 4 === 2) {
      const beard = new THREE.Mesh(new THREE.SphereGeometry(.071, 12, 8, 0, Math.PI * 2, Math.PI * .4, Math.PI * .48), hair);
      beard.scale.set(.84, .72, .84); beard.position.set(0, -.028, .024); this.head.add(beard);
    }
    if (lane % 5 === 1) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(.098, .009, 6, 24), new THREE.MeshStandardMaterial({ color, roughness: .55 }));
      band.rotation.x = Math.PI / 2; band.position.y = .065; this.head.add(band);
    }

    for (const s of [-1, 1]) {
      // shoulder girdle: deltoid cap → upper arm → elbow → forearm → fist
      const sh = new THREE.Group();
      sh.position.set(s * (female ? .165 : .195) * build, .17, 0);
      this.chest.add(sh);
      const deltoid = new THREE.Mesh(new THREE.SphereGeometry(.062, 10, 8), kit);
      deltoid.scale.set(build, 1.15, build); sh.add(deltoid);
      const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(.047, .17, 4, 10), skin);
      upperArm.position.y = -.15; sh.add(upperArm);
      const biceps = new THREE.Mesh(new THREE.SphereGeometry(.048, 10, 8), skin);
      biceps.scale.set(1, 1.28, .92); biceps.position.set(0, -.16, .018); sh.add(biceps);
      const elbowCap = new THREE.Mesh(new THREE.SphereGeometry(.048, 10, 8), skin);
      elbowCap.position.y = -.29; sh.add(elbowCap);
      const el = new THREE.Group(); el.position.y = -.29; sh.add(el);
      const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(.04, .17, 4, 10), skin);
      forearm.position.y = -.12; forearm.scale.set(1, 1, .92); el.add(forearm);
      const wrist = new THREE.Group(); wrist.position.y = -.235; el.add(wrist);
      if ((lane + (s > 0 ? 1 : 0)) % 4 === 0) {
        const tape = new THREE.Mesh(new THREE.CylinderGeometry(.043, .043, .05, 10), new THREE.MeshStandardMaterial({ color: '#f5f5ee', roughness: .7 }));
        tape.position.y = -.01; wrist.add(tape);
      }
      const fist = new THREE.Mesh(new THREE.SphereGeometry(.046, 10, 8), skin);
      fist.scale.set(.82, 1.1, .95); fist.position.y = -.025; wrist.add(fist);
      this.wrists.push(wrist);
      this.shoulders.push(sh); this.elbows.push(el);

      // leg: hip → thigh (+short leg) → knee → shin (+calf) → ankle → shoe
      const hj = new THREE.Group();
      hj.position.set(s * (female ? .115 : .10), -.04, 0);
      this.hips.add(hj);
      const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(.082, .24, 4, 12), skin);
      thigh.position.y = -.2; thigh.scale.set(build, 1, 1.05 * build); hj.add(thigh);
      const shortLeg = new THREE.Mesh(new THREE.CapsuleGeometry(.09, .1, 4, 12), shorts);
      shortLeg.position.y = -.11; hj.add(shortLeg);
      const kneeCap = new THREE.Mesh(new THREE.SphereGeometry(.062, 10, 8), skin);
      kneeCap.position.y = -.45; hj.add(kneeCap);
      const kn = new THREE.Group(); kn.position.y = -.45; hj.add(kn);
      const shin = new THREE.Mesh(new THREE.CapsuleGeometry(.052, .24, 4, 10), skin);
      shin.position.y = -.19; kn.add(shin);
      const calf = new THREE.Mesh(new THREE.SphereGeometry(.055, 10, 8), skin);
      calf.scale.set(.95, 1.6, 1); calf.position.set(0, -.11, -.022); kn.add(calf);
      const ak = new THREE.Group(); ak.position.y = -.42; kn.add(ak);
      const heel = new THREE.Mesh(new THREE.BoxGeometry(.085, .07, .12), shoe);
      heel.position.set(0, -.045, -.01); ak.add(heel);
      const toe = new THREE.Mesh(new THREE.BoxGeometry(.082, .052, .15), shoe);
      toe.position.set(0, -.055, .105); toe.rotation.x = .1; ak.add(toe);
      const sole = new THREE.Mesh(new THREE.BoxGeometry(.09, .018, .27), shoeSole);
      sole.position.set(0, -.076, .045); ak.add(sole);
      this.hipJoints.push(hj); this.knees.push(kn); this.ankles.push(ak);
    }

    this.root.scale.setScalar(heightScale);
    const auraMaterial = new THREE.MeshBasicMaterial({ color: '#ffcf4a', transparent: true, opacity: .58, side: THREE.DoubleSide, depthWrite: false });
    this.specialAura = new THREE.Mesh(new THREE.TorusGeometry(.42, .018, 8, 40), auraMaterial);
    this.specialAura.rotation.x = Math.PI / 2; this.specialAura.position.y = .08; this.specialAura.visible = false; this.root.add(this.specialAura);
    const flameMaterial = new THREE.MeshBasicMaterial({ color: '#ff6a20', transparent: true, opacity: .9 });
    for (const x of [-.07, .07]) {
      const flame = new THREE.Mesh(new THREE.ConeGeometry(.065, .46, 10), flameMaterial);
      flame.position.set(x, .82, -.28); flame.rotation.x = -Math.PI / 2; this.rocketFlames.add(flame);
    }
    this.rocketFlames.visible = false; this.root.add(this.rocketFlames);
    this.potionBottle = new THREE.Group();
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(.025, .034, .12, 9), new THREE.MeshPhysicalMaterial({ color: '#59ff8b', emissive: '#176b35', emissiveIntensity: .8, transmission: .15, roughness: .22 }));
    const cork = new THREE.Mesh(new THREE.CylinderGeometry(.017, .017, .025, 8), new THREE.MeshStandardMaterial({ color: '#8b5a2b' }));
    cork.position.y = .072; this.potionBottle.add(bottle, cork); this.potionBottle.position.set(.2, 1.55, .08); this.potionBottle.visible = false; this.root.add(this.potionBottle);
    this.winnerBadge = this.makeWinnerBadge();
    this.root.add(this.winnerBadge);
    this.root.add(makeNameTag(name, gender, lane, appearance));
    this.root.position.set(START_X, 0, laneZ(lane));
    this.root.traverse(o => { if (o instanceof THREE.Mesh) { o.castShadow = true; } });
  }

  setSpecial(special: SpecialMove) { this.special = special; }

  private makeWinnerBadge() {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 96;
    const context = canvas.getContext('2d')!;
    context.fillStyle = 'rgba(20, 12, 0, .94)';
    context.strokeStyle = '#ffcf4a'; context.lineWidth = 7;
    context.beginPath(); context.roundRect(8, 8, 240, 70, 24); context.fill(); context.stroke();
    context.fillStyle = '#ffcf4a'; context.font = '900 42px Arial';
    context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText('1ST', 128, 44);
    const material = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthTest: false });
    const badge = new THREE.Sprite(material);
    badge.position.set(0, 3.25, 0); badge.scale.set(2.1, .79, 1); badge.visible = false; badge.renderOrder = 120;
    return badge;
  }

  private crouch() {
    // "set" position in the blocks: hips high, back flat, weight on the hands.
    // Sign convention: +x rotation swings a limb backwards, knees/ankles flex with +x.
    this.hips.position.y = .56;
    this.hips.rotation.set(0, 0, 0);
    this.torso.rotation.set(1.12, 0, 0);
    this.chest.rotation.set(.1, 0, 0);
    this.head.rotation.set(-.88, 0, 0);
    for (const k of [0, 1]) {
      this.shoulders[k].rotation.set(-1.02, 0, k === 0 ? .06 : -.06);
      this.elbows[k].rotation.x = -.08;
      this.hipJoints[k].rotation.x = k === 0 ? -1.15 : .35;  // front thigh tucked under the chest
      this.knees[k].rotation.x = k === 0 ? 1.95 : .55;       // knees flex backwards (anatomical)
      this.ankles[k].rotation.x = k === 0 ? -.35 : .45;      // front dorsiflexed, rear on the block
    }
  }

  /** Standing on the podium: rank 0 = champion (arms up + hop), others wave. */
  ceremony(t: number, rank: number) {
    this.hips.position.y = .95 + (rank === 0 ? Math.abs(Math.sin(t * 3.4)) * .1 : 0);
    this.hips.rotation.set(0, 0, 0);
    this.torso.rotation.set(-.04, 0, 0);
    this.chest.rotation.set(0, Math.sin(t * .9 + rank) * .08, 0);
    this.head.rotation.set(-.16, Math.sin(t * .7 + rank * 2) * .2, 0);
    for (const k of [0, 1]) {
      this.hipJoints[k].rotation.x = 0;
      this.knees[k].rotation.x = -.05;
      this.ankles[k].rotation.x = 0;
    }
    if (rank === 0) { this.celebrate(t); return; }
    this.shoulders[0].rotation.set(-.12, 0, .08); this.elbows[0].rotation.x = -.2;
    this.shoulders[1].rotation.set(0, 0, 2.35 + Math.sin(t * 5 + rank) * .3); this.elbows[1].rotation.x = -.4;
  }

  private celebrate(t: number) {
    for (const k of [0, 1]) {
      this.shoulders[k].rotation.x = 0;
      this.shoulders[k].rotation.z = (k === 0 ? -1 : 1) * (2.55 + Math.sin(t * 6 + k) * .25);
      this.elbows[k].rotation.x = -.3;
    }
    this.head.rotation.x = -.35;
    this.torso.rotation.x = -.06 + Math.sin(t * 5) * .03;
  }

  update(dist: number, t: number, dt: number) {
    // post-finish jog-out with exponential deceleration
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
    this.root.rotation.z = 0;
    this.winnerBadge.visible = this.winner && this.finishT !== null;
    const specialActive = !!this.special && t >= this.special.trigger && t < this.special.trigger + this.special.duration;
    const specialKind = specialActive ? this.special!.kind : null;
    this.rocketFlames.visible = specialKind === 'rocketFire';
    this.potionBottle.visible = specialKind === 'potion';
    this.specialAura.visible = specialActive;
    if (specialActive) {
      const pulse = .9 + Math.sin(t * 16) * .12;
      this.specialAura.scale.setScalar(pulse);
      (this.specialAura.material as THREE.MeshBasicMaterial).color.set(this.special!.multiplier > 1 ? '#ffcf4a' : '#ff5a7d');
    }

    // Sweat gradually changes skin micro-roughness and specular response.
    const effort = THREE.MathUtils.clamp(x / 100, 0, 1);
    this.skinMaterial.roughness = THREE.MathUtils.lerp(.54, .31, effort);
    this.skinMaterial.clearcoat = THREE.MathUtils.lerp(.03, .2, effort);
    this.kitMaterial.roughness = THREE.MathUtils.lerp(.46, .39, effort);

    if (this.finishT === null && x <= 0.001) { this.blend = 0; this.crouch(); return; }

    this.blend = Math.min(1, this.blend + dt * (x < 8 ? 3.7 : 2.8));
    const b = this.blend, run = Math.min(1, this.v / 8.5);
    // Cadence derived from a 4.1–4.4m full stride: about 4.4–4.8 steps/s
    // at elite top speed. The previous factor doubled realistic cadence.
    this.phase += this.v * dt * (1.38 + .08 * run);
    const pL = this.phase, swingL = Math.sin(pL);

    // forward lean: deep drive phase out of the blocks → upright at top speed
    const driveLean = .13 + .47 * Math.exp(-Math.max(0, x) / 8.5);
    const finishProgress = this.finishT === null
      ? Math.max(0, Math.min(1, (x - 96) / 4))
      : Math.max(0, 1 - (t - this.finishT) / .48);
    const finishEase = finishProgress * finishProgress * (3 - 2 * finishProgress);
    const lean = (this.finishT !== null ? .06 : driveLean) + finishEase * .43;
    this.torso.rotation.x = lean * b + (1 - b) * 1.12;
    this.torso.rotation.z = swingL * .035 * run;
    // pelvis and shoulder girdle counter-rotate, synced to foot plant (cos phase)
    const cosL = Math.cos(pL);
    this.hips.rotation.y = cosL * .13 * run * b;
    this.hips.rotation.z = swingL * .045 * run * b;
    this.chest.rotation.y = -cosL * .21 * run * b;
    this.chest.rotation.x = (.06 + finishEase * .14) * b;
    // gaze stays level on the finish line
    this.head.rotation.x = -(this.torso.rotation.x + this.chest.rotation.x) * (.82 - finishEase * .18);
    this.head.rotation.y = -this.chest.rotation.y * .55;
    // vertical oscillation: lowest mid-stance, highest mid-flight (two per cycle)
    const flightLift = (-Math.cos(2 * pL - 1.4) + 1) * .021 * run;
    this.hips.position.y = .56 + (.37 - .012 * run) * b + flightLift;

    // ── legs: planted-foot gait solved with 2-bone IK ──
    // The foot follows a real gait path (plant → drive back under the body →
    // toe-off → high heel-recovery arc) and the thigh/knee angles are solved
    // from it, so feet never skate and knees always bend anatomically.
    const L1 = .41, L2 = .40;                       // thigh, shin (slightly under geometric length)
    const ANKLE_H = .08;
    const hipH = this.hips.position.y - .04;        // hip pivot height above ground
    const reach = (.24 + .36 * run) * (specialKind === 'giantStride' ? 1.55 : 1);
    const STANCE = .34 - .06 * run;                 // contact time shortens at top speed
    for (const k of [0, 1]) {
      const sgn = k === 0 ? 1 : -1;
      const p = pL + (k === 0 ? 0 : Math.PI);
      const u = (((p % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2);
      let footZ: number, footY: number, anklePitch: number;
      if (u < STANCE) {                             // stance: foot planted, body passes over it
        const s = u / STANCE;
        footZ = (.62 - 1.62 * s) * reach;
        footY = ANKLE_H - Math.sin(Math.PI * s) * .008;
        anklePitch = s > .68 ? ((s - .68) / .32) * .72 * run : -.06 * (1 - s);
      } else {                                      // swing: heel to hip, knee drives up and forward
        const s = (u - STANCE) / (1 - STANCE);
        const e = s * s * (3 - 2 * s);
        footZ = (-1 + 1.62 * e) * reach;
        footY = ANKLE_H + Math.pow(Math.sin(Math.PI * s), 1.12) * (.27 + .30 * run);
        anklePitch = -.34 * Math.sin(Math.PI * s);  // toes up through recovery
      }
      const dz = footZ, dy = footY - hipH;
      const d = Math.min(L1 + L2 - .004, Math.hypot(dz, dy));
      const a1 = Math.atan2(dz, -dy);
      const cosHip = Math.min(1, Math.max(-1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)));
      const cosKnee = Math.min(1, Math.max(-1, (L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2)));
      const hipRot = -(a1 + Math.acos(cosHip));     // +x rotation swings the limb backwards
      const kneeRot = Math.PI - Math.acos(cosKnee); // knee flexes backwards only
      this.hipJoints[k].rotation.x = hipRot * b + (1 - b) * (k === 0 ? -1.15 : .35);
      this.knees[k].rotation.x = kneeRot * b + (1 - b) * (k === 0 ? 1.95 : .55);
      // keep the sole level with the ground, plus the gait pitch
      this.ankles[k].rotation.x = (anklePitch - (hipRot + kneeRot)) * b + (1 - b) * (k === 0 ? -.35 : .45);

      // arms drive opposite the legs; elbows stay ~90°, opening on the backswing.
      // At foot plant (u=0) the same-side arm is at its rearmost point.
      const armSw = -Math.cos(p);
      const armDrive = x < 22 ? 1.16 : 1.02;
      this.shoulders[k].rotation.x = (-armSw * armDrive - .1) * run * b + (1 - b) * -1.02;
      this.shoulders[k].rotation.z = sgn * .09 * b;
      this.elbows[k].rotation.x = -(1.22 + .24 * armSw * run) * b - .04;
      this.wrists[k].rotation.x = (.12 - .14 * armSw) * run * b;
    }
    if (specialKind === 'horseRun') {
      this.hips.position.y = .58;
      this.torso.rotation.x = 1.18;
      this.chest.rotation.x = .18;
      this.head.rotation.x = -.9;
      for (const k of [0, 1]) {
        this.shoulders[k].rotation.x = Math.sin(this.phase + k * Math.PI) * .9 - .75;
        this.elbows[k].rotation.x = -.25;
      }
    } else if (specialKind === 'flying') {
      this.root.position.y = 1.05 + Math.sin(t * 9) * .09;
      this.torso.rotation.x = .08;
      this.shoulders[0].rotation.set(-1.65, 0, -.18);
      this.shoulders[1].rotation.set(-1.65, 0, .18);
      this.elbows.forEach(elbow => { elbow.rotation.x = -.08; });
    } else if (specialKind === 'rocketFire') {
      this.root.position.y = .16 + Math.sin(t * 38) * .035;
      this.torso.rotation.x = .52;
      this.rocketFlames.children.forEach((flame, index) => flame.scale.set(1, .82 + Math.sin(t * 35 + index) * .22, 1));
    } else if (specialKind === 'lieDown') {
      this.hips.position.y = .22;
      this.torso.rotation.x = 1.5;
      this.chest.rotation.x = .05;
      this.head.rotation.x = -1.35;
      this.shoulders.forEach((shoulder, index) => shoulder.rotation.set(-.2, 0, index ? 1.25 : -1.25));
      this.hipJoints.forEach((hip, index) => hip.rotation.x = index ? .15 : -.15);
      this.knees.forEach(knee => { knee.rotation.x = .08; });
    } else if (specialKind === 'potion') {
      this.shoulders[1].rotation.set(-2.15, 0, .35);
      this.elbows[1].rotation.x = -1.65;
      this.head.rotation.x -= .35;
      this.potionBottle.rotation.z = Math.sin(t * 8) * .15;
    } else if (specialKind === 'springShoes') {
      this.root.position.y = Math.abs(Math.sin(t * 9.5)) * .72;
      this.ankles.forEach(ankle => { ankle.rotation.x += Math.sin(t * 9.5) * .35; });
    } else if (specialKind === 'ninjaDash') {
      this.specialAura.rotation.z += dt * 12;
      this.root.position.y = .06;
      this.chest.rotation.y += Math.sin(t * 28) * .12;
    } else if (specialKind === 'danceBreak') {
      this.root.position.y = Math.abs(Math.sin(t * 7)) * .13;
      this.hips.rotation.y = Math.sin(t * 10) * .6;
      this.shoulders[0].rotation.z = -1.7 + Math.sin(t * 8) * .7;
      this.shoulders[1].rotation.z = 1.7 + Math.cos(t * 8) * .7;
    } else if (specialKind === 'headwind') {
      this.torso.rotation.x = -.28 + Math.sin(t * 15) * .05;
      this.chest.rotation.x = -.16;
      this.shoulders.forEach((shoulder, index) => shoulder.rotation.z = (index ? 1 : -1) * .65);
      this.head.rotation.x = .22;
    }
    if (this.finishT !== null && this.v < 2.4 && this.winner) this.celebrate(t);
  }
}

type AnyRunner = Runner | SkinnedRunner;

// Pure side-on tracking camera. Camera and target always share X, so the
// viewing vector can never reveal an athlete's back.
const SIDE_CAMERA_Y = 4.6;
const SIDE_CAMERA_Z = 18;

// ── Stadium ──────────────────────────────────────────────────
export class Stadium {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(40, 1, .1, 600);
  renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private smaa: SMAAPass;
  private ssao: SSAOPass;
  private bloom: UnrealBloomPass;
  private keyLight!: THREE.DirectionalLight;
  private renderScale = 1.25;
  private nameTagsEnabled = true;
  runners: AnyRunner[] = [];
  clock = new THREE.Clock();
  private templates: { male: RunnerTemplate | null; female: RunnerTemplate | null } = { male: null, female: null };
  private names: string[] = [];
  private crowd!: THREE.InstancedMesh;
  private crowdBase: Float32Array = new Float32Array(0);
  private adTexs: THREE.CanvasTexture[] = [];
  private boardCanvas = document.createElement('canvas');
  private boardTex!: THREE.CanvasTexture;
  private boardAt = 0;
  private camPos = new THREE.Vector3(START_X, SIDE_CAMERA_Y, SIDE_CAMERA_Z);
  private camLook = new THREE.Vector3(START_X, 1, 0);
  private worldT = 0;
  private msg = ''; private msgSub = ''; private msgUntil = 0;
  private podium: THREE.Group | null = null;
  private ceremonyRunners: AnyRunner[] = [];
  private confetti: THREE.InstancedMesh | null = null;
  private confettiData: Float32Array = new Float32Array(0);
  private ceremonyT = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.scene.background = new THREE.Color('#050d1a');
    this.scene.fog = new THREE.Fog('#050d1a', 120, 320);
    this.canvas.dataset.cameraMode = 'side-only';
    this.canvas.dataset.viewAxis = 'negative-z';
    this.canvas.dataset.runnerRenderer = 'procedural-human';
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
    this.build();
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.ssao = new SSAOPass(this.scene, this.camera);
    this.ssao.kernelRadius = 9;
    this.ssao.minDistance = .001;
    this.ssao.maxDistance = .065;
    this.composer.addPass(this.ssao);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .2, .42, .88);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        offset: { value: .92 },
        darkness: { value: .64 },
      },
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: 'uniform sampler2D tDiffuse; uniform float offset; uniform float darkness; varying vec2 vUv; void main(){vec4 c=texture2D(tDiffuse,vUv); vec2 uv=(vUv-vec2(.5))*vec2(offset); c.rgb*=1.0-dot(uv,uv)*darkness; gl_FragColor=c;}',
    }));
    this.smaa = new SMAAPass();
    this.composer.addPass(this.smaa);
    this.composer.addPass(new OutputPass());
    // optional photoreal athletes: auto-detected at src/public/models/runner.glb
    void loadRunnerTemplates().then(templates => { this.templates = templates; });
    addEventListener('resize', () => this.resize());
    this.resize();
  }

  setQuality(quality: GraphicsQuality) {
    const preset = quality === 'performance'
      ? { scale: 1, ssao: false, bloom: false, shadow: 1024 }
      : quality === 'cinematic'
        ? { scale: 2, ssao: true, bloom: true, shadow: 4096 }
        : { scale: 1.25, ssao: true, bloom: true, shadow: 2048 };
    this.renderScale = Math.min(devicePixelRatio, preset.scale);
    this.renderer.setPixelRatio(this.renderScale);
    this.ssao.enabled = preset.ssao;
    this.bloom.enabled = preset.bloom;
    if (this.keyLight.shadow.mapSize.width !== preset.shadow) {
      this.keyLight.shadow.map?.dispose();
      this.keyLight.shadow.map = null;
      this.keyLight.shadow.mapSize.set(preset.shadow, preset.shadow);
    }
    this.resize();
  }

  setNameTags(visible: boolean) {
    this.nameTagsEnabled = visible;
    const apply = (root: THREE.Object3D) => root.traverse(object => {
      if (object.userData.isNameTag) object.visible = visible;
    });
    this.runners.forEach(runner => apply(runner.root));
    this.ceremonyRunners.forEach(runner => apply(runner.root));
  }

  setSpecialMoves(moves: SpecialMove[]) {
    this.runners.forEach((runner, index) => { if (moves[index]) runner.setSpecial(moves[index]); });
  }

  private makeRunner(lane: number, color: string, gender: Gender, name: string, appearance: Appearance, hairStyle: HairStyle): AnyRunner {
    const template = gender === 'female' ? this.templates.female : this.templates.male;
    if (template) return new SkinnedRunner(template, lane, color, gender, appearance, makeNameTag(name, gender, lane, appearance));
    return new Runner(lane, color, gender, name, appearance, hairStyle);
  }

  private build() {
    // infield + surroundings
    const field = new THREE.Mesh(new THREE.PlaneGeometry(360, 220), new THREE.MeshStandardMaterial({ color: '#0b3020', roughness: .95 }));
    field.rotation.x = -Math.PI / 2; field.position.y = -.03; field.receiveShadow = true;
    this.scene.add(field);

    // track with painted texture (extends 30m past the finish for the jog-out)
    const track = new THREE.Mesh(new THREE.PlaneGeometry(140, 20), new THREE.MeshStandardMaterial({ map: makeTrackTexture(), roughness: .88 }));
    track.rotation.x = -Math.PI / 2; track.position.set(10, 0, 0); track.receiveShadow = true;
    (track.material as THREE.MeshStandardMaterial).map!.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    this.scene.add(track);

    // starting blocks
    const blockMat = new THREE.MeshStandardMaterial({ color: '#d8dde6', metalness: .4, roughness: .4 });
    for (let i = 0; i < 8; i++) {
      const grp = new THREE.Group();
      const rail = new THREE.Mesh(new THREE.BoxGeometry(.7, .04, .06), blockMat); rail.position.y = .05; grp.add(rail);
      for (const [dx, ry] of [[-.18, -.5], [.12, -.5]] as const) {
        const pad = new THREE.Mesh(new THREE.BoxGeometry(.16, .04, .18), blockMat);
        pad.position.set(dx, .12, 0); pad.rotation.x = ry; grp.add(pad);
      }
      grp.position.set(START_X - .45, 0, laneZ(i));
      grp.rotation.y = Math.PI / 2;
      this.scene.add(grp);
    }

    // grandstands with roof, both sides
    const standMat = new THREE.MeshStandardMaterial({ color: '#122438', roughness: .85 });
    for (const side of [-1, 1]) {
      for (let row = 0; row < 12; row++) {
        const tier = new THREE.Mesh(new THREE.BoxGeometry(190, 1.1, 2.4), standMat);
        tier.position.set(5, .8 + row * 1.15, side * (14.5 + row * 2.1));
        this.scene.add(tier);
      }
      const roof = new THREE.Mesh(new THREE.BoxGeometry(196, .5, 14), new THREE.MeshStandardMaterial({ color: '#16324a', roughness: .5, metalness: .3 }));
      roof.position.set(5, 16.4, side * 32);
      roof.rotation.x = side * .1;
      this.scene.add(roof);
    }

    // colourful crowd with wave animation
    const N = 2600;
    const geo = new THREE.BoxGeometry(.34, .5, .3);
    const mat = new THREE.MeshLambertMaterial();
    this.crowd = new THREE.InstancedMesh(geo, mat, N);
    this.crowdBase = new Float32Array(N * 4);
    const palette = ['#e4573d', '#f2b134', '#4ba3dd', '#7ed957', '#e86ca4', '#f5f0e6', '#9a7fe8', '#41d8ff'];
    const m = new THREE.Matrix4(), col = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const side = i % 2 ? 1 : -1, row = Math.floor(i / 260), colIdx = i % 130;
      const x = -90 + colIdx * 1.47 + Math.random() * .6;
      const y = 1.65 + row * 1.15;
      const z = side * (14.8 + row * 2.1 + Math.random() * .5);
      this.crowdBase.set([x, y, z, Math.random() * 6.28], i * 4);
      m.setPosition(x, y, z); this.crowd.setMatrixAt(i, m);
      this.crowd.setColorAt(i, col.set(palette[(Math.random() * palette.length) | 0]));
    }
    this.scene.add(this.crowd);

    // LED advertising boards along both track edges
    for (const side of [-1, 1]) {
      const tex = makeAdTexture();
      this.adTexs.push(tex);
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(136, .9, .12),
        [null, null, null, null,
          new THREE.MeshBasicMaterial({ map: tex }),
          new THREE.MeshBasicMaterial({ map: tex })
        ].map(mm => mm ?? new THREE.MeshStandardMaterial({ color: '#06121f' })) as THREE.Material[]
      );
      board.position.set(8, .48, side * 10.9);
      this.scene.add(board);
    }

    // giant screen / scoreboard
    this.boardCanvas.width = 768; this.boardCanvas.height = 384;
    this.boardTex = new THREE.CanvasTexture(this.boardCanvas);
    this.boardTex.colorSpace = THREE.SRGBColorSpace;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(21, 11.5, .8), new THREE.MeshStandardMaterial({ color: '#0a1622', roughness: .4 }));
    frame.position.set(10, 12.5, -38);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(20, 10.5), new THREE.MeshBasicMaterial({ map: this.boardTex }));
    screen.position.set(10, 12.5, -37.55);
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(.4, .5, 7), new THREE.MeshStandardMaterial({ color: '#15293d' }));
    legL.position.set(4, 3.5, -38);
    const legR = legL.clone(); legR.position.x = 16;
    this.scene.add(frame, screen, legL, legR);
    this.drawBoard(0, '', 0);

    // floodlight masts
    const mastMat = new THREE.MeshStandardMaterial({ color: '#233a4f', metalness: .5, roughness: .5 });
    const panelMat = new THREE.MeshBasicMaterial({ color: '#eaf6ff' });
    for (const [mx, mz] of [[-70, -30], [-70, 30], [86, -30], [86, 30]] as const) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.45, .7, 34, 10), mastMat);
      pole.position.set(mx, 17, mz); this.scene.add(pole);
      const panel = new THREE.Mesh(new THREE.BoxGeometry(6.5, 3, .5), panelMat);
      panel.position.set(mx, 34.5, mz);
      panel.lookAt(10, 0, 0);
      this.scene.add(panel);
      const spot = new THREE.SpotLight('#dcecff', 65, 180, .62, .65);
      spot.position.set(mx, 34, mz); spot.target.position.set(10, 0, 0);
      this.scene.add(spot, spot.target);
    }

    // key light with shadows + ambient fill
    const key = new THREE.DirectionalLight('#cfe4ff', 2.4);
    this.keyLight = key;
    key.position.set(20, 45, 28);
    key.castShadow = true;
    key.shadow.mapSize.set(4096, 4096);
    key.shadow.camera.left = -70; key.shadow.camera.right = 85;
    key.shadow.camera.top = 25; key.shadow.camera.bottom = -25;
    key.shadow.camera.far = 120;
    this.scene.add(key);
    this.scene.add(new THREE.HemisphereLight('#7fb4d8', '#1c1008', 1.15));

    // night sky stars
    const starGeo = new THREE.BufferGeometry();
    const pts = new Float32Array(1500);
    for (let i = 0; i < 500; i++) {
      const a = Math.random() * Math.PI * 2, r = 200 + Math.random() * 90, h = 30 + Math.random() * 160;
      pts.set([Math.cos(a) * r, h, Math.sin(a) * r], i * 3);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    this.scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: '#9db8d8', size: .7, sizeAttenuation: true })));
  }

  private drawBoard(time: number, leader: string, dist: number) {
    const g = this.boardCanvas.getContext('2d')!;
    g.fillStyle = '#04101c'; g.fillRect(0, 0, 768, 384);
    g.fillStyle = '#41d8ff'; g.font = 'bold 34px Arial'; g.textAlign = 'left';
    g.fillText('RUNNING 100m', 30, 56);
    g.fillStyle = '#ffcf4a'; g.font = '26px Arial'; g.textAlign = 'right';
    g.fillText("MEN'S 100M", 738, 56);
    g.strokeStyle = '#12314a'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(30, 78); g.lineTo(738, 78); g.stroke();
    if (this.msg && this.worldT < this.msgUntil) {
      // flashing banner (new record / ceremony)
      const blink = Math.sin(this.worldT * 7) > -.35;
      g.textAlign = 'center';
      if (blink) {
        g.fillStyle = '#ffcf4a';
        g.font = 'bold 76px Arial';
        g.fillText(this.msg, 384, this.msgSub ? 205 : 240);
      }
      if (this.msgSub) {
        g.fillStyle = '#ffffff'; g.font = 'bold 44px Arial';
        g.fillText(this.msgSub, 384, 300);
      }
      this.boardTex.needsUpdate = true;
      return;
    }
    g.fillStyle = '#ffffff'; g.font = 'bold 150px Arial'; g.textAlign = 'center';
    g.fillText(Math.max(0, time).toFixed(2), 384, 235);
    if (leader) {
      g.fillStyle = '#7ed957'; g.font = 'bold 44px Arial';
      g.fillText(`${leader}  ·  ${Math.min(100, dist).toFixed(0)}m`, 384, 330);
    }
    this.boardTex.needsUpdate = true;
  }

  /** Show a flashing message on the giant screen for `secs` seconds. */
  flashMessage(text: string, sub = '', secs = 5) {
    this.msg = text; this.msgSub = sub; this.msgUntil = this.worldT + secs;
    this.boardAt = 0;
  }

  setAthletes(count: number, colors: string[], names: string[] = [], genders: Gender[] = [], appearances: Appearance[] = [], hairStyles: HairStyle[] = []) {
    this.clearPodium();
    this.msg = ''; this.msgSub = ''; this.msgUntil = 0;
    this.runners.forEach(r => this.scene.remove(r.root));
    this.runners = [];
    this.names = names;
    for (let i = 0; i < count; i++) {
      const r = this.makeRunner(i, colors[i], genders[i] ?? 'male', names[i] ?? `선수 ${i + 1}`, appearances[i] ?? 'eastAsian', hairStyles[i] ?? 'crop');
      r.root.traverse(object => { if (object.userData.isNameTag) object.visible = this.nameTagsEnabled; });
      this.runners.push(r);
      this.scene.add(r.root);
    }
    this.snapSideCamera(0);
    this.drawBoard(0, '', 0);
  }

  /** Immediately position the exact-profile camera; used by the one-second finish replay. */
  snapSideCamera(distance: number) {
    const x = distance >= 92 ? 50 : START_X + distance;
    this.camPos.set(x, SIDE_CAMERA_Y, SIDE_CAMERA_Z);
    this.camLook.set(x, 1.05, 0);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
  }

  /** raceTime < 0 during the countdown; distances are metres run per athlete. */
  update(distances: number[], raceTime: number, _mode?: string) {
    const dt = Math.min(.05, this.clock.getDelta());
    this.worldT += dt;

    // runners
    let lead = 0, leadIdx = 0;
    distances.forEach((d, i) => { if (d > lead) { lead = d; leadIdx = i; } });
    let winnerIdx = -1;
    this.runners.forEach((r, i) => {
      r.update(distances[i] ?? 0, raceTime, dt);
      if (r.finishT !== null && (winnerIdx < 0 || r.finishT < this.runners[winnerIdx].finishT!)) winnerIdx = i;
    });
    if (winnerIdx >= 0) this.runners.forEach((r, i) => r.winner = i === winnerIdx);
    // crowd wave + excitement
    const excite = lead > 0 ? 1 : .25;
    const m = new THREE.Matrix4();
    for (let i = 0; i < this.crowdBase.length / 4; i++) {
      const x = this.crowdBase[i * 4], y = this.crowdBase[i * 4 + 1], z = this.crowdBase[i * 4 + 2], p = this.crowdBase[i * 4 + 3];
      const bob = Math.max(0, Math.sin(this.worldT * 2.4 - x * .045 + p * .3)) * .38 * excite + Math.sin(this.worldT * 3 + p) * .04;
      m.setPosition(x, y + bob, z);
      this.crowd.setMatrixAt(i, m);
    }
    this.crowd.instanceMatrix.needsUpdate = true;

    // LED boards scroll
    for (const t of this.adTexs) t.offset.x = (t.offset.x + dt * .04) % 1;

    // scoreboard at ~12Hz
    if (this.worldT - this.boardAt > .08) {
      this.boardAt = this.worldT;
      this.drawBoard(raceTime, lead > 0 ? this.names[leadIdx] ?? '' : '', lead);
    }

    // ── exact side-only tracking camera ──
    const leadX = START_X + lead;
    const sideX = lead >= 92 ? 50 : leadX;
    this.camPos.lerp(new THREE.Vector3(sideX, SIDE_CAMERA_Y, SIDE_CAMERA_Z), Math.min(1, dt * 5.5));
    this.camLook.lerp(new THREE.Vector3(sideX, 1.05, 0), Math.min(1, dt * 6.5));
    this.camLook.x = this.camPos.x; // exact profile: no forward/back viewing component
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
  }

  // ── victory ceremony (3D podium + confetti) ─────────────────
  showPodium(entries: { name: string; color: string; gender: Gender; appearance: Appearance; hairStyle: HairStyle; time: string }[], headline = 'VICTORY CEREMONY') {
    this.setAthletes(0, []);
    const grp = new THREE.Group();
    const spots = [{ z: 0, h: 1.15 }, { z: -2.3, h: .8 }, { z: 2.3, h: .55 }];
    const metals = ['#ffcf4a', '#c9d4e0', '#c47d52'];
    entries.slice(0, 3).forEach((e, i) => {
      const s = spots[i];
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(2, s.h, 2),
        new THREE.MeshStandardMaterial({ color: metals[i], roughness: .35, metalness: .45 }));
      box.position.set(20, s.h / 2, s.z); box.castShadow = true; box.receiveShadow = true;
      grp.add(box);
      const r = this.makeRunner(i, e.color, e.gender, e.name, e.appearance, e.hairStyle);
      r.root.position.set(20, s.h, s.z);
      r.root.rotation.y = 0; // face the main stand (+z)
      grp.add(r.root);
      this.ceremonyRunners.push(r);
    });
    // confetti
    const N = 420;
    const cGeo = new THREE.PlaneGeometry(.14, .08);
    const cMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    this.confetti = new THREE.InstancedMesh(cGeo, cMat, N);
    this.confettiData = new Float32Array(N * 5);
    const palette = ['#ffcf4a', '#41d8ff', '#ff5a7d', '#7ed957', '#f5f0e6', '#a779ff'];
    const col = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * 8;
      this.confettiData.set([20 + Math.cos(a) * r, 2 + Math.random() * 11, Math.sin(a) * r,
        1.1 + Math.random() * 1.6, Math.random() * 6.28], i * 5);
      this.confetti.setColorAt(i, col.set(palette[(Math.random() * palette.length) | 0]));
    }
    grp.add(this.confetti);
    this.scene.add(grp);
    this.podium = grp;
    this.ceremonyT = 0;
    this.msg = headline;
    this.msgSub = entries[0] ? `${entries[0].name}  ${entries[0].time}` : '';
    this.msgUntil = Infinity;
  }

  private clearPodium() {
    if (this.podium) { this.scene.remove(this.podium); this.podium = null; }
    this.ceremonyRunners = [];
    this.confetti = null;
  }

  /** Drive the ceremony scene; call instead of update() while the podium is shown. */
  updateCeremony() {
    const dt = Math.min(.05, this.clock.getDelta());
    this.worldT += dt; this.ceremonyT += dt;
    const t = this.ceremonyT;
    this.ceremonyRunners.forEach((r, i) => r.ceremony(t, i));

    // excited crowd
    const m = new THREE.Matrix4();
    for (let i = 0; i < this.crowdBase.length / 4; i++) {
      const x = this.crowdBase[i * 4], y = this.crowdBase[i * 4 + 1], z = this.crowdBase[i * 4 + 2], p = this.crowdBase[i * 4 + 3];
      const bob = Math.max(0, Math.sin(this.worldT * 2.8 + p)) * .42 + Math.sin(this.worldT * 3 + p) * .04;
      m.setPosition(x, y + bob, z);
      this.crowd.setMatrixAt(i, m);
    }
    this.crowd.instanceMatrix.needsUpdate = true;

    // confetti rain
    if (this.confetti) {
      const e = new THREE.Euler();
      for (let i = 0; i < this.confettiData.length / 5; i++) {
        let y = this.confettiData[i * 5 + 1] - this.confettiData[i * 5 + 3] * dt;
        if (y < .06) y = 9 + Math.random() * 4;
        this.confettiData[i * 5 + 1] = y;
        const p = this.confettiData[i * 5 + 4];
        const x = this.confettiData[i * 5] + Math.sin(this.worldT * 2 + p) * .35;
        e.set(this.worldT * 3 + p, p, this.worldT * 2.2);
        m.makeRotationFromEuler(e);
        m.setPosition(x, y, this.confettiData[i * 5 + 2]);
        this.confetti.setMatrixAt(i, m);
      }
      this.confetti.instanceMatrix.needsUpdate = true;
    }

    // LED boards + scoreboard banner
    for (const tex of this.adTexs) tex.offset.x = (tex.offset.x + dt * .04) % 1;
    if (this.worldT - this.boardAt > .08) { this.boardAt = this.worldT; this.drawBoard(0, '', 0); }

    // Ceremony remains on the same side axis and never orbits behind athletes.
    this.camPos.lerp(new THREE.Vector3(20, SIDE_CAMERA_Y, SIDE_CAMERA_Z), Math.min(1, dt * 4));
    this.camLook.lerp(new THREE.Vector3(20, 1.5, 0), Math.min(1, dt * 5));
    this.camLook.x = this.camPos.x;
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.smaa.setSize(w * this.renderScale, h * this.renderScale);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  render() { this.composer.render(); }
}
