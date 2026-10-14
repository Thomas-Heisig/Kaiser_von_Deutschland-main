// src/core/WikiIntegration.ts

export interface WikiArticle {
  title: string;
  extract: string;
  url: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  categories?: string[];
}

export interface WikiSearchResult {
  title: string;
  snippet: string;
  pageid: number;
}

export interface HistoricalEventWiki {
  eventId: string;
  wikiArticles: WikiArticle[];
  relatedTopics: string[];
  lastUpdated: number;
}

export class WikiIntegration {
  private baseUrl = 'https://de.wikipedia.org/w/api.php';
  private cache: Map<string, WikiArticle> = new Map();
  private eventWikiCache: Map<string, HistoricalEventWiki> = new Map();

  constructor() {}

  /**
   * Search Wikipedia
   */
  public async search(query: string, limit: number = 5): Promise<WikiSearchResult[]> {
    try {
      const params = new URLSearchParams({
        action: 'query',
        list: 'search',
        srsearch: query,
        format: 'json',
        origin: '*',
        srlimit: limit.toString()
      });

      const response = await fetch(`${this.baseUrl}?${params}`);
      const data = await response.json();

      if (data.query?.search) {
        return data.query.search.map((result: any) => ({
          title: result.title,
          snippet: this.stripHTML(result.snippet),
          pageid: result.pageid
        }));
      }

      return [];
    } catch (error) {
      console.error('Wikipedia search error:', error);
      return [];
    }
  }

