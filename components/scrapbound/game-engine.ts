export type EnemyKind = "crawler" | "fly" | "soldier" | "spider"
export type Enemy = { id: number; kind: EnemyKind; x: number; y: number; vx: number; hp: number; maxHp: number; phase: number; hitBy: number; alive: boolean }
export type Dialogue = { name: string; lines: string[]; index: number; shop?: boolean }
export type GameState = {
  player: { x: number; y: number; vx: number; vy: number; hp: number; maxHp: number; energy: number; screws: number; facing: number; grounded: boolean; attack: number; attackId: number; dash: number; dashCooldown: number; invulnerable: number }
  enemies: Enemy[]; boss: { hp: number; maxHp: number; x: number; phase: number; timer: number; attack: "slam" | "charge" | "shards"; alive: boolean; hitBy: number }
  camera: number; time: number; checkpoint: number; foundGreen: boolean; shortcut: boolean; bossWon: boolean; upgrades: string[]; dialogue: Dialogue | null; toast: string; toastTimer: number; savePulse: number
}

export const WORLD_WIDTH = 5900
export const VIEW_WIDTH = 960
export const VIEW_HEIGHT = 540
export const GROUND_Y = 458
export const AREAS = [
  { name: "Montanha do Descarte", start: 0, end: 1100, tint: "#382e2a" },
  { name: "Túneis de Ferrugem", start: 1100, end: 2200, tint: "#292d2b" },
  { name: "Vila dos Pregos", start: 2200, end: 3200, tint: "#38312a" },
  { name: "Cemitério de Motores", start: 3200, end: 4500, tint: "#2a3030" },
  { name: "Entrada da Fornalha", start: 4500, end: WORLD_WIDTH, tint: "#3b2824" },
]

export const PLATFORMS = [
  { x: 250, y: 376, w: 210 }, { x: 610, y: 330, w: 170 }, { x: 930, y: 390, w: 120 },
  { x: 1260, y: 365, w: 230 }, { x: 1610, y: 315, w: 180 }, { x: 1900, y: 380, w: 180 },
  { x: 2240, y: 365, w: 200 }, { x: 2680, y: 340, w: 220 }, { x: 3000, y: 375, w: 160 },
  { x: 3310, y: 360, w: 210 }, { x: 3660, y: 315, w: 230 }, { x: 4060, y: 370, w: 190 },
  { x: 4620, y: 360, w: 220 }, { x: 5030, y: 320, w: 180 }, { x: 5480, y: 375, w: 180 },
]

export function createGameState(saved?: Partial<GameState>): GameState {
  const base: GameState = {
    player: { x: 120, y: GROUND_Y - 42, vx: 0, vy: 0, hp: 5, maxHp: 5, energy: 3, screws: 12, facing: 1, grounded: false, attack: 0, attackId: 0, dash: 0, dashCooldown: 0, invulnerable: 0 },
    enemies: [
      { id: 1, kind: "crawler", x: 650, y: GROUND_Y - 24, vx: 0, hp: 2, maxHp: 2, phase: 0, hitBy: -1, alive: true },
      { id: 2, kind: "fly", x: 1020, y: 310, vx: 0, hp: 2, maxHp: 2, phase: 0, hitBy: -1, alive: true },
      { id: 3, kind: "spider", x: 1760, y: 345, vx: 0, hp: 3, maxHp: 3, phase: 0, hitBy: -1, alive: true },
      { id: 4, kind: "soldier", x: 2150, y: GROUND_Y - 40, vx: 0, hp: 4, maxHp: 4, phase: 0, hitBy: -1, alive: true },
      { id: 5, kind: "crawler", x: 3420, y: GROUND_Y - 24, vx: 0, hp: 2, maxHp: 2, phase: 0, hitBy: -1, alive: true },
      { id: 6, kind: "fly", x: 3890, y: 280, vx: 0, hp: 2, maxHp: 2, phase: 0, hitBy: -1, alive: true },
      { id: 7, kind: "soldier", x: 4330, y: GROUND_Y - 40, vx: 0, hp: 4, maxHp: 4, phase: 0, hitBy: -1, alive: true },
    ],
    boss: { hp: 18, maxHp: 18, x: 5480, phase: 0, timer: 1.4, attack: "slam", alive: true, hitBy: -1 },
    camera: 0, time: 0, checkpoint: 0, foundGreen: false, shortcut: false, bossWon: false, upgrades: [], dialogue: null, toast: "", toastTimer: 0, savePulse: 0,
  }
  if (!saved) return base
  return { ...base, ...saved, player: { ...base.player, ...saved.player, x: saved.player?.x ?? 120, y: saved.player?.y ?? GROUND_Y - 42 }, enemies: saved.enemies ?? base.enemies, boss: { ...base.boss, ...saved.boss } }
}

