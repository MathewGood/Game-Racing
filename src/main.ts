import './ui/styles.css';
import { StadiumAudio } from './audio/stadiumAudio';
import { Stadium } from './render/stadium';
import { profiles } from './data/profiles';
import { loadSettings, saveSettings, type GameSettings } from './core/settings';
import {
  makeAthlete,
  makeHeats,
  qualify,
  simulate,
  type Athlete,
  type Appearance,
  type Gender,
  type HairStyle,
  type Race,
  type Result,
} from './core/simulation';

const app = document.querySelector<HTMLDivElement>('#app')!;
let settings = loadSettings();
const stadium = new Stadium(document.querySelector<HTMLCanvasElement>('#world')!);
const audio = new StadiumAudio();
const MAX_ATHLETES = 50;

let athletes: Athlete[] = [];
let heats: Athlete[][] = [];
let races: Race[] = [];
let currentHeat = 0;
let finalRace: Race | null = null;
let animationFrame = 0;
let participantCount = 12;

type DraftAthlete = { name: string; profileIndex: number; gender: Gender; appearance: Appearance; hairStyle: HairStyle };
const appearances: Array<{ value: Appearance; label: string; short: string }> = [
  { value: 'eastAsian', label: '동아시아계', short: 'EAS' },
  { value: 'european', label: '유럽계', short: 'EUR' },
  { value: 'african', label: '아프리카계', short: 'AFR' },
];
const hairStyles: Array<{ value: HairStyle; label: string }> = [
  { value: 'buzz', label: '버즈컷' }, { value: 'crop', label: '크롭컷' },
  { value: 'sidePart', label: '사이드 파트' }, { value: 'waves', label: '웨이브' },
  { value: 'curls', label: '컬리' }, { value: 'afro', label: '아프로' },
  { value: 'braids', label: '브레이드' }, { value: 'ponytail', label: '포니테일' },
  { value: 'bun', label: '번' }, { value: 'undercut', label: '언더컷' },
];
const maleNames = ['김태양', '박지훈', '이서준', '최도윤', '정우진', '한시우', '윤도현', '강민재', '장하준', '오지호'];
const femaleNames = ['김서연', '이지아', '박하린', '최수빈', '정유나', '한채원', '윤지우', '강예린', '장민서', '오다은'];
const drafts: DraftAthlete[] = Array.from({ length: MAX_ATHLETES }, (_, index) => {
  const gender: Gender = index % 2 === 0 ? 'male' : 'female';
  const pool = gender === 'male' ? maleNames : femaleNames;
  return {
    name: `${pool[Math.floor(index / 2) % pool.length]}${index >= 20 ? ` ${index + 1}` : ''}`,
    profileIndex: index % profiles.length,
    gender,
    appearance: appearances[index % appearances.length].value,
    hairStyle: hairStyles[index % hairStyles.length].value,
  };
});

try {
  const saved = JSON.parse(localStorage.getItem('running100m-roster') || '{}') as { participantCount?: number; drafts?: DraftAthlete[] };
  participantCount = Math.max(2, Math.min(MAX_ATHLETES, Number(saved.participantCount) || participantCount));
  saved.drafts?.slice(0, MAX_ATHLETES).forEach((draft, index) => {
    if (draft && typeof draft.name === 'string' && ['male', 'female'].includes(draft.gender)) {
      drafts[index] = {
        name: draft.name.slice(0, 18), gender: draft.gender,
        appearance: appearances.some(item => item.value === draft.appearance) ? draft.appearance : appearances[index % appearances.length].value,
        hairStyle: hairStyles.some(item => item.value === draft.hairStyle) ? draft.hairStyle : hairStyles[index % hairStyles.length].value,
        profileIndex: Math.max(0, Math.min(profiles.length - 1, Number(draft.profileIndex) || 0)),
      };
    }
  });
} catch { /* keep the curated default roster */ }

