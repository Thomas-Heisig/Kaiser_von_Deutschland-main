/**
 * Optionale Ich-Perspektive am eigenen Standort — klar begrenzte lokale Ausbaustufe.
 *
 * WAS DAS IST: Ein minimaler eigener WebGL-Renderer (rohes WebGL, keine
 * zusätzliche Engine-Abhängigkeit), der ausschließlich die unmittelbare
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

import { EYE_HEIGHT, FIELD_OF_VIEW_DEGREES, FIRST_PERSON_NOTE, startingState, step, TURN_SPEED, type FirstPersonState } from './FirstPersonLogic';

/** UI-Texte der Ich-Perspektive. */
export const FIRST_PERSON_HUD = {
  title: 'Ich-Perspektive',
  note: FIRST_PERSON_NOTE,
  hint: 'Umschauen: Maus ziehen oder Zeigersperre · Gehen: W A S D · Zurück: Esc oder Button',
  button: 'Zurück zur Karte',
} as const;

const VERTEX_SHADER = `
attribute vec3 aPosition;
attribute vec3 aColor;
uniform mat4 uProjection;
uniform mat4 uView;
varying vec3 vColor;
void main() {
  vColor = aColor;
  gl_Position = uProjection * uView * vec4(aPosition, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision mediump float;
varying vec3 vColor;
void main() {
  gl_FragColor = vec4(vColor, 1.0);
}
`;

interface Box {
  x: number; y: number; z: number;
  w: number; h: number; d: number;
  r: number; g: number; b: number;
}

function pushBox(out: number[], box: Box): void {
  const { x, y, z, w, h, d, r, g, b } = box;
  const x0 = x - w / 2, x1 = x + w / 2;
  const y0 = y, y1 = y + h;
  const z0 = z - d / 2, z1 = z + d / 2;
  // Zwei Dreiecke pro Fläche; Farbe konstant. Nur sichtbare Flächen genügen
  // für diese Ausbaustufe — Rückseiten-Culling bleibt aktiv.
  const quads: Array<[number[], number[], number[], number[]]> = [
    // Boden (unten, Normale -Y) und Decke (oben, +Y)
    [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]],
    [[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]],
    // Süd (+Z) und Nord (-Z)
    [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]],
    [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]],
    // Ost (+X) und West (-X)
    [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]],
    [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]],
  ];
  for (const q of quads) {
    out.push(...q[0], ...q[1], ...q[2], r, g, b);
    out.push(...q[0], ...q[2], ...q[3], r, g, b);
  }
}

/** Für WebView/DPI robuste Kamera-Matrix (View = inverse Transformation). */
function viewMatrix(x: number, z: number, yawDeg: number, eyeHeight: number): Float32Array {
  const yaw = (yawDeg * Math.PI) / 180;
  const cos = Math.cos(yaw), sin = Math.sin(yaw);
  // Blick nach Norden (+Z) bei yaw = 0; rechts = +X.
  const fx = sin, fz = cos;
  const rx = cos, rz = -sin;
  const eyeY = eyeHeight;
  // Zeilenweise: rechte Achse, hoch, negative Blickrichtung (Rechtssystem).
  return new Float32Array([
    rx, 0, rz, 0,
    0, 1, 0, 0,
    -fx, 0, -fz, 0,
    -(rx * x + rz * z),
    -eyeY,
    (fx * x + fz * z),
    1,
  ]);
}

