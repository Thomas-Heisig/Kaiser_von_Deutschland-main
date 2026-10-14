// src/core/RoleSystem.ts
import rolesData from '../data/json/roles.json';

export interface RoleDefinition {
  id: string;
  name: string;
  femaleName?: string;
  rank: number;
  category: string;
  description: string;
  startingResources: {
    gold: number;
    land: number;
    population: number;
  };
  abilities: string[];
  requirements: {
    prestige?: number;
    authority?: number;
    kingdomScore?: number;
    previousTitle?: string;
    piety?: number;
    stewardship?: number;
    popularity?: number;
    wealth?: number;
    martial?: number;
    courage?: number;
    learning?: number;
    education?: string;
    skill?: number;
    land?: number;
    diplomacy?: number;
    intrigue?: number;
    stealth?: number;
    medicine?: number;
    culturalInfluence?: number;
    justice?: number;
    charisma?: number;
    wit?: number;
    radicalism?: number;
    environmentalism?: number;
    minYear?: number;
  };
  specializations?: string[];
  bonuses?: {
    buildingCostReduction?: number;
    buildingTimeReduction?: number;
    cityEfficiency?: number;
    healthBonus?: number;
    plagueResistance?: number;
    populationGrowth?: number;
    prestigeBonus?: number;
    culturalInfluence?: number;
    happiness?: number;
    miningEfficiency?: number;
    resourceProduction?: number;
    mineralDiscovery?: number;
    stability?: number;
    authority?: number;
    corruptionReduction?: number;
    courtHappiness?: number;
    stressReduction?: number;
    uniqueEvents?: number;
    rebellionChance?: number;
    followerLoyalty?: number;
    popularSupport?: number;
    sustainability?: number;
    publicApproval?: number;
    longTermStability?: number;
  };
}

export class RoleSystem {
  private static roles: Map<string, RoleDefinition> = new Map();
  
  static {
    // Initialize roles from JSON data
    rolesData.roles.forEach((role: any) => {
      this.roles.set(role.id, role as RoleDefinition);
    });
  }
  
  /**
   * Holt alle verfügbaren Rollen
   */
  public static getAllRoles(): RoleDefinition[] {
    return Array.from(this.roles.values());
  }
  
  /**
   * Holt eine Rolle nach ID
   */
  public static getRole(roleId: string): RoleDefinition | undefined {
    return this.roles.get(roleId);
  }
  
  /**
   * Holt alle Rollen einer Kategorie
   */
  public static getRolesByCategory(category: string): RoleDefinition[] {
    return this.getAllRoles().filter(role => role.category === category);
  }
  
  /**
   * Holt alle Rollen bis zu einem bestimmten Rang
   */
  public static getRolesByMaxRank(maxRank: number): RoleDefinition[] {
    return this.getAllRoles().filter(role => role.rank <= maxRank);
  }
  