function applySettings() {
  stadium.setQuality(settings.graphics);
  stadium.setNameTags(settings.showNameTags);
  audio.setMix(settings.masterVolume, settings.crowdVolume, settings.musicVolume);
  document.documentElement.dataset.reducedMotion = String(settings.reducedMotion);
}

applySettings();

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character]!));
const button = (label: string, id: string, ghost = false) => `<button class="button ${ghost ? 'ghost' : ''}" id="${id}">${label}</button>`;
const on = (id: string, handler: () => void) => document.querySelector(`#${id}`)?.addEventListener('click', handler);

const setBanner = (text: string, kind: 'bad' | 'good') => {
  const element = document.querySelector('.banner') as HTMLElement | null;
  if (element) { element.textContent = text; element.className = `banner show ${kind}`; }
};

function home() {
  cancelAnimationFrame(animationFrame);
  app.innerHTML = `<main class="screen home-screen"><div class="brand">RUNNING 100m · CHAMPIONSHIP EDITION</div><h1>RUNNING<br><em>100m</em></h1><p class="lead">한 번의 클릭으로 시작하는 빠른 경기부터 최대 50명의 챔피언십까지. 출발 후 무작위로 폭발하는 10종 필살기와 포토피니시 리플레이로 예측할 수 없는 100m 승부를 경험하세요.</p><div class="mode-grid"><button class="mode-card featured" id="quick"><small>QUICK MATCH</small><b>빠른 경기</b><span>8명 결선을 즉시 시작합니다</span></button><button class="mode-card" id="start"><small>CHAMPIONSHIP</small><b>대회 모드</b><span>선수 등록 · 예선 · 결선 · 시상식</span></button></div><div class="actions secondary-actions">${button('기록실', 'records', true)}${button('설정', 'settings', true)}</div><div class="build-mark">120HZ RACE ENGINE · 10 SPECIAL MOVES · PHOTOFINISH REPLAY</div></main>`;
  on('quick', quickRace);
  on('start', () => { void audio.playMenuMusic(); register(); });
  on('records', showRecords);
  on('settings', showSettings);
  stadium.setAthletes(0, []);
  stadium.render();
}

function quickRace() {
  void audio.enable();
  athletes = drafts.slice(0, 8).map((draft, index) => makeAthlete(
    draft.name, profiles[draft.profileIndex], `q${index}`, draft.gender, draft.appearance, draft.hairStyle,
  ));
  heats = [athletes]; races = []; currentHeat = 0;
  runRace(athletes, true);
}

function showSettings() {
  app.innerHTML = `<main class="screen"><section class="panel settings-panel"><div class="brand">GAME SETTINGS</div><h2 class="title">게임 설정</h2><p class="sub">기기 성능과 관람 환경에 맞게 조절하며, 저장 후 다음 실행에도 유지됩니다.</p><label class="setting-row"><span><b>그래픽 품질</b><small>후처리와 렌더링 해상도</small></span><select id="graphics"><option value="performance" ${settings.graphics === 'performance' ? 'selected' : ''}>성능 우선</option><option value="balanced" ${settings.graphics === 'balanced' ? 'selected' : ''}>균형</option><option value="cinematic" ${settings.graphics === 'cinematic' ? 'selected' : ''}>시네마틱</option></select></label>${volumeSetting('masterVolume', '전체 음량', settings.masterVolume)}${volumeSetting('crowdVolume', '관중 음량', settings.crowdVolume)}${volumeSetting('musicVolume', '메뉴 음악', settings.musicVolume)}<label class="setting-row toggle-row"><span><b>선수 이름표</b><small>경기 중 선수 위에 이름 표시</small></span><input id="showNameTags" type="checkbox" ${settings.showNameTags ? 'checked' : ''}></label><label class="setting-row toggle-row"><span><b>모션 감소</b><small>UI 점멸과 전환 애니메이션 최소화</small></span><input id="reducedMotion" type="checkbox" ${settings.reducedMotion ? 'checked' : ''}></label><div class="actions">${button('저장', 'saveSettings')}${button('취소', 'back', true)}</div></section></main>`;
  on('back', home);
  on('saveSettings', () => {
    const readVolume = (id: string) => Number((document.querySelector<HTMLInputElement>(`#${id}`)?.value ?? '70')) / 100;
    settings = {
      graphics: document.querySelector<HTMLSelectElement>('#graphics')!.value as GameSettings['graphics'],
      masterVolume: readVolume('masterVolume'),
      crowdVolume: readVolume('crowdVolume'),
      musicVolume: readVolume('musicVolume'),
      showNameTags: document.querySelector<HTMLInputElement>('#showNameTags')!.checked,
      reducedMotion: document.querySelector<HTMLInputElement>('#reducedMotion')!.checked,
    };
    saveSettings(settings); applySettings(); void audio.playMenuMusic(); home();
  });
  document.querySelectorAll<HTMLInputElement>('.volume-range').forEach(input => input.addEventListener('input', () => {
    const output = document.querySelector<HTMLOutputElement>(`[data-for="${input.id}"]`);
    if (output) output.value = `${input.value}%`;
  }));
}

