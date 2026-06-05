const RUNNERS = [
  { id: "turbo-turtle", name: "느림보 터보 거북", icon: "🐢", concept: "초반 산책, 후반 폭주", speed: 7.4, accel: 2.6, stamina: 91, stability: 84, type: "후반형", ability: "거북이가 미쳤다!", description: "초반은 느리지만 구간 후반 100m에서 폭발적으로 가속한다.", chance: 0.004, effectText: "거북이가 미쳤다! 등껍질 터보 ON!" },
  { id: "rocket-shoes", name: "로켓 신발 스프린터", icon: "🚀", concept: "중반 추진체 발사", speed: 9.1, accel: 3.2, stamina: 73, stability: 58, type: "리스크 폭발형", ability: "로켓 점화", description: "중간 지점에서 로켓 신발이 발사되어 초고속 질주한다. 가끔 비틀거린다.", chance: 0.009, effectText: "로켓 점화! 신발에서 불꽃이 솟습니다!" },
  { id: "four-leg", name: "네발 질주 괴짜", icon: "🐺", concept: "갑자기 네 발 모드", speed: 8.8, accel: 2.7, stamina: 82, stability: 62, type: "랜덤 역전형", ability: "네발 모드", description: "갑자기 네 발로 달리며 관중을 혼란에 빠뜨린다.", chance: 0.008, effectText: "네발 모드 발동! 규정집이 떨고 있습니다!" },
  { id: "wing-king", name: "날개 돋친 단거리왕", icon: "🪽", concept: "잠깐 비행하는 주자", speed: 9.3, accel: 2.5, stamina: 69, stability: 64, type: "초고속 변칙형", ability: "날개 질주", description: "등에서 날개가 돋아 잠깐 날아간 뒤 착지 때 흔들릴 수 있다.", chance: 0.007, effectText: "날개가 돋았다! 이건 육상인가 항공인가요!" },
  { id: "banana-slide", name: "바나나 미끄럼 선수", icon: "🍌", concept: "넘어질 듯 미끄러져 전진", speed: 8.1, accel: 2.2, stamina: 79, stability: 48, type: "도박형", ability: "바나나 슬라이드", description: "미끄러짐으로 빠르게 전진하지만 낮은 확률로 넘어져 멈춘다.", chance: 0.01, effectText: "바나나 슬라이드! 실패인가요, 기술인가요!" },
  { id: "muscle-duck", name: "근육 폭발 오리", icon: "🦆", concept: "뒤뚱뒤뚱 근육 각성", speed: 8.3, accel: 2.9, stamina: 76, stability: 70, type: "파워형", ability: "근육 부풀리기", description: "근육이 부풀어 짧게 폭주하고 이후 피로가 증가한다.", chance: 0.008, effectText: "근육 폭발! 오리의 어깨가 트랙보다 넓습니다!" },
  { id: "drum-heart", name: "북치는 심장 팬더", icon: "🐼", concept: "리듬이 맞으면 안정 가속", speed: 8.4, accel: 2.1, stamina: 88, stability: 91, type: "안정형", ability: "심장 북소리", description: "일정한 리듬으로 달리며 실수 없이 서서히 속도를 올린다.", chance: 0.006, effectText: "둥둥둥! 팬더의 심장이 응원단 북입니다!" },
  { id: "comet-kid", name: "꼬리별 소년", icon: "☄️", concept: "뒤처질수록 빛나는 추격자", speed: 8.7, accel: 2.8, stamina: 81, stability: 76, type: "추격형", ability: "꼬리별 추격", description: "순위가 낮을 때 별빛 꼬리를 만들며 추격한다.", chance: 0.007, effectText: "꼬리별 추격! 꼴찌 팀이 밤하늘을 찢습니다!" },
  { id: "magnet-baton", name: "자석 바통 마술사", icon: "🧲", concept: "바통 전달 장인", speed: 8.0, accel: 1.9, stamina: 86, stability: 94, type: "바통 보너스형", ability: "자석 바통", description: "바통 전달 직후 다음 주자에게 강한 가속 보너스를 준다.", chance: 0.005, effectText: "자석 바통! 손보다 먼저 바통이 날아갑니다!" },
  { id: "spring-legs", name: "스프링 다리 캥거루", icon: "🦘", concept: "통통 튀는 가속", speed: 8.6, accel: 3.4, stamina: 74, stability: 68, type: "초반형", ability: "스프링 점프", description: "구간 초반 통통 튀며 빠르게 앞서나간다.", chance: 0.007, effectText: "스프링 점프! 한 번 뛸 때마다 10m씩 튑니다!" },
  { id: "ice-cream", name: "아이스크림 번개", icon: "🍦", concept: "차가울수록 빠른 냉기 주자", speed: 8.9, accel: 2.4, stamina: 70, stability: 72, type: "순간 가속형", ability: "냉기 번개", description: "트랙을 얼리며 미끄러지듯 가속한다.", chance: 0.007, effectText: "냉기 번개! 트랙이 아이스크림처럼 녹아내립니다!" },
  { id: "pressure-lion", name: "압박받는 사자", icon: "🦁", concept: "선두면 긴장, 추격이면 강함", speed: 9.0, accel: 2.3, stamina: 80, stability: 55, type: "멘탈 변동형", ability: "왕의 포효", description: "뒤처지면 포효로 가속하지만 선두에서는 긴장해 실수할 수 있다.", chance: 0.008, effectText: "왕의 포효! 하지만 선두 압박은 무섭습니다!" },
  { id: "cloud-ninja", name: "구름 닌자", icon: "🥷", concept: "연막 속 순간이동", speed: 8.5, accel: 2.6, stamina: 77, stability: 78, type: "변칙형", ability: "구름 연막", description: "연막 속에서 짧게 순간이동한 듯 전진한다.", chance: 0.006, effectText: "펑! 구름 닌자가 20m 앞에서 나타났습니다!" },
  { id: "coffee-robot", name: "커피 과충전 로봇", icon: "🤖", concept: "카페인 게이지 과열", speed: 8.2, accel: 3.0, stamina: 83, stability: 66, type: "게이지형", ability: "카페인 과충전", description: "과충전되면 빠르지만 드물게 삐걱거리며 감속한다.", chance: 0.007, effectText: "카페인 과충전! 로봇 관절에서 에스프레소 증기!" }
];