export function getArea(x: number) { return AREAS.find((area) => x >= area.start && x < area.end) ?? AREAS[AREAS.length - 1] }

function setToast(state: GameState, text: string) { state.toast = text; state.toastTimer = 2.8 }

export function tickGame(s: GameState, keys: Set<string>, dt: number) {
  const p = s.player
  s.time += dt
  s.toastTimer = Math.max(0, s.toastTimer - dt)
  s.savePulse = Math.max(0, s.savePulse - dt)
  p.invulnerable = Math.max(0, p.invulnerable - dt)
  p.dashCooldown = Math.max(0, p.dashCooldown - dt)
  p.attack = Math.max(0, p.attack - dt)
  p.dash = Math.max(0, p.dash - dt)
  const left = keys.has("a") || keys.has("arrowleft")
  const right = keys.has("d") || keys.has("arrowright")

  if (keys.has("j") || keys.has("mouse")) {
    if (p.attack <= 0 && p.dash <= 0) { p.attack = 0.24; p.attackId += 1 }
  }
  if (keys.has("space") && p.grounded) { p.vy = -560; p.grounded = false }
  if (keys.has("shift") && p.dashCooldown <= 0 && p.dash <= 0) { p.dash = 0.18; p.dashCooldown = 0.72; p.vx = p.facing * 610 }
  if (keys.has("k") && p.energy > 0 && !keys.has("_usedK")) { p.energy -= 1; p.attack = 0.4; p.attackId += 1; keys.add("_usedK") }
  if (!keys.has("k")) keys.delete("_usedK")

  if (p.dash <= 0) {
    if (left !== right) { p.vx = (left ? -1 : 1) * (keys.has("_run") ? 285 : 220); p.facing = left ? -1 : 1 }
    else p.vx *= Math.pow(0.0009, dt)
    p.vy = Math.min(p.vy + 1450 * dt, 900)
  }
  const oldY = p.y
  p.x = Math.max(0, Math.min(WORLD_WIDTH - 35, p.x + p.vx * dt))
  p.y += p.vy * dt
  p.grounded = false
  if (p.y + 42 >= GROUND_Y) { p.y = GROUND_Y - 42; p.vy = 0; p.grounded = true }
  for (const platform of PLATFORMS) {
    if (p.vy >= 0 && p.x + 28 > platform.x && p.x + 8 < platform.x + platform.w && oldY + 42 <= platform.y + 8 && p.y + 42 >= platform.y) {
      p.y = platform.y - 42; p.vy = 0; p.grounded = true
    }
  }
  if (p.y > VIEW_HEIGHT + 400) { p.x = s.checkpoint || 120; p.y = GROUND_Y - 42; p.hp = Math.max(1, p.hp - 1); p.vy = 0; setToast(s, "A sucata te devolveu ao Marco.") }

  const targetCamera = Math.max(0, Math.min(WORLD_WIDTH - VIEW_WIDTH, p.x - VIEW_WIDTH * 0.42))
  s.camera += (targetCamera - s.camera) * Math.min(1, dt * 5)

  for (const enemy of s.enemies) {
    if (!enemy.alive) continue
    enemy.phase += dt
    const distance = p.x - enemy.x
    if (Math.abs(distance) < 310) {
      if (enemy.kind === "fly") { enemy.vx = Math.sign(distance) * Math.min(90, Math.abs(distance) * 0.35); enemy.y = 290 + Math.sin(enemy.phase * 2.1) * 46 }
      else if (enemy.kind === "spider") { enemy.vx = Math.sign(distance) * 70; enemy.y = 345 + Math.sin(enemy.phase * 3) * 55 }
      else enemy.vx = Math.sign(distance) * (enemy.kind === "soldier" ? 76 : 48)
    } else enemy.vx *= 0.92
    if (enemy.kind !== "fly" && enemy.kind !== "spider") enemy.y = GROUND_Y - (enemy.kind === "soldier" ? 40 : 24)
    enemy.x += enemy.vx * dt
    if (p.attack > 0.08 && enemy.hitBy !== p.attackId && Math.abs(enemy.x - (p.x + p.facing * 42)) < 62 && Math.abs(enemy.y - p.y) < 78) {
      enemy.hitBy = p.attackId; enemy.hp -= 1; enemy.vx = p.facing * 180
      if (enemy.hp <= 0) { enemy.alive = false; p.screws += enemy.kind === "soldier" ? 5 : 2; p.energy = Math.min(3, p.energy + 0.25) }
    }
    if (Math.abs(enemy.x - p.x) < 35 && Math.abs(enemy.y - p.y) < 45 && p.invulnerable <= 0) {
      p.hp -= 1; p.invulnerable = 1.05; p.vx = Math.sign(p.x - enemy.x) * 260; p.vy = -270
      if (p.hp <= 0) { p.hp = p.maxHp; p.x = s.checkpoint || 120; p.y = GROUND_Y - 42; p.screws = Math.max(0, p.screws - 5); setToast(s, "Caco foi remontado no último Marco.") }
    }
  }

  if (!s.bossWon && p.x > 5110) {
    const b = s.boss
    b.timer -= dt; b.phase += dt
    if (b.timer <= 0) { b.attack = (["slam", "charge", "shards"] as const)[Math.floor((b.phase * 2.4) % 3)]; b.timer = b.attack === "charge" ? 2.1 : 2.8 }
    if (b.attack === "charge" && b.timer > 1.2) b.x += Math.sign(p.x - b.x) * 270 * dt
    if (b.attack === "slam" && b.timer < 0.4 && Math.abs(b.x - p.x) < 110 && p.invulnerable <= 0) { p.hp -= 1; p.invulnerable = 1; p.vy = -300 }
    if (b.attack === "shards" && b.timer < 0.25 && Math.abs(b.x - p.x) < 260 && p.invulnerable <= 0) { p.hp -= 1; p.invulnerable = 0.9 }
    if (p.attack > 0.08 && b.hitBy !== p.attackId && Math.abs(p.x - b.x) < 125 && Math.abs(p.y - (GROUND_Y - 100)) < 120) { b.hitBy = p.attackId; b.hp -= 1; p.energy = Math.min(3, p.energy + 0.2) }
    if (b.hp <= 0) { b.alive = false; s.bossWon = true; s.upgrades.push("Pulso de Sucata"); setToast(s, "O Colosso caiu. Habilidade desbloqueada: Pulso de Sucata."); s.savePulse = 2 }
    if (p.hp <= 0) { p.hp = p.maxHp; p.x = s.checkpoint || 4550; p.y = GROUND_Y - 42; p.screws = Math.max(0, p.screws - 8); setToast(s, "Caco foi remontado no Marco da Fornalha.") }
  }

  if (!s.foundGreen && p.x > 3690 && p.x < 3900 && p.y < 400) { s.foundGreen = true; setToast(s, "Uma flor. Viva. Debaixo de todo esse ferro..."); s.savePulse = 2 }
  if (p.x > 2440 && p.x < 2540 && p.y >= GROUND_Y - 80) {
    if (s.checkpoint < 2480) { s.checkpoint = 2480; s.savePulse = 2; setToast(s, "Marco de Sucata ativado — progresso salvo.") }
  }
  if (p.x > 4570 && p.x < 4660 && p.y >= GROUND_Y - 80 && s.checkpoint < 4600) { s.checkpoint = 4600; s.savePulse = 2; setToast(s, "Marco da Fornalha ativado — progresso salvo.") }
  if (s.bossWon && p.x > 5700) p.x = 5700
}