  /**
   * Prüft ob ein Spieler die Voraussetzungen für eine Rolle erfüllt
   */
  public static canPlayerAchieveRole(
    role: RoleDefinition,
    playerStats: any
  ): { canAchieve: boolean; missingRequirements: string[] } {
    const missing: string[] = [];
    
    if (role.requirements.prestige && playerStats.prestige < role.requirements.prestige) {
      missing.push(`Prestige: ${playerStats.prestige}/${role.requirements.prestige}`);
    }
    
    if (role.requirements.authority && playerStats.authority < role.requirements.authority) {
      missing.push(`Autorität: ${playerStats.authority}/${role.requirements.authority}`);
    }
    
    if (role.requirements.piety && playerStats.piety < role.requirements.piety) {
      missing.push(`Frömmigkeit: ${playerStats.piety}/${role.requirements.piety}`);
    }
    
    if (role.requirements.stewardship && playerStats.stewardship < role.requirements.stewardship) {
      missing.push(`Verwaltung: ${playerStats.stewardship}/${role.requirements.stewardship}`);
    }
    
    if (role.requirements.popularity && playerStats.popularity < role.requirements.popularity) {
      missing.push(`Beliebtheit: ${playerStats.popularity}/${role.requirements.popularity}`);
    }
    
    if (role.requirements.martial && playerStats.martial < role.requirements.martial) {
      missing.push(`Kriegskunst: ${playerStats.martial}/${role.requirements.martial}`);
    }
    
    if (role.requirements.courage && playerStats.courage < role.requirements.courage) {
      missing.push(`Mut: ${playerStats.courage}/${role.requirements.courage}`);
    }
    
    if (role.requirements.learning && playerStats.learning < role.requirements.learning) {
      missing.push(`Gelehrsamkeit: ${playerStats.learning}/${role.requirements.learning}`);
    }
    
    if (role.requirements.kingdomScore && playerStats.kingdomScore < role.requirements.kingdomScore) {
      missing.push(`Reichspunktzahl: ${playerStats.kingdomScore}/${role.requirements.kingdomScore}`);
    }
    
    if (role.requirements.wealth && playerStats.gold < role.requirements.wealth) {
      missing.push(`Reichtum: ${playerStats.gold}/${role.requirements.wealth}`);
    }
    
    if (role.requirements.land && playerStats.land < role.requirements.land) {
      missing.push(`Land: ${playerStats.land}/${role.requirements.land}`);
    }
    
    // New requirement checks for expanded roles
    if (role.requirements.diplomacy && playerStats.diplomacy < role.requirements.diplomacy) {
      missing.push(`Diplomatie: ${playerStats.diplomacy}/${role.requirements.diplomacy}`);
    }
    
    if (role.requirements.intrigue && playerStats.intrigue < role.requirements.intrigue) {
      missing.push(`Intrige: ${playerStats.intrigue}/${role.requirements.intrigue}`);
    }
    
    if (role.requirements.stealth && playerStats.stealth < role.requirements.stealth) {
      missing.push(`Heimlichkeit: ${playerStats.stealth}/${role.requirements.stealth}`);
    }
    
    if (role.requirements.medicine && playerStats.medicine < role.requirements.medicine) {
      missing.push(`Medizin: ${playerStats.medicine}/${role.requirements.medicine}`);
    }
    
    if (role.requirements.culturalInfluence && playerStats.culturalInfluence < role.requirements.culturalInfluence) {
      missing.push(`Kultureller Einfluss: ${playerStats.culturalInfluence}/${role.requirements.culturalInfluence}`);
    }
    
    if (role.requirements.justice && playerStats.justice < role.requirements.justice) {
      missing.push(`Gerechtigkeit: ${playerStats.justice}/${role.requirements.justice}`);
    }
    
    if (role.requirements.charisma && playerStats.charisma < role.requirements.charisma) {
      missing.push(`Charisma: ${playerStats.charisma}/${role.requirements.charisma}`);
    }
    
    if (role.requirements.wit && playerStats.wit < role.requirements.wit) {
      missing.push(`Geist: ${playerStats.wit}/${role.requirements.wit}`);
    }
    
    if (role.requirements.radicalism && playerStats.radicalism < role.requirements.radicalism) {
      missing.push(`Radikalismus: ${playerStats.radicalism}/${role.requirements.radicalism}`);
    }
    
    if (role.requirements.environmentalism && playerStats.environmentalism < role.requirements.environmentalism) {
      missing.push(`Umweltbewusstsein: ${playerStats.environmentalism}/${role.requirements.environmentalism}`);
    }
    
    if (role.requirements.minYear && playerStats.currentYear < role.requirements.minYear) {
      missing.push(`Mindestjahr: ${playerStats.currentYear}/${role.requirements.minYear}`);
    }
    
    return {
      canAchieve: missing.length === 0,
      missingRequirements: missing
    };
  }
  
  /**
   * Gibt den Namen der Rolle basierend auf dem Geschlecht zurück
   */
  public static getRoleName(role: RoleDefinition, gender: 'male' | 'female'): string {
    if (gender === 'female' && role.femaleName) {
      return role.femaleName;
    }
    return role.name;
  }
  
  /**
   * Holt alle Kategorien
   */
  public static getCategories(): string[] {
    return rolesData.metadata.categories;
  }
  
