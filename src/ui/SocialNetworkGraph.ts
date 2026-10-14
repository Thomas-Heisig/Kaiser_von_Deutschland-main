// src/ui/SocialNetworkGraph.ts

import * as PIXI from 'pixi.js';
import { Citizen, SocialRelation } from '../core/CitizenSystem';

/**
 * Graph-Knoten
 */
interface GraphNode {
  citizen: Citizen;
  x: number;
  y: number;
  vx: number; // Geschwindigkeit X
  vy: number; // Geschwindigkeit Y
  fx?: number; // Fixed X (für Drag)
  fy?: number; // Fixed Y (für Drag)
  connections: number; // Anzahl Verbindungen
}

/**
 * Graph-Kante
 */
interface GraphEdge {
  source: GraphNode;
  target: GraphNode;
  relation: SocialRelation;
}

/**
 * Filter-Optionen
 */
export interface NetworkFilter {
  relationTypes?: string[]; // 'friend', 'enemy', 'rival', etc.
  minStrength?: number; // Minimum Beziehungsstärke
  maxStrength?: number; // Maximum Beziehungsstärke
  maxDepth?: number; // Wie viele Beziehungsebenen anzeigen
  profession?: string; // Nur bestimmten Beruf anzeigen
  socialClass?: string; // Nur bestimmte Klasse anzeigen
}

/**
 * Social Network Graph Visualisierung mit Force-Directed Layout
 */
export class SocialNetworkGraph {
  private app?: PIXI.Application;
  private container: PIXI.Container;
  private nodes: GraphNode[] = [];
  private edges: GraphEdge[] = [];
  private filter: NetworkFilter = {};
  
  // Physics-Konstanten für Force-Directed Layout
  private readonly REPULSION_STRENGTH = 1000;
  private readonly ATTRACTION_STRENGTH = 0.01;
  private readonly DAMPING = 0.9;
  private readonly MIN_DISTANCE = 50;
  private readonly MAX_DISTANCE = 300;
  
  // Visual-Konstanten
  private readonly NODE_RADIUS = 20;
  private readonly COLORS = {
    NODE_DEFAULT: 0x4A90E2,
    NODE_SELECTED: 0xFFD700,
    NODE_BORDER: 0x333333,
    RELATION_FRIEND: 0x00FF00,
    RELATION_ENEMY: 0xFF0000,
    RELATION_RIVAL: 0xFF8800,
    RELATION_MENTOR: 0x8800FF,
    RELATION_COLLEAGUE: 0x0088FF,
    TEXT: 0xFFFFFF,
    BACKGROUND: 0x1A1A1A
  };
  
  private animationFrameId?: number;
  private selectedNode?: GraphNode;
  
  constructor() {
    this.container = new PIXI.Container();
  }
  
  /**
   * Initialisiert die Visualisierung
   */
  public async initialize(parentElement: HTMLElement): Promise<void> {
    this.app = new PIXI.Application();
    await this.app.init({
      width: parentElement.clientWidth,
      height: parentElement.clientHeight,
      backgroundColor: this.COLORS.BACKGROUND,
      antialias: true,
      resolution: window.devicePixelRatio || 1
    });
    
    parentElement.appendChild(this.app.canvas as HTMLCanvasElement);
    this.app.stage.addChild(this.container);
    
    // Interaktivität
    this.container.eventMode = 'static';
    this.container.hitArea = new PIXI.Rectangle(0, 0, this.app.screen.width, this.app.screen.height);
    
    this.enableDragAndPan();
  }
  
  /**
   * Baut Netzwerk-Graph für einen Bürger
   */
  public buildGraph(
    centerCitizen: Citizen,
    getAllCitizens: () => Citizen[],
    filter: NetworkFilter = {}
  ): void {
    this.filter = filter;
    this.nodes = [];
    this.edges = [];
    
    const citizensMap = new Map<string, Citizen>();
    getAllCitizens().forEach(c => citizensMap.set(c.id, c));
    
    // Zentral-Knoten erstellen
    const centerNode = this.createNode(centerCitizen);
    this.nodes.push(centerNode);
    
    // Netzwerk expandieren
    this.expandNetwork(centerCitizen, citizensMap, 0, filter.maxDepth || 2);
    
    // Initiale Positionen (Kreis-Layout)
    this.initializePositions();
    
    // Render starten
    this.render();
    this.startSimulation();
  }
  
