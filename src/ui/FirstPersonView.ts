/**
 * Optionale Ich-Perspektive am eigenen Standort — klar begrenzte lokale Ausbaustufe.
 *
 * WAS DAS IST: Ein separater Three.js-Renderer, der ausschließlich die unmittelbare
 * Umgebung der eigenen Behausung am {@link DWELLING_ANCHOR} darstellt —
 * Innenraum, Türöffnung und Hof. Augenhöhe und Gebäudegrößen in Metern,
 * konsistent zur Kartenmaßstabskette (MapScale.ts).
 *
 * WAS DAS NICHT IST: Keine begehbare Welt, kein Innenraum-Asset-Pipeline,
 * keine zweite Simulation. Die Ausstattung ist bewusst abstrakt (farbige
 * Flächen für Tisch, Bank, Bett) und im HUD als gestalterische Annäherung
 * gekennzeichnet ({@link FIRST_PERSON_NOTE}).
 *
 * Eingaben: Umschauen per Maizug (ohne Pointer Lock) oder optionaler
 * Zeigersperre, Bewegung mit WASD, Rückkehr mit Escape oder Button. Solange
 * die Sicht aktiv ist, fängt ein Capture-Listener Escape ab, damit der
 * globale Handler das Spiel nicht pausiert.
 */

import {
  DWELLING_FURNITURE,
  DWELLING_DOOR,
  DWELLING_WALLS,
  DWELLING_HALF_DEPTH,
  DWELLING_HALF_WIDTH,
  DWELLING_WALL_HEIGHT,
  DWELLING_WALL_THICKNESS,
  EYE_HEIGHT,
  FIELD_OF_VIEW_DEGREES,
  FIRST_PERSON_NOTE,
  startingState,
  step,
  TURN_SPEED,
  YARD_EXTENT,
  type FirstPersonState,
} from './FirstPersonLogic';
import {
  BoxGeometry, Color, DirectionalLight, HemisphereLight, Mesh, MeshStandardMaterial,
  PerspectiveCamera, Scene, WebGLRenderer,
} from 'three';

/** UI-Texte der Ich-Perspektive. */
export const FIRST_PERSON_HUD = {
  title: 'Ich-Perspektive',
  note: FIRST_PERSON_NOTE,
  hint: 'Umschauen: Maus ziehen oder Zeigersperre · Gehen: W A S D · Zurück: Esc oder Button',
  button: 'Zurück zur Karte',
} as const;

interface Box {
  x: number; y: number; z: number;
  w: number; h: number; d: number;
  r: number; g: number; b: number;
}

function pushBox(out: Mesh<BoxGeometry, MeshStandardMaterial>[], box: Box): void {
  const { x, y, z, w, h, d, r, g, b } = box;
  const mesh = new Mesh(new BoxGeometry(w, h, d),
    new MeshStandardMaterial({ color: new Color(r, g, b), roughness: 0.85 }));
  // Logical +Z is north; Three's right-handed scene uses -Z for geographic north.
  mesh.position.set(x, y + h / 2, -z);
  out.push(mesh);
}

/**
 * Ich-Perspektive: Lebenszyklus, Eingaben und WebGL-Darstellung.
 *
 * Die Klasse besitzt kein eigenes Update der Spielsimulation; sie rendert nur
 * die lokale Szene und hält Kamera-/Eingabezustand.
 */
export class FirstPersonView {
  private canvas?: HTMLCanvasElement;
  private overlay?: HTMLDivElement;
  private host?: HTMLElement;
  private renderer?: WebGLRenderer;
  private scene?: Scene;
  private camera = new PerspectiveCamera(FIELD_OF_VIEW_DEGREES, 1, 0.05, 120);
  private pitch = -25;
  private observer?: ResizeObserver;
  private raf = 0;
  private disposed = false;

