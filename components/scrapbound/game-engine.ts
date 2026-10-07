export type EnemyKind = "crawler" | "fly" | "soldier" | "spider"
export type AttackDirection = "left" | "right" | "up" | "down"
export type HitParticle = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number }
export type Enemy = { id: number; kind: EnemyKind; x: number; y: number; vx: number; hp: number; maxHp: number; phase: number; hitBy: number; hurtTimer?: number; hitFlash?: number; knockY?: number; alive: boolean }
export type Dialogue = { name: string; lines: string[]; index: number; shop?: boolean }
export type GameState = {
  player: { x: number; y: number; vx: number; vy: number; hp: number; maxHp: number; energy: number; screws: number; facing: number; grounded: boolean; sitting: boolean; attack: number; attackId: number; attackDirection: AttackDirection; attackPhase: "idle" | "start" | "active" | "recovery"; comboStep: number; comboWindow: number; attackBuffer: number; jumpBuffer: number; coyoteTime: number; dash: number; dashCooldown: number; invulnerable: number; hurtFlash: number; pulseCooldown: number; pulseEffect: number; pogoCooldown: number }
  enemies: Enemy[]; unlockedModules: string[]; equippedModules: string[]; moduleSlots: number; boss: { hp: number; maxHp: number; x: number; phase: number; timer: number; attack: "slam" | "charge" | "shards"; alive: boolean; hitBy: number; secondPhase: boolean }
  deathTimer: number; camera: number; cameraZoom: number; time: number; hitStop: number; cameraShake: number; particles: HitParticle[]; checkpoint: number; foundGreen: boolean; forestEntered: boolean; forestMoment: number; flowerBloomed: boolean; projectRevealed: boolean; secretFound: boolean; wallBroken: boolean; shortcut: boolean; bossWon: boolean; ferronMet: boolean; upgrades: string[]; dialogue: Dialogue | null; toast: string; toastTimer: number; savePulse: number
}

export const WORLD_WIDTH = 9200
export const VIEW_WIDTH = 960
export const VIEW_HEIGHT = 540
export const GROUND_Y = 458
export const DEBUG_COMBAT = false
export const AREAS = [
  { name: "Montanha do Descarte", start: 0, end: 1100, tint: "#382e2a" },
  { name: "Túneis de Ferrugem", start: 1100, end: 2200, tint: "#292d2b" },
  { name: "Vila dos Pregos", start: 2200, end: 3200, tint: "#38312a" },
  { name: "Cemitério de Motores", start: 3200, end: 4500, tint: "#2a3030" },
  { name: "Entrada da Fornalha", start: 4500, end: 5900, tint: "#3b2824" },
  { name: "Jardim Morto", start: 5900, end: 6900, tint: "#26332e" },
  { name: "Primeira Floresta", start: 6900, end: 8200, tint: "#18382e" },
  { name: "Área de Recuperação", start: 8200, end: WORLD_WIDTH, tint: "#253a35" },
]

export const PLATFORMS = [
  { x: 250, y: 376, w: 210 }, { x: 610, y: 330, w: 170 }, { x: 930, y: 390, w: 120 },
  { x: 1260, y: 365, w: 230 }, { x: 1610, y: 315, w: 180 }, { x: 1900, y: 380, w: 180 },
  { x: 2240, y: 365, w: 200 }, { x: 2680, y: 340, w: 220 }, { x: 3000, y: 375, w: 160 },
  { x: 3310, y: 360, w: 210 }, { x: 3660, y: 315, w: 230 }, { x: 4060, y: 370, w: 190 },
  { x: 4620, y: 360, w: 220 }, { x: 5030, y: 320, w: 180 }, { x: 5480, y: 375, w: 180 },
  { x: 5920, y: 380, w: 170 }, { x: 6160, y: 330, w: 150 }, { x: 6400, y: 370, w: 210 },
  { x: 6680, y: 338, w: 210 }, { x: 6980, y: 360, w: 180 }, { x: 7260, y: 304, w: 220 },
  { x: 7530, y: 352, w: 210 }, { x: 7870, y: 320, w: 190 }, { x: 8190, y: 370, w: 230 },
  { x: 8530, y: 318, w: 210 }, { x: 8830, y: 362, w: 190 },
]

export function createGameState(saved?: Partial<GameState>): GameState {
  const base: GameState = {
    player: { x: 120, y: GROUND_Y - 42, vx: 0, vy: 0, hp: 5, maxHp: 5, energy: 3, screws: 12, facing: 1, grounded: false, sitting: false, attack: 0, attackId: 0, attackDirection: "right", attackPhase: "idle", comboStep: 0, comboWindow: 0, attackBuffer: 0, jumpBuffer: 0, coyoteTime: 0, dash: 0, dashCooldown: 0, invulnerable: 0, hurtFlash: 0, pulseCooldown: 0, pulseEffect: 0, pogoCooldown: 0 },
    unlockedModules: [], equippedModules: [], moduleSlots: 2,
    enemies: [
      { id: 1, kind: "crawler", x: 650, y: GROUND_Y - 24, vx: 0, hp: 2, maxHp: 2, phase: 0, hitBy: -1, hurtTimer: 0, hitFlash: 0, alive: true },
      { id: 2, kind: "fly", x: 1020, y: 310, vx: 0, hp: 2, maxHp: 2, phase: 0, hitBy: -1, hurtTimer: 0, hitFlash: 0, alive: true },
      { id: 3, kind: "spider", x: 1760, y: 345, vx: 0, hp: 3, maxHp: 3, phase: 0, hitBy: -1, hurtTimer: 0, hitFlash: 0, alive: true },
      { id: 4, kind: "soldier", x: 2150, y: GROUND_Y - 40, vx: 0, hp: 4, maxHp: 4, phase: 0, hitBy: -1, hurtTimer: 0, hitFlash: 0, alive: true },
      { id: 5, kind: "crawler", x: 3420, y: GROUND_Y - 24, vx: 0, hp: 2, maxHp: 2, phase: 0, hitBy: -1, hurtTimer: 0, hitFlash: 0, alive: true },
      { id: 6, kind: "fly", x: 3890, y: 280, vx: 0, hp: 2, maxHp: 2, phase: 0, hitBy: -1, hurtTimer: 0, hitFlash: 0, alive: true },
      { id: 7, kind: "soldier", x: 4330, y: GROUND_Y - 40, vx: 0, hp: 4, maxHp: 4, phase: 0, hitBy: -1, hurtTimer: 0, hitFlash: 0, alive: true },
      { id: 8, kind: "crawler", x: 6020, y: GROUND_Y - 24, vx: 0, hp: 2, maxHp: 2, phase: 0, hitBy: -1, hurtTimer: 0, hitFlash: 0, alive: true },
      { id: 9, kind: "spider", x: 6650, y: 350, vx: 0, hp: 3, maxHp: 3, phase: 0, hitBy: -1, hurtTimer: 0, hitFlash: 0, alive: true },
      { id: 10, kind: "fly", x: 7310, y: 285, vx: 0, hp: 2, maxHp: 2, phase: 0, hitBy: -1, hurtTimer: 0, hitFlash: 0, alive: true },
    ],
    boss: { hp: 18, maxHp: 18, x: 5480, phase: 0, timer: 1.4, attack: "slam", alive: true, hitBy: -1, secondPhase: false },
    deathTimer: 0, camera: 0, cameraZoom: 1, time: 0, hitStop: 0, cameraShake: 0, particles: [], checkpoint: 0, foundGreen: false, forestEntered: false, forestMoment: 0, flowerBloomed: false, projectRevealed: false, secretFound: false, wallBroken: false, shortcut: false, bossWon: false, ferronMet: false, upgrades: [], dialogue: null, toast: "", toastTimer: 0, savePulse: 0,
  }
  if (!saved) return base
  return { ...base, ...saved, player: { ...base.player, ...saved.player, x: saved.player?.x ?? 120, y: saved.player?.y ?? GROUND_Y - 42 }, enemies: saved.enemies ?? base.enemies, particles: Array.isArray(saved.particles) ? saved.particles : [], unlockedModules: saved.unlockedModules ?? base.unlockedModules, equippedModules: saved.equippedModules ?? base.equippedModules, moduleSlots: saved.moduleSlots ?? base.moduleSlots, boss: { ...base.boss, ...saved.boss } }
}

export function getArea(x: number) { return AREAS.find((area) => x >= area.start && x < area.end) ?? AREAS[AREAS.length - 1] }

function setToast(state: GameState, text: string) { state.toast = text; state.toastTimer = 2.8 }

function unlockModules(state: GameState, modules: string[]) {
  for (const module of modules) if (!state.unlockedModules.includes(module)) state.unlockedModules.push(module)
}

export function toggleModule(state: GameState, id: string) {
  if (!state.unlockedModules.includes(id)) return
  if (state.equippedModules.includes(id)) {
    state.equippedModules = state.equippedModules.filter((module) => module !== id)
    setToast(state, "Módulo removido do Núcleo.")
    return
  }
  if (state.equippedModules.length >= state.moduleSlots) { setToast(state, `Slots ocupados: ${state.moduleSlots}. Remova um módulo primeiro.`); return }
  state.equippedModules.push(id)
  setToast(state, "Módulo sintonizado ao Núcleo.")
}

function coreCapacity(s: GameState) { return s.upgrades.includes("core") ? 4 : 3 }

function attackDirection(keys: Set<string>, facing: number): AttackDirection {
  if (keys.has("w") || keys.has("arrowup")) return "up"
  if (keys.has("s") || keys.has("arrowdown")) return "down"
  if (keys.has("a") || keys.has("arrowleft")) return "left"
  if (keys.has("d") || keys.has("arrowright")) return "right"
  return facing < 0 ? "left" : "right"
}

function isInsideAttack(p: GameState["player"], x: number, y: number) {
  const centerX = p.x + 18
  const centerY = p.y + 22
  const strong = p.comboStep === 3
  if (p.attackDirection === "up") return Math.abs(x - centerX) < (strong ? 68 : 58) && y < centerY - 10 && y > centerY - (strong ? 168 : 150)
  if (p.attackDirection === "down") return Math.abs(x - centerX) < (strong ? 62 : 54) && y > centerY + 7 && y < centerY + (strong ? 154 : 138)
  const direction = p.attackDirection === "left" ? -1 : 1
  return Math.abs(x - (centerX + direction * (strong ? 58 : 48))) < (strong ? 60 : 52) && Math.abs(y - centerY) < (strong ? 66 : 58)
}