const TEAM_TEMPLATES = [
  { name: "번개형 스피드 팩", color: "#35e3ff", icon: "🦄", runnerIds: ["wing-king", "ice-cream", "comet-kid", "rocket-shoes", "spring-legs", "cloud-ninja"] },
  { name: "로켓 거북 밸런스 팩", color: "#ffd166", icon: "🐢", runnerIds: ["turbo-turtle", "rocket-shoes", "magnet-baton", "muscle-duck", "coffee-robot", "banana-slide"] },
  { name: "네발 추격 팩", color: "#ff4f9a", icon: "🐾", runnerIds: ["four-leg", "spring-legs", "pressure-lion", "comet-kid", "banana-slide", "drum-heart"] },
  { name: "날개 변칙 팩", color: "#8bff75", icon: "🪽", runnerIds: ["wing-king", "cloud-ninja", "drum-heart", "ice-cream", "magnet-baton", "turbo-turtle"] },
  { name: "폭주 랜덤 팩", color: "#ff9f1c", icon: "🐹", runnerIds: ["coffee-robot", "banana-slide", "rocket-shoes", "spring-legs", "four-leg", "comet-kid"] },
  { name: "근육 안정 팩", color: "#b28dff", icon: "🦆", runnerIds: ["muscle-duck", "pressure-lion", "magnet-baton", "drum-heart", "turbo-turtle", "ice-cream"] },
  { name: "바나나 도박 팩", color: "#ffe45e", icon: "🍌", runnerIds: ["banana-slide", "cloud-ninja", "spring-legs", "coffee-robot", "wing-king", "drum-heart"] },
  { name: "꼬리별 역전 팩", color: "#ff6b6b", icon: "☄️", runnerIds: ["comet-kid", "turbo-turtle", "pressure-lion", "rocket-shoes", "ice-cream", "magnet-baton"] },
  { name: "자석 바통 팩", color: "#4ecdc4", icon: "🧲", runnerIds: ["magnet-baton", "drum-heart", "cloud-ninja", "muscle-duck", "four-leg", "coffee-robot"] },
  { name: "스프링 초반 팩", color: "#95f985", icon: "🦘", runnerIds: ["spring-legs", "four-leg", "muscle-duck", "banana-slide", "pressure-lion", "wing-king"] }
];

const SEGMENT_DISTANCE = 400;
const TICK_SCALE = 5.8;
const appState = {
  screen: "start",
  teamCount: 6,
  relaySize: 4,
  selectionMode: "team",
  configuredTeams: [],
  race: null,
  raf: null,
  countdownTimer: null,
  countdownActive: false,
  paused: false,
  lastFrame: 0,
  lastConfig: null
};
const audioState = {
  context: null,
  crowdSource: null,
  crowdGain: null,
  crowdAudio: null
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const runnerById = (id) => RUNNERS.find((runner) => runner.id === id);

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function choice(items) { return items[Math.floor(Math.random() * items.length)]; }
function formatTime(seconds) { return `${seconds.toFixed(2)}초`; }
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}
function getTeamDisplayName(team, index) {
  const name = team?.name?.trim();
  return name || `${index + 1}레인 팀`;
}
function shortLabel(value, maxLength = 8) {
  const text = String(value || "");
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}
function getLaneStartProgress(laneIndex, laneCount) {
  if (laneCount <= 1) return 0;
  return (laneCount - 1 - laneIndex) * 0.026;
}

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  if (!audioState.context) audioState.context = new AudioCtor();
  if (audioState.context.state === "suspended") audioState.context.resume();
  return audioState.context;
}

function makeWavUrl(samples, sampleRate = 22050) {
  if (typeof btoa !== "function") return "";
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  const view = new DataView(buffer);
  const writeString = (offset, value) => {
    for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
  };
  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, samples.length * bytesPerSample, true);
  samples.forEach((sample, index) => {
    view.setInt16(44 + index * bytesPerSample, clamp(sample, -1, 1) * 32767, true);
  });
  let binary = "";
  const bytes = new Uint8Array(buffer);
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return `data:audio/wav;base64,${btoa(binary)}`;
}

function playHtmlAudio(samples, sampleRate = 22050, volume = 0.35, loop = false) {
  if (typeof Audio === "undefined" && typeof document === "undefined") return null;
  const url = makeWavUrl(samples, sampleRate);
  if (!url) return null;
  const audio = typeof Audio !== "undefined" ? new Audio(url) : document.createElement("audio");
  if (!audio.src) audio.src = url;
  audio.volume = volume;
  audio.loop = loop;
  audio.play().catch(() => {});
  return audio;
}

function playFallbackTone(frequency, duration = 0.16, volume = 0.2) {
  const sampleRate = 22050;
  const length = Math.floor(sampleRate * duration);
  const samples = Array.from({ length }, (_, index) => {
    const fade = 1 - index / length;
    return Math.sin((index / sampleRate) * Math.PI * 2 * frequency) * fade * 0.7;
  });
  playHtmlAudio(samples, sampleRate, volume);
}