export function interact(s: GameState) {
  if (s.dialogue) { s.dialogue.index += 1; if (s.dialogue.index >= s.dialogue.lines.length) s.dialogue = null; return }
  const x = s.player.x
  if (Math.abs(x - 2550) < 115) s.dialogue = { name: "LATA · MECÂNICA", lines: ["Você acordou falando com os parafusos, hein? Isso é bom sinal.", "Tenho peças úteis. Um favor: não pergunte de onde vieram.", "Escolha uma melhoria na bancada ao lado. E cuidado com o Ferreiro."] , shop: true }
  else if (Math.abs(x - 2920) < 130) s.dialogue = { name: "FERRÃO · DESMONTADOS", lines: ["O Ferreiro chama silêncio de paz. Eu chamo de ferrugem por dentro.", "Há algo vivo além destas paredes. Os velhos sabem — e escondem.", "Quando chegar à Fornalha, olhe para o que ele protege. Não para o que ele diz."] }
  else if (Math.abs(x - 3760) < 150 && s.foundGreen) s.dialogue = { name: "O JARDINEIRO", lines: ["Não toque na flor. Ela levou séculos para confiar no escuro.", "O mundo não morreu, pequeno Caco. Só aprendeu a se esconder.", "Este brilho no seu peito... conheço o desenho. Mas não o nome."] }
  else if (Math.abs(x - 5480) < 180 && s.bossWon) s.dialogue = { name: "O FERREIRO", lines: ["Esse pulso... eu o enterrei antes de você nascer.", "Você não foi montado aqui, Caco. Foi devolvido.", "A Fornalha guarda a primeira lembrança. E a última mentira."] }
  else if (Math.abs(x - s.checkpoint) < 80) { s.player.hp = s.player.maxHp; s.player.energy = 3; setToast(s, "Marco restaurado: vida e energia recuperadas.") }
  else setToast(s, "Só o vento passando pelos canos.")
}