function volumeSetting(id: string, label: string, value: number) {
  const percent = Math.round(value * 100);
  return `<label class="setting-row"><span><b>${label}</b><small>0% – 100%</small></span><input class="volume-range" id="${id}" type="range" min="0" max="100" value="${percent}"><output data-for="${id}">${percent}%</output></label>`;
}

const appearanceLabel = (value: Appearance) => appearances.find(item => item.value === value)?.label ?? value;
const appearanceShort = (value: Appearance) => appearances.find(item => item.value === value)?.short ?? value;
const hairLabel = (value: HairStyle) => hairStyles.find(item => item.value === value)?.label ?? value;

function captureDrafts() {
  for (let index = 0; index < participantCount; index += 1) {
    const name = document.querySelector<HTMLInputElement>(`#n${index}`);
    const profile = document.querySelector<HTMLSelectElement>(`#p${index}`);
    const gender = document.querySelector<HTMLSelectElement>(`#g${index}`);
    const appearance = document.querySelector<HTMLSelectElement>(`#a${index}`);
    const hairStyle = document.querySelector<HTMLSelectElement>(`#h${index}`);
    if (name && profile && gender && appearance && hairStyle) drafts[index] = {
      name: name.value.trim() || `선수 ${index + 1}`,
      profileIndex: Number(profile.value),
      gender: gender.value as Gender,
      appearance: appearance.value as Appearance,
      hairStyle: hairStyle.value as HairStyle,
    };
  }
  localStorage.setItem('running100m-roster', JSON.stringify({ participantCount, drafts }));
}

function athleteRows() {
  return Array.from({ length: participantCount }, (_, index) => {
    const draft = drafts[index];
    return `<label class="athlete"><span class="lane">${String(index + 1).padStart(2, '0')}</span><input id="n${index}" maxlength="18" value="${escapeHtml(draft.name)}" aria-label="${index + 1}번 선수 이름"><select id="g${index}" aria-label="${index + 1}번 선수 성별"><option value="male" ${draft.gender === 'male' ? 'selected' : ''}>남자</option><option value="female" ${draft.gender === 'female' ? 'selected' : ''}>여자</option></select><select id="a${index}" aria-label="${index + 1}번 선수 외형">${appearances.map(item => `<option value="${item.value}" ${draft.appearance === item.value ? 'selected' : ''}>${item.label}</option>`).join('')}</select><select id="h${index}" aria-label="${index + 1}번 선수 헤어스타일">${hairStyles.map(item => `<option value="${item.value}" ${draft.hairStyle === item.value ? 'selected' : ''}>${item.label}</option>`).join('')}</select><select id="p${index}" aria-label="${index + 1}번 선수 프로필">${profiles.map((profile, profileIndex) => `<option value="${profileIndex}" ${draft.profileIndex === profileIndex ? 'selected' : ''}>${profile.name}</option>`).join('')}</select></label>`;
  }).join('');
}