  /**
   * Erstellt einen Knoten
   */
  private createNode(citizen: Citizen): GraphNode {
    // Initial positions are randomized but will be adjusted by force-directed layout
    const initialWidth = this.app ? this.app.screen.width : 800;
    const initialHeight = this.app ? this.app.screen.height : 600;
    
    return {
      citizen,
      x: Math.random() * initialWidth,
      y: Math.random() * initialHeight,
      vx: 0,
      vy: 0,
      connections: 0
    };
  }
  
  /**
   * Expandiert Netzwerk rekursiv
   */
  private expandNetwork(
    citizen: Citizen,
    citizensMap: Map<string, Citizen>,
    depth: number,
    maxDepth: number
  ): void {
    if (depth >= maxDepth) return;
    
    const sourceNode = this.nodes.find(n => n.citizen.id === citizen.id);
    if (!sourceNode) return;
    
    for (const relation of citizen.socialRelations) {
      // Filter anwenden
      if (this.filter.relationTypes && !this.filter.relationTypes.includes(relation.relationType)) {
        continue;
      }
      if (this.filter.minStrength !== undefined && relation.strength < this.filter.minStrength) {
        continue;
      }
      if (this.filter.maxStrength !== undefined && relation.strength > this.filter.maxStrength) {
        continue;
      }
      
      const targetCitizen = citizensMap.get(relation.citizenId);
      if (!targetCitizen || !targetCitizen.isAlive) continue;
      
      // Filter nach Beruf/Klasse
      if (this.filter.profession && targetCitizen.profession !== this.filter.profession) {
        continue;
      }
      if (this.filter.socialClass && targetCitizen.socialClass !== this.filter.socialClass) {
        continue;
      }
      
      // Knoten erstellen falls noch nicht vorhanden
      let targetNode = this.nodes.find(n => n.citizen.id === targetCitizen.id);
      if (!targetNode) {
        targetNode = this.createNode(targetCitizen);
        this.nodes.push(targetNode);
        
        // Rekursiv erweitern
        this.expandNetwork(targetCitizen, citizensMap, depth + 1, maxDepth);
      }
      
      // Kante erstellen (falls noch nicht vorhanden)
      const edgeExists = this.edges.some(e => 
        (e.source === sourceNode && e.target === targetNode) ||
        (e.source === targetNode && e.target === sourceNode)
      );
      
      if (!edgeExists) {
        this.edges.push({
          source: sourceNode,
          target: targetNode,
          relation
        });
        sourceNode.connections++;
        targetNode.connections++;
      }
    }
  }
  
  /**
   * Initialisiert Positionen in Kreisform
   */
  private initializePositions(): void {
    if (!this.app || this.nodes.length === 0) return;
    
    const centerX = this.app.screen.width / 2;
    const centerY = this.app.screen.height / 2;
    const radius = Math.min(centerX, centerY) * 0.7;
    
    this.nodes.forEach((node, i) => {
      if (i === 0) {
        // Zentrum
        node.x = centerX;
        node.y = centerY;
      } else {
        const angle = (2 * Math.PI * i) / this.nodes.length;
        node.x = centerX + radius * Math.cos(angle);
        node.y = centerY + radius * Math.sin(angle);
      }
    });
  }
  
  /**
   * Rendert den Graph
   */
  private render(): void {
    this.container.removeChildren();
    
    // Kanten zeichnen
    this.drawEdges();
    
    // Knoten zeichnen
    this.drawNodes();
  }
  
  /**
   * Zeichnet alle Kanten
   */
  private drawEdges(): void {
    const graphics = new PIXI.Graphics();
    
    for (const edge of this.edges) {
      const color = this.getRelationColor(edge.relation.relationType);
      const alpha = Math.abs(edge.relation.strength) / 100;
      const lineWidth = Math.max(1, Math.abs(edge.relation.strength) / 25);
      
      graphics.lineStyle(lineWidth, color, alpha);
      graphics.moveTo(edge.source.x, edge.source.y);
      graphics.lineTo(edge.target.x, edge.target.y);
      
      // Pfeil für gerichtete Beziehungen
      if (edge.relation.relationType === 'mentor') {
        this.drawArrow(graphics, edge.source.x, edge.source.y, edge.target.x, edge.target.y, color);
      }
    }
    
    this.container.addChild(graphics);
  }
  
