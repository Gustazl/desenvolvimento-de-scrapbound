'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Activity, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronRight, CirclePause, Compass, Cpu, Heart, Map, Package, Play, RotateCcw, Sparkles, Volume2, VolumeX, Zap } from 'lucide-react'
import { AREAS, VIEW_HEIGHT, VIEW_WIDTH, buyUpgrade, createGameState, drawGame, getArea, interact, loadSavedState, persistState, resetSave, tickGame, upgradeInfo, type GameState } from './game-engine'

type Screen = 'title' | 'playing' | 'pause' | 'inventory' | 'map'

const itemNames: Record<string, string> = { blade: 'Lâmina reforçada', shell: 'Carcaça resistente', dash: 'Propulsor de dash', core: 'Núcleo de energia', 'Pulso de Sucata': 'Pulso de Sucata' }

export function ScrapboundGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState>(createGameState())
  const keysRef = useRef(new Set<string>())
  const screenRef = useRef<Screen>('title')
  const lastSaveRef = useRef(0)
  const [screen, setScreen] = useState<Screen>('title')
  const [frame, setFrame] = useState(0)
  const [hasSave, setHasSave] = useState(false)
  const [muted, setMuted] = useState(true)
  const [soundReady, setSoundReady] = useState(false)
  const audioRef = useRef<AudioContext | null>(null)

  const switchScreen = useCallback((next: Screen) => { screenRef.current = next; setScreen(next) }, [])

  const startGame = useCallback((continued: boolean) => {
    const saved = continued ? loadSavedState() : undefined
    if (!continued) resetSave()
    stateRef.current = createGameState(saved)
    if (!continued) stateRef.current.dialogue = { name: 'ABISMO DE FERRO · REGISTRO FRAGMENTADO', index: 0, lines: ['O mundo já foi verde. Agora só resta o que foi descartado.', 'Séculos de silêncio. Então, uma máquina despertou — e as sucatas aprenderam a sonhar.', 'Caco abre os olhos no alto do Abismo. Não sabe quem o montou. Só sabe que precisa descer.'] }
    switchScreen('playing')
    setHasSave(Boolean(saved))
    if (typeof window !== 'undefined') window.setTimeout(() => canvasRef.current?.focus(), 30)
  }, [switchScreen])

  const playTone = useCallback((frequency: number, duration = 0.09) => {
    if (muted) return
    try {
      const AudioContextClass = window.AudioContext
      const context = audioRef.current ?? new AudioContextClass()
      audioRef.current = context
      if (context.state === 'suspended') void context.resume()
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'triangle'
      oscillator.frequency.setValueAtTime(frequency, context.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(50, frequency * 0.55), context.currentTime + duration)
      gain.gain.setValueAtTime(0.045, context.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration)
      oscillator.connect(gain); gain.connect(context.destination)
      oscillator.start(); oscillator.stop(context.currentTime + duration)
    } catch { }
  }, [muted])

  const toggleSound = () => { setMuted((value) => !value); setSoundReady(true) }

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    let raf = 0
    let last = performance.now()
    let uiElapsed = 0
    const render = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.04)
      last = now
      const state = stateRef.current
      if (screenRef.current === 'playing' && !state.dialogue) tickGame(state, keysRef.current, dt)
      if (screenRef.current === 'playing' && state.dialogue) {
        const held = keysRef.current
        if (held.has('_interact')) { held.delete('_interact'); interact(state); playTone(380, 0.06) }
      }
      if (state.toastTimer > 0 && state.toast.includes('Marco') && now - lastSaveRef.current > 850) {
        persistState(state); lastSaveRef.current = now; setHasSave(true)
      }
      if (state.savePulse > 0 && now - lastSaveRef.current > 400) { persistState(state); lastSaveRef.current = now; setHasSave(true) }
      drawGame(ctx, state, VIEW_WIDTH, VIEW_HEIGHT)
      uiElapsed += dt
      if (uiElapsed > 0.09) { setFrame((value) => value + 1); uiElapsed = 0 }
      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
  }, [playTone])

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if ([' ', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(key)) event.preventDefault()
      if (event.repeat && ['e', 'i', 'escape', 'm'].includes(key)) return
      if (key === 'escape') { switchScreen(screenRef.current === 'playing' ? 'pause' : 'playing'); return }
      if (key === 'i' && screenRef.current === 'playing') { switchScreen('inventory'); return }
      if (key === 'i' && screenRef.current === 'inventory') { switchScreen('playing'); return }
      if (key === 'm' && screenRef.current === 'playing') { switchScreen('map'); return }
      if (key === 'm' && screenRef.current === 'map') { switchScreen('playing'); return }
      if (key === 'e' && screenRef.current === 'playing') { keysRef.current.add('_interact'); return }
      if (key === 'j') playTone(190, 0.08)
      if (key === ' ' || key === 'arrowup') keysRef.current.add('space')
      else if (key === 'arrowleft') keysRef.current.add('arrowleft')
      else if (key === 'arrowright') keysRef.current.add('arrowright')
      else keysRef.current.add(key)
    }
    const up = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (key === ' ' || key === 'arrowup') keysRef.current.delete('space')
      else keysRef.current.delete(key)
    }
    const clear = () => keysRef.current.clear()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear) }
  }, [playTone, switchScreen])

  useEffect(() => { setHasSave(Boolean(loadSavedState())) }, [])

  const state = stateRef.current
  const area = getArea(state.player.x)
  const closeOverlay = () => switchScreen('playing')
  const advanceDialogue = () => { interact(stateRef.current); playTone(380, 0.06); setFrame((value) => value + 1) }
  const purchase = (id: string) => { buyUpgrade(stateRef.current, id); persistState(stateRef.current); setHasSave(true); playTone(260, 0.12); setFrame((value) => value + 1) }
  const beginTitle = () => startGame(false)

  return (
    <main className="scrapbound-shell" aria-label="Scrapbound: A Revolução das Sucatas">
      <header className="game-topbar">
        <a className="brand-lockup" href="#inicio" onClick={(event) => { event.preventDefault(); switchScreen('title') }} aria-label="Ir ao menu principal">
          <span className="brand-mark"><Cpu size={20} /></span>
          <span><strong>SCRAPBOUND</strong><small>A REVOLUÇÃO DAS SUCATAS</small></span>
        </a>
        <div className="topbar-center"><span className="live-dot" /> CAPÍTULO I <span className="top-divider">/</span> O ABISMO</div>
        <div className="topbar-actions">
          <button className="icon-button sound-button" onClick={toggleSound} aria-label={muted ? 'Ativar sons' : 'Silenciar sons'} title={muted ? 'Ativar sons' : 'Silenciar sons'}>{muted ? <VolumeX size={17} /> : <Volume2 size={17} />}</button>
          <span className="build-label">VERSÃO 0.1</span>
        </div>
      </header>

      <section className="game-layout">
        <aside className="side-rail left-rail" aria-label="Status do personagem">
          <div className="rail-heading">CACO <span>· UNIDADE 07</span></div>
          <div className="status-card">
            <div className="status-label"><Heart size={13} /> INTEGRIDADE <span>{state.player.hp}/{state.player.maxHp}</span></div>
            <div className="health-cells" aria-label={`${state.player.hp} de ${state.player.maxHp} pontos de vida`}>{Array.from({ length: state.player.maxHp }, (_, index) => <span key={index} className={`health-cell ${index < state.player.hp ? 'filled' : ''}`} />)}</div>
            <div className="status-label energy-label"><Zap size={13} /> NÚCLEO <span>{Math.floor(state.player.energy)}/{state.upgrades.includes('core') ? 4 : 3}</span></div>
            <div className="energy-cells">{Array.from({ length: state.upgrades.includes('core') ? 4 : 3 }, (_, index) => <span key={index} className={index < state.player.energy ? 'charged' : ''} />)}</div>
          </div>
          <div className="scrap-count"><span className="bolt-icon">⌁</span><strong>{state.player.screws}</strong><small>PARAFUSOS</small></div>
          <div className="rail-separator" />
          <div className="location-label"><span>LOCALIZAÇÃO</span><strong>{area.name}</strong></div>
          <div className="mini-map" aria-label="Mapa resumido do Abismo"><div className="map-line" />{AREAS.map((zone, index) => <div className={`map-zone ${state.player.x >= zone.start && state.player.x < zone.end ? 'active' : ''}`} key={zone.name} style={{ left: `${index * 20}%` }} title={zone.name}><i /></div>)}<span className="map-you" style={{ left: `${Math.min(95, Math.max(2, state.player.x / 5900 * 100))}%` }} /></div>
          <div className="map-captions"><span>DESCARTE</span><span>FORNALHA</span></div>
          <p className="map-hint">Pressione <kbd>M</kbd> para abrir o mapa</p>
          <div className="rail-bottom"><span className={`save-indicator ${state.savePulse > 0 ? 'saving' : ''}`}><i /> {state.savePulse > 0 ? 'PROGRESSO SALVO' : 'MARCO DE SUCATA'}</span></div>
        </aside>

        <div className="play-column">
          <div className="viewport-frame">
            <div className="viewport-topline"><span><i className="signal-bars"><b /><b /><b /></i> SINAL ESTÁVEL</span><span>ABISMO-01 <span className="top-divider">·</span> {Math.floor(state.player.x).toString().padStart(4, '0')} M</span></div>
            <div className="canvas-wrap">
              <canvas ref={canvasRef} width={VIEW_WIDTH} height={VIEW_HEIGHT} tabIndex={0} aria-label="Mundo jogável de Scrapbound. Use A e D para andar, Espaço para pular, Shift para dash e J para atacar." />
              <div className="area-banner"><span className="area-kicker">SETOR ATUAL</span><strong>{area.name}</strong><span className="area-rule" /></div>
              {state.player.x < 420 && screen === 'playing' && !state.dialogue && <div className="first-objective"><span className="objective-icon"><Compass size={17} /></span><span><small>OBJETIVO</small><strong>Encontre uma saída do monte</strong></span><ChevronRight size={15} /></div>}
              {state.player.x > 4980 && state.boss.alive && screen === 'playing' && <div className="boss-hud"><div className="boss-name"><span>AMEAÇA DE CLASSE INDUSTRIAL</span><strong>COLOSSO DA FORNALHA</strong></div><div className="boss-bar"><i style={{ width: `${Math.max(0, state.boss.hp / state.boss.maxHp * 100)}%` }} /></div></div>}
              {state.toastTimer > 0 && screen === 'playing' && !state.dialogue && <div className="toast-message"><Sparkles size={15} />{state.toast}</div>}

              {screen === 'title' && <div className="screen-overlay title-screen"><div className="title-grain" /><div className="title-copy"><div className="title-kicker"><span /> UMA AVENTURA NO ABISMO DE FERRO</div><h1>SCRAP<span>BOUND</span></h1><div className="title-subtitle">A REVOLUÇÃO DAS SUCATAS</div><p>Quando tudo que foi descartado aprende a sonhar,<br />o que significa estar vivo?</p><div className="title-buttons"><button className="primary-button" onClick={beginTitle}><Play size={15} fill="currentColor" /> INICIAR DESCIDA</button>{hasSave && <button className="secondary-button" onClick={() => startGame(true)}>CONTINUAR <ChevronRight size={15} /></button>}</div><div className="title-footnote"><span>UMA HISTÓRIA DE METAL, MEMÓRIA E RAÍZES</span><span>PRESSIONE PARA COMEÇAR</span></div></div><div className="title-coordinate">45° 08' S <span>·</span> CAMADA 07</div></div>}

              {screen === 'pause' && <OverlayPanel eyebrow="SISTEMA SUSPENSO" title="Pausa" onClose={closeOverlay}><p className="panel-copy">O Abismo espera. Caco também.</p><button className="primary-button panel-main-button" onClick={closeOverlay}><Play size={15} fill="currentColor" /> VOLTAR À EXPLORAÇÃO</button><button className="panel-row-button" onClick={() => switchScreen('inventory')}><Package size={16} /> Inventário e equipamentos <ChevronRight size={15} /></button><button className="panel-row-button" onClick={() => switchScreen('map')}><Map size={16} /> Mapa do Abismo <ChevronRight size={15} /></button><button className="panel-row-button quiet" onClick={() => switchScreen('title')}><CirclePause size={16} /> Sair para o menu principal <ChevronRight size={15} /></button><p className="panel-shortcut">ESC para retomar</p></OverlayPanel>}

              {screen === 'inventory' && <OverlayPanel eyebrow="PERTENCES RECUPERADOS" title="Inventário" onClose={closeOverlay}><div className="inventory-profile"><div className="inventory-emblem"><Cpu size={27} /></div><div><strong>CACO · UNIDADE 07</strong><small>PEÇAS RECUPERADAS <span>{state.upgrades.length}/5</span></small></div></div><div className="inventory-section-title">EQUIPADO / DESCOBERTO</div><div className="equipment-list"><div className="equipment-item"><span className="equipment-icon">⌁</span><span><strong>Lâmina improvisada</strong><small>Feita de metal que ninguém quis.</small></span><i className="item-equipped">EQUIPADO</i></div>{state.upgrades.map((upgrade) => <div className="equipment-item" key={upgrade}><span className="equipment-icon discovered"><Sparkles size={15} /></span><span><strong>{itemNames[upgrade] ?? upgrade}</strong><small>{upgrade === 'Pulso de Sucata' ? 'Habilidade especial · tecla K.' : 'Melhoria instalada na Vila dos Pregos.'}</small></span><i className="item-equipped">ATIVO</i></div>)}{state.upgrades.length === 0 && <div className="empty-equipment">Ainda há espaço para outras peças.<br />Encontre Lata na Vila dos Pregos.</div>}</div><div className="inventory-note"><Zap size={15} /><span><strong>ENERGIA DO NÚCLEO</strong><small>Recuperada ao derrotar inimigos.</small></span><b>{Math.floor(state.player.energy)} / {state.upgrades.includes('core') ? 4 : 3}</b></div><p className="panel-shortcut">I ou ESC para fechar</p></OverlayPanel>}

              {screen === 'map' && <OverlayPanel eyebrow="CARTOGRAFIA INCOMPLETA" title="O Abismo" onClose={closeOverlay}><p className="panel-copy">Cinco setores conhecidos. O resto ainda é escuro.</p><div className="full-map"><div className="full-map-rail" />{AREAS.map((zone, index) => { const explored = state.player.x > zone.start || index === 0; const active = state.player.x >= zone.start && state.player.x < zone.end; return <div className={`full-map-zone ${explored ? 'explored' : 'unknown'} ${active ? 'active' : ''}`} key={zone.name} style={{ left: `${index * 21 + 1}%` }}><span className="full-map-node">{explored ? String(index + 1).padStart(2, '0') : '??'}</span><strong>{explored ? zone.name : 'Setor não mapeado'}</strong><small>{index === 0 ? 'MONTANHA DO DESCARTE' : index === 1 ? 'PASSAGENS SUBTERRÂNEAS' : index === 2 ? 'ASSENTAMENTO' : index === 3 ? 'ZONA DE RISCO' : 'ACESSO RESTRITO'}</small></div>})}<span className="full-map-player" style={{ left: `${Math.min(98, Math.max(1, state.player.x / 5900 * 100))}%` }}>CACO</span></div><div className="map-legend"><span><i className="legend-current" /> VOCÊ ESTÁ AQUI</span><span><i className="legend-mark" /> MARCO DE SUCATA</span></div><p className="map-tip">Caminhos elevados escondem atalhos e descobertas.</p><p className="panel-shortcut">M ou ESC para fechar</p></OverlayPanel>}

              {screen === 'playing' && state.dialogue && <div className="dialogue-shade"><div className="dialogue-card"><div className="dialogue-heading"><span className="dialogue-sigil"><Cpu size={17} /></span><span><small>TRANSMISSÃO PRÓXIMA</small><strong>{state.dialogue.name}</strong></span><i>REGISTRO {String(state.dialogue.index + 1).padStart(2, '0')}</i></div><p className="dialogue-line">{state.dialogue.lines[state.dialogue.index] ?? ''}</p>{state.dialogue.shop && <div className="shop-grid">{upgradeInfo.map((upgrade) => { const bought = state.upgrades.includes(upgrade.id); return <button className={`shop-item ${bought ? 'bought' : ''}`} key={upgrade.id} onClick={() => purchase(upgrade.id)} disabled={bought}><span className="shop-item-name">{upgrade.name}</span><small>{upgrade.detail}</small><span className="shop-cost">{bought ? 'INSTALADA' : <><b>⌁ {upgrade.cost}</b> PARAFUSOS</>}</span></button>})}</div>}<button className="dialogue-continue" onClick={advanceDialogue}><span>{state.dialogue.index < state.dialogue.lines.length - 1 ? 'CONTINUAR' : 'FECHAR'}</span><kbd>E</kbd><ChevronRight size={15} /></button></div></div>}
            </div>
            <div className="viewport-bottomline"><span><i className="bottom-dot" /> EXPLORAÇÃO EM ANDAMENTO</span><span>ABISMO DE FERRO <span className="top-divider">·</span> 07:42:16</span></div>
          </div>
          <div className="controls-strip"><span className="controls-label">CONTROLES</span><div className="control-group"><kbd>A</kbd><kbd>D</kbd><span>MOVER</span></div><div className="control-group"><kbd>ESPAÇO</kbd><span>PULAR</span></div><div className="control-group"><kbd>SHIFT</kbd><span>DASH</span></div><div className="control-group"><kbd>J</kbd><span>ATACAR</span></div><div className="control-group"><kbd>E</kbd><span>INTERAGIR</span></div><div className="control-group"><kbd>I</kbd><span>MOCHILA</span></div><div className="control-end"><kbd>ESC</kbd><span>PAUSAR</span></div></div>
          <div className="under-viewport"><span>UMA MÁQUINA NÃO PRECISA LEMBRAR PARA SENTIR FALTA.</span><span>SCRAPBOUND <i>©</i> 2026</span></div>
        </div>

        <aside className="side-rail right-rail" aria-label="Objetivos e habilidades"><div className="rail-heading">REGISTRO DE CAMPO</div><div className="objective-card"><span className="objective-tag">MISSÃO PRINCIPAL</span><strong>Rastros de uma origem</strong><p>Desça pelo Abismo. Descubra de onde veio a sua primeira lembrança.</p><div className="objective-progress"><span style={{ width: `${Math.min(100, Math.max(4, state.player.x / 5900 * 100))}%` }} /></div><small>ABISMO <b>{Math.floor(state.player.x / 5900 * 100)}%</b></small></div><div className="rail-separator" /><div className="rail-heading ability-heading">HABILIDADES</div><div className={`ability-slot ${state.upgrades.includes('Pulso de Sucata') ? 'unlocked' : ''}`}><span className="ability-symbol"><Zap size={16} /></span><span><strong>Pulso de Sucata</strong><small>{state.upgrades.includes('Pulso de Sucata') ? 'EXPLOSÃO DE ENERGIA' : '???? · NÃO DESCOBERTO'}</small></span><kbd>K</kbd></div><p className="ability-note">{state.upgrades.includes('Pulso de Sucata') ? 'Libere a energia acumulada para afastar ameaças.' : 'Habilidades perdidas aguardam no fundo.'}</p><div className="rail-separator" /><div className="discovery-card"><div className="discovery-top"><span className="leaf-glyph">✳</span><small>ANOMALIA ORGÂNICA</small><span className={state.foundGreen ? 'discovery-status found' : 'discovery-status'}>{state.foundGreen ? 'ENCONTRADA' : '????'}</span></div><strong>{state.foundGreen ? 'Vida sob o metal' : 'Sinal de vida'}</strong><p>{state.foundGreen ? 'Uma flor cresceu onde nada deveria sobreviver.' : 'Leituras orgânicas detectadas nas camadas profundas.'}</p><div className="discovery-meter"><i className={state.foundGreen ? 'discovered' : ''} /></div></div><div className="rail-bottom field-log"><span>DIÁRIO DO CATADOR</span><p>"A ferrugem não cobre tudo."</p></div></aside>
      </section>

      <footer className="game-footer"><span>© 2026 SCRAPBOUND STUDIO <i>·</i> UMA HISTÓRIA FEITA DE SOBRAS</span><span><Activity size={12} /> {soundReady ? (muted ? 'ÁUDIO DESATIVADO' : 'SOM AMBIENTE ATIVO') : 'SOM AMBIENTE'} <i>·</i> PROGRESSO LOCAL</span></footer>
    </main>
  )
}

function OverlayPanel({ eyebrow, title, onClose, children }: { eyebrow: string; title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="screen-overlay panel-screen"><section className="system-panel"><div className="panel-top"><span className="panel-screw" /><span className="panel-eyebrow">{eyebrow}</span><button className="panel-close" onClick={onClose} aria-label="Fechar painel">×</button></div><div className="panel-title-row"><h2>{title}</h2><span className="panel-coordinates">AB-07</span></div>{children}<span className="panel-screw screw-bottom-left" /><span className="panel-screw screw-bottom-right" /></section></div>
}