function register() {
  app.innerHTML = `<main class="screen"><section class="panel registration"><div class="brand">ATHLETE REGISTRATION</div><h2 class="title">선수 등록</h2><p class="sub identity-note">외형 프리셋과 헤어스타일은 시각적 개성만 바꾸며 경기 능력에는 영향을 주지 않습니다.</p><div class="count-control"><div><b>참가 선수 수</b><span>2명부터 최대 50명 · 한 조 최대 8명</span></div><input id="participantRange" type="range" min="2" max="50" value="${participantCount}"><input id="participantNumber" type="number" min="2" max="50" value="${participantCount}" aria-label="참가 선수 수"><output>${participantCount}명</output></div><div class="athlete-head"><span>번호</span><span>선수 이름</span><span>성별</span><span>외형</span><span>헤어</span><span>경기 스타일</span></div><div class="athletes">${athleteRows()}</div><div class="actions">${button('조 편성', 'seed')}${button('돌아가기', 'back', true)}</div></section></main>`;
  on('back', () => { captureDrafts(); home(); });
  const range = document.querySelector<HTMLInputElement>('#participantRange')!;
  const number = document.querySelector<HTMLInputElement>('#participantNumber')!;
  const changeCount = (value: number) => {
    captureDrafts();
    participantCount = Math.max(2, Math.min(MAX_ATHLETES, Math.round(value || 2)));
    register();
  };
  range.addEventListener('change', () => changeCount(Number(range.value)));
  number.addEventListener('change', () => changeCount(Number(number.value)));
  number.addEventListener('keydown', event => {
    if (event.key === 'Enter') changeCount(Number(number.value));
  });
  document.querySelector('.athletes')?.addEventListener('change', captureDrafts);
  on('seed', () => {
    captureDrafts();
    athletes = drafts.slice(0, participantCount).map((draft, index) => makeAthlete(
      draft.name,
      profiles[draft.profileIndex],
      `a${index}`,
      draft.gender,
      draft.appearance,
      draft.hairStyle,
    ));
    heats = makeHeats(athletes);
    showHeats();
  });
}

function showHeats() {
  const automatic = heats.length === 1 ? 8 : Math.max(1, Math.floor(8 / heats.length) - 1);
  const wildcard = heats.length === 1 ? 0 : Math.max(0, 8 - automatic * heats.length);
  app.innerHTML = `<main class="screen"><section class="panel heat-panel"><div class="brand">HEAT DRAW</div><h2 class="title">${heats.length === 1 ? '결선 편성' : `예선 ${heats.length}개 조 편성`}</h2><p class="sub">균등 배분 · ${heats.length === 1 ? '8명 이하 바로 결선' : `각 조 상위 ${automatic}명 자동 진출 + 기록순 ${wildcard}명 와일드카드`}</p><div class="heats">${heats.map((heat, index) => `<div class="heat"><b>HEAT ${index + 1} · ${heat.length}명</b><ol>${heat.map(athlete => `<li><span>${athlete.gender === 'female' ? '♀' : '♂'}</span> ${escapeHtml(athlete.name)} <small>· ${appearanceLabel(athlete.appearance)} · ${hairLabel(athlete.hairStyle)} · ${athlete.profile.tag}</small></li>`).join('')}</ol></div>`).join('')}</div><div class="actions">${button(heats.length === 1 ? '결선 시작' : '예선 시작', 'race')}${button('선수 수정', 'back', true)}</div></section></main>`;
  on('back', register);
  on('race', () => { races = []; currentHeat = 0; runRace(heats[0], heats.length === 1); });
}