function addSparks(s: GameState, x: number, y: number, strong = false) {
  const count = strong ? 8 : 5
  for (let index = 0; index < count; index++) {
    const angle = (Math.PI * 2 * index) / count + s.time * 3
    const speed = 45 + (index % 3) * 22
    s.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 18, life: .22 + (index % 3) * .035, maxLife: .3, color: index % 3 === 0 ? "#fff0c0" : "#e8a354", size: strong ? 2.5 : 1.8 })
  }
}

function beginAttack(p: GameState["player"], keys: Set<string>) {
  p.attackDirection = attackDirection(keys, p.facing)
  p.comboStep = p.comboWindow > 0 ? Math.min(3, p.comboStep + 1) : 1
  p.comboWindow = .48
  p.attack = .3
  p.attackPhase = "start"
  p.attackId += 1
  p.sitting = false
}

function usePulse(s: GameState) {
  const p = s.player
  if (!s.bossWon || p.energy < 1 || p.pulseCooldown > 0) return
  p.energy -= 1
  p.pulseCooldown = .55
  p.pulseEffect = .42
  s.hitStop = Math.max(s.hitStop, .04)
  s.cameraShake = Math.max(s.cameraShake, 3)
  addSparks(s, p.x + 18, p.y + 22, true)
  const pulseRange = s.equippedModules.includes("eco") ? 260 : 175
  for (const enemy of s.enemies) {
    if (!enemy.alive || Math.abs(enemy.x - (p.x + 18)) > pulseRange || Math.abs(enemy.y - (p.y + 22)) > 145) continue
    enemy.hp -= 1
    enemy.vx = Math.sign(s.equippedModules.includes("magnetico") ? p.x - enemy.x : enemy.x - p.x || p.facing) * (s.equippedModules.includes("magnetico") ? 300 : 245)
    enemy.hurtTimer = .2
    enemy.hitFlash = .16
    addSparks(s, enemy.x, enemy.y, false)
    if (enemy.hp <= 0) { enemy.alive = false; p.screws += enemy.kind === "soldier" ? 5 : 2; p.energy = Math.min(coreCapacity(s), p.energy + .2) }
  }
  if (s.boss.alive && Math.abs(s.boss.x - (p.x + 18)) < 195 && Math.abs((GROUND_Y - 100) - (p.y + 22)) < 160) {
    s.boss.hp -= 1
    s.boss.hitBy = -1
    addSparks(s, s.boss.x, GROUND_Y - 100, true)
  }
  if (!s.wallBroken && p.x > 5960 && p.x < 6250) {
    s.wallBroken = true
    s.secretFound = true
    unlockModules(s, ["magnetico", "eco"])
    p.screws += 8
    setToast(s, "O Pulso rompe a parede. Uma oficina escondida — e uma memória sem assinatura.")
    s.savePulse = 2
  } else setToast(s, "Pulso liberado. A sucata vibra ao redor de Caco.")
  if (s.equippedModules.includes("raiz") && s.foundGreen && p.x > 6200 && p.x < 6900 && !s.flowerBloomed) {
    s.flowerBloomed = true
    if (s.toast !== "O Pulso rompe a parede. Uma oficina escondida — e uma memória sem assinatura.") setToast(s, "O Núcleo desperta a raiz adormecida. Uma flor floresce no braço de Caco.")
    s.savePulse = 2
  }
}

