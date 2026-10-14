// src/ui/FamilyTreeVisualization.ts

import * as PIXI from 'pixi.js';
import { Citizen } from '../core/CitizenSystem';

/**
 * Knoten im Familienbaum
 */
interface TreeNode {
  citizen: Citizen;
  x: number;
  y: number;
  depth: number;
  children: TreeNode[];
  parent?: TreeNode;
  spouse?: TreeNode;
  collapsed: boolean;
}

/**
 * Familienbaum-Visualisierung mit PixiJS
 */
export class FamilyTreeVisualization {
  private app?: PIXI.Application;
  private container: PIXI.Container;
  private rootNode?: TreeNode;
  private allNodes: TreeNode[] = [];
  
  // Layout-Konstanten
  private readonly NODE_WIDTH = 120;
  private readonly NODE_HEIGHT = 60;
  private readonly HORIZONTAL_SPACING = 40;
  private readonly VERTICAL_SPACING = 100;
  private readonly COLORS = {
    NODE_MALE: 0x4A90E2,
    NODE_FEMALE: 0xE24A90,
    NODE_BORDER: 0x333333,
    NODE_SELECTED: 0xFFD700,
    LINE: 0x666666,
    TEXT: 0xFFFFFF,
    BACKGROUND: 0x1A1A1A
  };
  
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
    
    // Interaktivität aktivieren
    this.container.eventMode = 'static';
    this.container.hitArea = new PIXI.Rectangle(0, 0, this.app.screen.width, this.app.screen.height);
    