function runRace(field: Athlete[], isFinal: boolean, seed = Date.now() & 0xfffffff) {
  cancelAnimationFrame(animationFrame);
  const race = simulate(field, seed);
  stadium.setAthletes(field.length, field.map(athlete => athlete.color), field.map(athlete => athlete.name), field.map(athlete => athlete.gender), field.map(athlete => athlete.appearance), field.map(athlete => athlete.hairStyle));
  audio.beginRace();
  const startAt = performance.now() + 2500;
  const zeros = field.map(() => 0);
  const winningTime = race.results[0]?.time ?? race.duration - 1;
  const resultById = new Map(race.results.map(result => [result.athlete.id, result]));
  stadium.setSpecialMoves(field.map(athlete => resultById.get(athlete.id)!.special));
  const lastFinishTime = Math.max(...race.results.map(result => result.time));
  const liveEndTime = isFinal ? lastFinishTime + .65 : race.duration + 1.2;
  const recordBase = Number(localStorage.getItem('velocity-cr') || '9.95');
  let flashed = false;
  let countdownCue = 4;
  let paused = false;
  let pausedAt = 0;
  let pausedTotal = 0;
  const triggeredSpecials = new Set<string>();

  app.innerHTML = `<div class="hud"><div class="topbar"><strong>${isFinal ? 'FINAL' : `HEAT ${currentHeat + 1} / ${heats.length}`} · 100M</strong><span class="camera-label">SIDE VIEW ONLY</span><button class="hud-button" id="pauseRace" aria-label="경기 일시정지">Ⅱ</button><span class="timer">0.00</span></div><div class="rankbar"></div><div class="special-feed"></div><div class="banner"></div><div class="pause-overlay"><b>PAUSED</b><span>ESC 또는 계속 버튼으로 재개</span><button class="button" id="resumeRace">계속</button></div><div class="countdown">3</div><div class="flash"></div></div>`;

  const setPaused = (value: boolean) => {
    if (value === paused) return;
    paused = value;
    if (paused) pausedAt = performance.now();
    else pausedTotal += performance.now() - pausedAt;
    audio.setPaused(paused);
    document.querySelector('.pause-overlay')?.classList.toggle('show', paused);
    const control = document.querySelector<HTMLButtonElement>('#pauseRace');
    if (control) control.textContent = paused ? '▶' : 'Ⅱ';
  };
  const togglePause = () => setPaused(!paused);
  const keyHandler = (event: KeyboardEvent) => { if (event.key === 'Escape' || event.key.toLowerCase() === 'p') togglePause(); };
  document.querySelector('#pauseRace')?.addEventListener('click', togglePause);
  document.querySelector('#resumeRace')?.addEventListener('click', () => setPaused(false));
  addEventListener('keydown', keyHandler);
  const cleanupRaceControls = () => { removeEventListener('keydown', keyHandler); audio.setPaused(false); };

  const tick = (now: number) => {
    if (paused) {
      stadium.render();
      animationFrame = requestAnimationFrame(tick);
      return;
    }
    const elapsed = (now - startAt - pausedTotal) / 1000;
    const countdown = document.querySelector('.countdown') as HTMLElement | null;
    if (elapsed < 0) {
      const value = Math.max(1, Math.ceil(-elapsed / 0.84));
      if (countdown) countdown.textContent = String(value);
      if (value < countdownCue) { countdownCue = value; audio.cue(230 + value * 55); }
      stadium.update(zeros, elapsed);
      stadium.render();
      animationFrame = requestAnimationFrame(tick);
      return;
    }

    if (countdown) { countdown.remove(); audio.gun(); }

    const time = Math.min(race.duration, elapsed);
    const frame = race.frames[Math.min(race.frames.length - 1, Math.floor(time * 120))];
    const lead = Math.max(0, ...frame.distances);
    audio.update(lead / 100, elapsed);
    stadium.update(frame.distances, elapsed);
    stadium.render();

    field.forEach(athlete => {
      const result = resultById.get(athlete.id)!;
      if (time < result.special.trigger || triggeredSpecials.has(athlete.id)) return;
      triggeredSpecials.add(athlete.id);
      const boost = result.special.multiplier > 1;
      audio.specialCue(boost);
      const feed = document.querySelector('.special-feed');
      if (feed) {
        const item = document.createElement('div');
        item.className = `special-event ${boost ? 'boost' : 'slow'}`;
        item.innerHTML = `<b>${escapeHtml(athlete.name)}</b><span>${escapeHtml(result.special.name)}</span>`;
        feed.prepend(item);
        setTimeout(() => item.remove(), 2800);
      }
    });

    if (!flashed && time >= winningTime) {
      flashed = true;
      audio.finishCheer();
      document.querySelector('.flash')?.classList.add('on');
      const winner = race.results[0];
      if (winner) {
        const newRecord = isFinal && winner.time < recordBase - 1e-9;
        stadium.flashMessage(newRecord ? 'NEW RECORD' : 'WINNER', `${winner.athlete.name}  ${winner.time.toFixed(2)}`, 6);
        setBanner(`${newRecord ? '대회 신기록 · ' : '1위 · '}${winner.athlete.name}  ${winner.time.toFixed(2)}`, 'good');
      }
    }
    document.querySelector('.timer')!.textContent = Math.min(time, race.duration - 1).toFixed(2);
    const order = field.map((athlete, index) => ({ athlete, distance: frame.distances[index], result: resultById.get(athlete.id)! }))
      .sort((a, b) => b.distance - a.distance || a.result.time - b.result.time);
    document.querySelector('.rankbar')!.innerHTML = order.map((entry, index) => {
      const active = time >= entry.result.special.trigger && time < entry.result.special.trigger + entry.result.special.duration;
      return `<div class="rank ${active ? 'special-active' : ''}"><b>${index + 1}</b><span>${entry.athlete.gender === 'female' ? '♀' : '♂'} ${escapeHtml(entry.athlete.name)} <small>${appearanceShort(entry.athlete.appearance)}</small>${active ? `<i>${escapeHtml(entry.result.special.name)}</i>` : ''}</span><span style="margin-left:auto">${entry.distance.toFixed(1)}m</span></div>`;
    }).join('');

    if (elapsed < liveEndTime) animationFrame = requestAnimationFrame(tick);
    else {
      cleanupRaceControls();
      if (isFinal) {
        finalRace = race;
        saveRecord(race);
        runReplay(race);
      } else {
        races.push(race);
        currentHeat += 1;
        if (currentHeat < heats.length) runRace(heats[currentHeat], false, seed + 103);
        else showQualifiers();
      }
    }
  };
  animationFrame = requestAnimationFrame(tick);
}