export function tickGame(s: GameState, keys: Set<string>, dt: number) {
  if (!Array.isArray(s.particles)) s.particles = []
  const p = s.player
  s.time += dt
  s.toastTimer = Math.max(0, s.toastTimer - dt)
  s.savePulse = Math.max(0, s.savePulse - dt)
  s.forestMoment = Math.max(0, s.forestMoment - dt)
  s.hitStop = Math.max(0, s.hitStop - dt)
  s.cameraShake = Math.max(0, s.cameraShake - dt * 18)
  s.particles = s.particles.filter((particle) => {
    particle.life -= dt
    particle.x += particle.vx * dt
    particle.y += particle.vy * dt
    particle.vy += 210 * dt
    return particle.life > 0
  })
  const wasDying = s.deathTimer > 0
  s.deathTimer = Math.max(0, s.deathTimer - dt)
  if (wasDying && s.deathTimer === 0) { p.hp = p.maxHp; p.x = s.checkpoint || 120; p.y = GROUND_Y - 42; p.vx = 0; p.vy = 0; p.invulnerable = 1.4; p.hurtFlash = 0; setToast(s, "Caco foi remontado no último Marco."); s.savePulse = 2 }
  if (s.hitStop > 0) return
  s.cameraZoom += ((s.forestMoment > 0 ? .78 : 1) - s.cameraZoom) * Math.min(1, dt * 1.1)
  p.invulnerable = Math.max(0, p.invulnerable - dt)
  p.hurtFlash = Math.max(0, p.hurtFlash - dt)
  p.pulseCooldown = Math.max(0, p.pulseCooldown - dt)
  p.pulseEffect = Math.max(0, p.pulseEffect - dt)
  p.dashCooldown = Math.max(0, p.dashCooldown - dt)
  p.attack = Math.max(0, p.attack - dt)
  p.attackPhase = p.attack <= 0 ? "idle" : p.attack > .22 ? "start" : p.attack >= .1 ? "active" : "recovery"
  p.comboWindow = Math.max(0, p.comboWindow - dt)
  p.attackBuffer = Math.max(0, p.attackBuffer - dt)
  p.jumpBuffer = Math.max(0, p.jumpBuffer - dt)
  p.dash = Math.max(0, p.dash - dt)
  p.coyoteTime = p.grounded ? .12 : Math.max(0, p.coyoteTime - dt)
  const scripted = s.forestMoment > 0 || s.deathTimer > 0
  const left = !scripted && (keys.has("a") || keys.has("arrowleft"))
  const right = !scripted && (keys.has("d") || keys.has("arrowright"))
  if (left !== right) p.facing = left ? -1 : 1

  if (!scripted && keys.has("_jumpPressed")) { p.jumpBuffer = .12; keys.delete("_jumpPressed") }
  if (!scripted && keys.has("_attackPressed")) {
    keys.delete("_attackPressed")
    p.attackBuffer = .36
  }
  if (!scripted && keys.has("_pulsePressed")) { keys.delete("_pulsePressed"); usePulse(s) }
  const dashPressed = keys.has("_dashPressed")
  if (dashPressed) keys.delete("_dashPressed")
  if (!scripted && dashPressed && p.dashCooldown <= 0 && p.dash <= 0) {
    p.sitting = false
    p.attack = 0
    p.attackPhase = "idle"
    p.dash = .18
    p.dashCooldown = s.upgrades.includes("dash") ? .46 : .72
    p.vx = p.facing * 610
    addSparks(s, p.x + 18, p.y + 24)
  }
  if (p.attackBuffer > 0 && p.attack <= 0 && p.dash <= 0 && !scripted) { beginAttack(p, keys); p.attackBuffer = 0 }

  if (p.dash <= 0) {
    if (left !== right) { p.sitting = false; p.vx = (left ? -1 : 1) * (keys.has("_run") ? 285 : 220) }
    else p.vx *= Math.pow(0.0009, dt)
    p.vy = Math.min(p.vy + 1450 * dt, 900)
  }
  const oldY = p.y
  p.x = Math.max(0, Math.min(WORLD_WIDTH - 35, p.x + p.vx * dt))
  if (!s.wallBroken && p.x > 6108 && p.x < 6182) { p.x = 6108; p.vx = 0 }
  p.y += p.vy * dt
  p.grounded = false
  if (p.y + 42 >= GROUND_Y) { p.y = GROUND_Y - 42; p.vy = 0; p.grounded = true }
  for (const platform of PLATFORMS) {
    if (p.vy >= 0 && p.x + 28 > platform.x && p.x + 8 < platform.x + platform.w && oldY + 42 <= platform.y + 8 && p.y + 42 >= platform.y) {
      p.y = platform.y - 42; p.vy = 0; p.grounded = true
    }
  }
  p.pogoCooldown = Math.max(0, p.pogoCooldown - dt)
  if (p.jumpBuffer > 0 && (p.grounded || p.coyoteTime > 0) && !scripted) {
    p.sitting = false; p.vy = -560; p.grounded = false; p.coyoteTime = 0; p.jumpBuffer = 0
  }
  if (p.y > VIEW_HEIGHT + 400 && s.deathTimer <= 0) { p.hp = 0; s.deathTimer = .78; p.y = GROUND_Y - 42; p.vy = -180; p.vx = 0; p.screws = Math.max(0, p.screws - 5); setToast(s, "As peças de Caco se soltam. O Marco ainda lembra.") }

  const targetCamera = Math.max(0, Math.min(WORLD_WIDTH - VIEW_WIDTH, p.x - VIEW_WIDTH * 0.42))
  s.camera += (targetCamera - s.camera) * Math.min(1, dt * 5)

  for (const enemy of s.enemies) {
    if (scripted || !enemy.alive) continue
    enemy.phase += dt
    enemy.hurtTimer = Math.max(0, (enemy.hurtTimer ?? 0) - dt)
    enemy.hitFlash = Math.max(0, (enemy.hitFlash ?? 0) - dt)
    const distance = p.x - enemy.x
    if (enemy.hurtTimer <= 0 && Math.abs(distance) < 310) {
      if (enemy.kind === "fly") { enemy.vx = Math.sign(distance) * Math.min(90, Math.abs(distance) * 0.35); enemy.y = 290 + Math.sin(enemy.phase * 2.1) * 46 }
      else if (enemy.kind === "spider") { enemy.vx = Math.sign(distance) * 70; enemy.y = 345 + Math.sin(enemy.phase * 3) * 55 }
      else enemy.vx = Math.sign(distance) * (enemy.kind === "soldier" ? 76 : 48)
    } else if (enemy.hurtTimer <= 0) enemy.vx *= 0.92
    if (enemy.knockY) { enemy.y += enemy.knockY * dt; enemy.knockY = Math.min(900, enemy.knockY + 520 * dt); if (enemy.hurtTimer <= 0 && enemy.kind !== "fly" && enemy.kind !== "spider" && enemy.knockY > 0) { enemy.y = GROUND_Y - (enemy.kind === "soldier" ? 40 : 24); enemy.knockY = 0 } }
    else if (enemy.kind !== "fly" && enemy.kind !== "spider") enemy.y = GROUND_Y - (enemy.kind === "soldier" ? 40 : 24)
    enemy.x += enemy.vx * dt
    const attackActive = p.attackPhase === "active"
    if (attackActive && enemy.hitBy !== p.attackId && isInsideAttack(p, enemy.x, enemy.y)) {
      const strongHit = p.comboStep === 3
      const overcharged = strongHit && s.equippedModules.includes("sobrecharge") && p.energy >= coreCapacity(s)
      const damage = (s.upgrades.includes("blade") ? 2 : 1) + (strongHit ? 1 : 0) + (overcharged ? 1 : 0)
      if (overcharged) p.energy -= 1
      enemy.hitBy = p.attackId
      enemy.hp -= damage
      enemy.hurtTimer = .16
      enemy.hitFlash = .17
      enemy.vx = (p.attackDirection === "left" ? -1 : p.attackDirection === "right" ? 1 : p.facing) * (strongHit ? 290 : 205)
      enemy.knockY = p.attackDirection === "down" ? 0 : p.attackDirection === "up" ? -150 : enemy.knockY ?? 0
      enemy.phase += .7
      p.energy = Math.min(coreCapacity(s), p.energy + .08)
      if (p.attackDirection === "down" && !p.grounded && p.pogoCooldown <= 0) {
        p.vy = s.equippedModules.includes("impulso") ? -490 : -380
        p.grounded = false
        p.pogoCooldown = .38
      }
      s.hitStop = Math.max(s.hitStop, strongHit ? .065 : .04)
      s.cameraShake = Math.max(s.cameraShake, strongHit ? 3.2 : 1.2)
      addSparks(s, enemy.x, enemy.y, strongHit)
      if (enemy.hp <= 0) { enemy.alive = false; p.screws += enemy.kind === "soldier" ? 5 : 2; p.energy = Math.min(coreCapacity(s), p.energy + .35) }
    }
    if (Math.abs(enemy.x - (p.x + 18)) < 35 && Math.abs(enemy.y - (p.y + 21)) < 48 && p.invulnerable <= 0 && p.dash <= 0) {
      p.hp -= 1; p.invulnerable = .72; p.hurtFlash = .28; p.vx = Math.sign(p.x - enemy.x || -p.facing) * 260; p.vy = -270
      addSparks(s, p.x + 18, p.y + 22, false)
      if (p.hp <= 0 && s.deathTimer <= 0) { s.deathTimer = .78; p.sitting = false; p.vx = 0; p.vy = -180; p.attack = 0; p.screws = Math.max(0, p.screws - 5); setToast(s, "As peças de Caco se soltam. O Marco ainda lembra.") }
    }
  }

  if (p.attackPhase === "active" && p.attackDirection === "right" && !s.wallBroken && p.x > 6040 && p.x < 6170) { s.wallBroken = true; s.secretFound = true; unlockModules(s, ["magnetico", "eco"]); p.screws += 8; setToast(s, "A parede cede. Uma oficina escondida — e uma memória sem assinatura."); s.savePulse = 2 }

  if (!s.bossWon && p.x > 5110 && !scripted) {
    const b = s.boss
    b.timer -= dt; b.phase += dt
    if (!b.secondPhase && b.hp <= b.maxHp / 2) { b.secondPhase = true; setToast(s, "O núcleo vermelho se abre. A Fornalha ainda não terminou."); s.savePulse = 2 }
    if (b.timer <= 0) { b.attack = (["slam", "charge", "shards"] as const)[Math.floor((b.phase * 2.4) % 3)]; b.timer = (b.attack === "charge" ? 2.1 : 2.8) * (b.secondPhase ? .72 : 1) }
    if (b.attack === "charge" && b.timer <= 1.35 && b.timer > .28) b.x += Math.sign(p.x - b.x) * (b.secondPhase ? 340 : 270) * dt
    if (b.attack === "charge" && b.timer < .28 && Math.abs(b.x - p.x) < 120 && p.invulnerable <= 0) { p.hp -= 1; p.invulnerable = .72; p.hurtFlash = .28; p.vy = -330; p.vx = Math.sign(p.x - b.x || -p.facing) * 300; addSparks(s, p.x + 18, p.y + 22) }
    if (b.attack === "slam" && b.timer < 0.4 && Math.abs(b.x - p.x) < 110 && p.invulnerable <= 0) { p.hp -= 1; p.invulnerable = .72; p.hurtFlash = .28; p.vy = -300; p.vx = Math.sign(p.x - b.x || -p.facing) * 240; addSparks(s, p.x + 18, p.y + 22) }
    if (b.attack === "shards" && b.timer < 0.25 && Math.abs(b.x - p.x) < 260 && p.invulnerable <= 0) { p.hp -= 1; p.invulnerable = .72; p.hurtFlash = .28; addSparks(s, p.x + 18, p.y + 22) }
    if (p.attackPhase === "active" && b.hitBy !== p.attackId && isInsideAttack(p, b.x, GROUND_Y - 100)) {
      const strongHit = p.comboStep === 3
      const overcharged = strongHit && s.equippedModules.includes("sobrecharge") && p.energy >= coreCapacity(s)
      const damage = (s.upgrades.includes("blade") ? 2 : 1) + (strongHit ? 1 : 0) + (overcharged ? 1 : 0)
      if (overcharged) p.energy -= 1
      b.hitBy = p.attackId; b.hp -= damage; p.energy = Math.min(coreCapacity(s), p.energy + .18)
      s.hitStop = Math.max(s.hitStop, p.comboStep === 3 ? .07 : .045); s.cameraShake = Math.max(s.cameraShake, p.comboStep === 3 ? 4 : 1.5)
      addSparks(s, b.x, GROUND_Y - 100, p.comboStep === 3)
    }
    if (b.hp <= 0) { b.alive = false; s.bossWon = true; if (!s.upgrades.includes("Pulso de Sucata")) s.upgrades.push("Pulso de Sucata"); unlockModules(s, ["impulso", "sobrecharge"]); setToast(s, "O Colosso caiu. Pulso de Sucata e módulos de Núcleo desbloqueados."); s.savePulse = 2 }
    if (p.hp <= 0 && s.deathTimer <= 0) { s.deathTimer = .78; p.sitting = false; p.vx = 0; p.vy = -180; p.attack = 0; p.screws = Math.max(0, p.screws - 5); setToast(s, "As peças de Caco se soltam. O Marco ainda lembra.") }
  }

  if (!s.foundGreen && p.x > 6200 && p.x < 6340) { s.foundGreen = true; setToast(s, "Uma folha verde entre as placas. O ar mudou."); s.savePulse = 2 }
  if (!s.forestEntered && p.x > 6900) { s.forestEntered = true; s.forestMoment = 5.4; unlockModules(s, ["raiz"]); p.vx = 0; p.vy = 0; s.toast = ""; s.toastTimer = 0; s.savePulse = 2 }
  if (s.forestEntered && p.x > 7180 && !s.flowerBloomed) { s.flowerBloomed = true; s.upgrades.push("Broto de Sucata"); s.savePulse = 2 }
  if (p.x > 2440 && p.x < 2540 && p.y >= GROUND_Y - 80) {
    if (s.checkpoint < 2480) { s.checkpoint = 2480; s.savePulse = 2; setToast(s, "Marco de Sucata ativado — progresso salvo.") }
  }
  if (p.x > 4570 && p.x < 4660 && p.y >= GROUND_Y - 80 && s.checkpoint < 4600) { s.checkpoint = 4600; s.savePulse = 2; setToast(s, "Marco da Fornalha ativado — progresso salvo.") }
  if (p.x > 7040 && p.x < 7160 && p.y >= GROUND_Y - 80 && s.checkpoint < 7100) { s.checkpoint = 7100; s.savePulse = 2; setToast(s, "Marco das Raízes ativado. O vento guarda seu caminho.") }
  if (s.bossWon && p.x > 5700 && !s.foundGreen) setToast(s, "Além da Fornalha: siga o ar mais fresco para leste.")
  if (p.x > 5700 && !s.bossWon) p.x = 5700
  if (s.forestEntered && p.x > 8450 && !s.projectRevealed) setToast(s, "Uma máquina humana ainda emite luz. Pressione E.")
}

export function interact(s: GameState) {
  if (s.dialogue) { s.dialogue.index += 1; if (s.dialogue.index >= s.dialogue.lines.length) s.dialogue = null; return }
  const x = s.player.x
  if (s.forestEntered && x > 8470 && x < 8770) { s.projectRevealed = true; s.savePulse = 2; return }
  if (Math.abs(x - 4400) < 95) {
    if (!s.shortcut) { s.shortcut = true; setToast(s, "Elevador reativado. Atalho aberto até a Vila dos Pregos."); s.savePulse = 2 }
    else { s.player.x = 2180; s.player.y = GROUND_Y - 42; s.player.vx = 0; setToast(s, "O elevador range entre a Vila e o Cemitério.") }
    return
  }
  if (s.shortcut && Math.abs(x - 2180) < 70) { s.player.x = 4380; s.player.y = GROUND_Y - 42; s.player.vx = 0; setToast(s, "Atalho da Vila para o Cemitério."); return }
  if (s.checkpoint > 0 && Math.abs(x - s.checkpoint) < 55) { s.player.hp = s.player.maxHp; s.player.energy = s.upgrades.includes("core") ? 4 : 3; s.player.x = s.checkpoint; s.player.vx = 0; s.player.vy = 0; s.player.sitting = true; setToast(s, "Caco se senta no Marco. Vida e energia recuperadas; progresso salvo."); s.savePulse = 2 }
  else if (Math.abs(x - 2320) < 100) s.dialogue = { name: "VELHO PARAFUSO", index: 0, lines: ["A oficina do Ferreiro já foi uma catedral de verdade.", "Dizem que ele escuta o que as máquinas sonham.", "Eu? Só escuto minhas juntas reclamando."] }
  else if (Math.abs(x - 2550) < 115) s.dialogue = { name: "LATA · MECÂNICA", index: 0, lines: ["Você acordou falando com os parafusos, hein? Isso é bom sinal.", "Tenho peças úteis. Um favor: não pergunte de onde vieram.", "Escolha uma melhoria na bancada ao lado. E cuidado com o Ferreiro."] , shop: true }
  else if (Math.abs(x - 2750) < 95) s.dialogue = { name: "SUCATA PEQUENA", index: 0, lines: ["Você já viu o lado de cima?", "Minha mãe diz que o vento vem de lá.", "Um dia vou subir até descobrir se ela está certa."] }
  else if (Math.abs(x - 2920) < 130 && !s.ferronMet) { s.ferronMet = true; s.dialogue = { name: "FERRÃO · ENTRE OS CABOS", index: 0, lines: ["Você também ouviu?", "O vento."] } }
  else if (Math.abs(x - 2920) < 130) setToast(s, "O manto de Ferrão sumiu entre as placas.")
  else if (Math.abs(x - 4700) < 180) s.dialogue = { name: "O FERREIRO · CATEDRAL DE SUCATA", index: 0, lines: ["Você acordou tarde demais, pequeno Caco.", "Não procure aquilo que existe acima de nós.", "Há coisas que foram enterradas por uma razão."] }
  else if (Math.abs(x - 6540) < 160 && s.foundGreen) s.dialogue = { name: "O JARDINEIRO", index: 0, lines: ["Não toque na flor. Ela levou séculos para confiar no escuro.", "O mundo não morreu, pequeno Caco. Só aprendeu a se esconder.", "A raiz conhece o caminho para a luz. E você também."] }
  else if (Math.abs(x - 5480) < 180 && s.bossWon) s.dialogue = { name: "O FERREIRO · DEPOIS DA FORNALHA", index: 0, lines: ["Esse pulso... eu o enterrei antes de você nascer.", "Você não foi montado aqui, Caco. Foi devolvido.", "A Fornalha guarda a primeira lembrança. E a última mentira."] }
  else if (s.checkpoint > 0 && Math.abs(x - s.checkpoint) < 80) { s.player.hp = s.player.maxHp; s.player.energy = s.upgrades.includes("core") ? 4 : 3; s.player.sitting = true; setToast(s, "Caco descansa no Marco. Vida e energia recuperadas.") }
  else setToast(s, "Só o vento passando pelos canos.")
}