  /**
   * Get article by title
   */
  public async getArticle(title: string, useCache: boolean = true): Promise<WikiArticle | null> {
    // Check cache
    if (useCache && this.cache.has(title)) {
      return this.cache.get(title)!;
    }

    try {
      const params = new URLSearchParams({
        action: 'query',
        titles: title,
        prop: 'extracts|pageimages|categories',
        exintro: 'true',
        explaintext: 'true',
        pithumbsize: '400',
        format: 'json',
        origin: '*'
      });

      const response = await fetch(`${this.baseUrl}?${params}`);
      const data = await response.json();

      const pages = data.query?.pages;
      if (!pages) return null;

      const pageId = Object.keys(pages)[0];
      const page = pages[pageId];

      if (page.missing) return null;

      const article: WikiArticle = {
        title: page.title,
        extract: page.extract || '',
        url: `https://de.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
        thumbnail: page.thumbnail ? {
          source: page.thumbnail.source,
          width: page.thumbnail.width,
          height: page.thumbnail.height
        } : undefined,
        categories: page.categories?.map((c: any) => c.title.replace('Kategorie:', ''))
      };

      // Cache the article
      this.cache.set(title, article);

      return article;
    } catch (error) {
      console.error('Error fetching Wikipedia article:', error);
      return null;
    }
  }

  /**
   * Get articles for historical event
   */
  public async getEventWiki(
    eventId: string,
    eventName: string,
    eventYear?: number
  ): Promise<HistoricalEventWiki> {
    // Check cache
    if (this.eventWikiCache.has(eventId)) {
      const cached = this.eventWikiCache.get(eventId)!;
      // Cache valid for 7 days
      if (Date.now() - cached.lastUpdated < 7 * 24 * 60 * 60 * 1000) {
        return cached;
      }
    }

    const wikiArticles: WikiArticle[] = [];
    const relatedTopics: string[] = [];

    try {
      // Search for main event
      const mainArticle = await this.getArticle(eventName);
      if (mainArticle) {
        wikiArticles.push(mainArticle);
        
        // Extract related topics from categories
        if (mainArticle.categories) {
          relatedTopics.push(...mainArticle.categories.slice(0, 5));
        }
      }

      // If we have a year, search for related events in that year
      if (eventYear) {
        const yearSearch = await this.search(`${eventYear} Geschichte`, 3);
        for (const result of yearSearch) {
          const article = await this.getArticle(result.title);
          if (article && article.title !== mainArticle?.title) {
            wikiArticles.push(article);
          }
        }
      }

      const eventWiki: HistoricalEventWiki = {
        eventId,
        wikiArticles,
        relatedTopics,
        lastUpdated: Date.now()
      };

      // Cache the result
      this.eventWikiCache.set(eventId, eventWiki);

      return eventWiki;
    } catch (error) {
      console.error('Error fetching event wiki:', error);
      return {
        eventId,
        wikiArticles: [],
        relatedTopics: [],
        lastUpdated: Date.now()
      };
    }
  }

  /**
   * Get random historical article
   */
  public async getRandomHistoricalArticle(): Promise<WikiArticle | null> {
    try {
      const params = new URLSearchParams({
        action: 'query',
        list: 'random',
        rnnamespace: '0',
        rnlimit: '1',
        format: 'json',
        origin: '*'
      });

      const response = await fetch(`${this.baseUrl}?${params}`);
      const data = await response.json();

      if (data.query?.random?.[0]) {
        const randomTitle = data.query.random[0].title;
        return await this.getArticle(randomTitle);
      }

      return null;
    } catch (error) {
      console.error('Error fetching random article:', error);
      return null;
    }
  }

  /**
   * Get related articles
   */
  public async getRelatedArticles(title: string, limit: number = 5): Promise<WikiArticle[]> {
    try {
      // Get the main article first to find related topics
      const mainArticle = await this.getArticle(title);
      if (!mainArticle) return [];

      const relatedArticles: WikiArticle[] = [];

      // Search based on first few words of the extract
      const searchQuery = mainArticle.extract.split(' ').slice(0, 5).join(' ');
      const searchResults = await this.search(searchQuery, limit + 1);

      for (const result of searchResults) {
        if (result.title === title) continue; // Skip the main article
        if (relatedArticles.length >= limit) break;

        const article = await this.getArticle(result.title);
        if (article) {
          relatedArticles.push(article);
        }
      }

      return relatedArticles;
    } catch (error) {
      console.error('Error fetching related articles:', error);
      return [];
    }
  }

  /**
   * Get articles about a specific topic/category
   */
  public async getArticlesByCategory(category: string, limit: number = 10): Promise<WikiArticle[]> {
    try {
      const params = new URLSearchParams({
        action: 'query',
        list: 'categorymembers',
        cmtitle: `Kategorie:${category}`,
        cmlimit: limit.toString(),
        format: 'json',
        origin: '*'
      });

      const response = await fetch(`${this.baseUrl}?${params}`);
      const data = await response.json();

      const articles: WikiArticle[] = [];

      if (data.query?.categorymembers) {
        for (const member of data.query.categorymembers) {
          const article = await this.getArticle(member.title);
          if (article) {
            articles.push(article);
          }
        }
      }

      return articles;
    } catch (error) {
      console.error('Error fetching articles by category:', error);
      return [];
    }
  }

  /**
   * Suggest wiki topics based on game context
   */
  public suggestTopics(context: {
    year?: number;
    playerRole?: string;
    recentEvents?: string[];
    activePolicies?: string[];
  }): string[] {
    const suggestions: string[] = [];

    // Year-based suggestions
    if (context.year) {
      if (context.year < 500) {
        suggestions.push('Römisches Reich', 'Antike', 'Christentum');
      } else if (context.year < 1500) {
        suggestions.push('Mittelalter', 'Feudalismus', 'Kreuzzüge');
      } else if (context.year < 1800) {
        suggestions.push('Renaissance', 'Reformation', 'Absolutismus');
      } else if (context.year < 1900) {
        suggestions.push('Industrialisierung', 'Französische Revolution', 'Nationalismus');
      } else if (context.year < 2000) {
        suggestions.push('Weltkrieg', 'Kalter Krieg', 'Dekolonisation');
      } else {
        suggestions.push('Digitalisierung', 'Globalisierung', 'Klimawandel');
      }
    }

    // Role-based suggestions
    if (context.playerRole) {
      const role = context.playerRole.toLowerCase();
      if (role.includes('kaiser') || role.includes('könig')) {
        suggestions.push('Monarchie', 'Herrschaft', 'Dynastie');
      } else if (role.includes('papst') || role.includes('bischof')) {
        suggestions.push('Kirche', 'Religion', 'Theologie');
      } else if (role.includes('händler') || role.includes('kaufmann')) {
        suggestions.push('Handel', 'Wirtschaft', 'Hanse');
      }
    }

    // Remove duplicates
    return [...new Set(suggestions)];
  }

  /**
   * Generate event description enriched with wiki data
   */
  public async enrichEventDescription(
    eventName: string,
    baseDescription: string
  ): Promise<string> {
    const article = await this.getArticle(eventName);
    if (!article) return baseDescription;

    const wikiExtract = article.extract.substring(0, 300);
    const enriched = `${baseDescription}\n\n📚 Wikipedia: ${wikiExtract}${wikiExtract.length >= 300 ? '...' : ''}\n\n[Mehr erfahren](${article.url})`;

    return enriched;
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
    this.eventWikiCache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    articlesInCache: number;
    eventsInCache: number;
  } {
    return {
      articlesInCache: this.cache.size,
      eventsInCache: this.eventWikiCache.size
    };
  }

  /**
   * Strip HTML tags from text
   */
  private stripHTML(html: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  /**
   * Format article for display
   */
  public formatArticleForDisplay(article: WikiArticle): string {
    let formatted = `# ${article.title}\n\n`;
    
    if (article.thumbnail) {
      formatted += `![${article.title}](${article.thumbnail.source})\n\n`;
    }

    formatted += `${article.extract}\n\n`;
    formatted += `[Vollständiger Artikel auf Wikipedia](${article.url})\n\n`;

    if (article.categories && article.categories.length > 0) {
      formatted += `**Kategorien:** ${article.categories.slice(0, 5).join(', ')}\n`;
    }

    return formatted;
  }

  /**
   * Get article summary (first paragraph only)
   */
  public getArticleSummary(article: WikiArticle, maxLength: number = 200): string {
    const firstParagraph = article.extract.split('\n')[0];
    if (firstParagraph.length <= maxLength) {
      return firstParagraph;
    }
    return firstParagraph.substring(0, maxLength) + '...';
  }
}