function showQualifiers() {
  const qualified = qualify(races);
  app.innerHTML = `<main class="screen"><section class="panel"><div class="brand">QUALIFIED</div><h2 class="title">결선 진출자</h2><div class="heats"><div class="heat"><ol>${qualified.map((athlete, index) => `<li><b>${index + 1}</b> ${athlete.gender === 'female' ? '♀' : '♂'} ${escapeHtml(athlete.name)} · ${Math.min(...races.flatMap(race => race.results.filter(result => result.athlete.id === athlete.id).map(result => result.time))).toFixed(3)}</li>`).join('')}</ol></div></div><div class="actions">${button('결선 시작', 'final')}${button('예선 결과', 'detail', true)}</div></section></main>`;
  on('final', () => runRace(qualified, true, (Date.now() + 777) & 0xfffffff));
  on('detail', () => showResult(races.flatMap(race => race.results).sort(compareResults), false));
}

function compareResults(a: Result, b: Result) {
  return a.time - b.time;
}

function showResult(race: Race | Result[], isFinal: boolean) {
  const results = Array.isArray(race) ? race : race.results;
  app.innerHTML = `<main class="screen"><section class="panel results"><div class="brand">OFFICIAL RESULTS</div><h2 class="title">${isFinal ? '결선' : '예선'} 결과</h2><div class="table-wrap"><table class="table"><thead><tr><th>순위</th><th>선수</th><th>구분</th><th>외형</th><th>헤어</th><th>필살기</th><th>반응</th>${[10,20,30,40,50,60,70,80,90,100].map(distance => `<th>${distance}m</th>`).join('')}<th>기록</th></tr></thead><tbody>${results.map((result, index) => `<tr><td class="medal">${index < 3 && isFinal ? ['🥇','🥈','🥉'][index] : index + 1}</td><td><b>${escapeHtml(result.athlete.name)}</b></td><td>${result.athlete.gender === 'female' ? '여자' : '남자'}</td><td>${appearanceLabel(result.athlete.appearance)}</td><td>${hairLabel(result.athlete.hairStyle)}</td><td><span class="result-special ${result.special.multiplier > 1 ? 'boost' : 'slow'}">${escapeHtml(result.special.name)}</span></td><td>${result.reaction.toFixed(3)}</td>${result.splits.map(split => `<td>${split.toFixed(2)}</td>`).join('')}<td><b>${result.display}</b></td></tr>`).join('')}</tbody></table></div><div class="actions">${isFinal ? button('시상식', 'podium') : button('결선 진출자', 'qual')}${isFinal ? button('리플레이', 'replay', true) : ''}${button('CSV 저장', 'exportCsv', true)}</div></section></main>`;
  on('exportCsv', () => exportResults(results, isFinal));
  if (isFinal) {
    on('podium', podium);
    on('replay', () => finalRace && runReplay(finalRace));
  } else on('qual', showQualifiers);
}