  /**
   * Zeichnet einen Pfeil
   */
  private drawArrow(
    graphics: PIXI.Graphics,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: number
  ): void {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowSize = 10;
    
    // Pfeil am Zielpunkt
    const tipX = x2 - this.NODE_RADIUS * Math.cos(angle);
    const tipY = y2 - this.NODE_RADIUS * Math.sin(angle);
    
    graphics.beginFill(color);
    graphics.moveTo(tipX, tipY);
    graphics.lineTo(
      tipX - arrowSize * Math.cos(angle - Math.PI / 6),
      tipY - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    graphics.lineTo(
      tipX - arrowSize * Math.cos(angle + Math.PI / 6),
      tipY - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    graphics.closePath();
    graphics.endFill();
  }
  
  /**
   * Zeichnet alle Knoten
   */
  private drawNodes(): void {
    for (const node of this.nodes) {
      const nodeContainer = new PIXI.Container();
      nodeContainer.x = node.x;
      nodeContainer.y = node.y;
      nodeContainer.eventMode = 'static';
      nodeContainer.cursor = 'pointer';
      
      // Kreis
      const circle = new PIXI.Graphics();
      const isSelected = this.selectedNode === node;
      const color = isSelected ? this.COLORS.NODE_SELECTED : this.COLORS.NODE_DEFAULT;
      const radius = this.NODE_RADIUS + (node.connections * 2); // Größer je mehr Verbindungen
      
      circle.beginFill(color);
      circle.lineStyle(2, this.COLORS.NODE_BORDER);
      circle.drawCircle(0, 0, radius);
      circle.endFill();
      nodeContainer.addChild(circle);
      
      // Name (abgekürzt)
      const initials = node.citizen.firstName[0] + node.citizen.lastName[0];
      const nameText = new PIXI.Text({
        text: initials,
        style: {
          fontSize: 14,
          fill: this.COLORS.TEXT,
          fontFamily: 'Arial',
          fontWeight: 'bold'
        }
      });
      nameText.x = -nameText.width / 2;
      nameText.y = -nameText.height / 2;
      nodeContainer.addChild(nameText);
      
      // Interaktivität
      nodeContainer.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
        event.stopPropagation();
        this.onNodeDragStart(node, event);
      });
      
      nodeContainer.on('pointerover', () => {
        this.showNodeTooltip(node, nodeContainer);
      });
      
      nodeContainer.on('pointerout', () => {
        this.hideTooltip();
      });
      
      this.container.addChild(nodeContainer);
    }
  }
  
  /**
   * Holt Farbe für Beziehungstyp
   */
  private getRelationColor(relationType: string): number {
    switch (relationType) {
      case 'friend': return this.COLORS.RELATION_FRIEND;
      case 'enemy': return this.COLORS.RELATION_ENEMY;
      case 'rival': return this.COLORS.RELATION_RIVAL;
      case 'mentor': return this.COLORS.RELATION_MENTOR;
      case 'student': return this.COLORS.RELATION_MENTOR;
      case 'colleague': return this.COLORS.RELATION_COLLEAGUE;
      default: return 0x888888;
    }
  }
  
  /**
   * Startet Physics-Simulation
   */
  private startSimulation(): void {
    let iterations = 0;
    const maxIterations = 300;
    
    const simulate = () => {
      this.applyForces();
      this.updatePositions();
      this.render();
      
      iterations++;
      if (iterations < maxIterations) {
        this.animationFrameId = requestAnimationFrame(simulate);
      }
    };
    
    simulate();
  }
  