function playTone(frequency, duration = 0.16, type = "sine", volume = 0.16) {
  const context = getAudioContext();
  if (!context) {
    playFallbackTone(frequency, duration, volume);
    return;
  }
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  gain.gain.setValueAtTime(volume, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

function playStartBang() {
  const context = getAudioContext();
  if (!context) {
    const sampleRate = 22050;
    const length = Math.floor(sampleRate * 0.5);
    const samples = Array.from({ length }, (_, index) => (Math.random() * 2 - 1) * (1 - index / length));
    playHtmlAudio(samples, sampleRate, 0.55);
    playFallbackTone(95, 0.42, 0.24);
    return;
  }
  const buffer = context.createBuffer(1, context.sampleRate * 0.45, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  filter.type = "lowpass";
  filter.frequency.value = 950;
  gain.gain.setValueAtTime(0.45, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.45);
  source.buffer = buffer;
  source.connect(filter).connect(gain).connect(context.destination);
  source.start();
  playTone(95, 0.42, "sawtooth", 0.22);
}

function startCrowdSound() {
  const context = getAudioContext();
  if (!context) {
    if (audioState.crowdAudio) return;
    const sampleRate = 22050;
    const length = sampleRate * 2;
    const samples = Array.from({ length }, (_, index) => {
      const murmur = Math.sin(index * 0.011) * 0.18 + Math.sin(index * 0.027) * 0.12;
      return (Math.random() * 2 - 1) * 0.45 + murmur;
    });
    audioState.crowdAudio = playHtmlAudio(samples, sampleRate, 0.18, true);
    return;
  }
  if (audioState.crowdSource) return;
  const bufferLength = context.sampleRate * 2;
  const buffer = context.createBuffer(1, bufferLength, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferLength; i += 1) {
    const wave = Math.sin(i * 0.013) * 0.22 + Math.sin(i * 0.031) * 0.16;
    data[i] = (Math.random() * 2 - 1) * 0.55 + wave;
  }
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = buffer;
  source.loop = true;
  filter.type = "bandpass";
  filter.frequency.value = 900;
  filter.Q.value = 0.7;
  gain.gain.setValueAtTime(0.045, context.currentTime);
  source.connect(filter).connect(gain).connect(context.destination);
  source.start();
  audioState.crowdSource = source;
  audioState.crowdGain = gain;
}

function stopCrowdSound() {
  if (audioState.crowdAudio) {
    audioState.crowdAudio.pause();
    audioState.crowdAudio = null;
  }
  if (!audioState.crowdSource) return;
  try { audioState.crowdSource.stop(); } catch (error) {}
  audioState.crowdSource = null;
  audioState.crowdGain = null;
}

function clearCountdown() {
  if (appState.countdownTimer) clearTimeout(appState.countdownTimer);
  appState.countdownTimer = null;
  appState.countdownActive = false;
}

function showScreen(name) {
  appState.screen = name;
  $$(".screen").forEach((screen) => screen.classList.remove("screen-active"));
  $(`#${name}-screen`).classList.add("screen-active");
}

function buildDefaultConfig() {
  const previousTeams = appState.configuredTeams;
  appState.configuredTeams = TEAM_TEMPLATES.slice(0, appState.teamCount).map((template, index) => {
    const previous = previousTeams[index];
    const selectedTemplate = TEAM_TEMPLATES[previous?.templateIndex] || template;
    const runnerIds = previous?.runnerIds?.slice(0, appState.relaySize) || [];
    while (runnerIds.length < appState.relaySize) runnerIds.push(selectedTemplate.runnerIds[runnerIds.length % selectedTemplate.runnerIds.length]);
    return {
      templateIndex: previous?.templateIndex ?? index,
      name: previous?.name || "",
      color: selectedTemplate.color,
      icon: selectedTemplate.icon,
      runnerIds
    };
  });
}

function createTeamConfigFromTemplate(templateIndex, name = "") {
  const template = TEAM_TEMPLATES[templateIndex];
  return {
    templateIndex,
    name,
    color: template.color,
    icon: template.icon,
    runnerIds: template.runnerIds.slice(0, appState.relaySize)
  };
}

function syncTeamCount() {
  appState.teamCount = Number($("#team-count").value);
  $("#team-count-label").textContent = appState.teamCount;
  buildDefaultConfig();
  renderTeamConfig();
}

function syncRelaySize() {
  appState.relaySize = Number($("#relay-size").value);
  buildDefaultConfig();
  renderTeamConfig();
}

function renderTeamConfig() {
  const container = $("#team-config-list");
  container.innerHTML = "";
  appState.configuredTeams.forEach((team, teamIndex) => {
    const card = document.createElement("article");
    card.className = "team-card";
    const teamOptions = TEAM_TEMPLATES.map((template, index) => `<option value="${index}" ${team.templateIndex === index ? "selected" : ""}>${template.icon} ${template.name}</option>`).join("");
    const runnerSlots = Array.from({ length: appState.relaySize }, (_, slotIndex) => {
      const runnerOptions = RUNNERS.map((runner) => `<option value="${runner.id}" ${team.runnerIds[slotIndex] === runner.id ? "selected" : ""}>${runner.icon} ${runner.name}</option>`).join("");
      return `<label class="runner-slot"><span>${slotIndex + 1}주자 · 400m</span><select data-team="${teamIndex}" data-slot="${slotIndex}" class="runner-select">${runnerOptions}</select></label>`;
    }).join("");
    const summary = team.runnerIds.map((id) => runnerById(id)).filter(Boolean).map((runner) => `${runner.icon} ${runner.name}`).join(" → ");

    card.innerHTML = `
      <div class="team-card-header">
        <div class="team-name"><span class="team-dot" style="color:${team.color}; background:${team.color}"></span><span>${teamIndex + 1}레인</span></div>
        <label class="team-input-label"><span>팀 이름</span><input data-team="${teamIndex}" class="team-name-input" type="text" maxlength="18" placeholder="${teamIndex + 1}레인 팀 이름 입력" value="${escapeHtml(team.name)}" /></label>
        <label class="team-input-label"><span>주자 팩</span><select data-team="${teamIndex}" class="team-template-select">${teamOptions}</select></label>
      </div>
      <div class="runner-grid">${appState.selectionMode === "runner" ? runnerSlots : ""}</div>
      <p class="runner-summary">${summary}</p>
    `;
    container.appendChild(card);
  });

  $$(".team-name-input").forEach((input) => input.addEventListener("input", handleTeamNameChange));
  $$(".team-template-select").forEach((select) => select.addEventListener("change", handleTeamTemplateChange));
  $$(".runner-select").forEach((select) => select.addEventListener("change", handleRunnerChange));
}

function handleTeamNameChange(event) {
  const teamIndex = Number(event.target.dataset.team);
  appState.configuredTeams[teamIndex].name = event.target.value;
}

function handleTeamTemplateChange(event) {
  const teamIndex = Number(event.target.dataset.team);
  const templateIndex = Number(event.target.value);
  const template = TEAM_TEMPLATES[templateIndex];
  appState.configuredTeams[teamIndex] = {
    templateIndex,
    name: appState.configuredTeams[teamIndex].name,
    color: template.color,
    icon: template.icon,
    runnerIds: template.runnerIds.slice(0, appState.relaySize)
  };
  renderTeamConfig();
}

function handleRunnerChange(event) {
  const teamIndex = Number(event.target.dataset.team);
  const slotIndex = Number(event.target.dataset.slot);
  appState.configuredTeams[teamIndex].runnerIds[slotIndex] = event.target.value;
  renderTeamConfig();
}

function randomizeLineups() {
  appState.configuredTeams = Array.from({ length: appState.teamCount }, (_, index) => {
    const template = TEAM_TEMPLATES[index % TEAM_TEMPLATES.length];
    const shuffled = [...RUNNERS].sort(() => Math.random() - 0.5).slice(0, appState.relaySize).map((runner) => runner.id);
    return { templateIndex: index % TEAM_TEMPLATES.length, name: appState.configuredTeams[index]?.name || "", color: template.color, icon: template.icon, runnerIds: shuffled };
  });
  renderTeamConfig();
}

function createRaceTeam(config, index) {
  return {
    id: `team-${index}`,
    name: getTeamDisplayName(config, index),
    icon: config.icon,
    color: config.color,
    runners: config.runnerIds.slice(0, appState.relaySize).map((id) => ({ ...runnerById(id) })),
    currentRunnerIndex: 0,
    segmentDistance: 0,
    totalDistance: 0,
    finished: false,
    finishTime: null,
    activeEffects: [],
    batonGlow: 0,
    laneWobble: 0,
    abilityMemory: {},
    funnyScore: 0,
    lastRank: null
  };
}

function startRace() {
  getAudioContext();
  stopCrowdSound();
  clearCountdown();
  appState.lastConfig = JSON.parse(JSON.stringify({ teamCount: appState.teamCount, relaySize: appState.relaySize, selectionMode: appState.selectionMode, configuredTeams: appState.configuredTeams }));
  const teams = appState.configuredTeams.map(createRaceTeam);
  appState.race = {
    teams,
    totalDistance: appState.relaySize * SEGMENT_DISTANCE,
    startedAt: performance.now(),
    elapsed: 0,
    nextEventAt: 4 + Math.random() * 4,
    log: [],
    commentary: "선수들이 출발선에 섰습니다. 관중석이 술렁입니다!",
    biggestMoment: null,
    finished: false
  };
  appState.paused = false;
  appState.lastFrame = performance.now();
  renderTrack();
  renderRace();
  showScreen("race");
  logEvent("⏱️", "출발 준비", `${teams.length}팀, 팀당 ${appState.relaySize}명이 각 400m 한 바퀴를 준비합니다.`);
  cancelAnimationFrame(appState.raf);
  startCountdown();
}

function startCountdown() {
  const steps = [
    { text: "3", commentary: "3! 모두 스타팅 라인에 발을 고정합니다.", sound: () => playTone(520, 0.16, "triangle", 0.18) },
    { text: "2", commentary: "2! 바통을 쥔 손에 힘이 들어갑니다.", sound: () => playTone(620, 0.16, "triangle", 0.18) },
    { text: "1", commentary: "1! 경기장이 숨을 멈췄습니다.", sound: () => playTone(720, 0.16, "triangle", 0.18) },
    { text: "탕!", commentary: "탕! 출발 신호와 함께 관중 함성이 터집니다!", sound: playStartBang }
  ];
  let index = 0;
  appState.countdownActive = true;

  const showStep = () => {
    if (!appState.race) return;
    const step = steps[index];
    flashEffect(step.text);
    setCommentary(step.commentary);
    renderRace();
    step.sound();
    if (step.text === "탕!") {
      startCrowdSound();
      logEvent("🏁", "경기 시작", "탕! 출발 총성과 함께 모든 주자가 트랙을 돌기 시작합니다.");
    }
    index += 1;
    if (index < steps.length) {
      appState.countdownTimer = setTimeout(showStep, 850);
      return;
    }
    appState.countdownTimer = setTimeout(() => {
      appState.countdownActive = false;
      appState.lastFrame = performance.now();
      appState.raf = requestAnimationFrame(raceLoop);
    }, 280);
  };

  showStep();
}

function raceLoop(timestamp) {
  if (!appState.race || appState.race.finished) return;
  const delta = Math.min(0.08, (timestamp - appState.lastFrame) / 1000 || 0);
  appState.lastFrame = timestamp;
  if (!appState.paused) updateRace(delta);
  renderRace();
  appState.raf = requestAnimationFrame(raceLoop);
}

function updateRace(delta) {
  const race = appState.race;
  race.elapsed += delta;
  const rankingsBefore = getRankings();

  race.teams.forEach((team) => {
    if (team.finished) return;
    updateEffects(team, delta);
    maybeTriggerAbility(team);
    const runner = team.runners[team.currentRunnerIndex];
    const speed = computeSpeed(team, runner, rankingsBefore);
    team.segmentDistance += speed * delta * TICK_SCALE;
    team.totalDistance = team.currentRunnerIndex * SEGMENT_DISTANCE + team.segmentDistance;

    if (team.segmentDistance >= SEGMENT_DISTANCE) handleBatonOrFinish(team);
  });

  if (race.elapsed >= race.nextEventAt) triggerRandomEvent();
  detectRankChanges();

  if (race.teams.every((team) => team.finished)) finishRace();
}

function updateEffects(team, delta) {
  team.activeEffects = team.activeEffects.map((effect) => ({ ...effect, remaining: effect.remaining - delta })).filter((effect) => effect.remaining > 0);
  team.batonGlow = Math.max(0, team.batonGlow - delta);
  team.laneWobble = Math.max(0, team.laneWobble - delta);
}

function computeSpeed(team, runner, rankings) {
  const progress = clamp(team.segmentDistance / SEGMENT_DISTANCE, 0, 1);
  const staminaPenalty = Math.max(0.72, 1 - progress * (105 - runner.stamina) / 220);
  let speed = runner.speed + runner.accel * progress * 0.55;

  if (runner.id === "turbo-turtle") {
    speed *= progress < 0.35 ? 0.78 : 1 + progress * 0.42;
    if (team.segmentDistance > 300) speed *= 1.34;
  }
  if (runner.id === "spring-legs" && progress < 0.22) speed *= 1.2;

  const rank = rankings.findIndex((ranked) => ranked.id === team.id) + 1;
  if (runner.id === "comet-kid" && rank > Math.ceil(rankings.length / 2)) speed *= 1.13;
  if (runner.id === "pressure-lion") speed *= rank === 1 ? 0.95 : 1.08;

  team.activeEffects.forEach((effect) => { speed *= effect.multiplier; });
  if (team.batonGlow > 0) speed *= 1.12;
  return Math.max(1.8, speed * staminaPenalty);
}

function maybeTriggerAbility(team) {
  const runner = team.runners[team.currentRunnerIndex];
  const key = `${team.currentRunnerIndex}-${runner.id}`;
  if (team.abilityMemory[key] && Math.random() > 0.08) return;
  const progress = team.segmentDistance / SEGMENT_DISTANCE;
  let chance = runner.chance;
  if (["rocket-shoes", "wing-king"].includes(runner.id) && (progress < 0.35 || progress > 0.82)) chance *= 0.25;
  if (runner.id === "turbo-turtle" && progress < 0.68) chance *= 0.15;
  if (runner.id === "spring-legs" && progress > 0.35) chance *= 0.35;
  if (Math.random() > chance) return;

  team.abilityMemory[key] = true;
  let multiplier = 1.32;
  let duration = 2.4;
  let funny = 8;
  let extra = "";

  switch (runner.id) {
    case "rocket-shoes":
      multiplier = 1.72; duration = 2.2; funny = 11;
      if (Math.random() > runner.stability / 100) { addEffect(team, "로켓 후유증", 0.72, 1.1); extra = " 하지만 착지 후 살짝 비틀!"; }
      break;
    case "four-leg": multiplier = 1.48; duration = 2.8; team.laneWobble = 2; funny = 12; break;
    case "wing-king": multiplier = 1.62; duration = 1.9; if (Math.random() > runner.stability / 100) addEffect(team, "착지 흔들림", 0.84, .9); funny = 10; break;
    case "banana-slide":
      multiplier = 1.5; duration = 1.8; team.laneWobble = 2.2; funny = 13;
      if (Math.random() < 0.18) { multiplier = 0.2; duration = .8; extra = " 아, 진짜로 넘어졌습니다!"; }
      break;
    case "muscle-duck": multiplier = 1.42; duration = 2.1; addEffect(team, "근육 피로", 0.92, 2.6); funny = 10; break;
    case "turbo-turtle": multiplier = 1.55; duration = 2.6; funny = 12; break;
    case "magnet-baton": multiplier = 1.12; duration = 1.4; team.batonGlow = 4; funny = 7; break;
    case "pressure-lion": multiplier = 1.34; duration = 2.2; if (getRankings()[0]?.id === team.id) multiplier = 0.82; funny = 8; break;
    default: multiplier = 1.34 + Math.random() * .22; duration = 1.8 + Math.random() * 1.2;
  }
  addEffect(team, runner.ability, multiplier, duration);
  team.funnyScore += funny;
  logEvent(runner.icon, runner.ability, `${team.name}의 ${runner.name}: ${runner.effectText}${extra}`);
  flashEffect(runner.effectText);
  setCommentary(makeAbilityCommentary(runner));
}

function addEffect(team, name, multiplier, duration) {
  team.activeEffects.push({ name, multiplier, remaining: duration });
}

function handleBatonOrFinish(team) {
  const race = appState.race;
  team.segmentDistance = SEGMENT_DISTANCE;
  team.totalDistance = (team.currentRunnerIndex + 1) * SEGMENT_DISTANCE;
  const runner = team.runners[team.currentRunnerIndex];

  if (team.currentRunnerIndex >= team.runners.length - 1) {
    team.finished = true;
    team.finishTime = race.elapsed;
    logEvent("🏆", "완주", `${team.name}이 ${formatTime(team.finishTime)} 기록으로 결승선을 통과했습니다!`);
    setCommentary(`${team.name} 결승선 통과! ${runner.name}이 마지막 400m를 끝냈습니다!`);
    return;
  }

  team.currentRunnerIndex += 1;
  team.segmentDistance = 0;
  team.totalDistance = team.currentRunnerIndex * SEGMENT_DISTANCE;
  team.activeEffects = [];
  team.batonGlow = 1.6;
  const nextRunner = team.runners[team.currentRunnerIndex];
  let message = `${team.name}: ${runner.name}이 한 바퀴를 마치고 ${nextRunner.name}에게 바통 터치!`;
  if (runner.id === "magnet-baton" || Math.random() < 0.14) {
    addEffect(team, "황금 바통", 1.22, 2.8);
    message += " 황금 바통 가속까지 붙었습니다!";
    flashEffect("황금 바통! 환상적인 팀워크!");
  }
  logEvent("🤝", "바통 전달", message);
  setCommentary("바통 전달 성공! 환상적인 팀워크입니다!");
}

function triggerRandomEvent() {
  const race = appState.race;
  const activeTeams = race.teams.filter((team) => !team.finished);
  if (!activeTeams.length) return;
  const rankings = getRankings().filter((team) => !team.finished);
  const eventType = choice(["crowd", "shoelace", "wind", "commentator", "balloon", "golden"]);
  let team = choice(activeTeams);
  let title = "랜덤 이벤트";
  let text = "";
  let icon = "🎲";

  if (eventType === "crowd") {
    icon = "📣"; title = "관중 함성 버프"; addEffect(team, title, 1.16, 2.6); text = `${team.name}의 현재 주자가 함성을 등에 업고 빨라집니다!`;
  } else if (eventType === "shoelace") {
    icon = "👟"; title = "신발끈 풀림"; addEffect(team, title, 0.78, 1.6); text = `${team.name}, 신발끈이 춤을 춥니다. 잠시 감속!`;
  } else if (eventType === "wind") {
    team = rankings[rankings.length - 1] || team; icon = "🌬️"; title = "바람의 도움"; addEffect(team, title, 1.2, 2.8); text = `뒤처진 ${team.name}에게 순풍이 붑니다!`;
  } else if (eventType === "commentator") {
    icon = "🎙️"; title = "해설자 흥분"; text = choice(["해설자가 의자를 박차고 일어났습니다!", "마이크가 땀을 흘릴 정도의 명승부입니다!", "마지막 100m도 아닌데 경기장이 폭발 직전입니다!"]); flashEffect("해설자 흥분 MAX!");
  } else if (eventType === "balloon") {
    icon = "🎈"; title = "트랙 위 풍선 난입"; addEffect(team, title, 0.86, 1.4); team.laneWobble = 1.8; text = `${team.name} 앞에 풍선이 난입! 주자가 지그재그로 피합니다.`;
  } else {
    icon = "✨"; title = "황금 바통 기운"; team.batonGlow = 3.2; addEffect(team, title, 1.14, 2.2); text = `${team.name}의 바통이 반짝이며 다음 발걸음에 힘을 줍니다!`;
  }
  logEvent(icon, title, text);
  setCommentary(makeEventCommentary(title, team));
  race.nextEventAt = race.elapsed + 5 + Math.random() * 5;
}

function detectRankChanges() {
  getRankings().forEach((team, index) => {
    const rank = index + 1;
    if (team.lastRank && team.lastRank !== rank && rank <= 3 && !team.finished) {
      logEvent("↕️", "순위 변화", `${team.name}이 ${rank}위로 올라섰습니다!`);
    }
    team.lastRank = rank;
  });
}

function finishRace() {
  const race = appState.race;
  race.finished = true;
  cancelAnimationFrame(appState.raf);
  stopCrowdSound();
  playTone(880, 0.18, "triangle", 0.14);
  if (typeof setTimeout === "function") setTimeout(() => playTone(1170, 0.22, "triangle", 0.14), 130);
  const rankings = getRankings();
  const winner = rankings[0];
  const funniest = [...race.teams].sort((a, b) => b.funnyScore - a.funnyScore)[0];
  $("#winner-title").textContent = `${winner.icon} ${winner.name} 우승!`;
  $("#mvp-line").textContent = `MVP 웃긴 순간: ${funniest.name}이 총 ${funniest.funnyScore}점의 코믹 폭발력을 기록했습니다.`;
  $("#result-list").innerHTML = rankings.map((team, index) => `
    <div class="result-row">
      <strong>${index + 1}위</strong>
      <span>${team.icon} ${team.name}<br><small class="rank-meta">마지막 주자: ${team.runners.at(-1).name} · 코믹 점수 ${team.funnyScore}</small></span>
      <strong>${formatTime(team.finishTime || race.elapsed)}</strong>
    </div>
  `).join("");
  showScreen("result");
}

function getRankings() {
  if (!appState.race) return [];
  return [...appState.race.teams].sort((a, b) => {
    if (a.finished && b.finished) return a.finishTime - b.finishTime;
    if (a.finished) return -1;
    if (b.finished) return 1;
    return b.totalDistance - a.totalDistance;
  });
}

function renderTrack() {
  const track = $("#track-lanes");
  const laneCount = appState.race.teams.length;
  const makeCrowd = (count) => Array.from({ length: count }, (_, index) => `<span style="--delay:${(index % 12) * 0.08}s; --hue:${index * 31}deg"></span>`).join("");
  const laneMarkup = appState.race.teams.map((team, index) => {
    const inset = 4 + index * (36 / Math.max(1, laneCount - 1));
    const startPosition = getOvalPosition(getLaneStartProgress(index, laneCount), index, laneCount);
    const startStyle = `left:${startPosition.x}%; top:${startPosition.y}%; --runner-angle:${startPosition.angle}rad; color:${team.color}`;
    return `
      <div class="oval-lane" id="lane-${team.id}" style="inset:${inset}%; border-color:${team.color}; box-shadow:0 0 18px ${team.color}55"></div>
      <div class="start-marker" style="${startStyle}; border-color:${team.color}">${index + 1}</div>
      <div class="standby-runner" id="standby-${team.id}" style="${startStyle}">
        <span class="standby-tag">대기</span>
        <span class="runner-figure-wrap standby-figure">
          ${renderRunnerSprite()}
          <small class="runner-mark" id="standby-mark-${team.id}">${team.runners[1]?.icon || team.icon}</small>
        </span>
      </div>
      <div class="runner-token" id="token-${team.id}" style="color:${team.color}">
        <span class="runner-name-tag" style="border-color:${team.color}; box-shadow:0 0 14px ${team.color}55">${escapeHtml(shortLabel(team.name))}</span>
        <span class="runner-figure-wrap">
          ${renderRunnerSprite()}
          <small class="runner-mark" id="runner-mark-${team.id}">${team.runners[0]?.icon || team.icon}</small>
        </span>
      </div>
      <div class="baton-pop" id="baton-${team.id}" style="${startStyle}; border-color:${team.color}">바통 터치!</div>
    `;
  }).join("");
  const labelMarkup = appState.race.teams.map((team, index) => `
    <div class="track-team-label" style="border-left-color:${team.color}">
      <strong>${index + 1}레인</strong><span>${team.icon} ${escapeHtml(team.name)}</span><em id="segment-${team.id}">1/${appState.relaySize} · 0m</em>
    </div>
  `).join("");
  track.innerHTML = `
    <div class="crowd-stands stand-top">${makeCrowd(96)}</div>
    <div class="crowd-stands stand-bottom">${makeCrowd(96)}</div>
    <div class="crowd-stands stand-left">${makeCrowd(34)}</div>
    <div class="crowd-stands stand-right">${makeCrowd(34)}</div>
    <div class="track-field">
      <strong>바통존</strong>
      <span>레인별 출발선에서 주자 교대</span>
    </div>
    ${laneMarkup}
    <div class="track-labels">${labelMarkup}</div>
  `;
}

function getOvalPosition(lapProgress, laneIndex, laneCount, wobble = 0) {
  const spacing = laneCount > 1 ? laneIndex / (laneCount - 1) : 0;
  const radiusX = 45 - spacing * 22;
  const radiusY = 38 - spacing * 17;
  const theta = -Math.PI / 2 + clamp(lapProgress, 0, 1) * Math.PI * 2;
  return {
    x: 50 + Math.cos(theta) * radiusX,
    y: 50 + Math.sin(theta) * radiusY + wobble,
    angle: theta + Math.PI / 2
  };
}

function renderRunnerSprite() {
  return `
    <span class="runner-sprite" aria-hidden="true">
      <span class="sprite-shadow"></span>
      <span class="sprite-head"></span>
      <span class="sprite-hair"></span>
      <span class="sprite-body"></span>
      <span class="sprite-baton"></span>
      <span class="sprite-arm arm-front"></span>
      <span class="sprite-arm arm-back"></span>
      <span class="sprite-leg leg-front"></span>
      <span class="sprite-leg leg-back"></span>
      <span class="sprite-shoe shoe-front"></span>
      <span class="sprite-shoe shoe-back"></span>
    </span>
  `;
}

function renderRace() {
  if (!appState.race) return;
  const race = appState.race;
  $("#commentary").textContent = race.commentary;
  race.teams.forEach((team, teamIndex) => {
    const totalProgress = clamp(team.totalDistance / race.totalDistance, 0, 1);
    const lapProgress = team.finished ? 1 : clamp(team.segmentDistance / SEGMENT_DISTANCE, 0, 1);
    const wobble = team.laneWobble > 0 ? Math.sin(race.elapsed * 18) * 1.6 : 0;
    const laneStart = getLaneStartProgress(teamIndex, race.teams.length);
    const position = getOvalPosition((laneStart + lapProgress) % 1, teamIndex, race.teams.length, wobble);
    const token = $(`#token-${team.id}`);
    const lane = $(`#lane-${team.id}`);
    const badge = $(`#segment-${team.id}`);
    const baton = $(`#baton-${team.id}`);
    const standby = $(`#standby-${team.id}`);
    const runnerMark = $(`#runner-mark-${team.id}`);
    const standbyMark = $(`#standby-mark-${team.id}`);
    if (token) {
      token.style.left = `${position.x}%`;
      token.style.top = `${position.y}%`;
      token.style.setProperty("--runner-angle", `${position.angle}rad`);
      token.classList.toggle("boost", team.activeEffects.some((effect) => effect.multiplier > 1.1) || team.batonGlow > 0);
      token.classList.toggle("baton-ready", team.batonGlow > 0);
    }
    if (runnerMark) runnerMark.textContent = team.runners[team.currentRunnerIndex]?.icon || team.icon;
    if (standby) {
      const nextRunner = team.runners[team.currentRunnerIndex + 1];
      standby.classList.toggle("show", Boolean(nextRunner) && !team.finished);
      standby.classList.toggle("receiving", team.batonGlow > 0);
    }
    if (standbyMark) standbyMark.textContent = team.runners[team.currentRunnerIndex + 1]?.icon || team.icon;
    if (lane) {
      lane.classList.toggle("finished", team.finished);
      lane.classList.toggle("baton-flash", team.batonGlow > 0);
    }
    if (baton) baton.classList.toggle("show", team.batonGlow > 0 && !team.finished);
    if (badge) badge.textContent = team.finished ? "FINISH" : `${team.currentRunnerIndex + 1}/${team.runners.length} · ${Math.floor(team.segmentDistance)}m · ${Math.round(totalProgress * 100)}%`;
  });
  renderRankings();
  renderLog();
}

function renderRankings() {
  const race = appState.race;
  $("#ranking-list").innerHTML = getRankings().map((team, index) => {
    const runner = team.runners[team.currentRunnerIndex] || team.runners.at(-1);
    const progress = clamp(team.totalDistance / race.totalDistance, 0, 1);
    const remaining = Math.max(0, race.totalDistance - team.totalDistance);
    return `
      <div class="rank-row">
        <strong>${index + 1}</strong>
        <div>
          <div>${team.icon} ${team.name}</div>
          <div class="rank-meta">현재 주자: ${runner.name} · ${team.currentRunnerIndex + 1}구간 · ${Math.floor(team.totalDistance)}m / 남은 ${Math.ceil(remaining)}m</div>
          <div class="progress-shell"><div class="progress-bar" style="width:${progress * 100}%; background:${team.color}"></div></div>
        </div>
        <span>${team.finished ? "완주" : team.activeEffects.map((effect) => effect.name).join(", ") || "질주"}</span>
      </div>`;
  }).join("");
}

function renderLog() {
  $("#event-log").innerHTML = appState.race.log.slice(0, 18).map((item) => `
    <div class="log-item"><strong>${item.icon} ${item.title}</strong><br>${item.text}</div>
  `).join("");
}

function logEvent(icon, title, text) {
  const race = appState.race;
  race.log.unshift({ icon, title, text, at: race.elapsed });
  if (title !== "순위 변화") race.biggestMoment = text;
}

function setCommentary(text) { appState.race.commentary = text; }
function flashEffect(text) {
  const banner = $("#effect-banner");
  banner.textContent = text;
  banner.classList.remove("boom");
  void banner.offsetWidth;
  banner.classList.add("boom");
}

function makeAbilityCommentary(runner) {
  const lines = {
    "rocket-shoes": "엄청납니다! 로켓 신발이 불을 뿜습니다!",
    "turbo-turtle": "거북이가 더 이상 거북이가 아닙니다!",
    "four-leg": "네 발로 달리는 저 자세, 과연 규정에 있는 걸까요?",
    "wing-king": "날개가 돋았습니다! 이건 육상인가요, 항공 경기인가요?",
    "banana-slide": "넘어지는 줄 알았는데 추진 기술입니다! 바나나가 코치였나요?",
    "comet-kid": "꼴찌 팀이 무섭게 따라붙습니다! 별빛 꼬리가 생겼어요!"
  };
  return lines[runner.id] || `${runner.name}의 ${runner.ability}! 경기장이 뒤집어집니다!`;
}

function makeEventCommentary(title, team) {
  if (title.includes("바람")) return `순풍입니다! ${team.name}이 무섭게 따라붙습니다!`;
  if (title.includes("신발끈")) return `아뿔싸! ${team.name}의 발밑에서 작은 드라마가 펼쳐집니다!`;
  if (title.includes("풍선")) return "트랙 위 풍선 난입! 이 경기장에는 안전요원이 필요합니다!";
  if (title.includes("함성")) return `관중 함성이 ${team.name}의 연료가 됩니다!`;
  return "해설석도 감당 못 하는 상황! 경기장이 폭발할 듯한 함성입니다!";
}

function restoreLastConfig() {
  if (!appState.lastConfig) return;
  Object.assign(appState, JSON.parse(JSON.stringify(appState.lastConfig)));
  $("#team-count").value = appState.teamCount;
  $("#team-count-label").textContent = appState.teamCount;
  $("#relay-size").value = String(appState.relaySize);
  $$('input[name="selection-mode"]').forEach((radio) => { radio.checked = radio.value === appState.selectionMode; });
  renderTeamConfig();
}

function init() {
  buildDefaultConfig();
  renderTeamConfig();
  $("#go-setup").addEventListener("click", () => showScreen("setup"));
  $("#back-start").addEventListener("click", () => showScreen("start"));
  $("#team-count").addEventListener("input", syncTeamCount);
  $("#relay-size").addEventListener("change", syncRelaySize);
  $$('input[name="selection-mode"]').forEach((radio) => radio.addEventListener("change", (event) => {
    appState.selectionMode = event.target.value;
    renderTeamConfig();
  }));
  $("#randomize-lineups").addEventListener("click", randomizeLineups);
  $("#start-race").addEventListener("click", startRace);
  $("#pause-race").addEventListener("click", () => {
    appState.paused = !appState.paused;
    $("#pause-race").textContent = appState.paused ? "재개" : "일시정지";
    if (appState.paused) {
      stopCrowdSound();
    } else {
      if (!appState.countdownActive && appState.race && !appState.race.finished) startCrowdSound();
      appState.lastFrame = performance.now();
    }
  });
  $("#quit-race").addEventListener("click", () => {
    cancelAnimationFrame(appState.raf);
    clearCountdown();
    stopCrowdSound();
    showScreen("setup");
  });
  $("#return-setup").addEventListener("click", () => showScreen("setup"));
  $("#rematch").addEventListener("click", () => { restoreLastConfig(); startRace(); });
}

document.addEventListener("DOMContentLoaded", init);