function exportResults(results: Result[], isFinal: boolean) {
  const quote = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  const headers = ['순위', '선수', '구분', '외형', '헤어스타일', '필살기', '발동시점', '반응시간', ...Array.from({ length: 10 }, (_, index) => `${(index + 1) * 10}m`), '기록'];
  const rows = results.map((result, index) => [
    index + 1, result.athlete.name, result.athlete.gender === 'female' ? '여자' : '남자', appearanceLabel(result.athlete.appearance), hairLabel(result.athlete.hairStyle), result.special.name, result.special.trigger.toFixed(3), result.reaction.toFixed(3),
    ...result.splits.map(split => split.toFixed(3)), result.time.toFixed(3),
  ]);
  const csv = `\uFEFF${[headers, ...rows].map(row => row.map(quote).join(',')).join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `Running100m_${isFinal ? 'Final' : 'Heats'}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function runReplay(race: Race) {
  cancelAnimationFrame(animationFrame);
  const field = race.results.slice().sort((a, b) => a.lane - b.lane).map(result => result.athlete);
  stadium.setAthletes(field.length, field.map(athlete => athlete.color), field.map(athlete => athlete.name), field.map(athlete => athlete.gender), field.map(athlete => athlete.appearance), field.map(athlete => athlete.hairStyle));
  const replayResultById = new Map(race.results.map(result => [result.athlete.id, result]));
  stadium.setSpecialMoves(field.map(athlete => replayResultById.get(athlete.id)!.special));
  stadium.snapSideCamera(100);
  audio.beginRace();
  const winner = race.results[0];
  const winningTime = winner?.time ?? race.duration - 1;
  app.innerHTML = `<div class="hud"><div class="topbar"><strong>1 SECOND FINISH REPLAY</strong><span class="badge on">SLOW MOTION ×0.48</span><span class="camera-label">SIDE VIEW ONLY</span><span class="timer">${winningTime.toFixed(2)}</span></div><div class="replay-caption"><b>${escapeHtml(winner?.athlete.name ?? '')}</b> · 1위 결승선 통과</div><div class="flash"></div></div>`;
  let simulationTime = Math.max(0, winningTime - .3);
  let previous = performance.now();
  const replayStartedAt = previous;
  let flashed = false;
  const tick = (now: number) => {
    const delta = (now - previous) / 1000;
    previous = now;
    simulationTime += delta * 0.48;
    const time = Math.min(race.duration, simulationTime);
    const frame = race.frames[Math.min(race.frames.length - 1, Math.floor(time * 120))];
    audio.update(Math.max(0, ...frame.distances) / 100, simulationTime);
    stadium.update(frame.distances, simulationTime);
    stadium.render();
    if (!flashed && time >= winningTime) { flashed = true; document.querySelector('.flash')?.classList.add('on'); }
    document.querySelector('.timer')!.textContent = Math.min(time, race.duration - 1).toFixed(2);
    if ((now - replayStartedAt) / 1000 < 1) animationFrame = requestAnimationFrame(tick);
    else showResult(race, true);
  };
  animationFrame = requestAnimationFrame(tick);
}

function podium() {
  cancelAnimationFrame(animationFrame);
  const top = finalRace!.results.slice(0, 3);
  stadium.showPodium(top.map(result => ({
    name: result.athlete.name,
    color: result.athlete.color,
    gender: result.athlete.gender,
    appearance: result.athlete.appearance,
    hairStyle: result.athlete.hairStyle,
    time: result.display,
  })));
  audio.finishCheer();
  app.innerHTML = `<main class="screen ceremony"><section class="panel ceremony-panel"><div class="brand">VICTORY CEREMONY</div><h2 class="title">시상식</h2><div class="heat">${top.map((result, index) => `<div class="rank"><b>${['🥇', '🥈', '🥉'][index]}</b><span>${result.athlete.gender === 'female' ? '♀' : '♂'} ${escapeHtml(result.athlete.name)}</span><span style="margin-left:auto">${result.display}</span></div>`).join('')}</div><div class="actions">${button('메인 메뉴', 'home')}${button('결과 보기', 'res', true)}</div></section></main>`;
  on('home', () => { void audio.playMenuMusic(); home(); });
  on('res', () => { cancelAnimationFrame(animationFrame); showResult(finalRace!, true); });
  const loop = () => { stadium.updateCeremony(); stadium.render(); animationFrame = requestAnimationFrame(loop); };
  animationFrame = requestAnimationFrame(loop);
}

function readRecords(): Array<{ date: string; name: string; time: number; gender: Gender; cr?: boolean }> {
  try { return JSON.parse(localStorage.getItem('velocity-records') || '[]'); }
  catch { return []; }
}

function saveRecord(race: Race) {
  const winner = race.results[0];
  if (!winner) return;
  const championship = Number(localStorage.getItem('velocity-cr') || '9.95');
  const isChampionshipRecord = winner.time < championship - 1e-9;
  if (isChampionshipRecord) localStorage.setItem('velocity-cr', String(winner.time));
  const records = readRecords();
  records.unshift({ date: new Date().toLocaleDateString('ko-KR'), name: winner.athlete.name, time: winner.time, gender: winner.athlete.gender, cr: isChampionshipRecord });
  localStorage.setItem('velocity-records', JSON.stringify(records.slice(0, 50)));
}

function showRecords() {
  const records = readRecords();
  const championship = Number(localStorage.getItem('velocity-cr') || '9.95');
  app.innerHTML = `<main class="screen"><section class="panel"><div class="brand">HALL OF TIME</div><h2 class="title">기록실</h2><p class="sub">대회 기록(CR): <b class="cr-time">${championship.toFixed(2)}</b> · 결선 우승 기록이 이 기록보다 빠르면 NEW RECORD 연출과 함께 갱신됩니다.</p><div class="heat">${records.length ? records.map((record, index) => `<div class="rank"><b>${index + 1}</b><span>${record.gender === 'female' ? '♀' : '♂'} ${escapeHtml(record.name)}</span>${record.cr ? '<span class="cr-badge">CR</span>' : ''}<span style="margin-left:auto">${record.time.toFixed(2)} · ${escapeHtml(record.date)}</span></div>`).join('') : '아직 공식 기록이 없습니다.'}</div><div class="actions">${button('돌아가기', 'back')}</div></section></main>`;
  on('back', home);
}

home();