  private state: FirstPersonState = startingState();
  private lastTime = 0;
  private pressed = new Set<string>();
  private dragging = false;
  private pointerLocked = false;
  private pointerLockRequested = false;
  private motionEnabled = true;

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!this.active || document.querySelector('dialog:modal')) return;
    // Escape beendet die Sicht (und ggf. die Zeigersperre) — vor dem globalen
    // Handler, damit das Spiel nicht pausiert.
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.requestExit();
      return;
    }
    // WASD gilt auch ohne Zeigersperre (Mauszug-Umschauen bleibt aktiv); nur
    // wenn die Sicht den Eingabefokus hat und kein Formularelement zielt.
    const target = event.target;
    const onFormElement = target instanceof HTMLElement
      && (target.matches('input, select, textarea, button') || target.isContentEditable);
    if (!onFormElement && target instanceof Node && this.overlay?.contains(target)
      && ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
      event.preventDefault();
      event.stopPropagation();
      this.pressed.add(event.code);
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.pressed.delete(event.code);
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 || this.pointerLocked) return;
    this.dragging = true;
    this.canvas?.focus();
    try { this.canvas?.setPointerCapture(event.pointerId); } catch { /* Capture nicht verfügbar */ }
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    this.dragging = false;
    try { this.canvas?.releasePointerCapture(event.pointerId); } catch { /* bereits freigegeben */ }
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.pointerLocked && !this.dragging) return;
    this.rotate(event.movementX * 0.22);
    const damping = this.motionEnabled ? 1 : 0.25;
    this.pitch = Math.max(-80, Math.min(80, this.pitch - event.movementY * 0.22 * damping));
  };

  private readonly onCanvasClick = (): void => {
    if (this.pointerLockRequested && !this.pointerLocked) this.tryRequestPointerLock();
  };

  private readonly onPointerLockChange = (): void => {
    this.pointerLocked = document.pointerLockElement === this.canvas;
    const lockBtn = this.overlay?.querySelector('.fp-lock-btn');
    if (lockBtn) lockBtn.setAttribute('aria-pressed', this.pointerLocked ? 'true' : 'false');
    if (!this.pointerLocked) this.pressed.clear();
  };

  private readonly onCanvasBlur = (): void => {
    this.dragging = false;
    this.pressed.clear();
  };

  private readonly onResize = (): void => {
    this.resizeCanvas();
  };

  private exitListeners: { exit?: () => void } = {};

  /**
   * Baut Overlay, Canvas und GL-Kontext im Wirtscontainer auf.
   *
   * @param host Element, in dem das Overlay liegt (der Kartenbereich).
   * @param options Rückruf für „Zurück zur Karte“, Bewegungseinstellung.
   * @throws Error, wenn WebGL nicht verfügbar ist.
   */
  public initialize(host: HTMLElement, options: { onExit: () => void; motionEnabled?: boolean }): void {
    if (this.disposed) throw new Error('FirstPersonView wurde bereits verworfen.');
    if (this.overlay) return;

    this.exitListeners.exit = options.onExit;
    this.motionEnabled = options.motionEnabled ?? true;
    this.host = host;

    const overlay = document.createElement('div');
    overlay.className = 'fp-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'false');
    overlay.setAttribute('aria-label', 'Ich-Perspektive am eigenen Standort');
    overlay.tabIndex = -1;
    overlay.innerHTML = `
      <canvas class="fp-canvas" aria-label="Egozentrische Ansicht der Behausung"></canvas>
      <div class="fp-hud">
        <div class="fp-hud-main">
          <strong>${FIRST_PERSON_HUD.title}</strong>
          <span class="fp-note">${FIRST_PERSON_HUD.note}</span>
        </div>
        <div class="fp-hud-actions">
          <button type="button" class="fp-lock-btn" aria-pressed="false">Zeigersperre</button>
          <button type="button" class="fp-exit-btn">${FIRST_PERSON_HUD.button}</button>
        </div>
      </div>
      <p class="fp-hint">${FIRST_PERSON_HUD.hint}</p>
    `;
    host.appendChild(overlay);
    this.overlay = overlay;

    this.canvas = overlay.querySelector<HTMLCanvasElement>('.fp-canvas') ?? undefined;
    try {
      if (!this.canvas) throw new Error('Canvas der Ich-Perspektive fehlt.');
      this.canvas.tabIndex = 0;
      this.renderer = new WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
      this.canvas.dataset.renderer = 'three';
      this.buildScene();
    } catch (error) {
      this.renderer?.dispose();
      this.renderer = undefined;
      overlay.remove();
      this.overlay = undefined;
      throw error;
    }

    overlay.querySelector('.fp-exit-btn')?.addEventListener('click', () => this.requestExit());
    overlay.querySelector('.fp-lock-btn')?.addEventListener('click', () => {
      this.pointerLockRequested = true;
      this.tryRequestPointerLock();
    });

    document.addEventListener('keydown', this.onKeyDown, true);
    document.addEventListener('keyup', this.onKeyUp, true);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    window.addEventListener('resize', this.onResize);
    this.observer = new ResizeObserver(this.onResize);
    this.observer.observe(host);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('click', this.onCanvasClick);
    this.canvas.addEventListener('blur', this.onCanvasBlur);

    this.resizeCanvas();
    overlay.hidden = true;
  }

  /** Zeigt die Sicht an und hält die Karte an (nur Darstellung, keine Simulation). */
  public enter(): void {
    if (!this.overlay || this.disposed) return;
    if (this.host) this.host.hidden = false;
    this.overlay.hidden = false;
    this.resizeCanvas();
    this.overlay.focus({ preventScroll: true });
    // Der 👁-Zustand wird zugänglich gespiegelt: aria-expanded zeigt, dass ein
    // Dialog geöffnet ist; aria-pressed spiegelt den Aktiv-Zustand des Buttons.
    this.host?.parentElement?.querySelector<HTMLButtonElement>('[data-fp-control]')
      ?.setAttribute('aria-expanded', 'true');
    this.host?.parentElement?.querySelector<HTMLButtonElement>('[data-fp-control]')
      ?.setAttribute('aria-pressed', 'true');
    this.lastTime = performance.now();
    if (!this.raf) this.startLoop();
  }

  /** Verlässt die Sicht; Kartenkamera bleibt unangetastet. */
  public exit(): void {
    if (!this.overlay) return;
    this.overlay.hidden = true;
    if (this.host) this.host.hidden = true;
    this.stopLoop();
    if (this.pointerLocked && document.pointerLockElement) {
      try { document.exitPointerLock(); } catch { /* Sperre bereits aufgehoben */ }
    }
    this.pointerLocked = false;
    this.pointerLockRequested = false;
    this.dragging = false;
    this.pressed.clear();
    this.state = startingState();
    this.pitch = -25;
    const lockBtn = this.overlay.querySelector('.fp-lock-btn');
    if (lockBtn) lockBtn.setAttribute('aria-pressed', 'false');
    this.host?.parentElement?.querySelector<HTMLButtonElement>('[data-fp-control]')
      ?.setAttribute('aria-expanded', 'false');
    this.host?.parentElement?.querySelector<HTMLButtonElement>('[data-fp-control]')
      ?.setAttribute('aria-pressed', 'false');
  }

  /**
   * Beendet die Sicht aus sich heraus (HUD-Button, Escape) und benachrichtigt
   * danach den Host — so ist der Exit unabhängig davon, ob der Host-Callback
   * seinerseits exit() aufruft.
   */
  private requestExit(): void {
    if (!this.active) return;
    const notify = this.exitListeners.exit;
    this.exit();
    notify?.();
  }

  /** true, solange die Sicht geöffnet ist. */
  public get active(): boolean {
    return !!this.overlay && !this.overlay.hidden;
  }

  /** Passt die Bewegung an („Bewegung reduzieren“). */
  public setMotion(enabled: boolean): void {
    this.motionEnabled = enabled;
  }

  /**
   * Dreht die Kamera (auch von außen ansteuerbar für Tastensteuerung).
   * Wird bei „Bewegung reduzieren“ gedämpft.
   */
  public rotate(deltaDegrees: number): void {
    if (!this.motionEnabled) deltaDegrees *= 0.25;
    this.state.yaw += deltaDegrees;
  }

  /**
   * Legt fest, ob der nächste Klick die Zeigersperre anfordert.
   * (Nur auf expliziten Knopfdruck, nie ungefragt.)
   */
  public requestPointerLock(): void {
    this.pointerLockRequested = true;
    this.tryRequestPointerLock();
  }

  /**
   * Fordert die Zeigersperre an; fehlgeschlagene Anfragen (verweigerte
   * Berechtigung, nicht unterstützter Modus) werden verworfen statt als
   * unbehandelte Promise-Ablehnung in der Konsole zu landen.
   */
  private tryRequestPointerLock(): void {
    try {
      const result = this.canvas?.requestPointerLock?.();
      if (result && typeof (result as Promise<void>).catch === 'function') {
        void (result as Promise<void>).catch(() => { /* Anfrage verweigert */ });
      }
    } catch { /* Anfrage sofort abgelehnt */ }
  }

  /** Entfernt DOM, Listener und GL-Ressourcen vollständig. */
  public dispose(): void {
    this.disposed = true;
    this.exit();
    document.removeEventListener('keydown', this.onKeyDown, true);
    document.removeEventListener('keyup', this.onKeyUp, true);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    window.removeEventListener('resize', this.onResize);
    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this.onPointerDown);
      this.canvas.removeEventListener('pointerup', this.onPointerUp);
      this.canvas.removeEventListener('pointermove', this.onPointerMove);
      this.canvas.removeEventListener('click', this.onCanvasClick);
      this.canvas.removeEventListener('blur', this.onCanvasBlur);
    }
    this.observer?.disconnect();
    this.scene?.traverse((object): void => {
      if (object instanceof Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) material.dispose();
      }
    });
    this.scene = undefined;
    this.renderer?.dispose();
    this.renderer = undefined;
    this.canvas = undefined;
    this.overlay?.remove();
    this.overlay = undefined;
  }

  private buildScene(): void {
    const scene = new Scene();
    scene.background = new Color(0x8ca9c2);
    scene.add(new HemisphereLight(0xe8f2ff, 0x70543a, 2));
    const sun = new DirectionalLight(0xffe6bb, 2);
    sun.position.set(4, 10, 6);
    scene.add(sun);
    const verts: Mesh<BoxGeometry, MeshStandardMaterial>[] = [];
    // Hof: Bodenplatte
    pushBox(verts, { x: 0, y: 0, z: 0, w: 2 * YARD_EXTENT, h: 0.02,
      d: 2 * YARD_EXTENT, r: 0.22, g: 0.30, b: 0.20 });
    // Behausung: Boden
    pushBox(verts, {
      x: 0, y: 0.02, z: 0,
      w: 2 * DWELLING_HALF_WIDTH, h: 0.02, d: 2 * DWELLING_HALF_DEPTH,
      r: 0.34, g: 0.25, b: 0.16,
    });
    for (const wall of DWELLING_WALLS) {
      pushBox(verts, { x: wall.x, y: 0, z: wall.z, w: wall.width,
        h: DWELLING_WALL_HEIGHT, d: wall.depth, r: 0.42, g: 0.31, b: 0.20 });
    }
    // Sturz über der Türöffnung
    pushBox(verts, {
      x: (DWELLING_DOOR.x0 + DWELLING_DOOR.x1) / 2, y: DWELLING_WALL_HEIGHT - 0.5,
      z: DWELLING_HALF_DEPTH - DWELLING_WALL_THICKNESS / 2,
      w: DWELLING_DOOR.x1 - DWELLING_DOOR.x0, h: 0.5, d: DWELLING_WALL_THICKNESS,
      r: 0.42, g: 0.31, b: 0.20,
    });
    // Dach (flaches Spielmodell)
    pushBox(verts, { x: 0, y: DWELLING_WALL_HEIGHT, z: 0, w: 2 * DWELLING_HALF_WIDTH,
      h: 0.15, d: 2 * DWELLING_HALF_DEPTH, r: 0.30, g: 0.18, b: 0.11 });
    // Ausstattung (gestalterische Annäherung): dieselbe metrische Geometrie wie auf der Karte.
    const { table, bench, bed, hearth } = DWELLING_FURNITURE;
    pushBox(verts, {
      x: table.x, y: 0.04, z: table.z, w: table.width, h: table.height, d: table.depth,
      r: 0.35, g: 0.22, b: 0.12,
    });
    pushBox(verts, {
      x: bench.x, y: 0.04, z: bench.z, w: bench.width, h: bench.height, d: bench.depth,
      r: 0.32, g: 0.21, b: 0.12,
    });
    pushBox(verts, {
      x: bed.x, y: 0.04, z: bed.z, w: bed.width, h: bed.height, d: bed.depth,
      r: 0.38, g: 0.33, b: 0.26,
    });
    pushBox(verts, {
      x: hearth.x, y: 0.04, z: hearth.z, w: hearth.width, h: hearth.height, d: hearth.depth,
      r: 0.25, g: 0.22, b: 0.20,
    });
    // Tisch oben (Arbeitsfläche)
    pushBox(verts, {
      x: table.x, y: 0.04 + table.height, z: table.z,
      w: table.width, h: 0.06, d: table.depth,
      r: 0.45, g: 0.30, b: 0.17,
    });

    scene.add(...verts);
    this.scene = scene;
  }

  private resizeCanvas(): void {
    if (!this.renderer || !this.overlay) return;
    const rect = this.overlay.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, rect.width), h = Math.max(1, rect.height);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    // FIELD_OF_VIEW_DEGREES describes the horizontal field of view.
    this.camera.aspect = w / h;
    this.camera.fov = 2 * Math.atan(Math.tan(FIELD_OF_VIEW_DEGREES * Math.PI / 360)
      / this.camera.aspect) * 180 / Math.PI;
    this.camera.updateProjectionMatrix();
  }

  private startLoop(): void {
    const loop = (time: number): void => {
      if (this.disposed || !this.renderer || !this.overlay || this.overlay.hidden) return;
      const dt = Math.min(0.1, Math.max(0, (time - this.lastTime) / 1000));
      this.lastTime = time;
      this.update(dt);
      this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private stopLoop(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private update(dt: number): void {
    let look = 0;
    if (this.pressed.has('ArrowLeft')) look -= TURN_SPEED * dt;
    if (this.pressed.has('ArrowRight')) look += TURN_SPEED * dt;
    if (look !== 0) this.rotate(look);

    const f = (this.pressed.has('KeyW') ? 1 : 0) - (this.pressed.has('KeyS') ? 1 : 0);
    const s = (this.pressed.has('KeyD') ? 1 : 0) - (this.pressed.has('KeyA') ? 1 : 0);
    if (f === 0 && s === 0) return;

    // Bewegung läuft durch die testbare Logik (Kollisionen inklusive);
    // „Bewegung reduzieren“ dämpft auf einen Bruchteil.
    const speedScale = this.motionEnabled ? 1 : 0.3;
    this.state = step(this.state, 0, { forward: f * speedScale, strafe: s * speedScale }, dt);
  }

  private render(): void {
    if (!this.renderer || !this.scene) return;
    const yaw = this.state.yaw * Math.PI / 180, pitch = this.pitch * Math.PI / 180;
    this.camera.position.set(this.state.x, EYE_HEIGHT, -this.state.z);
    this.camera.lookAt(this.state.x + Math.sin(yaw) * Math.cos(pitch),
      EYE_HEIGHT + Math.sin(pitch), -this.state.z - Math.cos(yaw) * Math.cos(pitch));
    this.renderer.render(this.scene, this.camera);
    if (this.canvas) {
      this.canvas.dataset.position = JSON.stringify(this.state);
      this.canvas.dataset.pitch = String(this.pitch);
    }
  }
}