function perspectiveMatrix(fovDeg: number, aspect: number, near: number, far: number): Float32Array {
  const f = 1 / Math.tan((fovDeg * Math.PI) / 360);
  const nf = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0,
  ]);
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
  private gl?: WebGLRenderingContext;
  private program?: WebGLProgram;
  private buffers?: { position: WebGLBuffer; color: WebGLBuffer; count: number };
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
    if (this.active && !onFormElement && event.code.startsWith('Key')) {
      event.preventDefault();
      this.pressed.add(event.code);
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.pressed.delete(event.code);
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 || this.pointerLocked) return;
    this.dragging = true;
    try { this.canvas?.setPointerCapture(event.pointerId); } catch { /* Capture nicht verfügbar */ }
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    this.dragging = false;
    try { this.canvas?.releasePointerCapture(event.pointerId); } catch { /* bereits freigegeben */ }
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (this.pointerLocked) {
      this.rotate(event.movementX * 0.22);
      return;
    }
    if (this.dragging) this.rotate(event.movementX * 0.22);
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

    this.canvas = overlay.querySelector('.fp-canvas') ?? undefined;
    const gl = this.canvas?.getContext('webgl', { antialias: false, alpha: false });
    if (!gl || !this.canvas) {
      overlay.remove();
      this.overlay = undefined;
      throw new Error('WebGL ist nicht verfügbar — Ich-Perspektive kann nicht gestartet werden.');
    }
    this.gl = gl;
    this.buildScene();

    overlay.querySelector('.fp-exit-btn')?.addEventListener('click', () => this.requestExit());
    overlay.querySelector('.fp-lock-btn')?.addEventListener('click', () => {
      this.pointerLockRequested = true;
      this.tryRequestPointerLock();
    });

    document.addEventListener('keydown', this.onKeyDown, true);
    document.addEventListener('keyup', this.onKeyUp, true);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    window.addEventListener('resize', this.onResize);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('click', this.onCanvasClick);
    this.canvas.addEventListener('blur', this.onCanvasBlur);

    this.resizeCanvas();
    this.startLoop();
  }

  /** Zeigt die Sicht an und hält die Karte an (nur Darstellung, keine Simulation). */
  public enter(): void {
    if (!this.overlay || this.disposed) return;
    if (this.host) this.host.hidden = false;
    this.overlay.hidden = false;
    this.resizeCanvas();
    this.overlay.focus({ preventScroll: true });
    // Der 👁-Zustand wird zugänglich gespiegelt: Der Öffner-Button
    // zeigt an, ob die Ich-Perspektive gerade aktiv ist.
    this.host?.parentElement?.querySelector<HTMLButtonElement>('[data-fp-control]')
      ?.setAttribute('aria-expanded', 'true');
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
    const lockBtn = this.overlay.querySelector('.fp-lock-btn');
    if (lockBtn) lockBtn.setAttribute('aria-pressed', 'false');
    this.host?.parentElement?.querySelector<HTMLButtonElement>('[data-fp-control]')
      ?.setAttribute('aria-expanded', 'false');
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
    if (this.buffers) {
      this.gl?.deleteBuffer(this.buffers.position);
      this.gl?.deleteBuffer(this.buffers.color);
      this.buffers = undefined;
    }
    if (this.program) this.gl?.deleteProgram(this.program);
    this.program = undefined;
    this.gl = undefined;
    this.canvas = undefined;
    this.overlay?.remove();
    this.overlay = undefined;
  }

  private buildScene(): void {
    const gl = this.gl;
    if (!gl) return;
    const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    if (!program) throw new Error('Shader-Kompilierung fehlgeschlagen.');
    this.program = program;

    const verts: number[] = [];
    // Hof: Bodenplatte
    pushBox(verts, { x: 0, y: 0, z: 0, w: 24, h: 0.02, d: 24, r: 0.22, g: 0.30, b: 0.20 });
    // Behausung: Boden
    pushBox(verts, { x: 0, y: 0.02, z: 0, w: 6, h: 0.02, d: 8, r: 0.34, g: 0.25, b: 0.16 });
    // Wände (Nord, Ost, West; Süd offen außer Türpfosten)
    pushBox(verts, { x: 0, y: 0, z: -4.15, w: 6.6, h: 2.6, d: 0.3, r: 0.42, g: 0.31, b: 0.20 });
    pushBox(verts, { x: -3.15, y: 0, z: 0, w: 0.3, h: 2.6, d: 8, r: 0.40, g: 0.29, b: 0.19 });
    pushBox(verts, { x: 3.15, y: 0, z: 0, w: 0.3, h: 2.6, d: 8, r: 0.40, g: 0.29, b: 0.19 });
    // Südwand mit Türspalt (-0.8..0.8): Segmente -3.3..-0.8 und 0.8..3.3
    pushBox(verts, { x: -2.05, y: 0, z: 4.15, w: 2.5, h: 2.6, d: 0.3, r: 0.42, g: 0.31, b: 0.20 });
    pushBox(verts, { x: 2.05, y: 0, z: 4.15, w: 2.5, h: 2.6, d: 0.3, r: 0.42, g: 0.31, b: 0.20 });
    // Sturz über der Tür
    pushBox(verts, { x: 0, y: 2.1, z: 4.15, w: 1.6, h: 0.5, d: 0.3, r: 0.42, g: 0.31, b: 0.20 });
    // Dach (flaches Spielmodell)
    pushBox(verts, { x: 0, y: 2.6, z: 0, w: 7, h: 0.15, d: 9, r: 0.30, g: 0.18, b: 0.11 });
    // Ausstattung (gestalterische Annäherung): Tisch, Bank, Bett, Herd
    pushBox(verts, { x: 0, y: 0.04, z: -2.6, w: 1.8, h: 0.75, d: 0.9, r: 0.35, g: 0.22, b: 0.12 });
    pushBox(verts, { x: 0, y: 0.04, z: -1.7, w: 1.8, h: 0.42, d: 0.35, r: 0.32, g: 0.21, b: 0.12 });
    pushBox(verts, { x: -2.2, y: 0.04, z: 2.4, w: 1.9, h: 0.45, d: 0.9, r: 0.38, g: 0.33, b: 0.26 });
    pushBox(verts, { x: 2.3, y: 0.04, z: -2.8, w: 1.1, h: 0.6, d: 1.1, r: 0.25, g: 0.22, b: 0.20 });
    // Tisch oben (Arbeitsfläche)
    pushBox(verts, { x: 0, y: 0.79, z: -2.6, w: 2.0, h: 0.06, d: 1.1, r: 0.45, g: 0.30, b: 0.17 });

    const position = new Float32Array(verts);
    // Farben sind in verts gemischt (xyz rgb); trennen für zwei Buffer.
    const positions: number[] = [];
    const colors: number[] = [];
    for (let i = 0; i < position.length; i += 6) {
      positions.push(position[i], position[i + 1], position[i + 2]);
      colors.push(position[i + 3], position[i + 4], position[i + 5]);
    }

    const posBuf = gl.createBuffer();
    const colBuf = gl.createBuffer();
    if (!posBuf || !colBuf) throw new Error('GL-Buffer konnten nicht erzeugt werden.');
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, colBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    this.buffers = { position: posBuf, color: colBuf, count: positions.length / 3 };
  }

  private resizeCanvas(): void {
    if (!this.canvas || !this.overlay) return;
    const rect = this.overlay.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  private startLoop(): void {
    const loop = (time: number): void => {
      if (this.disposed || !this.gl || !this.overlay || this.overlay.hidden) return;
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
    const gl = this.gl;
    if (!gl || !this.program || !this.buffers || !this.canvas) return;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0.55, 0.66, 0.76, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    gl.useProgram(this.program);
    const aspect = this.canvas.width / Math.max(1, this.canvas.height);
    const proj = perspectiveMatrix(FIELD_OF_VIEW_DEGREES, aspect, 0.1, 120);
    const view = viewMatrix(this.state.x, this.state.z, this.state.yaw, EYE_HEIGHT);
    const projLoc = gl.getUniformLocation(this.program, 'uProjection');
    const viewLoc = gl.getUniformLocation(this.program, 'uView');
    gl.uniformMatrix4fv(projLoc, false, proj);
    gl.uniformMatrix4fv(viewLoc, false, view);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);
    const aPos = gl.getAttribLocation(this.program, 'aPosition');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.color);
    const aCol = gl.getAttribLocation(this.program, 'aColor');
    gl.enableVertexAttribArray(aCol);
    gl.vertexAttribPointer(aCol, 3, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, this.buffers.count);
  }
}

function createProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string): WebGLProgram | undefined {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vs || !fs) return undefined;
  const program = gl.createProgram();
  if (!program) return undefined;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return undefined;
  }
  return program;
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | undefined {
  const shader = gl.createShader(type);
  if (!shader) return undefined;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return undefined;
  }
  return shader;
}
