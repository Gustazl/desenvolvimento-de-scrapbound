"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, AudioLines, BookOpen, Check, ChevronRight, Coins, Heart, Keyboard, Map, Play, RotateCcw, Shield, Sparkles, X, Zap } from "lucide-react"
import { AREAS, VIEW_HEIGHT, VIEW_WIDTH, WORLD_WIDTH, buyUpgrade, createGameState, drawCaco, drawGame, getArea, getSubarea, interact, loadSavedState, persistState, resetSave, tickGame, toggleModule, upgradeInfo, type GameState } from "./game-engine"

const coreModuleInfo = [
  { id: "magnetico", name: "Pulso Magnético", detail: "Atrai inimigos mecânicos próximos ao liberar o Pulso." },
  { id: "impulso", name: "Impulso", detail: "Rebate com mais força ao acertar inimigos no ar." },
  { id: "sobrecharge", name: "Sobrecharge", detail: "Com o Núcleo cheio, o terceiro golpe ganha impacto extra." },
  { id: "eco", name: "Eco", detail: "Amplia o alcance do Pulso para alcançar ameaças distantes." },
  { id: "raiz", name: "Raiz", detail: "Permite despertar a flor adormecida com o Pulso." },
]

const keysFor = { a: "ESQUERDA", d: "DIREITA", space: "PULAR", shift: "DASH", j: "ATACAR", k: "PULSO", e: "INTERAGIR", i: "INVENTÁRIO", m: "MAPA", escape: "PAUSAR" }
type Screen = "title" | "playing" | "pause" | "inventory" | "map" | "modules" | "death" | "cinematic" | "gallery" | "options" | "ending"
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
  const [hasSave, setHasSave] = useState(false)
  const [hasSeenIntro, setHasSeenIntro] = useState(false)
  const [endingBeat, setEndingBeat] = useState(0)
  const [panel, setPanel] = useState<Panel>("itens")
  const [revision, setRevision] = useState(0)
  const [sound, setSound] = useState(true)
  const [run, setRun] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const audioRef = useRef<AudioContext | null>(null)
  const world = gameRef.current

  const changeScreen = useCallback((next: Screen) => { screenRef.current = next; setScreen(next) }, [])
  useEffect(() => { const saved = loadSavedState(); setHasSave(Boolean(saved)); setHasSeenIntro(Boolean(saved?.introSeen)) }, [])
  const start = useCallback((fresh = false, showIntro = fresh) => {
    if (fresh) resetSave()
    const saved = fresh ? undefined : loadSavedState()
    setHasSave(Boolean(saved))
    setHasSeenIntro(Boolean(saved?.introSeen))
    const state = createGameState(saved)
    if (fresh) state.player.sitting = true
    gameRef.current = state
    changeScreen(showIntro ? "cinematic" : "playing")
    setRevision((value) => value + 1)
  }, [changeScreen])
  const enterWorld = useCallback(() => {
    const state = gameRef.current
    if (state) { state.introSeen = true; persistState(state); setHasSave(true); setHasSeenIntro(true) }
    changeScreen("playing"); lastFrameRef.current = 0
  }, [changeScreen])

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
      const greenDiscovered = Boolean(gameRef.current?.forestEntered)
      const bed = audio.createGain()
      const low = audio.createOscillator()
      const upper = audio.createOscillator()
      const filter = audio.createBiquadFilter()
      filter.type = "lowpass"
      filter.frequency.value = greenDiscovered ? 1100 : 180
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
  }, [screen, sound, world?.forestEntered])

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if ([" ", "arrowleft", "arrowright", "arrowup", "arrowdown"].includes(key)) event.preventDefault()
      if (event.repeat && ["e", "i", "m", "escape"].includes(key)) return
      const currentScreen = screenRef.current
      if (currentScreen === "title") {
        if (key === "enter" || key === " ") start(!hasSave, hasSave ? false : true)
        return
      }
      if (currentScreen === "cinematic") { if (key === "enter" || key === "e" || key === " " || key === "escape") enterWorld(); return }
      if (currentScreen === "gallery" || currentScreen === "options") { if (key === "escape") changeScreen("title"); return }
      if (currentScreen === "ending") {
        if (key === "enter" || key === " ") {
          if (endingBeat < 2) setEndingBeat((beat) => beat + 1)
          else { const state = gameRef.current; if (state) { state.projectCutsceneSeen = true; state.storyStage = Math.max(1, state.storyStage); persistState(state) }; changeScreen("playing") }
        } else if (key === "escape") { const state = gameRef.current; if (state) { state.projectCutsceneSeen = true; state.storyStage = Math.max(1, state.storyStage); persistState(state) }; changeScreen("playing") }
        return
      }
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
      if (key === "j" && !event.repeat) { keysRef.current.add("_attackPressed"); playTone(240, .08, "sawtooth") }
      if (key === "k" && !event.repeat) keysRef.current.add("_pulsePressed")
      if (key === " " && !event.repeat) { keysRef.current.add("_jumpPressed"); playTone(330, .11) }
      if (key === "shift" && !event.repeat) { keysRef.current.add("_dashPressed"); playTone(130, .13, "square") }
    }
    const up = (event: KeyboardEvent) => { keysRef.current.delete(event.key.toLowerCase() === " " ? "space" : event.key.toLowerCase()) }
    const blur = () => keysRef.current.clear()
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur)
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur) }
  }, [changeScreen, endingBeat, enterWorld, hasSave, playTone, start])

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
          if (state.projectRevealed && !state.projectCutsceneSeen && screenRef.current === "playing") { setEndingBeat(0); persistState(state); changeScreen("ending") }
          if (now - lastSaveRef.current > 7000 || (state.savePulse > 0 && now - lastSaveRef.current > 1000)) { persistState(state); setHasSave(true); lastSaveRef.current = now }
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
  }, [run, changeScreen])

  const handleAction = (action: string, value?: string) => {
    const state = gameRef.current
    if (action === "continue") start(false, false)
    if (action === "new") start(true, true)
    if (action === "gallery") changeScreen("gallery")
    if (action === "options") changeScreen("options")
    if (action === "replay-intro") start(false, true)
    if (action === "enter") enterWorld()
    if (action === "story-next") setEndingBeat((beat) => Math.min(2, beat + 1))
    if (action === "story-return" && state) { state.projectCutsceneSeen = true; state.storyStage = Math.max(1, state.storyStage); persistState(state); setHasSave(true); changeScreen("playing") }
    if (action === "resume") changeScreen("playing")
    if (action === "inventory") changeScreen("inventory")
    if (action === "map") changeScreen("map")
    if (action === "toggle-controls") setShowControls((v) => !v)
    if (action === "toggle-sound") setSound((v) => !v)
    if (action === "run") setRun((v) => !v)
    if (action === "dialogue-next" && state?.dialogue) { interact(state); setRevision((v) => v + 1) }
    if (action === "buy" && state && value) { buyUpgrade(state, value); persistState(state); setRevision((v) => v + 1); playTone(390, .16) }
    if (action === "module" && state && value) { toggleModule(state, value); persistState(state); setRevision((v) => v + 1); playTone(270, .1) }
    if (action === "heal" && state) { state.player.hp = Math.min(state.player.maxHp, state.player.hp + 1); state.player.energy = Math.min(state.upgrades.includes("core") ? 4 : 3, state.player.energy + 1); setRevision((v) => v + 1) }
  }

  const pressControl = (key: string) => (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); keysRef.current.add(key)
    if (key === "j") keysRef.current.add("_attackPressed")
    if (key === "space") keysRef.current.add("_jumpPressed")
    if (key === "k") keysRef.current.add("_pulsePressed")
    if (key === "shift") keysRef.current.add("_dashPressed")
  }
  const releaseControl = (key: string) => () => keysRef.current.delete(key)
  const toggleMobileMap = () => changeScreen(screenRef.current === "map" ? "playing" : "map")
  const furthestMappedArea = world?.discoveredRooms.reduce((furthest, room) => { const match = /^area:(\d+)$/.exec(room); return match ? Math.max(furthest, Number(match[1])) : furthest }, 0) ?? 0
  const mapVisibleAreaCount = Math.min(AREAS.length, furthestMappedArea + 2)
  const mapCurrentAreaIndex = world ? Math.max(0, AREAS.findIndex((area) => world.player.x >= area.start && world.player.x < area.end)) : 0
  const mapCurrentArea = AREAS[mapCurrentAreaIndex]
  const subarea = world ? getSubarea(world.player.x) : ""
  const mapProgress = world && mapCurrentArea ? ((mapCurrentAreaIndex + Math.max(0, Math.min(1, (world.player.x - mapCurrentArea.start) / (mapCurrentArea.end - mapCurrentArea.start)))) / mapVisibleAreaCount) * 100 : 0

  return (
    <main className="scrap-shell">
      <div className="game-frame">
        <header className={`game-topbar ${screen === "cinematic" ? "cinematic-hidden" : ""}`}>
          <a className="wordmark" href="#inicio" onClick={(event) => { event.preventDefault(); changeScreen("title") }} aria-label="SCRAPBOUND, início"><span className="wordmark-mark">S</span><span>SCRAP<span className="wordmark-accent">BOUND</span><small>A REVOLUÇÃO DAS SUCATAS</small></span></a>
          <div className="topbar-center"><span className="live-indicator" /> <span>PROTOCOLO DE CAMPO <i>·</i> V. 0.1</span></div>
          <div className="topbar-actions"><button className="icon-button" aria-label={sound ? "Desativar som" : "Ativar som"} onClick={() => handleAction("toggle-sound")}><AudioLines size={16} className={sound ? "sound-active" : ""} /></button><button className="icon-button" aria-label="Controles" onClick={() => handleAction("toggle-controls")}><Keyboard size={16} /></button><span className="system-status"><span /> SISTEMA ONLINE</span></div>
        </header>

        <section className="game-screen" aria-label="Jogo SCRAPBOUND">
          <canvas ref={canvasRef} className="game-canvas" width={VIEW_WIDTH} height={VIEW_HEIGHT} onPointerDown={(event) => { if (event.button !== 0 || screenRef.current !== "playing" || gameRef.current?.dialogue) return; keysRef.current.add("mouse"); keysRef.current.add("_attackPressed"); window.setTimeout(() => keysRef.current.delete("mouse"), 90); playTone(240, .08, "sawtooth") }} aria-label="Mundo jogável de Scrapbound. Use A e D para andar, espaço para pular, J para atacar na direção indicada, K para liberar o Pulso e E para interagir." />

          {world && <>
            <div className="hud-top">
              <div className="hud-health"><div className="hud-avatar">C</div><div className="health-copy"><span className="hud-label">INTEGRIDADE</span><div className="hearts">{Array.from({ length: world.player.maxHp }, (_, index) => <Heart key={index} size={15} fill={index < world.player.hp ? "#ca7554" : "transparent"} stroke={index < world.player.hp ? "#e9a178" : "#70695e"} />)}</div></div></div>
              <div className="hud-area"><span className="area-overline">SETOR ATUAL</span><span>{getArea(world.player.x).name}</span>{subarea && <small className="hud-subarea">{subarea}</small>}{world.layer === "underworks" && <small className="hud-depth">CAMADA INFERIOR</small>}</div>
              <div className="hud-currency"><Coins size={15} /><span>{world.player.screws.toString().padStart(3, "0")}</span><small>PARAFUSOS</small></div>
            </div>
            <div className={`hud-energy ${world.player.energy >= (world.upgrades.includes("core") ? 4 : 3) ? "energy-full" : ""}`} aria-label={`Energia do Núcleo: ${world.player.energy.toFixed(1)} de ${world.upgrades.includes("core") ? 4 : 3}`}><span className="hud-label">NÚCLEO</span>{Array.from({ length: world.upgrades.includes("core") ? 4 : 3 }, (_, i) => <i key={i} className={i < Math.floor(world.player.energy) ? "charged" : ""} />)}<span className="energy-count">{Math.floor(world.player.energy)}/{world.upgrades.includes("core") ? 4 : 3}</span>{world.bossWon && <><button className="pulse-button" disabled={world.player.energy < 1 || world.player.pulseCooldown > 0} onPointerDown={pressControl("k")} onPointerUp={releaseControl("k")} onPointerCancel={releaseControl("k")} aria-label="Liberar Pulso, tecla K">PULSO <kbd>K</kbd></button><button className="pulse-button modules-open" onClick={() => changeScreen("modules")} aria-label="Abrir módulos do Núcleo">MÓDULOS</button></>}</div>
            <div className="hud-location"><span className="location-rule" /><span>{world.layer === "underworks" ? "TÚNEIS DE FERRUGEM · SUBNÍVEL" : subarea || getArea(world.player.x).name.toUpperCase()}</span><span className="location-rule" /></div>
            {world.storyStage >= 3 && <div className="story-objective"><small>MISSÃO PRINCIPAL</small><span>Descubra por que Caco foi criado.</span></div>}
            {world.tutorialHintTimer > 0 && screen === "playing" && !world.dialogue && <div className="tutorial-hint" role="status"><span className="tutorial-dot" />{world.tutorialHint}</div>}
            {world.vistaMoment > 0 && <div className="vista-overlay" aria-live="polite"><span>TORRE DE OBSERVAÇÃO</span><strong>O mundo não termina aqui.</strong><small>ÁREA DE RECUPERAÇÃO · SUPERFÍCIE</small></div>}
            <div className="hud-compass"><span>N</span><div className="compass-track"><i style={{ left: `${Math.max(1, Math.min(98, (world.player.x / WORLD_WIDTH) * 100))}%` }} /></div><span>SUPERFÍCIE</span><button onClick={toggleMobileMap} aria-label="Abrir mapa"><Map size={14} /></button></div>
            {world.toastTimer > 0 && <div className="game-toast" role="status"><Sparkles size={14} />{world.toast}</div>}
            {world.dialogue && <div className="dialogue-box"><div className="dialogue-name">{world.dialogue.name}</div><p>{world.dialogue.lines[Math.min(world.dialogue.index, world.dialogue.lines.length - 1)]}</p>{world.dialogue.shop && <div className="dialogue-shop">{upgradeInfo.map((upgrade) => <button key={upgrade.id} onClick={() => handleAction("buy", upgrade.id)} disabled={world.upgrades.includes(upgrade.id) || world.player.screws < upgrade.cost}><span>{upgrade.name}</span><small>{world.upgrades.includes(upgrade.id) ? "INSTALADA" : `${upgrade.cost} PARAFUSOS`}</small></button>)}</div>}<button className="dialogue-continue" onClick={() => handleAction("dialogue-next")}>CONTINUAR <ChevronRight size={14} /></button></div>}
          </>}

          {screen === "title" && <div className="screen-overlay title-overlay"><div className="title-grain" /><div className="title-content"><div className="title-eyebrow"><span /> ARQUIVO DE EXPLORAÇÃO Nº 001 <span /></div><h1>SCRAP<span>BOUND</span></h1><p className="title-subtitle">A REVOLUÇÃO DAS SUCATAS</p><div className="title-divider"><i /><span>✳</span><i /></div><p className="title-quote">“O mundo não acabou.<br />Só aprendeu a se esconder.”</p><div className="title-buttons"><button className="button-primary" onClick={() => handleAction("new")}><Play size={15} fill="currentColor" /> NOVO JOGO</button><button className="button-secondary" disabled={!hasSave} onClick={() => handleAction("continue")}><RotateCcw size={15} /> CONTINUAR</button><button className="button-secondary" onClick={() => handleAction("toggle-controls")}><Keyboard size={15} /> CONTROLES</button><button className="button-secondary" onClick={() => handleAction("options")}>OPÇÕES</button>{hasSeenIntro && <button className="text-action gallery-action" onClick={() => handleAction("gallery")}><BookOpen size={14} /> GALERIA / MEMÓRIAS</button>}</div>{showControls && <Controls onClose={() => setShowControls(false)} />}</div><span className="title-coordinate">ABISMO DE FERRO · COORD. 00:00:01</span><span className="title-version">ARQUIVO LOCAL {hasSave ? "· PROGRESSO ENCONTRADO" : "· SEM REGISTRO"}</span></div>}

          {screen === "cinematic" && <IntroCinematic soundEnabled={sound} onComplete={enterWorld} />}
          {screen === "gallery" && <OverlayCard eyebrow="MEMÓRIAS RECUPERADAS" title="O primeiro sinal." onClose={() => changeScreen("title")}><p className="panel-copy">Uma lembrança do fundo do Abismo de Ferro.</p><button className="button-primary full-button" onClick={() => handleAction("replay-intro")}><Play size={15} fill="currentColor" /> REVER ABERTURA</button></OverlayCard>}
          {screen === "options" && <OverlayCard eyebrow="CONFIGURAÇÃO DE CAMPO" title="Opções." onClose={() => changeScreen("title")}><div className="pause-actions"><button onClick={() => handleAction("toggle-sound")}><AudioLines size={16} /> SOM AMBIENTE {sound ? "· ATIVADO" : "· DESATIVADO"}<ChevronRight size={15} /></button><button onClick={() => handleAction("toggle-controls")}><Keyboard size={16} /> CONSULTAR CONTROLES <ChevronRight size={15} /></button></div>{showControls && <Controls onClose={() => setShowControls(false)} />}</OverlayCard>}

          {screen === "pause" && <OverlayCard eyebrow="SINAL INTERROMPIDO" title="A sucata espera." onClose={() => handleAction("resume")}><div className="pause-actions"><button onClick={() => handleAction("resume")}><Play size={16} /> CONTINUAR EXPLORAÇÃO <ChevronRight size={15} /></button><button onClick={() => handleAction("inventory")}><Shield size={16} /> INVENTÁRIO <ChevronRight size={15} /></button><button onClick={() => handleAction("map")}><Map size={16} /> MAPA DO ABISMO <ChevronRight size={15} /></button><button onClick={() => { changeScreen("title"); gameRef.current && persistState(gameRef.current) }}><X size={16} /> VOLTAR AO MENU <ChevronRight size={15} /></button></div><div className="pause-footnote"><span className="live-indicator" /> PROGRESSO SALVO AUTOMATICAMENTE</div></OverlayCard>}

          {screen === "inventory" && world && <OverlayCard eyebrow="PERTENCES DE CACO" title="O que restou." onClose={() => handleAction("resume")}><div className="inventory-tabs">{(["itens", "habilidades", "diário"] as Panel[]).map((tab) => <button key={tab} className={panel === tab ? "active" : ""} onClick={() => setPanel(tab)}>{tab === "itens" ? "ITENS" : tab === "habilidades" ? "HABILIDADES" : "DIÁRIO"}</button>)}</div>{panel === "itens" && <div className="inventory-content"><div className="equipment-card"><div className="item-icon">⌁</div><div><span className="item-category">ARMA · EQUIPADA</span><strong>Lâmina improvisada</strong><small>Uma peça de metal que ainda sabe cortar.</small></div><Check size={14} /></div>{upgradeInfo.map((item) => <div className="equipment-card" key={item.id}><div className="item-icon muted">{item.id === "shell" ? "⬡" : item.id === "dash" ? "↗" : item.id === "core" ? "◉" : "⌁"}</div><div><span className="item-category">MELHORIA · {world.upgrades.includes(item.id) ? "INSTALADA" : "DISPONÍVEL NA LATA"}</span><strong>{item.name}</strong><small>{item.detail}</small></div>{world.upgrades.includes(item.id) && <Check size={14} />}</div>)}<div className="inventory-stats"><span><Heart size={14} /> {world.player.hp}/{world.player.maxHp} INTEGRIDADE</span><span><Zap size={14} /> {world.player.energy} CARGAS</span><span><Coins size={14} /> {world.player.screws} PARAFUSOS</span></div></div>}{panel === "habilidades" && <div className="inventory-content ability-content"><div className="equipment-card"><div className="item-icon">⌁</div><div><span className="item-category">COMBATE · DISPONÍVEL</span><strong>Lâmina de sucata</strong><small>Golpe corpo a corpo. J ou clique esquerdo.</small></div><Check size={14} /></div><div className="equipment-card"><div className="item-icon">↗</div><div><span className="item-category">MOVIMENTO · DISPONÍVEL</span><strong>Propulsor improvisado</strong><small>Investida rápida e invulnerável. Shift.</small></div><Check size={14} /></div><div className="equipment-card"><div className="item-icon muted">✳</div><div><span className="item-category">HABILIDADE · {world.bossWon ? "DESBLOQUEADA" : "BLOQUEADA"}</span><strong>Pulso de Sucata</strong><small>{world.bossWon ? "Uma onda de energia. K para usar; consome 1 núcleo." : "O Colosso da Fornalha guarda esta habilidade."}</small></div>{world.bossWon && <Check size={14} />}</div></div>}{panel === "diário" && <div className="journal-content"><BookOpen size={22} /><span>FRAGMENTO DE MEMÓRIA · 001</span><p>“O Ferreiro acordou antes de nós. Ele diz que lá fora só existe silêncio. Mas por que, então, suas máquinas continuam apontadas para o céu?”</p><small>{world.foundGreen ? "NOVA ANOTAÇÃO · Uma flor cresce no metal. Ela não devia estar aqui." : "Continue explorando para encontrar novas lembranças."}</small></div>}</OverlayCard>}

          {screen === "map" && world && <OverlayCard eyebrow="CARTOGRAFIA DE CAMPO" title="O Abismo de Ferro." onClose={() => handleAction("resume")}><div className="map-legend"><span><i className="map-dot player-dot" /> VOCÊ</span><span><i className="map-dot" /> MARCO</span><span><i className="map-dot secret-dot" /> DESCOBERTA</span></div><div className="world-map"><div className="map-route">{AREAS.slice(0, mapVisibleAreaCount).map((area, index) => { const discovered = world.discoveredRooms.includes(`area:${index}`); const active = world.player.x >= area.start && world.player.x < area.end; const feature = index === 0 ? "Entrada do Abismo" : index === 1 ? "Galerias e vapor" : index === 2 ? "Vila e abrigo" : index === 3 ? "Trilhos e cemitério" : index === 4 ? world.bossWon ? "Fornalha atravessável" : "Sinal hostil" : index === 5 ? world.secretFound ? "Memória encontrada" : "Jardim silencioso" : index === 6 ? world.projectRevealed ? "Terminal C-01" : "Instalação humana" : world.flowerBloomed ? "Flor no braço de Caco" : "Horizonte de árvores"; return <div key={area.name} className={`map-region ${active ? "current" : discovered ? "discovered" : "unknown"}`}><span className="region-index">{discovered ? `0${index + 1}` : "···"}</span><strong>{discovered ? area.name : <span className="sr-only">Área ainda sem registro</span>}</strong><div className="region-content">{discovered && <><span className="map-feature"><i className={`map-dot ${active ? "player-dot" : ""}`} style={{ display: active ? "block" : "none" }} />{feature}</span>{world.checkpoint >= area.start && index >= 2 && <span className="map-feature"><i className="map-dot" /> Marco de Sucata</span>}</>}</div></div>})}</div><div className="map-you" style={{ left: `${Math.max(5, Math.min(94, mapProgress))}%` }}><span>{world.layer === "underworks" ? "ABAIXO DE VOCÊ" : "VOCÊ ESTÁ AQUI"}</span><i /></div></div>{world.discoveredRooms.includes("area:1") && <section className="vertical-map" aria-label="Camadas conhecidas dos Túneis de Ferrugem"><div className={`vertical-level ${world.layer === "surface" ? "level-current" : ""}`}><span>CAMADA SUPERIOR</span><strong>Passarelas de sucata</strong>{world.discoveredRooms.includes("upper-gallery") && <small>Galeria alta explorada</small>}</div><i className="vertical-link" /><div className={`vertical-level ${world.layer === "surface" ? "" : "level-current"}`}><span>CAMADA CENTRAL</span><strong>Túnel principal</strong><small>Entrada sob as placas</small></div><i className={`vertical-link ${world.discoveredRooms.includes("underworks") ? "link-open" : ""}`} /><div className={`vertical-level ${world.discoveredRooms.includes("underworks") ? world.layer === "underworks" ? "level-current" : "" : "level-hidden"}`}><span>{world.discoveredRooms.includes("underworks") ? "CAMADA INFERIOR" : "SEM REGISTRO"}</span><strong>{world.discoveredRooms.includes("underworks") ? "Túneis de Ferrugem" : ""}</strong>{world.discoveredRooms.includes("underworks") && <small>{world.lowerWallBroken ? world.tunnelMemoryFound ? "Memória recuperada" : "Passagem aberta · memória" : "Passagem ainda soterrada"}</small>}</div>{world.relayActivated && <div className="map-shortcut"><i className="map-dot" /> Elevador ativo · Cemitério de Motores</div>}</section>}<p className="map-tip"><Map size={14} /> O mapa só registra lugares visitados. Plataformas acima, frestas e ruídos atrás das paredes ainda podem esconder caminhos.</p></OverlayCard>}

          {screen === "death" && <div className="screen-overlay"><OverlayCard eyebrow="SINAL PERDIDO" title="A sucata lembra." onClose={() => start(false)}><p className="death-copy">Caco será remontado no último Marco de Sucata.</p><button className="button-primary full-button" onClick={() => start(false)}><RotateCcw size={15} /> VOLTAR AO MARCO</button></OverlayCard></div>}

          {screen === "ending" && <div className="screen-overlay ending-overlay"><section className="ending-card"><span className="chapter-index">REGISTRO HUMANO RECUPERADO · 01/01</span><div className="terminal-orbit"><span /><i /><b /></div>{endingBeat === 0 ? <><p className="ending-ecology">ÁREA DE RECUPERAÇÃO ECOLÓGICA</p><h2>PROJETO<br /><strong>SCRAPBOUND</strong></h2><div className="ending-status">STATUS: <b>SUBJECT DETECTED</b></div><div className="terminal-record"><span>UNIDADE <b>C-01</b></span><span>RESPOSTA NATURAL <b>CONFIRMADA</b></span><span>MEMÓRIA <b>INCOMPLETA</b></span><span>PROTOCOLO <b>DESPERTAR</b></span></div><button className="button-primary" onClick={() => handleAction("story-next")}>LER REGISTRO <ChevronRight size={15} /></button></> : endingBeat === 1 ? <><p className="ending-ecology">MEMÓRIA FRAGMENTADA · ORIGEM DESCONHECIDA</p><div className="ending-silhouette"><span /><i /><b /></div><p className="ending-copy">Uma silhueta diante de uma floresta. Depois, uma máquina. Por último, Caco.</p><h3>VOCÊ NÃO FOI DESCARTADO.</h3><button className="button-primary" onClick={() => handleAction("story-next")}>CONTINUAR <ChevronRight size={15} /></button></> : <><p className="ending-ecology">SINAL PERDIDO</p><h2>VOCÊ FOI<br /><strong>ENVIADO.</strong></h2><p className="ending-copy">A tela apaga. O terminal sabe onde Caco está — mas não diz por quê.</p><button className="button-primary" onClick={() => handleAction("story-return")}>VOLTAR À EXPLORAÇÃO <ChevronRight size={15} /></button></>}</section></div>}


          {screen === "playing" && <>
            <div className="boss-hud" style={{ opacity: world && world.player.x > 5000 && !world.bossWon ? 1 : 0 }}><div className="boss-name"><span>{world?.boss.secondPhase ? "FASE II · NÚCLEO EXPOSTO" : "AMEAÇA DE NÍVEL INDUSTRIAL"}</span><strong>O COLOSSO DA FORNALHA</strong></div><div className="boss-health"><span style={{ width: `${world ? Math.max(0, (world.boss.hp / world.boss.maxHp) * 100) : 0}%` }} /></div><small>{world?.boss.attack === "slam" ? "PANCADA NO CHÃO" : world?.boss.attack === "charge" ? "INVESTIDA HORIZONTAL" : "CHUVA DE FRAGMENTOS"}</small></div>
            {showControls && <Controls onClose={() => setShowControls(false)} />}
          </>}
          {screen === "modules" && world && <OverlayCard eyebrow="SINTONIA DO NÚCLEO" title="Módulos de Caco" onClose={() => changeScreen("playing")}><p className="panel-copy">Escolha efeitos que combinam com seu estilo. {world.equippedModules.length}/{world.moduleSlots} slots ocupados.</p><div className="core-module-grid">{coreModuleInfo.filter((module) => world.unlockedModules.includes(module.id)).map((module) => { const equipped = world.equippedModules.includes(module.id); return <button key={module.id} className={`core-module-card ${equipped ? "equipped" : ""}`} onClick={() => handleAction("module", module.id)} aria-pressed={equipped}><span className="module-status">{equipped ? "SINTONIZADO" : "DISPONÍVEL"}</span><strong>{module.name}</strong><small>{module.detail}</small></button>})}</div>{world.unlockedModules.length === 0 && <p className="module-empty">O Núcleo ainda não reconhece módulos. Novas sintonias serão encontradas ao explorar o Abismo.</p>}<p className="panel-shortcut">ESC para voltar à exploração</p></OverlayCard>}
        </section>

        <footer className="game-footer"><div className="footer-right"><span>ABISMO <i>·</i> SETOR {world ? String(AREAS.indexOf(getArea(world.player.x)) + 1).padStart(2, "0") : "01"}</span><span className="save-status"><span /> {world?.savePulse ? "SALVANDO" : "AUTOSAVE"}</span></div></footer>
      </div>
      {screen === "playing" && <div className="mobile-controls" aria-label="Controles de toque"><div className="mobile-move"><button onPointerDown={pressControl("a")} onPointerUp={releaseControl("a")} onPointerCancel={releaseControl("a")} aria-label="Mover para esquerda"><ArrowLeft /></button><button onPointerDown={pressControl("d")} onPointerUp={releaseControl("d")} onPointerCancel={releaseControl("d")} aria-label="Mover para direita"><ArrowRight /></button></div><div className="mobile-actions"><button onPointerDown={pressControl("j")} onPointerUp={releaseControl("j")} onPointerCancel={releaseControl("j")} aria-label="Atacar">J</button><button onPointerDown={pressControl("space")} onPointerUp={releaseControl("space")} onPointerCancel={releaseControl("space")} aria-label="Pular"><ArrowUp /></button><button onPointerDown={pressControl("shift")} onPointerUp={releaseControl("shift")} onPointerCancel={releaseControl("shift")} aria-label="Dash">D</button><button onClick={toggleMobileMap} aria-label="Abrir mapa"><Map size={17} /></button></div><div className="mobile-aim" aria-label="Direção do golpe"><button onPointerDown={pressControl("arrowup")} onPointerUp={releaseControl("arrowup")} onPointerCancel={releaseControl("arrowup")} aria-label="Mirar para cima"><ArrowUp size={15} /></button><button onPointerDown={pressControl("arrowdown")} onPointerUp={releaseControl("arrowdown")} onPointerCancel={releaseControl("arrowdown")} aria-label="Mirar para baixo"><ArrowDown size={15} /></button></div></div>}
      <div className="page-caption"><span>UMA HISTÓRIA SOBRE O QUE RESTA</span><span>EXPLORE NO SEU RITMO</span></div>
    </main>
  )
}