    // Drag & Pan
    this.enableDragAndPan();
  }
  
  /**
   * Erstellt Familienbaum für einen Bürger
   */
  public buildTree(
    rootCitizen: Citizen,
    getAllCitizens: () => Citizen[],
    maxDepth: number = 5
  ): void {
    const citizensMap = new Map<string, Citizen>();
    getAllCitizens().forEach(c => citizensMap.set(c.id, c));
    
    // Baum aufbauen
    this.rootNode = this.createTreeNode(rootCitizen, citizensMap, 0, maxDepth);
    this.allNodes = [];
    this.collectNodes(this.rootNode, this.allNodes);
    
    // Layout berechnen
    this.calculateLayout(this.rootNode);
    
    // Visualisierung rendern
    this.render();
  }
  
  /**
   * Erstellt einen Baum-Knoten rekursiv
   */
  private createTreeNode(
    citizen: Citizen,
    citizensMap: Map<string, Citizen>,
    depth: number,
    maxDepth: number
  ): TreeNode {
    const node: TreeNode = {
      citizen,
      x: 0,
      y: depth * (this.NODE_HEIGHT + this.VERTICAL_SPACING),
      depth,
      children: [],
      collapsed: false
    };
    
    if (depth >= maxDepth) {
      return node;
    }
    
    // Kinder finden
    const childRelations = citizen.familyRelations.filter(r => r.relationType === 'child');
    for (const relation of childRelations) {
      const child = citizensMap.get(relation.citizenId);
      if (child && child.isAlive) {
        const childNode = this.createTreeNode(child, citizensMap, depth + 1, maxDepth);
        childNode.parent = node;
        node.children.push(childNode);
      }
    }
    
    // Ehepartner finden
    const spouseRelation = citizen.familyRelations.find(r => r.relationType === 'spouse');
    if (spouseRelation) {
      const spouse = citizensMap.get(spouseRelation.citizenId);
      if (spouse && spouse.isAlive) {
        const spouseNode = this.createTreeNode(spouse, citizensMap, depth, maxDepth);
        node.spouse = spouseNode;
        spouseNode.spouse = node;
      }
    }
    
    return node;
  }
  
  /**
   * Sammelt alle Knoten in einer flachen Liste
   */
  private collectNodes(node: TreeNode, result: TreeNode[]): void {
    result.push(node);
    if (node.spouse && !result.includes(node.spouse)) {
      result.push(node.spouse);
    }
    if (!node.collapsed) {
      for (const child of node.children) {
        this.collectNodes(child, result);
      }
    }
  }
  
  /**
   * Berechnet Layout-Positionen für alle Knoten
   */
  private calculateLayout(node: TreeNode, xOffset: number = 0): number {
    if (!node) return 0;
    
    let currentX = xOffset;
    
    // Kinder layouten
    if (!node.collapsed && node.children.length > 0) {
      for (const child of node.children) {
        currentX = this.calculateLayout(child, currentX);
        currentX += this.HORIZONTAL_SPACING;
      }
      currentX -= this.HORIZONTAL_SPACING;
      
      // Elternknoten zentrieren über Kindern
      const firstChild = node.children[0];
      const lastChild = node.children[node.children.length - 1];
      node.x = (firstChild.x + lastChild.x) / 2;
    } else {
      node.x = currentX;
      currentX += this.NODE_WIDTH;
    }
    
    // Ehepartner neben sich platzieren
    if (node.spouse) {
      node.spouse.x = node.x + this.NODE_WIDTH + 20;
      node.spouse.y = node.y;
    }
    
    return currentX;
  }
  
  /**
   * Rendert die Visualisierung
   */
  private render(): void {
    this.container.removeChildren();
    
    if (!this.rootNode) return;
    
    // Linien zuerst zeichnen (damit sie unter den Knoten sind)
    this.drawConnections(this.rootNode);
    
    // Knoten zeichnen
    for (const node of this.allNodes) {
      if (!node.collapsed || node === this.rootNode) {
        this.drawNode(node);
      }
    }
    
    // Zentrieren
    this.centerView();
  }
  
  /**
   * Zeichnet Verbindungslinien zwischen Knoten
   */
  private drawConnections(node: TreeNode): void {
    const graphics = new PIXI.Graphics();
    graphics.lineStyle(2, this.COLORS.LINE);
    
    // Verbindung zu Ehepartner
    if (node.spouse) {
      graphics.moveTo(node.x + this.NODE_WIDTH, node.y + this.NODE_HEIGHT / 2);
      graphics.lineTo(node.spouse.x, node.spouse.y + this.NODE_HEIGHT / 2);
    }
    
    // Verbindungen zu Kindern
    if (!node.collapsed && node.children.length > 0) {
      // Vertikale Linie von Eltern nach unten
      const parentCenterX = node.spouse 
        ? (node.x + node.spouse.x + this.NODE_WIDTH) / 2
        : node.x + this.NODE_WIDTH / 2;
      
      const parentY = node.y + this.NODE_HEIGHT;
      const childrenY = node.children[0].y;
      const midY = (parentY + childrenY) / 2;
      
      graphics.moveTo(parentCenterX, parentY);
      graphics.lineTo(parentCenterX, midY);
      
      // Horizontale Linie über allen Kindern
      const firstChildX = node.children[0].x + this.NODE_WIDTH / 2;
      const lastChildX = node.children[node.children.length - 1].x + this.NODE_WIDTH / 2;
      
      graphics.moveTo(firstChildX, midY);
      graphics.lineTo(lastChildX, midY);
      
      // Vertikale Linien zu jedem Kind
      for (const child of node.children) {
        const childX = child.x + this.NODE_WIDTH / 2;
        graphics.moveTo(childX, midY);
        graphics.lineTo(childX, childrenY);
      }
    }
    
    this.container.addChild(graphics);
    
    // Rekursiv für Kinder
    if (!node.collapsed) {
      for (const child of node.children) {
        this.drawConnections(child);
      }
    }
  }
  
  /**
   * Zeichnet einen einzelnen Knoten
   */
  private drawNode(node: TreeNode): void {
    const nodeContainer = new PIXI.Container();
    nodeContainer.x = node.x;
    nodeContainer.y = node.y;
    nodeContainer.eventMode = 'static';
    nodeContainer.cursor = 'pointer';
    
    // Hintergrund
    const bg = new PIXI.Graphics();
    const color = node.citizen.gender === 'male' ? this.COLORS.NODE_MALE : this.COLORS.NODE_FEMALE;
    bg.beginFill(color);
    bg.lineStyle(2, this.COLORS.NODE_BORDER);
    bg.drawRoundedRect(0, 0, this.NODE_WIDTH, this.NODE_HEIGHT, 5);
    bg.endFill();
    nodeContainer.addChild(bg);
    
    // Name
    const nameText = new PIXI.Text({
      text: `${node.citizen.firstName} ${node.citizen.lastName}`,
      style: {
        fontSize: 12,
        fill: this.COLORS.TEXT,
        fontFamily: 'Arial',
        align: 'center',
        wordWrap: true,
        wordWrapWidth: this.NODE_WIDTH - 10
      }
    });
    nameText.x = this.NODE_WIDTH / 2 - nameText.width / 2;
    nameText.y = 5;
    nodeContainer.addChild(nameText);
    
    // Alter
    const ageText = new PIXI.Text({
      text: `${node.citizen.age} Jahre`,
      style: {
        fontSize: 10,
        fill: this.COLORS.TEXT,
        fontFamily: 'Arial'
      }
    });
    ageText.x = this.NODE_WIDTH / 2 - ageText.width / 2;
    ageText.y = 30;
    nodeContainer.addChild(ageText);
    
    // Beruf
    const professionText = new PIXI.Text({
      text: node.citizen.profession,
      style: {
        fontSize: 9,
        fill: this.COLORS.TEXT,
        fontFamily: 'Arial',
        fontStyle: 'italic'
      }
    });
    professionText.x = this.NODE_WIDTH / 2 - professionText.width / 2;
    professionText.y = 45;
    nodeContainer.addChild(professionText);
    
    // Klick-Event zum Auf-/Zuklappen
    if (node.children.length > 0) {
      const collapseIcon = new PIXI.Text({
        text: node.collapsed ? '+' : '-',
        style: {
          fontSize: 16,
          fill: this.COLORS.TEXT,
          fontFamily: 'Arial',
          fontWeight: 'bold'
        }
      });
      collapseIcon.x = this.NODE_WIDTH - 20;
      collapseIcon.y = 5;
      nodeContainer.addChild(collapseIcon);
      
      nodeContainer.on('pointerdown', () => {
        node.collapsed = !node.collapsed;
        this.allNodes = [];
        this.collectNodes(this.rootNode!, this.allNodes);
        this.calculateLayout(this.rootNode!);
        this.render();
      });
    }
    
    // Tooltip bei Hover
    nodeContainer.on('pointerover', () => {
      this.showTooltip(node, nodeContainer);
    });
    
    nodeContainer.on('pointerout', () => {
      this.hideTooltip();
    });
    
    this.container.addChild(nodeContainer);
  }
  
  /**
   * Zeigt Tooltip mit Details
   */
  private showTooltip(node: TreeNode, targetContainer: PIXI.Container): void {
    const tooltip = new PIXI.Container();
    tooltip.name = 'tooltip';
    
    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.9);
    bg.lineStyle(1, this.COLORS.NODE_BORDER);
    bg.drawRoundedRect(0, 0, 200, 120, 5);
    bg.endFill();
    tooltip.addChild(bg);
    
    const text = new PIXI.Text({
      text: [
        `Name: ${node.citizen.firstName} ${node.citizen.lastName}`,
        `Alter: ${node.citizen.age} Jahre`,
        `Beruf: ${node.citizen.profession}`,
        `Klasse: ${node.citizen.socialClass}`,
        `Reichtum: ${node.citizen.wealth.toFixed(0)}`,
        `Ruf: ${node.citizen.reputation.toFixed(0)}`,
        `Gesundheit: ${node.citizen.health.overall.toFixed(0)}%`
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
    
    tooltip.x = targetContainer.x + this.NODE_WIDTH + 10;
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
   * Zentriert die Ansicht
   */
  private centerView(): void {
    if (!this.app || !this.rootNode) return;
    
    // Finde Bounds
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    for (const node of this.allNodes) {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x + this.NODE_WIDTH);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y + this.NODE_HEIGHT);
    }
    
    const width = maxX - minX;
    // Note: height calculation reserved for future vertical centering feature
    // const height = maxY - minY;
    
    // Zentrieren
    this.container.x = (this.app.screen.width - width) / 2 - minX;
    this.container.y = 50; // Etwas Abstand oben
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
   * Bereinigt Ressourcen
   */
  public destroy(): void {
    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = undefined;
    }
  }
  
  /**
   * Exportiert Familienbaum als Bild
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