export function buyUpgrade(s: GameState, id: string) {
  const items: Record<string, { label: string; cost: number }> = { blade: { label: "Lâmina reforçada", cost: 12 }, shell: { label: "Carcaça resistente", cost: 15 }, dash: { label: "Propulsor de dash", cost: 10 }, core: { label: "Núcleo de energia", cost: 12 } }
  const item = items[id]
  if (!item || s.upgrades.includes(id)) return setToast(s, "Essa peça já está instalada.")
  if (s.player.screws < item.cost) return setToast(s, `Faltam parafusos. Custa ${item.cost}.`)
  s.player.screws -= item.cost; s.upgrades.push(id)
  if (id === "shell") { s.player.maxHp += 1; s.player.hp += 1 }
  if (id === "core") s.player.energy = 4
  setToast(s, `${item.label} instalada.`)
}

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill() }

export function drawGame(ctx: CanvasRenderingContext2D, s: GameState, width: number, height: number) {
  const sx = width / VIEW_WIDTH, sy = height / VIEW_HEIGHT
  ctx.setTransform(sx, 0, 0, sy, 0, 0)
  const cam = s.camera
  const area = getArea(s.player.x)
  const green = s.foundGreen
  const bg = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT)
  bg.addColorStop(0, green && s.player.x > 3500 ? "#182a25" : "#11191b")
  bg.addColorStop(0.62, area.tint)
  bg.addColorStop(1, "#161718")
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
  // Tubulações suspensas.
  ctx.strokeStyle = "#4c4941"; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(0, 98); ctx.lineTo(VIEW_WIDTH, 98); ctx.stroke()
  ctx.strokeStyle = "#211f1c"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 103); ctx.lineTo(VIEW_WIDTH, 103); ctx.stroke()
  for (let x = -((cam * 0.75) % 230); x < VIEW_WIDTH; x += 230) { ctx.fillStyle = "#62584b"; ctx.fillRect(x, 91, 22, 17); ctx.strokeStyle = "#7c6551"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 4, 98); ctx.lineTo(x + 18, 98); ctx.stroke() }
  // Piso metálico em placas.
  ctx.fillStyle = "#252625"; ctx.fillRect(0, GROUND_Y, VIEW_WIDTH, VIEW_HEIGHT - GROUND_Y)
  for (let x = -((cam % 160)); x < VIEW_WIDTH; x += 160) { ctx.fillStyle = "#37352f"; ctx.fillRect(x, GROUND_Y + 2, 156, 5); ctx.fillStyle = "#72654f"; ctx.beginPath(); ctx.arc(x + 8, GROUND_Y + 15, 2, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(x + 148, GROUND_Y + 15, 2, 0, Math.PI * 2); ctx.fill() }
  for (const platform of PLATFORMS) { const x = platform.x - cam; if (x < -250 || x > VIEW_WIDTH + 200) continue; ctx.fillStyle = "#302f2a"; ctx.fillRect(x, platform.y, platform.w, 13); ctx.fillStyle = "#827053"; ctx.fillRect(x, platform.y, platform.w, 3); ctx.fillStyle = "#51493d"; for (let b = 12; b < platform.w; b += 38) ctx.fillRect(x + b, platform.y + 4, 3, 7) }
  // Lago de óleo e vegetação secreta.
  if (s.player.x > 3300 && s.player.x < 4320) { ctx.fillStyle = "rgba(22,49,44,.8)"; ctx.fillRect(3200 - cam, 439, 1300, 18); for (let i = 0; i < 9; i++) { const x = 3620 + i * 48 - cam; ctx.strokeStyle = green ? "#668d58" : "#485548"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, GROUND_Y); ctx.quadraticCurveTo(x - 12, 436, x + 2, 425 - (i % 3) * 7); ctx.stroke(); if (green && i === 3) { ctx.fillStyle = "#a9cf7e"; ctx.beginPath(); ctx.arc(x + 2, 424, 7, 0, Math.PI * 2); ctx.fill() } } }
  // Sucata de silhueta no primeiro plano.
  for (let i = 0; i < 20; i++) { const x = ((i * 73 + 45 - cam * 0.8) % 1300 + 1300) % 1300 - 120; ctx.fillStyle = i % 2 ? "#292522" : "#33302a"; ctx.beginPath(); ctx.moveTo(x, GROUND_Y); ctx.lineTo(x + 16, 410 - ((i * 37) % 36)); ctx.lineTo(x + 48, GROUND_Y); ctx.fill() }
  // Marcos e passagens.
  for (const point of [2480, 4600]) { const x = point - cam; if (x > -60 && x < VIEW_WIDTH + 60) { ctx.fillStyle = "#40392f"; rounded(ctx, x - 17, 408, 34, 50, 5); ctx.fillStyle = s.checkpoint === point ? "#c48b50" : "#758071"; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = s.checkpoint === point ? 16 : 5; ctx.beginPath(); ctx.arc(x, 423, 5, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = "#9a8a6d"; ctx.fillRect(x - 24, 454, 48, 5) } }
  // NPCs: oficina, resistência, jardineiro e o Ferreiro após o chefe.
  const npcs = [{ x: 2550, label: "LATA", color: "#d18c58", type: 0 }, { x: 2920, label: "FERRÃO", color: "#ba7253", type: 1 }, ...(green ? [{ x: 3760, label: "JARDINEIRO", color: "#8faf78", type: 2 }] : []), ...(s.bossWon ? [{ x: 5480, label: "O FERREIRO", color: "#b37549", type: 3 }] : [])]
  for (const npc of npcs) { const x = npc.x - cam; if (x < -60 || x > VIEW_WIDTH + 60) continue; drawBot(ctx, x, GROUND_Y - 44, npc.color, s.time, 1); ctx.fillStyle = "#c9b89b"; ctx.font = "10px monospace"; ctx.textAlign = "center"; ctx.fillText(npc.label, x, GROUND_Y - 55); if (Math.abs(s.player.x - npc.x) < 120) { ctx.fillStyle = "#eee0c6"; ctx.font = "11px monospace"; ctx.fillText("[E] falar", x, GROUND_Y - 72) } }
  // Inimigos com silhuetas diferentes.
  for (const e of s.enemies) { if (!e.alive) continue; const x = e.x - cam; if (x < -80 || x > VIEW_WIDTH + 80) continue; drawEnemy(ctx, e, x, s.time) }
  // Chefe colossal com martelo e olho central.
  if (!s.bossWon && s.player.x > 4950) { const b = s.boss, x = b.x - cam; ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.beginPath(); ctx.ellipse(x, GROUND_Y, 92, 17, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#383430"; rounded(ctx, x - 60, GROUND_Y - 170, 120, 160, 19); ctx.fillStyle = "#625446"; rounded(ctx, x - 49, GROUND_Y - 155, 98, 34, 8); ctx.fillStyle = "#b83e32"; ctx.shadowColor = "#ee4536"; ctx.shadowBlur = 20; ctx.beginPath(); ctx.arc(x, GROUND_Y - 135, 11, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = "#41372e"; ctx.fillRect(x - 48, GROUND_Y - 15, 34, 18); ctx.fillRect(x + 16, GROUND_Y - 15, 34, 18); const hammerY = b.attack === "slam" && b.timer < 0.6 ? GROUND_Y - 68 : GROUND_Y - 150; ctx.save(); ctx.translate(x + 48, GROUND_Y - 122); ctx.rotate(b.attack === "slam" && b.timer < 0.6 ? -0.9 : 0.22); ctx.fillStyle = "#816345"; ctx.fillRect(0, 0, 15, 72); ctx.fillStyle = "#786d5b"; rounded(ctx, -20, 52, 56, 45, 7); ctx.restore(); void hammerY; if (x > -100 && x < VIEW_WIDTH + 100) { ctx.fillStyle = "#eee0c6"; ctx.font = "11px monospace"; ctx.textAlign = "center"; ctx.fillText(b.attack === "slam" ? "PANCADA" : b.attack === "charge" ? "INVESTIDA" : "FRAGMENTOS", x, GROUND_Y - 188) } }
  // Caco: corpo assimétrico, um olho âmbar, pernas e lâmina.
  const p = s.player, px = p.x - cam, py = p.y
  if (!(p.invulnerable > 0 && Math.floor(s.time * 18) % 2 === 0)) drawBot(ctx, px + 18, py + 22, "#a77950", s.time, p.facing, p.attack > 0, p.dash > 0)
  if (p.attack > 0) { ctx.strokeStyle = "#e5c77e"; ctx.lineWidth = 5; ctx.globalAlpha = Math.min(1, p.attack * 5); ctx.beginPath(); ctx.arc(px + 18 + p.facing * 26, py + 18, 27, p.facing < 0 ? Math.PI * 0.62 : -Math.PI * 0.62, p.facing < 0 ? Math.PI * 1.38 : Math.PI * 0.62); ctx.stroke(); ctx.globalAlpha = 1 }
  // Poeira, partículas e faíscas ambientais.
  for (let i = 0; i < 36; i++) { const x = (i * 109 + s.time * (11 + i % 5) - cam * 0.2) % VIEW_WIDTH; const y = (i * 71 + s.time * (8 + i % 4)) % 430; ctx.fillStyle = i % 9 === 0 ? "rgba(215,137,73,.65)" : "rgba(190,184,158,.25)"; ctx.beginPath(); ctx.arc(x, y, i % 9 === 0 ? 1.7 : 1, 0, Math.PI * 2); ctx.fill() }
  ctx.fillStyle = "rgba(0,0,0,.22)"; const vignette = ctx.createRadialGradient(480, 250, 145, 480, 250, 560); vignette.addColorStop(0, "rgba(0,0,0,0)"); vignette.addColorStop(1, "rgba(0,0,0,.56)"); ctx.fillStyle = vignette; ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT)
  ctx.textAlign = "left"
}

function drawBot(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, time: number, facing: number, attacking = false, dashing = false) {
  const bob = Math.sin(time * 7 + x * 0.02) * 1.5
  ctx.save(); ctx.translate(x, y + bob); ctx.scale(facing, 1)
  if (dashing) { ctx.globalAlpha = 0.45; ctx.fillStyle = "#a5b3a3"; rounded(ctx, -25, 9, 36, 25, 7); ctx.globalAlpha = 1 }
  ctx.strokeStyle = "#83725e"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-5, 27); ctx.lineTo(-10, 39); ctx.lineTo(-14, 42); ctx.moveTo(8, 28); ctx.lineTo(13, 38); ctx.lineTo(18, 40); ctx.stroke()
  ctx.strokeStyle = "#554d42"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-11, 41); ctx.lineTo(-2, 41); ctx.moveTo(12, 40); ctx.lineTo(21, 40); ctx.stroke()
  ctx.fillStyle = color; rounded(ctx, -13, 10, 25, 22, 6); ctx.fillStyle = "#c1a67c"; ctx.fillRect(-9, 14, 5, 4); ctx.fillStyle = "#403c35"; rounded(ctx, -10, -5, 23, 19, 6); ctx.fillStyle = "#987b59"; ctx.fillRect(-8, -8, 19, 5); ctx.fillStyle = "#efd17b"; ctx.shadowColor = "#ffd17a"; ctx.shadowBlur = 9; ctx.beginPath(); ctx.arc(6, 2, 3.3, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0
  ctx.strokeStyle = "#987b59"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-12, 15); ctx.lineTo(-19, 22 + Math.sin(time * 9) * 2); ctx.lineTo(-16, 28); ctx.moveTo(11, 16); ctx.lineTo(17, 22); ctx.stroke()
  ctx.strokeStyle = attacking ? "#efd17b" : "#8d9991"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(18, 22); ctx.lineTo(29, 9); ctx.lineTo(32, 12); ctx.stroke()
  ctx.restore()
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, x: number, time: number) {
  const y = e.y
  if (e.kind === "crawler") { ctx.fillStyle = "#655443"; rounded(ctx, x - 15, y + 5, 30, 18, 7); ctx.fillStyle = "#d47445"; ctx.fillRect(x + 6, y + 10, 5, 4); ctx.strokeStyle = "#8f7556"; ctx.lineWidth = 3; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x + i * 8, y + 18); ctx.lineTo(x + i * 12, y + 25); ctx.stroke() } }
  if (e.kind === "fly") { ctx.fillStyle = "rgba(132,158,148,.3)"; ctx.beginPath(); ctx.ellipse(x - 10, y + Math.sin(time * 12) * 4, 13, 5, -0.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + 10, y - Math.sin(time * 12) * 4, 13, 5, 0.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#564a3e"; ctx.beginPath(); ctx.ellipse(x, y, 13, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#d98449"; ctx.fillRect(x + 4, y - 3, 4, 4) }
  if (e.kind === "soldier") { ctx.fillStyle = "#6e5942"; rounded(ctx, x - 14, y, 28, 37, 5); ctx.fillStyle = "#3b3933"; rounded(ctx, x - 12, y - 15, 25, 19, 6); ctx.fillStyle = "#d17546"; ctx.fillRect(x + 1, y - 8, 6, 4); ctx.strokeStyle = "#958066"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 10, y + 8); ctx.lineTo(x - 22, y + 19); ctx.moveTo(x + 10, y + 9); ctx.lineTo(x + 19, y + 20); ctx.stroke() }
  if (e.kind === "spider") { ctx.fillStyle = "#685241"; ctx.beginPath(); ctx.ellipse(x, y + 10, 17, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "#947557"; ctx.lineWidth = 3; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x + i * 8, y + 12); ctx.lineTo(x + i * 16, y + 23 + Math.sin(time * 8 + i) * 3); ctx.moveTo(x + i * 8, y + 8); ctx.lineTo(x + i * 16, y - 4); ctx.stroke() } ctx.fillStyle = "#de824e"; ctx.fillRect(x - 4, y + 6, 3, 3); ctx.fillRect(x + 3, y + 6, 3, 3) }
  ctx.fillStyle = "#241f1c"; ctx.fillRect(x - 17, y - 21, 34, 4); ctx.fillStyle = "#bc6546"; ctx.fillRect(x - 17, y - 21, 34 * (e.hp / e.maxHp), 4)
}

export function saveableState(s: GameState): Partial<GameState> { return { player: { ...s.player, vx: 0, vy: 0, attack: 0, dash: 0 }, enemies: s.enemies, boss: s.boss, checkpoint: s.checkpoint, foundGreen: s.foundGreen, shortcut: s.shortcut, bossWon: s.bossWon, upgrades: s.upgrades } }
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