export function buyUpgrade(s: GameState, id: string) {
  const items: Record<string, { label: string; cost: number }> = { blade: { label: "Lâmina reforçada", cost: 12 }, shell: { label: "Carcaça resistente", cost: 15 }, dash: { label: "Propulsor de dash", cost: 10 }, core: { label: "Núcleo de energia", cost: 12 } }
  const item = items[id]
  if (!item || s.upgrades.includes(id)) return setToast(s, "Essa peça já está instalada.")
  if (s.player.screws < item.cost) return setToast(s, `Faltam parafusos. Custa ${item.cost}.`)
  s.player.screws -= item.cost; s.upgrades.push(id)
  if (id === "shell") { s.player.maxHp += 1; s.player.hp += 1 }
  if (id === "core") { s.player.energy = 4; s.moduleSlots = Math.max(s.moduleSlots, 3); setToast(s, "Núcleo ampliado. Capacidade de energia e um slot de módulo adicionados.") }
  setToast(s, `${item.label} instalada.`)
}

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill() }
function blendColor(a: string, b: string, amount: number) { const t = Math.max(0, Math.min(1, amount)); const parse = (value: string) => [1, 3, 5].map((index) => Number.parseInt(value.slice(index, index + 2), 16)); const from = parse(a), to = parse(b); return `rgb(${from.map((value, index) => Math.round(value + (to[index] - value) * t)).join(",")})` }
function polygon(ctx: CanvasRenderingContext2D, points: [number, number][], fill: string, stroke = "#201e1a") { ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]); for (const [x, y] of points.slice(1)) ctx.lineTo(x, y); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke() } }

