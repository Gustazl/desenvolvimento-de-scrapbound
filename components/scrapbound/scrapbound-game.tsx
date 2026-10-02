"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, ArrowUp, AudioLines, BookOpen, Check, ChevronRight, CircleHelp, Coins, Heart, Keyboard, Map, Play, RotateCcw, Shield, Sparkles, X, Zap } from "lucide-react"
import { AREAS, VIEW_HEIGHT, VIEW_WIDTH, buyUpgrade, createGameState, drawGame, getArea, interact, loadSavedState, persistState, resetSave, tickGame, upgradeInfo, type GameState } from "./game-engine"

const keysFor = { a: "ESQUERDA", d: "DIREITA", space: "PULAR", shift: "DASH", j: "ATACAR", k: "PULSO", e: "INTERAGIR", i: "INVENTÁRIO", m: "MAPA", escape: "PAUSAR" }
type Screen = "title" | "playing" | "pause" | "inventory" | "map" | "death" | "intro"
type Panel = "itens" | "habilidades" | "diário"

export default function ScrapboundGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<GameState | null>(null)
  const keysRef = useRef(new Set<string>())
  const lastFrameRef = useRef(0)
  const lastSaveRef = useRef(0)
  const lastUiRef = useRef(0)
  const screenRef = useRef<Screen>("title")
  const [screen, setScreen] = useState<Screen>("title")
  const [panel, setPanel] = useState<Panel>("itens")
  const [revision, setRevision] = useState(0)
  const [sound, setSound] = useState(false)
  const [run, setRun] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const audioRef = useRef<AudioContext | null>(null)
  const world = gameRef.current

  const changeScreen = useCallback((next: Screen) => { screenRef.current = next; setScreen(next) }, [])
  const start = useCallback((fresh = false) => {
    if (fresh) resetSave()
    const state = createGameState(fresh ? undefined : loadSavedState())
    gameRef.current = state
    changeScreen("intro")
    setRevision((value) => value + 1)
  }, [changeScreen])
  const enterWorld = useCallback(() => { changeScreen("playing"); lastFrameRef.current = 0 }, [changeScreen])

  const playTone = useCallback((frequency = 180, duration = .09, wave: OscillatorType = "triangle") => {
    if (!sound) return
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextClass) return
      const audio = audioRef.current ?? new AudioContextClass()
      audioRef.current = audio
      if (audio.state === "suspended") void audio.resume()
      const oscillator = audio.createOscillator()
      const gain = audio.createGain()
      oscillator.type = wave
      oscillator.frequency.setValueAtTime(frequency, audio.currentTime)
      gain.gain.setValueAtTime(.045, audio.currentTime)
      gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration)
      oscillator.connect(gain); gain.connect(audio.destination)
      oscillator.start(); oscillator.stop(audio.currentTime + duration)
    } catch { /* áudio é um recurso opcional do navegador */ }
  }, [sound])

  useEffect(() => {
    if (!sound || screen !== "playing") return
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextClass) return
      const audio = audioRef.current ?? new AudioContextClass()
      audioRef.current = audio
      if (audio.state === "suspended") void audio.resume()
      const greenDiscovered = Boolean(gameRef.current?.foundGreen)
      const bed = audio.createGain()
      const low = audio.createOscillator()
      const upper = audio.createOscillator()
      const filter = audio.createBiquadFilter()
      filter.type = "lowpass"
      filter.frequency.value = greenDiscovered ? 520 : 180
      bed.gain.setValueAtTime(.0001, audio.currentTime)
      bed.gain.exponentialRampToValueAtTime(.012, audio.currentTime + 1.4)
      low.type = "sine"
      low.frequency.value = greenDiscovered ? 73.42 : 49
      upper.type = "sine"
      upper.frequency.value = greenDiscovered ? 110 : 73.42
      low.connect(filter); upper.connect(filter); filter.connect(bed); bed.connect(audio.destination)
      low.start(); upper.start()
      return () => {
        const now = audio.currentTime
        bed.gain.cancelScheduledValues(now)
        bed.gain.setTargetAtTime(.0001, now, .14)
        low.stop(now + .7); upper.stop(now + .7)
      }
    } catch { /* a paisagem sonora depende do suporte de áudio do navegador */ }
  }, [screen, sound, world?.foundGreen])

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if ([" ", "arrowleft", "arrowright", "arrowup", "arrowdown"].includes(key)) event.preventDefault()
      if (event.repeat && ["e", "i", "m", "escape"].includes(key)) return
      const currentScreen = screenRef.current
      if (currentScreen === "title") {
        if (key === "enter" || key === " ") start(false)
        return
      }
      if (currentScreen === "intro") { if (key === "enter" || key === "e" || key === " ") enterWorld(); return }
      if (key === "escape") { changeScreen(currentScreen === "playing" ? "pause" : currentScreen === "pause" ? "playing" : "playing"); keysRef.current.clear(); return }
      if (currentScreen === "pause") { if (key === "enter") changeScreen("playing"); return }
      if (currentScreen === "death") { if (key === "enter") start(false); return }
      if (currentScreen === "inventory" || currentScreen === "map") {
        if (key === "i" || key === "m" || key === "escape") changeScreen("playing")
        return
      }
      if (currentScreen !== "playing") return
      if (key === "i") { changeScreen("inventory"); keysRef.current.clear(); return }
      if (key === "m") { changeScreen("map"); keysRef.current.clear(); return }
      if (key === "e") {
        const state = gameRef.current
        if (state?.dialogue && state.dialogue.index >= state.dialogue.lines.length - 1) { state.dialogue = null; setRevision((v) => v + 1) }
        else if (state && !state.dialogue) { interact(state); setRevision((v) => v + 1) }
        else if (state?.dialogue) { interact(state); setRevision((v) => v + 1) }
        return
      }
      if (key === " " || key in keysFor || key.startsWith("arrow")) keysRef.current.add(key === " " ? "space" : key)
      if (key === "j") playTone(240, .08, "sawtooth")
      if (key === "space") playTone(330, .11)
      if (key === "shift") playTone(130, .13, "square")
    }
    const up = (event: KeyboardEvent) => { keysRef.current.delete(event.key.toLowerCase() === " " ? "space" : event.key.toLowerCase()) }
    const blur = () => keysRef.current.clear()
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur)
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur) }
  }, [changeScreen, enterWorld, playTone, start])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    let frame = 0
    const loop = (now: number) => {
      const state = gameRef.current
      if (state) {
        const dt = Math.min(.04, lastFrameRef.current ? (now - lastFrameRef.current) / 1000 : 0)
        lastFrameRef.current = now
        if (screenRef.current === "playing" && !state.dialogue) {
          if (run) keysRef.current.add("_run"); else keysRef.current.delete("_run")
          tickGame(state, keysRef.current, dt)
          if (now - lastSaveRef.current > 7000 || (state.savePulse > 0 && now - lastSaveRef.current > 1000)) { persistState(state); lastSaveRef.current = now }
        }
        drawGame(ctx, state, VIEW_WIDTH, VIEW_HEIGHT)
        if (now - lastUiRef.current > 100) { setRevision((value) => value + 1); lastUiRef.current = now }
      } else {
        drawBackdrop(ctx, now / 1000)
      }
      frame = window.requestAnimationFrame(loop)
    }
    frame = window.requestAnimationFrame(loop)
    return () => window.cancelAnimationFrame(frame)
  }, [run])

  const handleAction = (action: string, value?: string) => {
    const state = gameRef.current
    if (action === "continue") start(false)
    if (action === "new") start(true)
    if (action === "enter") enterWorld()
    if (action === "resume") changeScreen("playing")
    if (action === "inventory") changeScreen("inventory")
    if (action === "map") changeScreen("map")
    if (action === "toggle-controls") setShowControls((v) => !v)
    if (action === "toggle-sound") setSound((v) => !v)
    if (action === "run") setRun((v) => !v)
    if (action === "dialogue-next" && state?.dialogue) { interact(state); setRevision((v) => v + 1) }
    if (action === "buy" && state && value) { buyUpgrade(state, value); persistState(state); setRevision((v) => v + 1); playTone(390, .16) }
    if (action === "heal" && state) { state.player.hp = Math.min(state.player.maxHp, state.player.hp + 1); state.player.energy = Math.min(state.upgrades.includes("core") ? 4 : 3, state.player.energy + 1); setRevision((v) => v + 1) }
  }

  const pressControl = (key: string) => (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); keysRef.current.add(key)
  }
  const releaseControl = (key: string) => () => keysRef.current.delete(key)
  const toggleMobileMap = () => changeScreen(screenRef.current === "map" ? "playing" : "map")

  return (
    <main className="scrap-shell">
      <div className="game-frame">
        <header className="game-topbar">
          <a className="wordmark" href="#inicio" onClick={(event) => { event.preventDefault(); changeScreen("title") }} aria-label="SCRAPBOUND, início"><span className="wordmark-mark">S</span><span>SCRAP<span className="wordmark-accent">BOUND</span><small>A REVOLUÇÃO DAS SUCATAS</small></span></a>
          <div className="topbar-center"><span className="live-indicator" /> <span>PROTOCOLO DE CAMPO <i>·</i> V. 0.1</span></div>
          <div className="topbar-actions"><button className="icon-button" aria-label={sound ? "Desativar som" : "Ativar som"} onClick={() => handleAction("toggle-sound")}><AudioLines size={16} className={sound ? "sound-active" : ""} /></button><button className="icon-button" aria-label="Controles" onClick={() => handleAction("toggle-controls")}><Keyboard size={16} /></button><span className="system-status"><span /> SISTEMA ONLINE</span></div>
        </header>

        <section className="game-screen" aria-label="Jogo SCRAPBOUND">
          <canvas ref={canvasRef} className="game-canvas" width={VIEW_WIDTH} height={VIEW_HEIGHT} onPointerDown={(event) => { if (event.button !== 0 || screenRef.current !== "playing" || gameRef.current?.dialogue) return; keysRef.current.add("mouse"); window.setTimeout(() => keysRef.current.delete("mouse"), 90); playTone(240, .08, "sawtooth") }} aria-label="Mundo jogável de Scrapbound. Use A e D para andar, espaço para pular, J ou clique para atacar e E para interagir." />

          {world && <>
            <div className="hud-top">
              <div className="hud-health"><div className="hud-avatar">C</div><div className="health-copy"><span className="hud-label">INTEGRIDADE</span><div className="hearts">{Array.from({ length: world.player.maxHp }, (_, index) => <Heart key={index} size={15} fill={index < world.player.hp ? "#ca7554" : "transparent"} stroke={index < world.player.hp ? "#e9a178" : "#70695e"} />)}</div></div></div>
              <div className="hud-area"><span className="area-overline">SETOR ATUAL</span><span>{getArea(world.player.x).name}</span></div>
              <div className="hud-currency"><Coins size={15} /><span>{world.player.screws.toString().padStart(3, "0")}</span><small>PARAFUSOS</small></div>
            </div>
            <div className="hud-energy" aria-label={`${world.player.energy} cargas de energia`}><span className="hud-label">NÚCLEO</span>{Array.from({ length: world.upgrades.includes("core") ? 4 : 3 }, (_, i) => <i key={i} className={i < Math.floor(world.player.energy) ? "charged" : ""} />)}</div>
            <div className="hud-location"><span className="location-rule" /><span>{getArea(world.player.x).name.toUpperCase()}</span><span className="location-rule" /></div>
            <div className="hud-compass"><span>N</span><div className="compass-track"><i style={{ left: `${Math.max(1, Math.min(98, (world.player.x / 5900) * 100))}%` }} /></div><span>ABISMO</span><button onClick={toggleMobileMap} aria-label="Abrir mapa"><Map size={14} /></button></div>
            {world.toastTimer > 0 && <div className="game-toast" role="status"><Sparkles size={14} />{world.toast}</div>}
            {world.dialogue && <div className="dialogue-box"><div className="dialogue-name">{world.dialogue.name}</div><p>{world.dialogue.lines[Math.min(world.dialogue.index, world.dialogue.lines.length - 1)]}</p>{world.dialogue.shop && <div className="dialogue-shop">{upgradeInfo.map((upgrade) => <button key={upgrade.id} onClick={() => handleAction("buy", upgrade.id)} disabled={world.upgrades.includes(upgrade.id) || world.player.screws < upgrade.cost}><span>{upgrade.name}</span><small>{world.upgrades.includes(upgrade.id) ? "INSTALADA" : `${upgrade.cost} PARAFUSOS`}</small></button>)}</div>}<button className="dialogue-continue" onClick={() => handleAction("dialogue-next")}>CONTINUAR <ChevronRight size={14} /></button></div>}
          </>}

          {screen === "title" && <div className="screen-overlay title-overlay"><div className="title-grain" /><div className="title-content"><div className="title-eyebrow"><span /> ARQUIVO DE EXPLORAÇÃO Nº 001 <span /></div><h1>SCRAP<span>BOUND</span></h1><p className="title-subtitle">A REVOLUÇÃO DAS SUCATAS</p><div className="title-divider"><i /><span>✳</span><i /></div><p className="title-quote">“O mundo não acabou.<br />Só aprendeu a se esconder.”</p><div className="title-buttons"><button className="button-primary" onClick={() => handleAction("continue")}><Play size={15} fill="currentColor" /> CONTINUAR JORNADA</button><button className="button-secondary" onClick={() => handleAction("new")}><RotateCcw size={15} /> NOVA JORNADA</button></div><button className="text-action" onClick={() => handleAction("toggle-controls")}><CircleHelp size={14} /> COMO JOGAR</button>{showControls && <Controls onClose={() => setShowControls(false)} />}</div><span className="title-coordinate">ABISMO DE FERRO · COORD. 00:00:01</span><span className="title-version">ARQUIVO LOCAL {loadSavedState() ? "· PROGRESSO ENCONTRADO" : "· SEM REGISTRO"}</span></div>}

          {screen === "intro" && <div className="screen-overlay intro-overlay"><div className="intro-card"><span className="chapter-index">PRÓLOGO · UM SOM SOB A SUCATA</span><h2>O silêncio<br />também enferruja.</h2><div className="intro-copy"><p>Por séculos, o Abismo de Ferro dormiu sob o peso do que o mundo descartou.</p><p>Então, uma máquina antiga despertou. A sucata aprendeu a respirar. E o Ferreiro ensinou todos a não olhar para cima.</p><p>Em algum lugar sob uma montanha de metal, uma pequena criatura abriu o único olho.</p></div><div className="intro-footer"><span>VOCÊ É CACO. POR ENQUANTO, ISSO BASTA.</span><button className="button-primary" onClick={() => handleAction("enter")}>ACORDAR <ChevronRight size={15} /></button></div></div></div>}

          {screen === "pause" && <OverlayCard eyebrow="SINAL INTERROMPIDO" title="A sucata espera." onClose={() => handleAction("resume")}><div className="pause-actions"><button onClick={() => handleAction("resume")}><Play size={16} /> CONTINUAR EXPLORAÇÃO <ChevronRight size={15} /></button><button onClick={() => handleAction("inventory")}><Shield size={16} /> INVENTÁRIO <ChevronRight size={15} /></button><button onClick={() => handleAction("map")}><Map size={16} /> MAPA DO ABISMO <ChevronRight size={15} /></button><button onClick={() => { changeScreen("title"); gameRef.current && persistState(gameRef.current) }}><X size={16} /> VOLTAR AO MENU <ChevronRight size={15} /></button></div><div className="pause-footnote"><span className="live-indicator" /> PROGRESSO SALVO AUTOMATICAMENTE</div></OverlayCard>}

          {screen === "inventory" && world && <OverlayCard eyebrow="PERTENCES DE CACO" title="O que restou." onClose={() => handleAction("resume")}><div className="inventory-tabs">{(["itens", "habilidades", "diário"] as Panel[]).map((tab) => <button key={tab} className={panel === tab ? "active" : ""} onClick={() => setPanel(tab)}>{tab === "itens" ? "ITENS" : tab === "habilidades" ? "HABILIDADES" : "DIÁRIO"}</button>)}</div>{panel === "itens" && <div className="inventory-content"><div className="equipment-card"><div className="item-icon">⌁</div><div><span className="item-category">ARMA · EQUIPADA</span><strong>Lâmina improvisada</strong><small>Uma peça de metal que ainda sabe cortar.</small></div><Check size={14} /></div>{upgradeInfo.map((item) => <div className="equipment-card" key={item.id}><div className="item-icon muted">{item.id === "shell" ? "⬡" : item.id === "dash" ? "↗" : item.id === "core" ? "◉" : "⌁"}</div><div><span className="item-category">MELHORIA · {world.upgrades.includes(item.id) ? "INSTALADA" : "DISPONÍVEL NA LATA"}</span><strong>{item.name}</strong><small>{item.detail}</small></div>{world.upgrades.includes(item.id) && <Check size={14} />}</div>)}<div className="inventory-stats"><span><Heart size={14} /> {world.player.hp}/{world.player.maxHp} INTEGRIDADE</span><span><Zap size={14} /> {world.player.energy} CARGAS</span><span><Coins size={14} /> {world.player.screws} PARAFUSOS</span></div></div>}{panel === "habilidades" && <div className="inventory-content ability-content"><div className="equipment-card"><div className="item-icon">⌁</div><div><span className="item-category">COMBATE · DISPONÍVEL</span><strong>Lâmina de sucata</strong><small>Golpe corpo a corpo. J ou clique esquerdo.</small></div><Check size={14} /></div><div className="equipment-card"><div className="item-icon">↗</div><div><span className="item-category">MOVIMENTO · DISPONÍVEL</span><strong>Propulsor improvisado</strong><small>Investida rápida e invulnerável. Shift.</small></div><Check size={14} /></div><div className="equipment-card"><div className="item-icon muted">✳</div><div><span className="item-category">HABILIDADE · {world.bossWon ? "DESBLOQUEADA" : "BLOQUEADA"}</span><strong>Pulso de Sucata</strong><small>{world.bossWon ? "Uma onda de energia. K para usar; consome 1 núcleo." : "O Colosso da Fornalha guarda esta habilidade."}</small></div>{world.bossWon && <Check size={14} />}</div></div>}{panel === "diário" && <div className="journal-content"><BookOpen size={22} /><span>FRAGMENTO DE MEMÓRIA · 001</span><p>“O Ferreiro acordou antes de nós. Ele diz que lá fora só existe silêncio. Mas por que, então, suas máquinas continuam apontadas para o céu?”</p><small>{world.foundGreen ? "NOVA ANOTAÇÃO · Uma flor cresce no metal. Ela não devia estar aqui." : "Continue explorando para encontrar novas lembranças."}</small></div>}</OverlayCard>}

          {screen === "map" && world && <OverlayCard eyebrow="CARTOGRAFIA DE CAMPO" title="O Abismo de Ferro." onClose={() => handleAction("resume")}><div className="map-legend"><span><i className="map-dot player-dot" /> VOCÊ</span><span><i className="map-dot" /> MARCO</span><span><i className="map-dot secret-dot" /> VIDA DETECTADA</span></div><div className="world-map"><div className="map-route">{AREAS.map((area, index) => <div key={area.name} className={`map-region ${world.player.x >= area.start && world.player.x < area.end ? "current" : world.player.x >= area.start ? "discovered" : "unknown"}`}><span className="region-index">0{index + 1}</span><strong>{area.name}</strong><div className="region-content"><span className="map-feature"><i className="map-dot player-dot" style={{ display: world.player.x >= area.start && world.player.x < area.end ? "block" : "none" }} />{index === 0 ? "Montanhas de sucata" : index === 1 ? "Galerias subterrâneas" : index === 2 ? "Refúgio e oficina" : index === 3 ? world.foundGreen ? "● Vida detectada" : "Terreno instável" : world.bossWon ? "Forja atravessável" : "Sinal hostil"}</span>{world.checkpoint >= area.start && index >= 2 && <span className="map-feature"><i className="map-dot" /> Marco de Sucata</span>}</div></div>)}</div><div className="map-you" style={{ left: `${Math.max(5, Math.min(94, (world.player.x / 5900) * 100))}%` }}><span>VOCÊ ESTÁ AQUI</span><i /></div></div><p className="map-tip"><Map size={14} /> As áreas se revelam conforme você as alcança. Procure passagens no alto e sinais de vida abaixo.</p></OverlayCard>}

          {screen === "death" && <div className="screen-overlay"><OverlayCard eyebrow="SINAL PERDIDO" title="A sucata lembra." onClose={() => start(false)}><p className="death-copy">Caco será remontado no último Marco de Sucata.</p><button className="button-primary full-button" onClick={() => start(false)}><RotateCcw size={15} /> VOLTAR AO MARCO</button></OverlayCard></div>}

          {screen === "playing" && <>
            <div className="boss-hud" style={{ opacity: world && world.player.x > 5000 && !world.bossWon ? 1 : 0 }}><div className="boss-name"><span>AMEAÇA DE NÍVEL INDUSTRIAL</span><strong>O COLOSSO DA FORNALHA</strong></div><div className="boss-health"><span style={{ width: `${world ? Math.max(0, (world.boss.hp / world.boss.maxHp) * 100) : 0}%` }} /></div><small>{world?.boss.attack === "slam" ? "PANCADA NO CHÃO" : world?.boss.attack === "charge" ? "INVESTIDA HORIZONTAL" : "CHUVA DE FRAGMENTOS"}</small></div>
            {showControls && <Controls onClose={() => setShowControls(false)} />}
          </>}
        </section>

        <footer className="game-footer"><div className="footer-controls"><span><kbd>A</kbd><kbd>D</kbd> MOVER</span><span><kbd>ESPAÇO</kbd> PULAR</span><span><kbd>J</kbd> ATACAR</span><span><kbd>SHIFT</kbd> DASH</span><span><kbd>E</kbd> INTERAGIR</span></div><div className="footer-right"><span>ABISMO <i>·</i> SETOR {world ? String(AREAS.indexOf(getArea(world.player.x)) + 1).padStart(2, "0") : "01"}</span><span className="save-status"><span /> {world?.savePulse ? "SALVANDO" : "AUTOSAVE"}</span></div></footer>
      </div>
      {screen === "playing" && <div className="mobile-controls" aria-label="Controles de toque"><div className="mobile-move"><button onPointerDown={pressControl("a")} onPointerUp={releaseControl("a")} onPointerCancel={releaseControl("a")} aria-label="Mover para esquerda"><ArrowLeft /></button><button onPointerDown={pressControl("d")} onPointerUp={releaseControl("d")} onPointerCancel={releaseControl("d")} aria-label="Mover para direita"><ArrowRight /></button></div><div className="mobile-actions"><button onPointerDown={pressControl("j")} onPointerUp={releaseControl("j")} onPointerCancel={releaseControl("j")} aria-label="Atacar">J</button><button onPointerDown={pressControl("space")} onPointerUp={releaseControl("space")} onPointerCancel={releaseControl("space")} aria-label="Pular"><ArrowUp /></button><button onPointerDown={pressControl("shift")} onPointerUp={releaseControl("shift")} onPointerCancel={releaseControl("shift")} aria-label="Dash">D</button><button onClick={toggleMobileMap} aria-label="Abrir mapa"><Map size={17} /></button></div></div>}
      <div className="page-caption"><span>UMA HISTÓRIA SOBRE O QUE RESTA</span><span>WASD / SETAS PARA MOVER <i>·</i> EXPLORE NO SEU RITMO</span></div>
    </main>
  )
}

