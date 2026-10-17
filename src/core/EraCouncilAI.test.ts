import { describe, expect, it } from 'vitest';
import { COUNCIL_DECISIONS, CouncilDecisionSystem } from './CouncilDecisionSystem';
import { Kingdom } from './Kingdom';
import type { Player } from './Player';
import { CouncilAdvisor } from './CouncilAdvisor';

const ruler = () => {
  const kingdom = new Kingdom({ name:'Testreich',rulerName:'Anna',foundingYear:1200 });
  return { id:'ruler',kingdom,updateStats:() => undefined } as unknown as Player;
};
describe('Historischer Reichsrat und Bürgerdelegation', () => {
  it('has newer crises with explicit periods', () => {
    expect(COUNCIL_DECISIONS.find(d => d.id==='cyber_incident')?.minYear).toBe(2000);
    expect(COUNCIL_DECISIONS.find(d => d.id==='railway_works')?.minYear).toBe(1820);
    expect(COUNCIL_DECISIONS.find(d => d.id==='noble_wedding')?.maxYear).toBe(1900);
  });
  it('remembers who was delegated a council resolution', () => {
    const council = new CouncilDecisionSystem(() => 0);
    const player = ruler(); council.tryGenerate(player,1200,5,1200);
    const choice = council.getChoices(player).find(c => c.affordable);
    expect(choice).toBeDefined();
    const entry = council.resolve(player,choice!.id,1200,5,{id:'citizen-1',name:'Anna Müller'});
    expect(entry.delegatedCitizenName).toBe('Anna Müller');
    expect(council.serialize().history[0].delegatedCitizenId).toBe('citizen-1');
  });
  it('rule adviser never selects an unaffordable choice', () => {
    expect(CouncilAdvisor.chooseByRules([{id:'a',affordable:false,probability:null},{id:'b',affordable:true,probability:0.6}])).toBe('b');
  });
});