export function drawGame(ctx: CanvasRenderingContext2D, s: GameState, width: number, height: number) {
  if (!Array.isArray(s.particles)) s.particles = []
  const sx = width / VIEW_WIDTH, sy = height / VIEW_HEIGHT
  ctx.setTransform(sx, 0, 0, sy, 0, 0)
  ctx.fillStyle = "#111714"; ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT)
  ctx.save()
  ctx.translate(VIEW_WIDTH / 2, VIEW_HEIGHT / 2); ctx.scale(s.cameraZoom, s.cameraZoom); ctx.translate(-VIEW_WIDTH / 2, -VIEW_HEIGHT / 2)
  ctx.translate(Math.sin(s.time * 71) * s.cameraShake, Math.cos(s.time * 53) * s.cameraShake * .45)
  const cam = s.camera
  const area = getArea(s.player.x)
  const green = s.foundGreen
  const forestBlend = Math.max(0, Math.min(1, (s.player.x - 5650) / 1550))
  const bg = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT)
  bg.addColorStop(0, blendColor("#11191b", "#b8c79b", forestBlend * (s.forestEntered ? .58 : .28)))
  bg.addColorStop(.62, blendColor(area.tint, "#17412e", forestBlend))
  bg.addColorStop(1, blendColor("#161718", "#18392e", forestBlend))
  ctx.fillStyle = bg; ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT)
  // Distantes torres e chaminés dão escala às cinco zonas.
  for (let i = 0; i < 32; i++) {
    const wx = i * 205, parallaxX = wx - cam * 0.27
    const x = ((parallaxX % 6900) + 6900) % 6900 - 80
    const h = 90 + ((i * 73) % 170)
    ctx.fillStyle = i % 3 === 0 ? "#1a2222" : "#202321"
    ctx.fillRect(x, 420 - h, 72 + (i % 4) * 18, h + 120)
    ctx.fillStyle = "#505048"; ctx.fillRect(x + 12, 420 - h + 20, 3, h - 8)
    if (i % 4 === 0) { ctx.fillStyle = "#b45d35"; ctx.globalAlpha = 0.28; ctx.fillRect(x + 38, 420 - h + 32, 8, 5); ctx.globalAlpha = 1 }
  }
  // Bruma atmosférica e manchas de luz.
  for (let i = 0; i < 8; i++) { const x = ((i * 157 + s.time * (8 + i) - cam * 0.12) % 1100) - 70; ctx.fillStyle = `rgba(150,145,125,${0.025 + (i % 3) * 0.012})`; ctx.beginPath(); ctx.ellipse(x, 230 + (i % 4) * 54, 115, 26, 0, 0, Math.PI * 2); ctx.fill() }
  if (green && s.player.x > 3500) { const glow = ctx.createRadialGradient(515 - (cam % 340), 350, 5, 515 - (cam % 340), 350, 250); glow.addColorStop(0, "rgba(132,191,114,.15)"); glow.addColorStop(1, "rgba(132,191,114,0)"); ctx.fillStyle = glow; ctx.fillRect(250, 120, 530, 350) }
  if (s.player.x > 5700) {
    const visibility = Math.max(0, Math.min(1, (s.player.x - 5800) / 1250))
    for (let i = 0; i < 14; i++) {
      const wx = 5840 + i * 215, x = wx - cam * .88, h = 150 + (i * 47 % 190)
      if (x < -130 || x > VIEW_WIDTH + 130) continue
      ctx.globalAlpha = visibility * .84
      ctx.fillStyle = i % 2 ? "#17452f" : "#225536"
      ctx.beginPath(); ctx.moveTo(x - 37, GROUND_Y); ctx.lineTo(x - 24, GROUND_Y - h * .32); ctx.lineTo(x - 31, GROUND_Y - h * .42); ctx.lineTo(x - 14, GROUND_Y - h * .56); ctx.lineTo(x - 20, GROUND_Y - h * .68); ctx.lineTo(x - 5, GROUND_Y - h * .76); ctx.lineTo(x + 6, GROUND_Y - h); ctx.lineTo(x + 17, GROUND_Y - h * .75); ctx.lineTo(x + 31, GROUND_Y - h * .63); ctx.lineTo(x + 22, GROUND_Y - h * .49); ctx.lineTo(x + 39, GROUND_Y - h * .33); ctx.lineTo(x + 26, GROUND_Y); ctx.fill()
      polygon(ctx,[[x-24,GROUND_Y-h*.44],[x-12,GROUND_Y-h*.63],[x-1,GROUND_Y-h*.43],[x+6,GROUND_Y-h*.29]],i%2?"#3b7040":"#446d3d","")
      polygon(ctx,[[x-7,GROUND_Y-h*.78],[x+6,GROUND_Y-h],[x+20,GROUND_Y-h*.73],[x+12,GROUND_Y-h*.56]],i%3?"#31653a":"#557846","")
      ctx.strokeStyle = "#456c3e"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 3, GROUND_Y - 16); ctx.lineTo(x + 5, GROUND_Y - h + 18); ctx.stroke()
      if (i % 3 === 0) { ctx.strokeStyle = "#879653"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 22, GROUND_Y - h * .55); ctx.quadraticCurveTo(x + 55, GROUND_Y - h * .6, x + 48 + Math.sin(s.time + i) * 10, GROUND_Y - h * .42); ctx.stroke() }
    }
    ctx.globalAlpha = 1
    if (s.player.x > 6830) {
      const sunlight = ctx.createRadialGradient(735, 124, 8, 735, 124, 430); sunlight.addColorStop(0, `rgba(212,225,157,${.18 * visibility})`); sunlight.addColorStop(1, "rgba(142,194,117,0)"); ctx.fillStyle = sunlight; ctx.fillRect(340, 0, 600, 430)
      for (let i = 0; i < 10; i++) { const x = (i * 113 + s.time * (8 + i % 3) - cam * .36 + 960) % 1100; const y = 130 + (i * 79 % 260) + Math.sin(s.time * .8 + i) * 9; ctx.fillStyle = i % 4 === 0 ? "rgba(230,213,139,.72)" : "rgba(208,226,169,.54)"; ctx.beginPath(); ctx.ellipse(x, y, i % 4 === 0 ? 3 : 1.7, i % 4 === 0 ? 1.5 : 1, Math.sin(s.time + i), 0, Math.PI * 2); ctx.fill() }
      ctx.fillStyle = "rgba(119,185,129,.23)"; ctx.fillRect(0, GROUND_Y - 2, VIEW_WIDTH, 3)
      for (let i = 0; i < 12; i++) { const x = (i * 97 - cam * .53) % VIEW_WIDTH; ctx.strokeStyle = "rgba(188,214,152,.48)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, 115 + i % 4 * 28); ctx.quadraticCurveTo(x + 12, 150 + i % 4 * 35, x + Math.sin(s.time + i) * 10, 190 + i % 4 * 36); ctx.stroke() }
    }
  }
  // Tubulações suspensas desaparecem sob a copa da floresta.
  if (s.player.x < 6500) { ctx.strokeStyle = "#4c4941"; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(0, 98); ctx.lineTo(VIEW_WIDTH, 98); ctx.stroke(); ctx.strokeStyle = "#211f1c"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 103); ctx.lineTo(VIEW_WIDTH, 103); ctx.stroke(); for (let x = -((cam * 0.75) % 230); x < VIEW_WIDTH; x += 230) { ctx.fillStyle = "#62584b"; ctx.fillRect(x, 91, 22, 17); ctx.strokeStyle = "#7c6551"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 4, 98); ctx.lineTo(x + 18, 98); ctx.stroke() } }
  // Piso metálico em placas.
  ctx.fillStyle = blendColor("#252625", "#1d3929", forestBlend); ctx.fillRect(0, GROUND_Y, VIEW_WIDTH, VIEW_HEIGHT - GROUND_Y)
  for (let x = -((cam % 160)); x < VIEW_WIDTH; x += 160) { ctx.fillStyle = blendColor("#37352f", "#315337", forestBlend); ctx.fillRect(x, GROUND_Y + 2, 156, 5); ctx.fillStyle = blendColor("#72654f", "#8ca45f", forestBlend); ctx.beginPath(); ctx.arc(x + 8, GROUND_Y + 15, 2, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(x + 148, GROUND_Y + 15, 2, 0, Math.PI * 2); ctx.fill() }
  for (const platform of PLATFORMS) { const x = platform.x - cam; if (x < -250 || x > VIEW_WIDTH + 200) continue; ctx.fillStyle = "#302f2a"; ctx.fillRect(x, platform.y, platform.w, 13); ctx.fillStyle = "#827053"; ctx.fillRect(x, platform.y, platform.w, 3); ctx.fillStyle = "#51493d"; for (let b = 12; b < platform.w; b += 38) ctx.fillRect(x + b, platform.y + 4, 3, 7) }
  // Lago de óleo e vegetação secreta.
  if (s.player.x > 3300 && s.player.x < 4320) { ctx.fillStyle = "rgba(22,49,44,.8)"; ctx.fillRect(3200 - cam, 439, 1300, 18); for (let i = 0; i < 9; i++) { const x = 3620 + i * 48 - cam; ctx.strokeStyle = green ? "#668d58" : "#485548"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, GROUND_Y); ctx.quadraticCurveTo(x - 12, 436, x + 2, 425 - (i % 3) * 7); ctx.stroke(); if (green && i === 3) { ctx.fillStyle = "#a9cf7e"; ctx.beginPath(); ctx.arc(x + 2, 424, 7, 0, Math.PI * 2); ctx.fill() } } }
  // Sucata de silhueta cede lugar às plantas na borda da floresta.
  if (s.player.x < 6800) for (let i = 0; i < 20; i++) { const x = ((i * 73 + 45 - cam * 0.8) % 1300 + 1300) % 1300 - 120; ctx.fillStyle = i % 2 ? "#292522" : "#33302a"; ctx.beginPath(); ctx.moveTo(x, GROUND_Y); ctx.lineTo(x + 16, 410 - ((i * 37) % 36)); ctx.lineTo(x + 48, GROUND_Y); ctx.fill() }
  // Marcos da jornada, incluindo a primeira raiz e o descanso entre as árvores.
  for (const point of [2480, 4600, 7100]) { const x = point - cam; if (x > -60 && x < VIEW_WIDTH + 60) { ctx.fillStyle = "#40392f"; rounded(ctx, x - 17, 408, 34, 50, 5); ctx.fillStyle = s.checkpoint === point ? "#c48b50" : "#758071"; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = s.checkpoint === point ? 16 : 5; ctx.beginPath(); ctx.arc(x, 423, 5, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = "#9a8a6d"; ctx.fillRect(x - 24, 454, 48, 5); ctx.fillStyle = "#594d3b"; ctx.fillRect(x - 24, 437, 48, 6); ctx.fillRect(x - 20, 443, 4, 12); ctx.fillRect(x + 16, 443, 4, 12); ctx.fillStyle = "#c9b89b"; ctx.font = "9px monospace"; ctx.textAlign = "center"; ctx.fillText("MARCO", x, 397) } }
  if (s.player.x > 4150 && s.player.x < 4570) drawElevator(ctx, 4400 - cam, s.time, s.shortcut)
  if (s.shortcut && s.player.x > 1970 && s.player.x < 2390) drawElevator(ctx, 2180 - cam, s.time, true)
  if (s.player.x > 6050 && !s.wallBroken) drawSealedWall(ctx, 6145 - cam)
  if (s.wallBroken && !s.secretFound) drawMemoryNiche(ctx, 6145 - cam, s.time)
  const npcs = [
    { x: 2320 + Math.sin(s.time * .7) * 12, label: "VELHO PARAFUSO", role: "old" as const },
    { x: 2550, label: "LATA", role: "lata" as const },
    { x: 2750 + Math.sin(s.time * .95 + 1) * 15, label: "SUCATA PEQUENA", role: "child" as const },
    ...(!s.ferronMet ? [{ x: 2920, label: "FERRÃO", role: "ferron" as const }] : []),
    { x: 4700, label: "O FERREIRO", role: "forger" as const },
    ...(green ? [{ x: 6540, label: "O JARDINEIRO", role: "gardener" as const }] : []),
  ]
  for (const npc of npcs) { const x = npc.x - cam; if (x < -160 || x > VIEW_WIDTH + 160) continue; drawNamedCharacter(ctx, x, GROUND_Y - 5, npc.role, s.time); ctx.fillStyle = "#d0c4ad"; ctx.font = "10px monospace"; ctx.textAlign = "center"; ctx.fillText(npc.label, x, npc.role === "forger" ? GROUND_Y - 190 : GROUND_Y - 58); if (Math.abs(s.player.x - npc.x) < (npc.role === "forger" ? 180 : 125)) { ctx.fillStyle = "#f0dfbb"; ctx.font = "11px monospace"; ctx.fillText("[E] falar", x, npc.role === "forger" ? GROUND_Y - 174 : GROUND_Y - 73) } }
  if (s.forestEntered) drawResearchTerminal(ctx, 8580 - cam, s.time, s.projectRevealed)
  if (s.player.x > 6000) drawTinyFlower(ctx, 6300 - cam, s.time, s.foundGreen)
  if (s.forestEntered && s.player.x > 6840) drawForestFlora(ctx, cam, s.time, s.foundGreen)
  if (s.secretFound && s.player.x > 6100 && s.player.x < 6300) { const secretX = 6145 - cam; ctx.fillStyle = "#171c18"; ctx.fillRect(secretX - 32, 378, 64, 77); ctx.fillStyle = "#a7ba77"; ctx.beginPath(); ctx.arc(secretX, 399, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#ddd4bb"; ctx.font = "9px monospace"; ctx.textAlign = "center"; ctx.fillText("MEMÓRIA 01", secretX, 369) }

  // Inimigos com silhuetas diferentes.
  for (const e of s.enemies) { if (!e.alive) continue; const x = e.x - cam; if (x < -80 || x > VIEW_WIDTH + 80) continue; drawEnemy(ctx, e, x, s.time); if (DEBUG_COMBAT) { ctx.strokeStyle = "#65e2c1"; ctx.lineWidth = 1; ctx.strokeRect(x - 23, e.y - 30, 46, 52) } }
  // O Colosso prepara ataques com sinais visuais antes de cada impacto.
  if (!s.bossWon && s.player.x > 4950) drawColossus(ctx, s.boss, s.boss.x - cam, s.time)
  const p = s.player, px = p.x - cam, py = p.y
  if (!(p.invulnerable > 0 && Math.floor(s.time * 18) % 2 === 0)) drawCaco(ctx, px + 18, py + 42, p, s.time, s.flowerBloomed, s.deathTimer)
  if (p.attack > 0) {
    const angle = p.attackDirection === "right" ? 0 : p.attackDirection === "left" ? Math.PI : p.attackDirection === "up" ? -Math.PI / 2 : Math.PI / 2
    ctx.save(); ctx.translate(px + 18, py + 22); ctx.rotate(angle)
    ctx.strokeStyle = p.comboStep === 3 ? "#fff0bc" : "#f4d087"; ctx.lineWidth = p.comboStep === 3 ? 4 : 2.5
    ctx.globalAlpha = p.attackPhase === "active" ? .82 : .3
    ctx.beginPath(); ctx.arc(31, 0, p.comboStep === 3 ? 43 : 36, -.92, .92); ctx.stroke()
    if (p.comboStep === 3) { ctx.globalAlpha *= .38; ctx.beginPath(); ctx.arc(31, 0, 50, -.72, .72); ctx.stroke() }
    ctx.restore(); ctx.globalAlpha = 1
  }
  if (p.pulseEffect > 0) {
    const progress = 1 - p.pulseEffect / .42
    ctx.save(); ctx.translate(px + 18, py + 22); ctx.globalAlpha = Math.max(0, 1 - progress)
    ctx.strokeStyle = "#e8bb70"; ctx.lineWidth = 2
    for (let ring = 0; ring < 2; ring++) { ctx.beginPath(); ctx.arc(0, 0, 30 + progress * (120 + ring * 18), 0, Math.PI * 2); ctx.stroke() }
    ctx.restore(); ctx.globalAlpha = 1
  }
  for (const particle of Array.isArray(s.particles) ? s.particles : []) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife)
    ctx.fillStyle = particle.color; ctx.fillRect(particle.x - cam, particle.y, particle.size, particle.size)
  }
  ctx.globalAlpha = 1
  if (DEBUG_COMBAT) {
    ctx.save(); ctx.strokeStyle = "#65e2c1"; ctx.lineWidth = 1; ctx.strokeRect(px + 6, py + 2, 24, 40)
    if (p.attackPhase === "active") { ctx.strokeStyle = "#ff7765"; ctx.strokeRect(px + 18 - (p.attackDirection === "left" ? 100 : p.attackDirection === "right" ? -4 : 36), py + 22 - (p.attackDirection === "up" ? 150 : p.attackDirection === "down" ? -7 : 58), p.attackDirection === "left" || p.attackDirection === "right" ? 104 : 116, p.attackDirection === "up" || p.attackDirection === "down" ? 142 : 116) }
    ctx.fillStyle = "#dcf0d8"; ctx.font = "10px monospace"; ctx.fillText(`ESTADO ${p.attackPhase} · ${p.attackDirection} · V ${Math.round(p.vx)},${Math.round(p.vy)} · N ${p.energy.toFixed(1)} · DASH ${p.dashCooldown.toFixed(1)} · PULSO ${p.pulseCooldown.toFixed(1)}`, 14, 22)
    ctx.restore()
  }
  // Poeira, partículas e faíscas ambientais.
  for (let i = 0; i < 36; i++) { const x = (i * 109 + s.time * (11 + i % 5) - cam * 0.2) % VIEW_WIDTH; const y = (i * 71 + s.time * (8 + i % 4)) % 430; ctx.fillStyle = i % 9 === 0 ? "rgba(215,137,73,.65)" : "rgba(190,184,158,.25)"; ctx.beginPath(); ctx.arc(x, y, i % 9 === 0 ? 1.7 : 1, 0, Math.PI * 2); ctx.fill() }
  ctx.fillStyle = "rgba(0,0,0,.22)"; const vignette = ctx.createRadialGradient(480, 250, 145, 480, 250, 560); vignette.addColorStop(0, "rgba(0,0,0,0)"); vignette.addColorStop(1, "rgba(0,0,0,.56)"); ctx.fillStyle = vignette; ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT)
  ctx.textAlign = "left"
  ctx.restore()
}