  /**
   * Gibt eine Beschreibung der Fähigkeiten einer Rolle zurück
   */
  public static getAbilityDescriptions(roleId: string): Map<string, string> {
    const abilityDescriptions = new Map<string, string>([
      ['appoint_kings', 'Könige ernennen und absetzen'],
      ['declare_war', 'Kriege erklären'],
      ['call_diet', 'Reichstag einberufen'],
      ['issue_imperial_decrees', 'Kaiserliche Erlasse verkünden'],
      ['crown_pope', 'Papst krönen'],
      ['grant_titles', 'Titel verleihen'],
      ['appoint_nobles', 'Adlige ernennen'],
      ['levy_taxes', 'Steuern erheben'],
      ['grant_lands', 'Ländereien verleihen'],
      ['host_tournaments', 'Turniere ausrichten'],
      ['excommunicate', 'Exkommunizieren'],
      ['crown_emperor', 'Kaiser krönen'],
      ['call_crusade', 'Kreuzzug ausrufen'],
      ['issue_papal_bulls', 'Päpstliche Bullen erlassen'],
      ['canonize_saints', 'Heilige kanonisieren'],
      ['appoint_bishops', 'Bischöfe ernennen'],
      ['appoint_counts', 'Grafen ernennen'],
      ['raise_army', 'Armee aufstellen'],
      ['grant_fiefs', 'Lehen vergeben'],
      ['manage_treasury', 'Schatzkammer verwalten'],
      ['conduct_diplomacy', 'Diplomatie betreiben'],
      ['oversee_military', 'Militär beaufsichtigen'],
      ['regulate_trade', 'Handel regulieren'],
      ['manage_infrastructure', 'Infrastruktur verwalten'],
      ['bless_marriages', 'Ehen segnen'],
      ['collect_tithes', 'Zehnten einsammeln'],
      ['build_churches', 'Kirchen bauen'],
      ['educate_clergy', 'Klerus ausbilden'],
      ['grant_indulgences', 'Ablässe gewähren'],
      ['manage_city', 'Stadt verwalten'],
      ['collect_taxes', 'Steuern einziehen'],
      ['build_infrastructure', 'Infrastruktur errichten'],
      ['regulate_markets', 'Märkte regulieren'],
      ['maintain_order', 'Ordnung aufrechterhalten'],
      ['train_apprentices', 'Lehrlinge ausbilden'],
      ['set_prices', 'Preise festsetzen'],
      ['quality_control', 'Qualitätskontrolle durchführen'],
      ['protect_secrets', 'Zunftgeheimnisse schützen'],
      ['lead_cavalry', 'Kavallerie anführen'],
      ['participate_tournaments', 'An Turnieren teilnehmen'],
      ['administer_fief', 'Lehen verwalten'],
      ['teach_students', 'Studenten unterrichten'],
      ['conduct_research', 'Forschung betreiben'],
      ['write_books', 'Bücher schreiben'],
      ['advise_rulers', 'Herrscher beraten'],
      ['discover_technologies', 'Technologien entdecken'],
      ['trade_goods', 'Waren handeln'],
      ['establish_routes', 'Handelsrouten etablieren'],
      ['negotiate_deals', 'Geschäfte aushandeln'],
      ['invest_ventures', 'In Unternehmungen investieren'],
      ['hire_guards', 'Wachen anheuern'],
      ['craft_goods', 'Waren herstellen'],
      ['train_apprentice', 'Lehrling ausbilden'],
      ['sell_products', 'Produkte verkaufen'],
      ['maintain_tools', 'Werkzeuge warten'],
      ['farm_land', 'Land bewirtschaften'],
      ['raise_livestock', 'Vieh züchten'],
      ['harvest_crops', 'Ernten einbringen'],
      ['pay_tithes', 'Zehnten zahlen'],
      ['serve_militia', 'In der Miliz dienen'],
      ['perform_labor', 'Arbeit verrichten'],
      ['earn_wages', 'Lohn verdienen'],
      ['join_guild', 'Gilde beitreten'],
      ['pray', 'Beten'],
      ['copy_manuscripts', 'Manuskripte kopieren'],
      ['brew_beer', 'Bier brauen'],
      ['provide_charity', 'Wohltätigkeit leisten'],
      ['teach', 'Unterrichten'],
      // New abilities for expanded roles
      ['negotiate_treaties', 'Verträge aushandeln'],
      ['establish_embassies', 'Botschaften errichten'],
      ['trade_agreements', 'Handelsabkommen schließen'],
      ['cultural_exchange', 'Kulturaustausch fördern'],
      ['prevent_wars', 'Kriege verhindern'],
      ['gather_intelligence', 'Informationen sammeln'],
      ['sabotage_operations', 'Sabotageaktionen durchführen'],
      ['assassination', 'Attentate ausführen'],
      ['steal_technology', 'Technologie stehlen'],
      ['uncover_plots', 'Verschwörungen aufdecken'],
      ['disguise', 'Verkleiden'],
      ['design_buildings', 'Gebäude entwerfen'],
      ['optimize_city_layout', 'Stadtlayout optimieren'],
      ['reduce_construction_cost', 'Baukosten reduzieren'],
      ['improve_aesthetics', 'Ästhetik verbessern'],
      ['plan_infrastructure', 'Infrastruktur planen'],
      ['heal_sick', 'Kranke heilen'],
      ['combat_plagues', 'Seuchen bekämpfen'],
      ['improve_sanitation', 'Hygiene verbessern'],
      ['train_physicians', 'Ärzte ausbilden'],
      ['research_medicine', 'Medizin erforschen'],
      ['commission_artworks', 'Kunstwerke in Auftrag geben'],
      ['host_exhibitions', 'Ausstellungen veranstalten'],
      ['patronize_artists', 'Künstler fördern'],
      ['build_museums', 'Museen errichten'],
      ['cultural_festivals', 'Kulturfestivals organisieren'],
      ['optimize_mining', 'Bergbau optimieren'],
      ['discover_veins', 'Erzadern entdecken'],
      ['improve_extraction', 'Förderung verbessern'],
      ['manage_miners', 'Bergleute verwalten'],
      ['geological_survey', 'Geologische Untersuchungen'],
      ['draft_laws', 'Gesetze entwerfen'],
      ['reform_justice', 'Justiz reformieren'],
      ['arbitrate_disputes', 'Streitigkeiten schlichten'],
      ['establish_courts', 'Gerichte einrichten'],
      ['codify_laws', 'Gesetze kodifizieren'],
      ['entertain_court', 'Hof unterhalten'],
      ['speak_truth', 'Wahrheit sprechen'],
      ['lift_spirits', 'Stimmung heben'],
      ['mock_enemies', 'Feinde verspotten'],
      ['unique_insights', 'Einzigartige Einsichten'],
      ['incite_rebellion', 'Aufstände anstiften'],
      ['organize_protests', 'Proteste organisieren'],
      ['spread_ideology', 'Ideologie verbreiten'],
      ['recruit_followers', 'Anhänger rekrutieren'],
      ['overthrow_government', 'Regierung stürzen'],
      ['promote_sustainability', 'Nachhaltigkeit fördern'],
      ['protect_nature', 'Natur schützen'],
      ['renewable_energy', 'Erneuerbare Energien'],
      ['environmental_laws', 'Umweltgesetze'],
      ['green_technology', 'Grüne Technologie']
    ]);
    
    const role = this.roles.get(roleId);
    if (!role) return new Map();
    
    const result = new Map<string, string>();
    role.abilities.forEach(ability => {
      result.set(ability, abilityDescriptions.get(ability) || ability);
    });
    
    return result;
  }
  
  /**
   * Berechnet die empfohlene Rolle basierend auf Spielerstatistiken
   */
  public static recommendRole(playerStats: any): RoleDefinition | null {
    const eligibleRoles = this.getAllRoles().filter(role => {
      const check = this.canPlayerAchieveRole(role, playerStats);
      return check.canAchieve;
    });
    
    if (eligibleRoles.length === 0) return null;
    
    // Sortiere nach Rang (höchster zuerst)
    eligibleRoles.sort((a, b) => b.rank - a.rank);
    
    return eligibleRoles[0];
  }
  
  /**
   * Gibt die nächste erreichbare Rolle zurück
   */
  public static getNextRole(currentRole: RoleDefinition, playerStats: any): RoleDefinition | null {
    const allRoles = this.getAllRoles()
      .filter(role => role.rank > currentRole.rank)
      .sort((a, b) => a.rank - b.rank);
    
    for (const role of allRoles) {
      const check = this.canPlayerAchieveRole(role, playerStats);
      if (check.canAchieve) {
        return role;
      }
    }
    
    return null;
  }
}