function OverlayCard({ eyebrow, title, onClose, children }: { eyebrow: string; title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="screen-overlay panel-overlay"><section className="metal-panel"><div className="panel-screws"><i /><i /><i /><i /></div><div className="panel-header"><div><span className="panel-eyebrow">{eyebrow}</span><h2>{title}</h2></div><button className="icon-button close-panel" onClick={onClose} aria-label="Fechar painel"><X size={18} /></button></div><div className="panel-body">{children}</div></section></div>
}

function Controls({ onClose }: { onClose: () => void }) {
  return <div className="controls-card"><div className="controls-head"><span>MANUAL DO OPERADOR</span><button onClick={onClose} aria-label="Fechar controles"><X size={15} /></button></div><div className="controls-grid">{[["A / D", "MOVER"], ["ESPAÇO", "PULAR"], ["SHIFT", "DASH"], ["J / CLIQUE", "ATACAR"], ["K", "PULSO"], ["E", "INTERAGIR"], ["I", "INVENTÁRIO"], ["M", "MAPA"], ["ESC", "PAUSAR"]].map(([key, value]) => <span key={key}><kbd>{key}</kbd><small>{value}</small></span>)}</div><p>Derrote inimigos para recolher parafusos. Procure a Lata na Vila dos Pregos e ative os Marcos para recuperar suas forças.</p></div>
}

function drawBackdrop(ctx: CanvasRenderingContext2D, time: number) {
  const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT)
  gradient.addColorStop(0, "#111a1b"); gradient.addColorStop(.55, "#272c29"); gradient.addColorStop(1, "#151514")
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT)
  for (let i = 0; i < 23; i++) { const x = (i * 83 + Math.sin(time * .09 + i) * 12) % VIEW_WIDTH; const height = 90 + (i * 59) % 200; ctx.fillStyle = i % 3 ? "#1a2221" : "#202522"; ctx.fillRect(x, 420 - height, 54 + i % 3 * 15, height + 130); ctx.fillStyle = "#403d34"; ctx.fillRect(x + 9, 425 - height, 3, height) }
  ctx.fillStyle = "#242523"; ctx.fillRect(0, 458, VIEW_WIDTH, 82)
  for (let x = 0; x < VIEW_WIDTH; x += 158) { ctx.fillStyle = "#37342d"; ctx.fillRect(x, 460, 154, 5); ctx.fillStyle = "#76684f"; ctx.beginPath(); ctx.arc(x + 9, 475, 2, 0, 6.29); ctx.fill() }
  ctx.strokeStyle = "#45443b"; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(0, 98); ctx.lineTo(VIEW_WIDTH, 98); ctx.stroke()
  for (let i = 0; i < 28; i++) { const x = (i * 109 + time * (i % 4 + 6)) % VIEW_WIDTH; const y = (i * 79 + time * (i % 3 + 4)) % 430; ctx.fillStyle = i % 8 ? "rgba(190,184,158,.25)" : "rgba(215,137,73,.65)"; ctx.beginPath(); ctx.arc(x, y, i % 8 ? 1 : 2, 0, 6.29); ctx.fill() }
}