function drawCaco(ctx: CanvasRenderingContext2D, x: number, footY: number, player: GameState["player"], time: number, bloomed: boolean, deathTimer: number) {
  const moving = Math.abs(player.vx) > 35 && player.grounded && player.dash <= 0
  const stride = moving ? Math.sin(time * (Math.abs(player.vx) > 260 ? 17 : 11)) * .52 : 0
  const bob = player.sitting ? 0 : player.grounded ? Math.abs(Math.sin(time * 7)) * .9 : 0
  const attackProgress = player.attack > 0 ? Math.max(0, 1 - player.attack / .3) : 0
  const fall = deathTimer > 0 ? (0.78 - deathTimer) / 0.78 : 0
  ctx.save(); ctx.translate(x, footY + bob + (player.sitting ? 5 : 0)); ctx.rotate(-fall * 1.05); ctx.scale(player.facing, 1)
  if (player.dash > 0) { for (let i = 1; i <= 3; i++) { ctx.globalAlpha = .18 / i; polygon(ctx, [[-18 - i * 9, -52], [-5 - i * 9, -61], [8 - i * 9, -54], [9 - i * 9, -8], [-17 - i * 9, -10]], i === 1 ? "#dda85e" : "#a9b2a2", "") } ctx.globalAlpha = 1 }
  ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.ellipse(0, -1, 19, 4, 0, 0, Math.PI * 2); ctx.fill()
  // Old backplate and exposed wires create the silhouette before the face is visible.
  polygon(ctx, [[-8,-52],[-23,-47],[-27,-26],[-17,-18],[-6,-30]], "#493c30", "#211e19"); polygon(ctx, [[-22,-45],[-30,-49],[-31,-33],[-24,-28]], "#9a5531", "#35241a")
  ctx.strokeStyle = "#ba6239"; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-14,-47); ctx.quadraticCurveTo(-28,-36,-21,-24); ctx.moveTo(-10,-48); ctx.quadraticCurveTo(-18,-57,-24,-52); ctx.stroke()
  const legLift = player.grounded ? 0 : 5
  for (const side of [-1, 1]) {
    const swing = side === -1 ? stride : -stride
    ctx.save(); ctx.translate(side * 6, -14); ctx.rotate(swing + (player.grounded ? 0 : side * .36) + (player.sitting ? side * .72 : 0))
    polygon(ctx, [[-3,-2],[3,-2],[5,7],[1,13],[-4,8]], side < 0 ? "#78614a" : "#9b6744")
    ctx.translate(0, 8); ctx.rotate(-swing * .6); polygon(ctx, [[-3,-1],[3,-1],[5,7],[2,10],[-4,7]], "#554b3c"); polygon(ctx, [[-6,6],[6,6],[8,10],[-5,11]], "#bc7546")
    ctx.restore()
  }
  // Asymmetric scrap torso, shoulder plates, fasteners and amber chest slit.
  const lean = player.dash > 0 ? -.58 : player.attack > 0 && player.attackDirection === "up" ? -.2 : player.attack > 0 && player.attackDirection === "down" ? .18 : player.vy < -80 ? -.12 : moving ? -.08 : 0
  ctx.save(); ctx.translate(0,-30); ctx.rotate(lean)
  polygon(ctx, [[-12,-19],[7,-17],[14,-8],[11,9],[2,16],[-12,10],[-17,-4]], "#675746", "#1f1b17")
  polygon(ctx, [[-11,-16],[1,-17],[5,-5],[-9,-2],[-15,-8]], "#b27345", "#35251b")
  polygon(ctx, [[3,-14],[12,-8],[8,2],[0,0]], "#4a4640", "#1f1d19")
  polygon(ctx, [[-7,1],[8,-3],[12,8],[2,14],[-10,9]], "#786347", "#29231c")
  ctx.fillStyle = "#d9a34e"; ctx.shadowColor = "#f4a640"; ctx.shadowBlur = bloomed ? 6 : 12; ctx.beginPath(); ctx.arc(1,2,2.4,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0
  for (const [bx,by] of [[-12,-10],[8,-8],[-7,7],[8,9]] as [number,number][]) { ctx.fillStyle="#d0b98d"; ctx.beginPath(); ctx.arc(bx,by,1.15,0,Math.PI*2); ctx.fill(); ctx.fillStyle="#514536"; ctx.fillRect(bx-.3,by-.3,.6,.6) }
  // Left arm counterbalances the blade arm; each joint swings with the gait.
  ctx.save(); ctx.translate(-12,-12); ctx.rotate(-.16 - stride * .8); polygon(ctx, [[-3,-2],[4,-1],[7,8],[1,15],[-5,9]], "#615441"); polygon(ctx, [[-4,10],[4,11],[5,16],[-3,18]], "#a55c37"); ctx.restore()
  const swingAngle = player.attack <= 0 ? .12 + stride * .9 : player.attackDirection === "up" ? -2.45 + attackProgress * .8 : player.attackDirection === "down" ? .78 + attackProgress * .62 : player.comboStep === 3 ? -1.8 + attackProgress * 3.1 : player.comboStep === 2 ? .95 - attackProgress * 2.6 : -.95 + attackProgress * 2.35
  ctx.save(); ctx.translate(9,-12); ctx.rotate(swingAngle); polygon(ctx, [[-3,-3],[5,-2],[7,8],[2,14],[-4,9]], "#ad6540"); ctx.fillStyle="#8f6c4b"; ctx.beginPath(); ctx.arc(2,10,2.6,0,Math.PI*2); ctx.fill()
  // The improvised blade is attached to this rotating forearm.
  polygon(ctx, [[0,11],[4,10],[7,24],[17,39],[11,42],[2,28]], player.attack > 0 ? "#d5c8a3" : "#9c9883", "#342b21"); polygon(ctx, [[7,24],[17,39],[12,37]], "#e9d6a8", "")
  if (player.attack > 0) { ctx.strokeStyle="#ffd57c"; ctx.lineWidth=2; ctx.globalAlpha=Math.min(1,player.attack*5); ctx.beginPath(); ctx.moveTo(3,20); ctx.lineTo(22,40); ctx.stroke(); ctx.globalAlpha=1 }
  ctx.restore()
  if (bloomed) { ctx.strokeStyle="#66834d"; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-7,1); ctx.quadraticCurveTo(-12,-5,-10,-12); ctx.stroke(); polygon(ctx,[[-10,-9],[-15,-14],[-9,-13]],"#7eaa5e",""); polygon(ctx,[[-10,-12],[-5,-17],[-7,-10]],"#b1c879","") }
  ctx.restore()
  // Distinctive angular head with single luminous eye; slight mechanical nod.
  const nod = player.grounded && !moving ? Math.sin(time * 2.7) * 1.5 : Math.sin(time * 6) * 1.8
  ctx.save(); ctx.translate(0,-54 + nod); ctx.rotate(lean * .32)
  polygon(ctx, [[-14,-8],[-8,-17],[8,-16],[14,-8],[11,8],[2,13],[-12,8]], "#7c6b55", "#211d18")
  polygon(ctx, [[-14,-8],[-8,-17],[-1,-15],[-3,-1],[-13,3]], "#c1844b", "#5a3923")
  polygon(ctx, [[0,-15],[8,-16],[14,-8],[11,0],[2,-2]], "#4d4942", "#29231d")
  ctx.fillStyle="#241d17"; ctx.beginPath(); ctx.ellipse(5,-4,5.2,4.1,0,0,Math.PI*2); ctx.fill(); ctx.fillStyle="#ffca68"; ctx.shadowColor="#ff9e38"; ctx.shadowBlur=deathTimer>0?3:player.dash>0?22:13; ctx.globalAlpha=deathTimer>0?Math.max(.1,deathTimer/.78):1; ctx.beginPath(); ctx.ellipse(5,-4,3.2,2.8,0,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1; ctx.shadowBlur=0
  for (const [bx,by] of [[-9,-9],[10,-9],[-10,5]] as [number,number][]) { ctx.fillStyle="#d5b889"; ctx.beginPath(); ctx.arc(bx,by,1.35,0,Math.PI*2); ctx.fill() }
  if (player.grounded && Math.sin(time * 2.1) > .985) { ctx.fillStyle="#17130f"; ctx.fillRect(1,-7,8,5) }
  ctx.restore()
  if (player.dash > 0) { ctx.fillStyle="#ffb256"; ctx.shadowColor="#ff8a36"; ctx.shadowBlur=14; ctx.beginPath(); ctx.arc(-18,-28,2,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0 }
  if (deathTimer > 0) { ctx.globalAlpha = Math.max(.25, deathTimer / .78); polygon(ctx,[[18,-41],[25,-47],[29,-39],[23,-33]],"#9b6841",""); polygon(ctx,[[-14,-26],[-22,-31],[-19,-23],[-12,-19]],"#6e5a45",""); ctx.globalAlpha = 1 }
  if (player.invulnerable > .7 && Math.floor(time * 23) % 3 === 0) { for (let i=0;i<3;i++){ctx.fillStyle=i%2?"#e7ae63":"#f4d18b";ctx.beginPath();ctx.moveTo(15+i*4,-45-i*3);ctx.lineTo(21+i*5,-53-i*2);ctx.lineTo(17+i*3,-43-i*4);ctx.fill()} }
  if (player.hurtFlash > 0) { ctx.globalAlpha = Math.min(.42, player.hurtFlash * 1.8); ctx.strokeStyle = "#fff1ca"; ctx.lineWidth = 3; ctx.strokeRect(-17, -61, 34, 60); ctx.globalAlpha = 1 }
  ctx.restore()
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, x: number, time: number) {
  const y = e.y, pulse = Math.sin(time * (e.kind === "fly" ? 12 : 8) + e.id) * 2
  ctx.save(); ctx.translate(x,y+pulse)
  if (e.kind === "crawler") {
    for(let i=-2;i<=2;i++){ctx.strokeStyle="#7e6044";ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(i*5,8);ctx.lineTo(i*8,15+Math.sin(time*12+i)*3);ctx.lineTo(i*11,20);ctx.stroke()}
    polygon(ctx,[[-17,7],[-12,-3],[4,-7],[16,-1],[12,11],[-7,13]],"#68533e"); polygon(ctx,[[-14,1],[-8,-8],[2,-4],[-3,5]],"#9b6340")
    ctx.fillStyle="#e98c48";ctx.shadowColor="#d46630";ctx.shadowBlur=6;ctx.beginPath();ctx.arc(8,2,2.5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0
  } else if (e.kind === "fly") {
    ctx.globalAlpha=.55; polygon(ctx,[[-4,0],[-24,-10],[-14,-20],[0,-8]],"#8c9a88",""); polygon(ctx,[[2,0],[24,-9],[14,-20],[0,-8]],"#86998d","");ctx.globalAlpha=1
    polygon(ctx,[[-10,-5],[-5,-12],[7,-10],[12,-3],[5,6],[-7,5]],"#5d503e");ctx.fillStyle="#f59b48";ctx.shadowColor="#ff7b31";ctx.shadowBlur=9;ctx.beginPath();ctx.arc(5,-4,3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0
  } else if (e.kind === "soldier") {
    polygon(ctx,[[-16,24],[-18,5],[-12,-7],[10,-6],[18,5],[14,25]],"#65513e");polygon(ctx,[[-12,-6],[-16,-20],[-6,-30],[10,-26],[15,-13],[8,-4]],"#4d4941");polygon(ctx,[[-15,-17],[-9,-27],[-2,-18],[-9,-7]],"#a3643e");
    ctx.fillStyle="#e97541";ctx.shadowColor="#ea5934";ctx.shadowBlur=7;ctx.fillRect(2,-18,7,4);ctx.shadowBlur=0
    ctx.strokeStyle="#94714e";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(-25,13);ctx.lineTo(-19,18);ctx.moveTo(12,1);ctx.lineTo(23,9);ctx.stroke()
  } else {
    for(let i=0;i<4;i++){const side=i<2?-1:1, row=i%2;ctx.strokeStyle="#a67a4d";ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(side*7,(row?4:-1));ctx.lineTo(side*(18+row*4),-6+row*13+Math.sin(time*10+i)*2);ctx.lineTo(side*(25+row*3),4+row*12);ctx.stroke()}
    polygon(ctx,[[-14,3],[-10,-7],[-3,-12],[9,-9],[15,1],[10,10],[-8,11]],"#75553b");polygon(ctx,[[-3,-10],[7,-15],[13,-6],[5,0]],"#b66c3d");
    for(const ex of [-4,5]){ctx.fillStyle="#f2a250";ctx.shadowColor="#d87939";ctx.shadowBlur=5;ctx.fillRect(ex,0,3,3)}ctx.shadowBlur=0
  }
  if ((e.hitFlash ?? 0) > 0) { ctx.globalAlpha = Math.min(.68, (e.hitFlash ?? 0) * 4); ctx.fillStyle = "#fff0c8"; ctx.fillRect(-29, -32, 58, 56); ctx.globalAlpha = 1 }
  ctx.restore()
  ctx.fillStyle="#211e1b";ctx.fillRect(x-17,y-25,34,3);ctx.fillStyle=(e.hitFlash ?? 0) > 0 ? "#fff0c8" : "#c76c43";ctx.fillRect(x-17,y-25,34*(e.hp/e.maxHp),3)
}

function drawColossus(ctx: CanvasRenderingContext2D, boss: GameState["boss"], x: number, time: number) {
  const windup = boss.timer < .72, charging = boss.attack === "charge" && boss.timer > 1.2
  const bob = Math.sin(time * 2.1) * 2
  ctx.save(); ctx.translate(x, GROUND_Y + bob)
  ctx.fillStyle="rgba(0,0,0,.42)";ctx.beginPath();ctx.ellipse(0,0,114,17,0,0,Math.PI*2);ctx.fill()
  if(windup&&boss.attack==="slam"){ctx.fillStyle="rgba(225,69,47,.2)";ctx.fillRect(-152,-5,304,5);ctx.strokeStyle="rgba(243,101,61,.85)";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-6,150,10,0,0,Math.PI*2);ctx.stroke()}
  if(boss.attack==="charge"&&boss.timer>1.35){ctx.strokeStyle="rgba(235,94,57,.7)";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-260,-14);ctx.lineTo(260,-14);ctx.stroke();ctx.fillStyle="#ee9562";ctx.font="9px monospace";ctx.textAlign="center";ctx.fillText("INVESTIDA · SAIA DA LINHA",0,-24)}
  if(boss.attack==="shards"&&boss.timer<1.1){for(let i=0;i<7;i++){const sx=-126+i*42, fall=((time*180+i*49)%200);ctx.fillStyle="rgba(225,85,54,.18)";ctx.fillRect(sx-4,-235+fall-16,8,32);polygon(ctx,[[sx-5,-235+fall-20],[sx+5,-235+fall-20],[sx,-235+fall]],"#d56c43","")}}
  const lean=charging ? 0.22 : 0
  ctx.save();ctx.rotate(lean)
  polygon(ctx,[[-63,-5],[-74,-111],[-51,-180],[-20,-199],[41,-183],[68,-132],[57,-6]],"#474037")
  polygon(ctx,[[-52,-150],[-75,-178],[-68,-230],[-42,-204],[-31,-166]],"#93562f");polygon(ctx,[[28,-167],[43,-220],[58,-245],[69,-185],[52,-151]],"#815135")
  polygon(ctx,[[-47,-167],[-103,-132],[-121,-48],[-94,-17],[-70,-49],[-33,-123]],"#62503c")
  polygon(ctx,[[40,-162],[86,-140],[127,-95],[111,-71],[79,-94],[36,-120]],"#574835")
  polygon(ctx,[[-116,-53],[-155,-22],[-139,-4],[-97,-24]],"#a36a3e");
  ctx.save();ctx.translate(111,-91);ctx.rotate(boss.attack==="slam"&&windup?-1.22:boss.attack==="charge"?.65:.2);polygon(ctx,[[-11,-6],[11,-5],[13,46],[-10,53]],"#895b37");polygon(ctx,[[-30,38],[31,37],[39,76],[23,100],[-33,91],[-41,62]],boss.attack==="slam"&&windup?"#c65e36":"#73614a");for(let i=-1;i<=1;i++){ctx.fillStyle="#bd8050";ctx.fillRect(i*17-2,54,5,15)}ctx.restore()
  polygon(ctx,[[-48,-169],[-22,-187],[27,-176],[53,-143],[29,-119],[-34,-125],[-59,-145]],"#817052")
  polygon(ctx,[[-42,-158],[-17,-174],[18,-166],[29,-147],[-3,-139],[-43,-145]],"#a2643b")
  polygon(ctx,[[-52,-106],[45,-110],[49,-73],[29,-38],[-43,-42],[-62,-77]],"#69543d")
  for(let i=0;i<5;i++){ctx.strokeStyle="#98774f";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-45+i*21,-98);ctx.lineTo(-38+i*21,-53);ctx.stroke()}
  ctx.fillStyle="#231c18";ctx.beginPath();ctx.arc(3,-152,21,0,Math.PI*2);ctx.fill();ctx.fillStyle="#d94835";ctx.shadowColor="#ff3e2e";ctx.shadowBlur=24;ctx.beginPath();ctx.arc(3,-152,12,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0
  ctx.fillStyle="#ef8e4e";ctx.shadowColor="#ff792e";ctx.shadowBlur=15;ctx.beginPath();ctx.arc(-2,-78,8+Math.sin(time*5)*1.5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0
  for(const [bx,by] of [[-55,-144],[47,-144],[-45,-77],[41,-82]] as [number,number][]) {ctx.fillStyle="#d4b18a";ctx.beginPath();ctx.arc(bx,by,2,0,Math.PI*2);ctx.fill()}
  ctx.restore()
  ctx.fillStyle="#c9b796";ctx.font="bold 10px monospace";ctx.textAlign="center";ctx.fillText(windup?"!  TELEGRÁFICO  !":boss.attack==="charge"?"INVESTIDA":"COLOSSO DA FORNALHA",0,-265)
  ctx.restore()
}

function drawNamedCharacter(ctx: CanvasRenderingContext2D, x: number, footY: number, role: "lata" | "ferron" | "forger" | "gardener" | "old" | "child", time: number) {
  const bob = Math.sin(time * 2 + x * .01) * 1.2
  ctx.save(); ctx.translate(x, footY + bob)
  if (role === "forger") {
    const pulse = 1 + Math.sin(time * 1.3) * .035
    ctx.scale(pulse,1)
    polygon(ctx,[[-58,-4],[-66,-100],[-48,-142],[-19,-153],[30,-145],[58,-110],[52,-5]],"#4d4032")
    polygon(ctx,[[-46,-118],[-42,-172],[-31,-204],[-21,-169],[-12,-135]],"#8b5634");polygon(ctx,[[30,-120],[37,-188],[50,-215],[56,-161],[48,-119]],"#815039")
    polygon(ctx,[[-42,-133],[-91,-105],[-105,-43],[-82,-22],[-51,-38],[-30,-93]],"#62513e");polygon(ctx,[[39,-131],[84,-104],[99,-52],[80,-30],[59,-45],[29,-91]],"#65513c")
    polygon(ctx,[[-93,-48],[-109,-8],[-84,-1],[-69,-38]],"#98623c");polygon(ctx,[[82,-48],[106,-9],[83,-2],[66,-42]],"#865332")
    polygon(ctx,[[-48,-4],[-52,0],[-49,6],[-17,6],[-13,-2]],"#393832");polygon(ctx,[[18,-3],[20,5],[53,5],[58,0],[50,-5]],"#403d36")
    polygon(ctx,[[-30,-141],[30,-140],[45,-112],[29,-93],[-29,-97],[-46,-119]],"#796346");polygon(ctx,[[-27,-134],[27,-132],[33,-115],[0,-108],[-35,-116]],"#a06b3e")
    for(const [cx,cy] of [[-36,-115],[36,-116],[-23,-99],[27,-99]] as [number,number][]) {ctx.fillStyle="#d1b17c";ctx.beginPath();ctx.arc(cx,cy,2,0,Math.PI*2);ctx.fill()}
    ctx.fillStyle="#201b16";ctx.beginPath();ctx.arc(0,-120,16,0,Math.PI*2);ctx.fill();ctx.fillStyle="#ffc260";ctx.shadowColor="#ff9f43";ctx.shadowBlur=24;ctx.beginPath();ctx.arc(0,-120,9,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0
    ctx.strokeStyle="#9a6f45";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-44,-50);ctx.bezierCurveTo(-76,-22,-5,-27,36,-61);ctx.stroke();ctx.beginPath();ctx.moveTo(36,-49);ctx.bezierCurveTo(72,-28,12,-23,-25,-43);ctx.stroke()
    for(let i=0;i<4;i++){ctx.fillStyle=i%2?"#d2763e":"#ffc467";ctx.globalAlpha=.7+Math.sin(time*11+i)*.3;ctx.fillRect(-65+i*37,-167+Math.sin(time*6+i)*4,3,3)}ctx.globalAlpha=1
  } else if (role === "ferron") {
    polygon(ctx,[[-9,-66],[-18,-49],[-25,-5],[-16,-2],[-5,-39],[3,-5],[11,-2],[13,-44],[5,-67]],"#332c2b")
    polygon(ctx,[[-8,-58],[-11,-91],[0,-119],[13,-94],[8,-59]],"#52443a");polygon(ctx,[[-10,-82],[-34,-67],[-51,-43],[-34,-48],[-16,-58]],"#542d28");polygon(ctx,[[7,-83],[33,-67],[49,-40],[30,-48],[11,-60]],"#3d302e")
    for(let i=0;i<3;i++)polygon(ctx,[[-6+i*6,-72],[i*9-16,-23],[i*7-21,-27]],i%2?"#734234":"#40343a")
    polygon(ctx,[[3,-102],[16,-108],[23,-98],[15,-87],[4,-90]],"#75604a");ctx.fillStyle="#241615";ctx.beginPath();ctx.arc(11,-98,6,0,Math.PI*2);ctx.fill();ctx.fillStyle="#e74e3b";ctx.shadowColor="#f04432";ctx.shadowBlur=17;ctx.beginPath();ctx.arc(11,-98,3.5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0
    ctx.strokeStyle="#b0a08a";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(18,-65);ctx.lineTo(28,-25);ctx.lineTo(43,7);ctx.stroke();polygon(ctx,[[40,5],[45,8],[31,6]],"#c7b491","")
    for(let i=0;i<5;i++){ctx.globalAlpha=.22;ctx.fillStyle="#e75038";ctx.beginPath();ctx.arc(Math.sin(time*4+i)*28,-60+i*11,2,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1
  } else if (role === "gardener") {
    polygon(ctx,[[-25,-4],[-40,-48],[-29,-84],[-4,-103],[27,-84],[42,-46],[24,-4]],"#34463b")
    polygon(ctx,[[-32,-75],[-18,-108],[-5,-80],[-13,-43]],"#71834f");polygon(ctx,[[4,-92],[22,-119],[29,-83],[16,-56]],"#4b7650");polygon(ctx,[[-5,-49],[3,-75],[16,-52],[12,-15]],"#819459")
    ctx.strokeStyle="#77935a";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-32,-48);ctx.quadraticCurveTo(-60,-25,-44,-1);ctx.moveTo(31,-50);ctx.quadraticCurveTo(58,-24,45,-2);ctx.stroke()
    ctx.fillStyle="#8ebd74";ctx.shadowColor="#9edb8c";ctx.shadowBlur=10;ctx.beginPath();ctx.arc(2,-81,5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0
    for(let i=0;i<5;i++){const leafX=-34+i*17+Math.sin(time+i)*2;polygon(ctx,[[leafX,-71-(i%2)*15],[leafX-7,-82],[leafX+2,-77]],i%2?"#739d5d":"#9bb66c","")}
  } else {
    polygon(ctx,[[-11,-5],[-16,-37],[-8,-61],[12,-58],[20,-34],[14,-6]],"#78543b");polygon(ctx,[[-15,-42],[-9,-64],[7,-70],[20,-55],[14,-40]],"#a86e43")
    polygon(ctx,[[-18,-48],[-25,-22],[-16,-17],[-10,-40]],"#73523c");polygon(ctx,[[15,-48],[26,-29],[19,-24],[9,-42]],"#95754c")
    ctx.fillStyle="#ffbd55";ctx.shadowColor="#f8a446";ctx.shadowBlur=9;ctx.beginPath();ctx.arc(7,-53,3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0
    for(const side of [-1,1])polygon(ctx,[[side*5,-6],[side*12,-5],[side*16,3],[side*3,4]],"#463e32")
  }
  ctx.restore()
}

function drawElevator(ctx: CanvasRenderingContext2D, x: number, time: number, open: boolean) {
  ctx.fillStyle="#272b28";ctx.fillRect(x-32,326,64,132);ctx.strokeStyle="#896d4d";ctx.lineWidth=4;ctx.strokeRect(x-32,326,64,132)
  ctx.strokeStyle="#65533e";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-42,310);ctx.lineTo(x-42,440);ctx.moveTo(x+42,310);ctx.lineTo(x+42,440);ctx.stroke()
  ctx.fillStyle="#8d744f";ctx.fillRect(x-24,342,48,4);ctx.fillStyle=open?"#b5d58a":"#8b6d42";ctx.shadowColor=open?"#a5d985":"#f0a849";ctx.shadowBlur=9+Math.sin(time*4)*3;ctx.beginPath();ctx.arc(x,365,5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0
  ctx.fillStyle="#d5c6aa";ctx.font="9px monospace";ctx.textAlign="center";ctx.fillText(open?"ATALHO ABERTO · E":"ELEVADOR TRAVADO · E",x,302)
}
function drawSealedWall(ctx: CanvasRenderingContext2D, x: number) { ctx.fillStyle="#35342e";polygon(ctx,[[x-34,458],[x-32,372],[x-18,355],[x-4,370],[x+12,351],[x+32,372],[x+34,458]],"#37342e");ctx.strokeStyle="#9a633c";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-19,382);ctx.lineTo(x+16,411);ctx.moveTo(x+16,382);ctx.lineTo(x-17,435);ctx.stroke();ctx.fillStyle="#d4b18a";ctx.font="9px monospace";ctx.textAlign="center";ctx.fillText("PAREDE FRÁGIL",x,346) }
function drawMemoryNiche(ctx: CanvasRenderingContext2D, x: number, time: number) { ctx.fillStyle="#1c211d";ctx.fillRect(x-34,369,68,88);ctx.strokeStyle="#98ab70";ctx.lineWidth=2;ctx.strokeRect(x-34,369,68,88);ctx.fillStyle="#b5cc78";ctx.shadowColor="#a3ce73";ctx.shadowBlur=10;ctx.beginPath();ctx.arc(x,396,5+Math.sin(time*3),0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle="#e0d8c6";ctx.font="8px monospace";ctx.textAlign="center";ctx.fillText("MEMÓRIA",x,359) }
function drawResearchTerminal(ctx: CanvasRenderingContext2D, x: number, time: number, activated: boolean) { ctx.fillStyle="#2b302b";polygon(ctx,[[x-48,458],[x-43,362],[x-30,341],[x+35,341],[x+47,366],[x+51,458]],"#343a34");polygon(ctx,[[x-28,379],[x+27,379],[x+29,424],[x-27,424]],"#121d19");ctx.fillStyle="#9acf83";ctx.shadowColor="#8fe78c";ctx.shadowBlur=14;ctx.fillRect(x-20,387,40,2);ctx.fillRect(x-20,395,activated?41:24,2);ctx.fillRect(x-20,403,activated?34:16,2);if(activated){ctx.fillStyle="#a9d99a";polygon(ctx,[[x+7,389],[x+11,385],[x+16,387],[x+17,396],[x+14,403],[x+9,403],[x+6,397]],"#a9d99a","");ctx.fillRect(x+9,402,2,8);ctx.fillRect(x+14,402,2,8)}ctx.shadowBlur=0;ctx.fillStyle="#d9d8c4";ctx.font="9px monospace";ctx.textAlign="center";ctx.fillText(activated?"PROJETO SCRAPBOUND":"[E] ACESSAR REGISTRO",x,331);if(activated){ctx.fillStyle="#b4d8aa";ctx.font="8px monospace";ctx.fillText("STATUS: ATIVO",x,437)}else if(Math.sin(time*2)>0){ctx.fillStyle="#89b97b";ctx.fillRect(x+32,350,3,3)} }
function drawTinyFlower(ctx: CanvasRenderingContext2D, x: number, time: number, discovered: boolean) { if (!discovered) return; ctx.strokeStyle="#6c884f";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,457);ctx.quadraticCurveTo(x-4,447,x+Math.sin(time*1.4)*2,435);ctx.stroke();ctx.fillStyle="#a4c277";polygon(ctx,[[x,449],[x-8,443],[x-1,441]],"#7da05a","");ctx.fillStyle="#dccc91";ctx.shadowColor="#d5e49b";ctx.shadowBlur=11;for(let i=0;i<5;i++){const angle=i*Math.PI*.4;ctx.beginPath();ctx.ellipse(x+Math.cos(angle)*4,435+Math.sin(angle)*4,3,2,angle,0,Math.PI*2);ctx.fill()}ctx.fillStyle="#e8bd63";ctx.beginPath();ctx.arc(x,435,2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0 }
function drawForestFlora(ctx: CanvasRenderingContext2D, cam: number, time: number, foundGreen: boolean) { for(let i=0;i<9;i++){const x=6830+i*116-cam;ctx.strokeStyle=i%2?"#557844":"#7c9652";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,458);ctx.quadraticCurveTo(x-7,446,x+Math.sin(time+i)*4,431-(i%3)*7);ctx.stroke();polygon(ctx,[[x,441],[x-9,434],[x-2,433]],"#749b5b","");if(i===2&&foundGreen){ctx.fillStyle="#e4c988";ctx.shadowColor="#d9e9a5";ctx.shadowBlur=9;ctx.beginPath();ctx.arc(x,429,4,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0}} }
export function saveableState(s: GameState): Partial<GameState> { return { player: { ...s.player, hp: Math.max(1, s.player.hp), vx: 0, vy: 0, sitting: false, attack: 0, dash: 0 }, enemies: s.enemies, boss: s.boss, checkpoint: s.checkpoint, foundGreen: s.foundGreen, forestEntered: s.forestEntered, flowerBloomed: s.flowerBloomed, projectRevealed: s.projectRevealed, secretFound: s.secretFound, wallBroken: s.wallBroken, shortcut: s.shortcut, bossWon: s.bossWon, ferronMet: s.ferronMet, upgrades: s.upgrades } }
export function loadSavedState(): Partial<GameState> | undefined { try { const data = localStorage.getItem("scrapbound-save"); return data ? JSON.parse(data) as Partial<GameState> : undefined } catch { return undefined } }
export function persistState(s: GameState) { try { localStorage.setItem("scrapbound-save", JSON.stringify(saveableState(s))) } catch { /* armazenamento pode estar indisponível no modo privado */ } }
export function resetSave() { try { localStorage.removeItem("scrapbound-save") } catch { /* armazenamento opcional */ } }
export const upgradeInfo = [
  { id: "blade", name: "Lâmina reforçada", cost: 12, detail: "Golpes empurram mais longe." },
  { id: "shell", name: "Carcaça resistente", cost: 15, detail: "+1 ponto de vida máxima." },
  { id: "dash", name: "Propulsor de dash", cost: 10, detail: "Dash recarrega mais rápido." },
  { id: "core", name: "Núcleo de energia", cost: 12, detail: "+1 carga de energia." },
]
export const enemyName = (kind: EnemyKind) => ({ crawler: "Rastejante", fly: "Mosca de Óleo", soldier: "Soldado Desmontado", spider: "Aranha de Cobre" })[kind]
export { setToast }
