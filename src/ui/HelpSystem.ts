/**
 * HelpSystem.ts
 * 
 * In-game help and documentation viewer system.
 * Provides access to all markdown documentation files directly in the game.
 */

export interface DocumentationSection {
  id: string;
  title: string;
  icon: string;
  files: DocumentationFile[];
}

export interface DocumentationFile {
  id: string;
  title: string;
  path: string;
  description?: string;
}

export class HelpSystem {
  private container: HTMLElement;
  private isOpen: boolean = false;
  // TODO: Will be used for tracking current file in future features
  // @ts-expect-error - Unused until file tracking features are implemented
  private currentFile: string | null = null;

  // Documentation structure – alle Pfade relativ zum Projektstamm
  private sections: DocumentationSection[] = [
    {
      id: 'quickstart',
      title: 'Schnelleinstieg',
      icon: '🚀',
      files: [
        { id: 'readme', title: 'Projekt-Übersicht', path: 'README.md', description: 'Hauptübersicht des Projekts' },
        { id: 'user-guide', title: 'Benutzerhandbuch', path: 'docs/USER_GUIDE.md', description: 'Spielanleitung (v2.0.0 – historisch)' },
        { id: 'gameplay', title: 'Gameplay-System', path: 'docs/03-game-design/GAMEPLAY_SYSTEM.md', description: 'Lebensphasen und Spielmechaniken' },
        { id: 'mode-selection', title: 'Modus-Auswahl', path: 'docs/03-game-design/mode-selection.md', description: 'Spielmodi und Rollenauswahl' }
      ]
    },
    {
      id: 'simulation',
      title: 'Simulation & Wirtschaft',
      icon: '⚙️',
      files: [
        { id: 'sim-readme', title: 'Simulationsmodell-Übersicht', path: 'docs/02-simulation-model/README.md', description: 'Perspektivenabhängige Ökonomie' },
        { id: 'economic-model', title: 'Wirtschaftsmodell', path: 'docs/02-simulation-model/economic-model.md', description: '6 Gameplay-Varianten' },
        { id: 'intensity-scaling', title: 'Intensitätsskalierung', path: 'docs/02-simulation-model/intensity-scaling.md', description: '4 Intensitäts-Achsen' },
        { id: 'role-perspectives', title: 'Rollen-Perspektiven', path: 'docs/02-simulation-model/role-perspectives.md', description: '5 Haupt-Perspektiven auf die Wirtschaft' }
      ]
    },
    {
      id: 'domains',
      title: 'Fachbereiche',
      icon: '🏛️',
      files: [
        { id: 'population', title: 'Bevölkerungssystem', path: 'docs/04-domains/population/README.md', description: 'Bevölkerungsdynamik und -verwaltung' },
        { id: 'population-guide', title: 'Bevölkerungs-Guide', path: 'docs/04-domains/population/guide.md', description: 'Detaillierte Bevölkerungsführung' },
        { id: 'population-api', title: 'Bevölkerungs-API', path: 'docs/04-domains/population/api.md', description: 'Bevölkerungs-Schnittstellen' },
        { id: 'social-mobility', title: 'Soziale Mobilität', path: 'docs/04-domains/population/social-mobility.md', description: 'Soziale Schichten und Aufstieg' },
        { id: 'ecology', title: 'Ökologie', path: 'docs/04-domains/ecology/README.md', description: 'Klima- und Umweltsystem' },
        { id: 'ecology-api', title: 'Ökologie-API', path: 'docs/04-domains/ecology/api.md', description: 'Ökologie-Schnittstellen' },
        { id: 'migration', title: 'Migration', path: 'docs/04-domains/migration/README.md', description: 'Migrationssystem' },
        { id: 'migration-system', title: 'Migrations-System', path: 'docs/04-domains/migration/system.md', description: 'Detailliertes Migrationssystem' },
        { id: 'naval', title: 'Marine', path: 'docs/04-domains/naval/README.md', description: 'Marine-Technologie und Einheiten' },
        { id: 'naval-system', title: 'Marine-System', path: 'docs/04-domains/naval/system.md', description: 'Detailliertes Marine-System' },
        { id: 'war-financing', title: 'Kriegsfinanzierung', path: 'docs/04-domains/war-financing/README.md', description: 'Kriegsfinanzierungs-Mechaniken' }
      ]
    },
    {
      id: 'development',
      title: 'Entwicklung & Technik',
      icon: '👨‍💻',
      files: [
        { id: 'architecture', title: 'Architektur', path: 'docs/05-technical-architecture/ARCHITECTURE.md', description: 'System-Architektur und Design' },
        { id: 'api', title: 'API-Referenz', path: 'docs/05-technical-architecture/API_REFERENCE.md', description: 'Code-Dokumentation' },
        { id: 'persistence', title: 'Persistenz', path: 'docs/05-technical-architecture/persistence.md', description: 'Datenhaltung und Speicherung' },
        { id: 'pixijs-overhaul', title: 'PixiJS-Überarbeitung', path: 'docs/05-technical-architecture/PIXIJS_OVERHAUL.md', description: 'Grafik-Engine' },
        { id: 'system-consolidation', title: 'System-Konsolidierung', path: 'docs/05-technical-architecture/system-consolidation.md', description: 'Adapter und Migration' },
        { id: 'database-impl', title: 'Datenbank-Implementierung', path: 'docs/06-development/database-implementation.md', description: 'SQLite-Integration' },
        { id: 'database-usage', title: 'Datenbank-Nutzung', path: 'docs/06-development/database-usage.md', description: 'SQLite-API-Nutzung' },
        { id: 'operations', title: 'Betrieb', path: 'docs/06-development/operations-guide.md', description: 'Build, Test und Release' },
        { id: 'deployment', title: 'Deployment', path: 'docs/06-development/public-deployment.md', description: 'Öffentliches Hosting' },
        { id: 'contributing', title: 'Beitragen', path: 'CONTRIBUTING.md', description: 'Wie Sie zum Projekt beitragen' }
      ]
    },
    {
      id: 'project',
      title: 'Projekt-Information',
      icon: '📋',
      files: [
        { id: 'roadmap', title: 'Roadmap', path: 'docs/00-meta/roadmap.md', description: 'Geplante Features und Entwicklung' },
        { id: 'status', title: 'Status', path: 'docs/00-meta/status.md', description: 'Aktueller Entwicklungsstand' },
        { id: 'vision', title: 'Vision', path: 'docs/00-meta/vision.md', description: 'Projekt-Vision und Ziele' },
        { id: 'changelog', title: 'Changelog', path: 'CHANGELOG.md', description: 'Versionshistorie' },
        { id: 'todo', title: 'TODO', path: 'TODO.md', description: 'Aktuelle Aufgabenliste' }
      ]
    },
    {
      id: 'overview',
      title: 'Überblick & Grundlagen',
      icon: '📖',
      files: [
        { id: 'overview-index', title: 'Spielüberblick', path: 'docs/01-overview/index.md', description: 'Spielidee und Konzept' },
        { id: 'glossary', title: 'Glossar', path: 'docs/01-overview/glossary.md', description: 'Fachbegriffe der Simulation' },
        { id: 'assumptions', title: 'Annahmen', path: 'docs/01-overview/assumptions.md', description: 'Grundannahmen der Simulation' },
        { id: 'target-groups', title: 'Zielgruppen', path: 'docs/01-overview/target-groups.md', description: 'Zielgruppen und Anwendungsfälle' }
      ]
    },
    {
      id: 'documentation',
      title: 'Dokumentation',
      icon: '📚',
      files: [
        { id: 'index', title: 'Dokumentations-Index', path: 'docs/INDEX.md', description: 'Vollständige Dokumentations-Übersicht' },
        { id: 'doc-readme', title: 'Dokumentations-Struktur', path: 'docs/README.md', description: 'Dokumentations-Organisation' },
        { id: 'ui-flow', title: 'UI-Flow', path: 'docs/UI_FLOW.md', description: 'Benutzeroberfläche und Abläufe' },
        { id: 'life-simulation', title: 'Life-Simulation', path: 'docs/LIFE_SIMULATION.md', description: 'Lebenssimulation (Entwurf)' },
        { id: 'adr-database', title: 'ADR: Datenbank', path: 'docs/08-decisions/adr-0001-database-technology.md', description: 'Architekturentscheidung Datenbank' },
        { id: 'references', title: 'Referenzen', path: 'docs/99-appendix/references.md', description: 'Quellen und weiterführende Links' }
      ]
    }
  ];