  /**
   * Wendet Kräfte an (Force-Directed)
   */
  private applyForces(): void {
    // Abstoßung zwischen allen Knoten
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const nodeA = this.nodes[i];
        const nodeB = this.nodes[j];
        
        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        if (distance < this.MIN_DISTANCE) {
          const force = this.REPULSION_STRENGTH / (distance * distance);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          nodeA.vx -= fx;
          nodeA.vy -= fy;
          nodeB.vx += fx;
          nodeB.vy += fy;
        }
      }
    }
    
    // Anziehung entlang Kanten
    for (const edge of this.edges) {
      const dx = edge.target.x - edge.source.x;
      const dy = edge.target.y - edge.source.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      
      const idealDistance = this.MAX_DISTANCE * (1 - Math.abs(edge.relation.strength) / 100);
      const force = (distance - idealDistance) * this.ATTRACTION_STRENGTH;
      
      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;
      
      if (!edge.source.fx) {
        edge.source.vx += fx;
        edge.source.vy += fy;
      }
      if (!edge.target.fx) {
        edge.target.vx -= fx;
        edge.target.vy -= fy;
      }
    }
  }
  
  /**
   * Aktualisiert Positionen basierend auf Geschwindigkeiten
   */
  private updatePositions(): void {
    if (!this.app) return;
    
    for (const node of this.nodes) {
      if (!node.fx) {
        node.vx *= this.DAMPING;
        node.vy *= this.DAMPING;
        
        node.x += node.vx;
        node.y += node.vy;
        
        // Grenzen
        const margin = 50;
        node.x = Math.max(margin, Math.min(this.app.screen.width - margin, node.x));
        node.y = Math.max(margin, Math.min(this.app.screen.height - margin, node.y));
      }
    }
  }
  
  /**
   * Knoten-Drag-Start
   */
  private onNodeDragStart(node: GraphNode, event: PIXI.FederatedPointerEvent): void {
    this.selectedNode = node;
    node.fx = event.global.x;
    node.fy = event.global.y;
    
    const onMove = (e: PIXI.FederatedPointerEvent) => {
      if (node.fx !== undefined) {
        node.fx = e.global.x;
        node.fy = e.global.y;
        node.x = node.fx;
        node.y = node.fy;
        this.render();
      }
    };
    
    const onEnd = () => {
      node.fx = undefined;
      node.fy = undefined;
      this.container.off('pointermove', onMove);
      this.container.off('pointerup', onEnd);
      this.container.off('pointerupoutside', onEnd);
    };
    
    this.container.on('pointermove', onMove);
    this.container.on('pointerup', onEnd);
    this.container.on('pointerupoutside', onEnd);
  }
  
  /**
   * Zeigt Tooltip für Knoten
   */
  private showNodeTooltip(node: GraphNode, targetContainer: PIXI.Container): void {
    const tooltip = new PIXI.Container();
    tooltip.name = 'tooltip';
    
    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.9);
    bg.lineStyle(1, this.COLORS.NODE_BORDER);
    bg.drawRoundedRect(0, 0, 220, 100, 5);
    bg.endFill();
    tooltip.addChild(bg);
    
    const relations = node.citizen.socialRelations.length;
    const avgStrength = relations > 0
      ? node.citizen.socialRelations.reduce((sum, r) => sum + r.strength, 0) / relations
      : 0;
    
    const text = new PIXI.Text({
      text: [
        `${node.citizen.firstName} ${node.citizen.lastName}`,
        `Beruf: ${node.citizen.profession}`,
        `Beziehungen: ${relations}`,
        `Ø Stärke: ${avgStrength.toFixed(0)}`,
        `Ruf: ${node.citizen.reputation.toFixed(0)}`,
        `Verbindungen im Graph: ${node.connections}`
      ].join('\n'),
      style: {
        fontSize: 10,
        fill: 0xFFFFFF,
        fontFamily: 'Arial',
        lineHeight: 14
      }
    });
    text.x = 10;
    text.y = 10;
    tooltip.addChild(text);
    
    tooltip.x = targetContainer.x + 30;
    tooltip.y = targetContainer.y;
    
    this.container.addChild(tooltip);
  }
  
  /**
   * Versteckt Tooltip
   */
  private hideTooltip(): void {
    const tooltip = this.container.getChildByName('tooltip');
    if (tooltip) {
      this.container.removeChild(tooltip);
    }
  }
  
  /**
   * Aktiviert Drag & Pan
   */
  private enableDragAndPan(): void {
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    
    this.container.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
      isDragging = true;
      dragStart = {
        x: event.global.x - this.container.x,
        y: event.global.y - this.container.y
      };
    });
    
    this.container.on('pointermove', (event: PIXI.FederatedPointerEvent) => {
      if (isDragging) {
        this.container.x = event.global.x - dragStart.x;
        this.container.y = event.global.y - dragStart.y;
      }
    });
    
    this.container.on('pointerup', () => {
      isDragging = false;
    });
    
    this.container.on('pointerupoutside', () => {
      isDragging = false;
    });
  }
  
  /**
   * Aktualisiert Filter und rendert neu
   */
  public updateFilter(filter: NetworkFilter, centerCitizen: Citizen, getAllCitizens: () => Citizen[]): void {
    this.buildGraph(centerCitizen, getAllCitizens, filter);
  }
  
  /**
   * Stoppt Simulation
   */
  public stopSimulation(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
  }
  
  /**
   * Bereinigt Ressourcen
   */
  public destroy(): void {
    this.stopSimulation();
    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = undefined;
    }
  }
  
  /**
   * Exportiert Graph als Bild
   */
  public async exportAsImage(): Promise<Blob | null> {
    if (!this.app) return null;
    
    const extract = this.app.renderer.extract;
    const canvas = await extract.canvas(this.container);
    
    return new Promise((resolve) => {
      if (canvas.toBlob) {
        canvas.toBlob((blob) => {
          resolve(blob);
        });
      } else {
        resolve(null);
      }
    });
  }
}