function OverlayCard({ eyebrow, title, onClose, children }: { eyebrow: string; title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="screen-overlay panel-overlay"><section className="metal-panel"><div className="panel-screws"><i /><i /><i /><i /></div><div className="panel-header"><div><span className="panel-eyebrow">{eyebrow}</span><h2>{title}</h2></div><button className="icon-button close-panel" onClick={onClose} aria-label="Fechar painel"><X size={18} /></button></div><div className="panel-body">{children}</div></section></div>
}

function Controls({ onClose }: { onClose: () => void }) {
  return <div className="controls-card"><div className="controls-head"><span>MANUAL DO OPERADOR</span><button onClick={onClose} aria-label="Fechar controles"><X size={15} /></button></div><div className="controls-grid">{[["A / D", "MOVER"], ["ESPAÇO", "PULAR"], ["SHIFT", "DASH"], ["J / CLIQUE", "ATACAR"], ["W / A / S / D", "DIREÇÃO DO GOLPE"], ["K", "PULSO"], ["E", "INTERAGIR"], ["I", "INVENTÁRIO"], ["M", "MAPA"], ["ESC", "PAUSAR"]].map(([key, value]) => <span key={key}><kbd>{key}</kbd><small>{value}</small></span>)}</div><p>Segure uma direção e ataque para escolher o golpe. No ar, ataque para baixo para rebater em inimigos. Acertos recuperam Núcleo; K libera o Pulso após a Fornalha.</p></div>
}

function IntroCinematic({ soundEnabled, onComplete }: { soundEnabled: boolean; onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const completeRef = useRef(onComplete)
  completeRef.current = onComplete

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    let frame = 0
    let audio: AudioContext | null = null
    const oscillators: OscillatorNode[] = []
    const startedAt = performance.now()
    const player = createGameState().player
    player.sitting = true
    player.grounded = true

    if (soundEnabled) {
      try {
        const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (AudioContextClass) {
          audio = new AudioContextClass()
          const bed = audio.createOscillator()
          const filter = audio.createBiquadFilter()
          const gain = audio.createGain()
          bed.type = "sine"; bed.frequency.value = 47; filter.type = "lowpass"; filter.frequency.value = 190
          gain.gain.setValueAtTime(.0001, audio.currentTime); gain.gain.linearRampToValueAtTime(.014, audio.currentTime + 2.4)
          bed.connect(filter); filter.connect(gain); gain.connect(audio.destination); bed.start(); oscillators.push(bed)
          const clink = (frequency: number, delay: number, duration: number, volume: number) => {
            const tone = audio!.createOscillator(); const envelope = audio!.createGain(); const time = audio!.currentTime + delay
            tone.type = "triangle"; tone.frequency.setValueAtTime(frequency, time); tone.frequency.exponentialRampToValueAtTime(Math.max(40, frequency * .48), time + duration)
            envelope.gain.setValueAtTime(.0001, time); envelope.gain.linearRampToValueAtTime(volume, time + .012); envelope.gain.exponentialRampToValueAtTime(.0001, time + duration)
            tone.connect(envelope); envelope.connect(audio!.destination); tone.start(time); tone.stop(time + duration + .03); oscillators.push(tone)
          }
          clink(920, 1.7, .5, .035); clink(180, 2.05, .85, .075); clink(64, 8.2, .7, .05); clink(58, 9.7, .8, .055); clink(65, 11.2, .9, .06)
        }
      } catch { /* a ambientação sonora é opcional */ }
    }

    const draw = (now: number) => {
      const t = (now - startedAt) / 1000
      const scaleX = canvas.clientWidth / VIEW_WIDTH
      const scaleY = canvas.clientHeight / VIEW_HEIGHT
      ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0)
      ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT)
      ctx.fillStyle = "#080b0b"; ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT)
      const reveal = Math.max(0, Math.min(1, (t - 1.65) / 2.6))
      if (reveal > 0) {
        const descent = Math.max(0, Math.min(1, (t - 4.2) / 5.2))
        const cameraY = descent * 114
        const sky = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT)
        sky.addColorStop(0, "#111719"); sky.addColorStop(.68, "#242623"); sky.addColorStop(1, "#101210")
        ctx.globalAlpha = reveal; ctx.fillStyle = sky; ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT)
        ctx.save(); ctx.translate(0, -cameraY)
        for (let i = 0; i < 19; i++) {
          const x = i * 68 - 75
          const h = 110 + (i * 71 % 205)
          ctx.fillStyle = i % 3 === 0 ? "#242622" : "#1c201f"
          ctx.fillRect(x, 408 - h, 62 + i % 4 * 19, h + 160)
          ctx.fillStyle = i % 2 ? "#514638" : "#393a34"
          ctx.fillRect(x + 12, 400 - h, 5, h + 70)
          if (i % 4 === 0) { ctx.fillStyle = "#7b573a"; ctx.fillRect(x + 29, 374 - h, 19, 8) }
        }
        ctx.fillStyle = "#191b19"; ctx.fillRect(0, 418, VIEW_WIDTH, 130)
        for (let i = 0; i < 13; i++) {
          const x = i * 85 - 38
          const y = 372 + i % 4 * 13
          ctx.fillStyle = i % 2 ? "#35342e" : "#454035"
          ctx.beginPath(); ctx.moveTo(x - 38, 454); ctx.lineTo(x - 17, y); ctx.lineTo(x + 5, y - 26); ctx.lineTo(x + 31, y + 5); ctx.lineTo(x + 57, 454); ctx.closePath(); ctx.fill()
          ctx.fillStyle = "#77705d"; ctx.fillRect(x - 12, y + 1, 26, 3)
        }
        ctx.strokeStyle = "#403b32"; ctx.lineWidth = 5
        for (let i = 0; i < 5; i++) { const x = i * 225 + 40 - (descent * 180); ctx.beginPath(); ctx.moveTo(x, 205); ctx.quadraticCurveTo(x + 75, 265, x + 40, 388); ctx.stroke() }
        const pieceY = Math.min(405, -35 + Math.max(0, t - 1.7) * 210)
        if (t > 1.7 && t < 3.8) { ctx.save(); ctx.translate(492 + Math.sin(t * 7) * 5, pieceY); ctx.rotate(t * 4); ctx.fillStyle = "#929181"; ctx.fillRect(-7, -6, 14, 12); ctx.fillStyle = "#c19a60"; ctx.fillRect(-4, -3, 7, 3); ctx.restore() }
        if (t > 8.2) {
          const bodyAlpha = Math.min(1, (t - 8.2) * 1.15)
          ctx.save(); ctx.globalAlpha = bodyAlpha
          const light = ctx.createRadialGradient(480, 406 - cameraY, 2, 480, 406 - cameraY, 105)
          light.addColorStop(0, `rgba(221,170,91,${Math.min(.44, (t - 8.6) * .2)})`); light.addColorStop(1, "rgba(221,170,91,0)")
          ctx.fillStyle = light; ctx.fillRect(350, 285 - cameraY, 260, 230)
          player.sitting = t < 10.5; player.vx = t > 10.5 ? 36 : 0
          drawCaco(ctx, 480, 433 - cameraY + (t > 10.5 ? Math.max(0, 26 - (t - 10.5) * 48) : 12), player, t, false, 0)
          ctx.restore()
          if (t < 12.6) { ctx.fillStyle = "#38372f"; ctx.fillRect(426, 393 - cameraY, 51, 30); ctx.fillRect(474, 409 - cameraY, 62, 20) }
        }
        for (let i = 0; i < 42; i++) {
          const x = (i * 127 + Math.sin(t * .25 + i) * 24) % VIEW_WIDTH
          const y = (i * 73 + t * (5 + i % 4)) % VIEW_HEIGHT
          ctx.fillStyle = i % 8 === 0 ? "rgba(210,151,87,.55)" : "rgba(193,190,165,.24)"
          ctx.beginPath(); ctx.arc(x, y, i % 8 === 0 ? 1.7 : 1, 0, Math.PI * 2); ctx.fill()
        }
        ctx.restore(); ctx.globalAlpha = 1
      }
      if (t > 11.9 && t < 13.35) {
        const alpha = Math.min(1, (t - 11.9) * 1.4)
        ctx.globalAlpha = alpha; ctx.fillStyle = "#eee5cf"; ctx.font = "italic 23px Georgia"; ctx.textAlign = "center"
        ctx.fillText("EU NÃO LEMBRO.", VIEW_WIDTH / 2, 276)
        ctx.font = "10px monospace"; ctx.fillStyle = "#b8aa8c"; ctx.fillText("MAS EU OUVI.", VIEW_WIDTH / 2, 307)
        ctx.globalAlpha = 1
      }
      if (t > 13.15) {
        const alpha = Math.min(1, (t - 13.15) * 1.2)
        ctx.fillStyle = `rgba(4,7,7,${.38 * alpha})`; ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT)
        ctx.globalAlpha = alpha; ctx.textAlign = "center"
        ctx.fillStyle = "#e4d9c2"; ctx.font = "500 52px Georgia"; ctx.fillText("SCRAPBOUND", VIEW_WIDTH / 2, 247)
        ctx.fillStyle = "#c08a5f"; ctx.font = "10px monospace"; ctx.letterSpacing = "4px"; ctx.fillText("A REVOLUÇÃO DAS SUCATAS", VIEW_WIDTH / 2, 277)
        ctx.fillStyle = "#d1c3a7"; ctx.font = "9px monospace"; ctx.letterSpacing = "3px"; ctx.fillText("ABISMO DE FERRO", VIEW_WIDTH / 2, 341)
        ctx.globalAlpha = 1; ctx.letterSpacing = "0px"
      }
      if (t >= 16.3) { completeRef.current(); return }
      frame = window.requestAnimationFrame(draw)
    }
    frame = window.requestAnimationFrame(draw)
    return () => { window.cancelAnimationFrame(frame); for (const oscillator of oscillators) { try { oscillator.stop() } catch { /* oscilador já encerrado */ } }; void audio?.close() }
  }, [soundEnabled])

  return <div className="cinematic-overlay"><canvas ref={canvasRef} width={VIEW_WIDTH} height={VIEW_HEIGHT} aria-label="Abertura animada: Caco desperta sob a sucata no Abismo de Ferro." /><button className="cinematic-skip" onClick={onComplete}>PULAR ABERTURA <kbd>ENTER</kbd></button><span className="cinematic-caption">UM SINAL SOB A SUCATA</span></div>
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