  constructor(containerId: string = 'help-system-container') {
    // Create container if it doesn't exist
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      document.body.appendChild(container);
    }
    this.container = container;
    this.initializeUI();
  }

  private initializeUI(): void {
    this.container.innerHTML = `
      <div class="help-overlay" style="display: none;">
        <div class="help-panel">
          <div class="help-header">
            <h2>📖 Hilfe & Dokumentation</h2>
            <button class="help-close-btn" title="Schließen">✕</button>
          </div>
          
          <div class="help-content">
            <aside class="help-sidebar">
              <div class="help-search">
                <input type="text" id="help-search" placeholder="🔍 Suchen..." />
              </div>
              <nav class="help-nav" id="help-nav">
                <!-- Navigation will be populated here -->
              </nav>
            </aside>
            
            <main class="help-main" id="help-main">
              <div class="help-welcome">
                <h3>Willkommen zur Hilfe-Sektion</h3>
                <p>Wählen Sie ein Thema aus der linken Seitenleiste, um die Dokumentation anzuzeigen.</p>
                
                <div class="help-quick-links">
                  <h4>Schnellzugriff:</h4>
                  <button class="quick-link-btn" data-file="readme">📋 Projekt-Übersicht</button>
                  <button class="quick-link-btn" data-file="gameplay">🎮 Gameplay-System</button>
                  <button class="quick-link-btn" data-file="roadmap">🗺️ Roadmap</button>
                  <button class="quick-link-btn" data-file="status">📊 Aktueller Status</button>
                  <button class="quick-link-btn" data-file="index">📚 Dokumentations-Index</button>
                  <button class="quick-link-btn" data-file="todo">✅ TODO-Liste</button>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
    this.renderNavigation();
  }

  private setupEventListeners(): void {
    // Close button
    const closeBtn = this.container.querySelector('.help-close-btn');
    closeBtn?.addEventListener('click', () => this.close());

    // Overlay click to close
    const overlay = this.container.querySelector('.help-overlay');
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.close();
      }
    });

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Search functionality
    const searchInput = this.container.querySelector('#help-search') as HTMLInputElement;
    searchInput?.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value.toLowerCase();
      this.filterNavigation(query);
    });

    // Quick links
    this.container.querySelectorAll('.quick-link-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const fileId = (e.target as HTMLElement).dataset.file;
        if (fileId) {
          this.loadDocumentByFileId(fileId);
        }
      });
    });
  }

  private renderNavigation(): void {
    const nav = this.container.querySelector('#help-nav');
    if (!nav) return;

    nav.innerHTML = this.sections.map(section => `
      <div class="help-section">
        <h3 class="help-section-title">${section.icon} ${section.title}</h3>
        <ul class="help-file-list">
          ${section.files.map(file => `
            <li class="help-file-item" data-file-id="${file.id}">
              <button class="help-file-btn" data-file-id="${file.id}">
                ${file.title}
              </button>
              ${file.description ? `<span class="help-file-desc">${file.description}</span>` : ''}
            </li>
          `).join('')}
        </ul>
      </div>
    `).join('');

    // Add click listeners to file buttons
    nav.querySelectorAll('.help-file-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const fileId = (e.target as HTMLElement).dataset.fileId;
        if (fileId) {
          this.loadDocumentByFileId(fileId);
        }
      });
    });
  }

  private filterNavigation(query: string): void {
    const sections = this.container.querySelectorAll('.help-section');
    
    sections.forEach(section => {
      const items = section.querySelectorAll('.help-file-item');
      let hasVisibleItems = false;

      items.forEach(item => {
        const text = item.textContent?.toLowerCase() || '';
        const isVisible = text.includes(query);
        (item as HTMLElement).style.display = isVisible ? 'block' : 'none';
        if (isVisible) hasVisibleItems = true;
      });

      // Hide section if no items match
      (section as HTMLElement).style.display = hasVisibleItems ? 'block' : 'none';
    });
  }

  private loadDocumentByFileId(fileId: string): void {
    // Find file in all sections
    for (const section of this.sections) {
      const file = section.files.find(f => f.id === fileId);
      if (file) {
        this.loadDocument(file.path, file.title);
        return;
      }
    }
  }

  private async loadDocument(path: string, title: string): Promise<void> {
    const main = this.container.querySelector('#help-main');
    if (!main) return;

    this.currentFile = path;

    // Show loading state
    main.innerHTML = `
      <div class="help-loading">
        <div class="spinner"></div>
        <p>Lade ${title}...</p>
      </div>
    `;

    try {
      const response = await fetch(path);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const markdown = await response.text();
      
      // Convert markdown to HTML (simple conversion)
      const html = this.markdownToHtml(markdown);

      main.innerHTML = `
        <div class="help-document">
          <div class="help-document-header">
            <h2>${title}</h2>
            <div class="help-document-actions">
              <button class="help-action-btn" onclick="window.open('${path}', '_blank')" title="In neuem Tab öffnen">
                🔗 Extern öffnen
              </button>
            </div>
          </div>
          <div class="help-document-content">
            ${html}
          </div>
        </div>
      `;

      // Highlight current file in navigation
      this.container.querySelectorAll('.help-file-btn').forEach(btn => {
        btn.classList.remove('active');
        if ((btn as HTMLElement).dataset.fileId === this.findFileIdByPath(path)) {
          btn.classList.add('active');
        }
      });

    } catch (error) {
      main.innerHTML = `
        <div class="help-error">
          <h3>⚠️ Fehler beim Laden</h3>
          <p>Die Dokumentation konnte nicht geladen werden.</p>
          <p class="error-details">${error instanceof Error ? error.message : 'Unbekannter Fehler'}</p>
          <button class="btn-secondary" onclick="location.reload()">Seite neu laden</button>
        </div>
      `;
    }
  }

  private findFileIdByPath(path: string): string | null {
    for (const section of this.sections) {
      const file = section.files.find(f => f.path === path);
      if (file) return file.id;
    }
    return null;
  }

  private markdownToHtml(markdown: string): string {
    // Simple markdown to HTML conversion
    // This is a basic implementation - could be enhanced with a proper markdown library
    
    let html = markdown;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Lists (unordered)
    html = html.replace(/^\- (.+)$/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Lists (ordered)
    html = html.replace(/^\d+\. (.+)$/gim, '<li>$1</li>');

    // Checkboxes
    html = html.replace(/\[ \]/g, '☐');
    html = html.replace(/\[x\]/gi, '✅');

    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';

    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>\s*<\/p>/g, '');

    return html;
  }

  public open(): void {
    const overlay = this.container.querySelector('.help-overlay') as HTMLElement;
    if (overlay) {
      overlay.style.display = 'flex';
      this.isOpen = true;
      
      // Prevent body scrolling
      document.body.style.overflow = 'hidden';
    }
  }

  public close(): void {
    const overlay = this.container.querySelector('.help-overlay') as HTMLElement;
    if (overlay) {
      overlay.style.display = 'none';
      this.isOpen = false;
      
      // Restore body scrolling
      document.body.style.overflow = '';
    }
  }

  public toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  public isVisible(): boolean {
    return this.isOpen;
  }
}
