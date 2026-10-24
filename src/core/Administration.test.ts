import {describe,it,expect} from 'vitest';
import {administrationBudget,defaultAdministration,validateAdministration} from './Administration';
import {Kingdom} from './Kingdom';
import {developGarrison,garrisonDevelopment} from './GarrisonDevelopment';
import {TreasuryLedger,validateTreasuryReport} from './TreasuryLedger';

describe('Delegated spending and treasury accounting',()=>{
  it('defaults to manual, scales risk and refuses malformed persisted controls',()=>{
    const k=new Kingdom({name:'Geest',rulerName:'Test'});k.resources.gold=50000;
    expect(Object.values(defaultAdministration().domains).some(Boolean)).toBe(false);
    expect(administrationBudget(k,'safe').budget).toBeLessThan(administrationBudget(k,'normal').budget);
    expect(administrationBudget(k,'normal').budget).toBeLessThan(administrationBudget(k,'bold').budget);
    k.resources.gold=100;
    expect(administrationBudget(k,'bold').budget).toBe(0);
    expect(()=>validateAdministration({policy:'reckless',domains:{}})).toThrow();
    const legacy=JSON.parse(JSON.stringify(defaultAdministration()));delete legacy.characterPlan;delete legacy.domains.character;
    expect(validateAdministration(legacy)).toEqual(defaultAdministration());
    expect(()=>validateAdministration({...defaultAdministration(),characterPlan:'unknown'})).toThrow();
  });
  it('records a clamped depletion and rejects unaccounted gold',()=>{
    const ledger=new TreasuryLedger('Januar',50);
    ledger.checkpoint('Unterhalt',0);ledger.checkpoint('Handel',20);
    const report=ledger.report();
    expect(report.entries).toEqual([{reason:'Unterhalt',amount:-50},{reason:'Handel',amount:20}]);
    expect(validateTreasuryReport(report)).toEqual(report);
    expect(()=>validateTreasuryReport({...report,closing:30})).toThrow();
  });
  it('charges era-appropriate equipment once, caps the gain and blocks empty armies',()=>{
    const k=new Kingdom({name:'Geest',rulerName:'Test'});
    k.military.equipmentQuality=98;k.resources.gold=10000;k.resources.wood=10000;k.resources.iron=10000;
    const option=garrisonDevelopment(k,-1999).find(p=>p.id==='equipment')!;
    const gold=k.resources.gold,iron=k.resources.iron;
    expect(option.cost.iron).toBe(0);
    developGarrison(k,-1999,'equipment');
    expect(k.resources.gold).toBe(gold-option.cost.gold);expect(k.resources.iron).toBe(iron);
    expect(k.military.equipmentQuality).toBe(100);
    expect(()=>developGarrison(k,-1999,'equipment')).toThrow();
    k.military.infantry=k.military.archers=k.military.cavalry=0;
    expect(garrisonDevelopment(k,2000).every(p=>!p.available)).toBe(true);
  });
});
