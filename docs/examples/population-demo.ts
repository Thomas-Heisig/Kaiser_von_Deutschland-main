// docs/examples/population-demo.ts
// Demonstration of Population Dynamics Features
// This file shows how to use the new v2.1.5 population systems

import { GameEngine } from '../../src/core/GameEngine';
import { NameGenerator } from '../../src/utils/NameGenerator';

/**
 * Demo 1: Initialisiere eine Bevölkerung
 */
function demo1_initializePopulation() {
  console.log('=== Demo 1: Bevölkerung initialisieren ===\n');
  
  const engine = new GameEngine({
    startingYear: 1200,
    randomEvents: false  // Für deterministische Demo
  });
  
  const citizenSystem = engine.getCitizenSystem();
  
  // Erstelle 100 Bürger für eine kleine Stadt
  console.log('Erstelle 100 Bürger...');
  
  for (let i = 0; i < 100; i++) {
    const gender = Math.random() < 0.5 ? 'male' : 'female';
    const age = Math.floor(Math.random() * 70);
    const { firstName, lastName } = NameGenerator.generateFullName(gender, 1200);
    
    const professions = ['farmer', 'artisan', 'merchant', 'soldier', 'scholar'];
    const profession = professions[Math.floor(Math.random() * professions.length)];
    
    citizenSystem.createCitizen({
      firstName,
      lastName,
      gender,
      age,
      birthYear: 1200 - age,
      birthMonth: Math.floor(Math.random() * 12) + 1,
      profession: profession as any,
      regionId: 'bavaria',
      socialClass: profession === 'scholar' ? 'middle' : 'peasant'
    });
  }
  
  console.log(`✓ ${citizenSystem.getPopulation()} Bürger erstellt\n`);
  
  // Zeige einige Statistiken
  const stats = engine.getPopulationStats();
  console.log('Bevölkerungsstatistiken:');
  console.log(`  Gesamtbevölkerung: ${stats.total}`);
  console.log(`  Durchschnittsalter: ${stats.demographics.averageAge.toFixed(1)} Jahre`);
  console.log(`  Medianalter: ${stats.demographics.medianAge} Jahre`);
  console.log('\n');
  
  return engine;
}

/**
 * Demo 2: Simuliere demografische Prozesse
 */
function demo2_simulateDemographics(engine: GameEngine) {
  console.log('=== Demo 2: Demografische Simulation ===\n');
  
  const demographicSystem = engine.getDemographicSystem();
  const citizenSystem = engine.getCitizenSystem();
  
  const initialPopulation = citizenSystem.getPopulation();
  console.log(`Startbevölkerung: ${initialPopulation}`);
  
  // Simuliere 5 Jahre
  console.log('Simuliere 5 Jahre...');
  
  for (let year = 0; year < 5; year++) {
    for (let month = 1; month <= 12; month++) {
      demographicSystem.processMonth(
        citizenSystem,
        1200 + year,
        month
      );
    }
  }
  
  const finalPopulation = citizenSystem.getPopulation();
  const change = finalPopulation - initialPopulation;
  const percentChange = ((change / initialPopulation) * 100).toFixed(1);
  
  console.log(`Endbevölkerung: ${finalPopulation}`);
  console.log(`Veränderung: ${change > 0 ? '+' : ''}${change} (${percentChange}%)`);
  
  const stats = engine.getPopulationStats();
  console.log(`\nDemografische Kennzahlen:`);
  console.log(`  Geburtenrate: ${stats.demographics.birthRate.toFixed(2)} pro 1000`);
  console.log(`  Sterberate: ${stats.demographics.deathRate.toFixed(2)} pro 1000`);
  console.log(`  Wachstumsrate: ${stats.demographics.growthRate.toFixed(2)} pro 1000`);
  console.log(`  Lebenserwartung: ${stats.demographics.lifeExpectancy.toFixed(1)} Jahre`);
  console.log('\n');
  
  return engine;
}

/**
 * Demo 3: Soziale Netzwerke
 */
function demo3_socialNetworks(engine: GameEngine) {
  console.log('=== Demo 3: Soziale Netzwerke ===\n');
  
  const socialSystem = engine.getSocialNetworkSystem();
  const citizenSystem = engine.getCitizenSystem();
  
  // Generiere soziale Beziehungen
  console.log('Generiere soziale Beziehungen...');
  socialSystem.generateSocialRelations(citizenSystem, 1205);
  
  // Zähle Beziehungen
  const citizens = citizenSystem.getAllCitizens().filter(c => c.isAlive);
  let totalRelations = 0;
  let maxRelations = 0;
  let citizenWithMostFriends = null;
  
  for (const citizen of citizens) {
    const relationCount = citizen.socialRelations.length;
    totalRelations += relationCount;
    
    if (relationCount > maxRelations) {
      maxRelations = relationCount;
      citizenWithMostFriends = citizen;
    }
  }
  
  const avgRelations = (totalRelations / citizens.length).toFixed(1);
  
  console.log(`Durchschnittliche Beziehungen pro Bürger: ${avgRelations}`);
  console.log(`Maximum Beziehungen: ${maxRelations}`);
  
  if (citizenWithMostFriends) {
    console.log(`\nBürger mit den meisten Beziehungen:`);
    console.log(`  Name: ${citizenWithMostFriends.firstName} ${citizenWithMostFriends.lastName}`);
    console.log(`  Beruf: ${citizenWithMostFriends.profession}`);
    console.log(`  Beziehungen: ${citizenWithMostFriends.socialRelations.length}`);
    console.log(`  Charisma: ${citizenWithMostFriends.personality.charisma}/100`);
  }
  
  console.log('\n');
  return engine;
}

/**
 * Hauptfunktion - Führt alle Demos aus
 */
export function runAllDemos() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  Kaiser von Deutschland v2.1.5                 ║');
  console.log('║  Bevölkerungsdynamik - Demo                   ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  
  let engine = demo1_initializePopulation();
  engine = demo2_simulateDemographics(engine);
  engine = demo3_socialNetworks(engine);
  
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║  Alle Demos erfolgreich abgeschlossen!        ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  
  // Finale Statistiken
  const finalStats = engine.getPopulationStats();
  console.log('Finale Bevölkerungsstatistiken:');
  console.log(`  Gesamtbevölkerung: ${finalStats.total}`);
  console.log(`  Durchschnittsalter: ${finalStats.demographics.averageAge.toFixed(1)} Jahre`);
  console.log(`  Geburtenrate: ${finalStats.demographics.birthRate.toFixed(2)} pro 1000`);
  console.log(`  Aktive Bewegungen: ${finalStats.activeMovements.length}`);
  console.log('\n');
  
  return engine;
}

// For browser or Node.js execution
if (typeof window === 'undefined') {
  runAllDemos();
}
