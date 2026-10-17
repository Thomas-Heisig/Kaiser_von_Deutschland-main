import { describe, it, expect } from 'vitest';
import { chooseCitizenCouncilOption } from './CitizenCouncilChoice';
import type { Citizen } from './CitizenSystem';
import type { CouncilChoiceOffer } from './CouncilDecisionSystem';

const citizen = (profession: Citizen['profession']) => ({
  profession, skills:{trading:90,craftsmanship:30,agriculture:30,combat:10,literacy:30,leadership:30,diplomacy:30,medicine:30},
  personality:{courage:20,intelligence:60,charisma:60,ambition:80,loyalty:60,creativity:50,discipline:70,compassion:40},
  reputation:60
}) as Pick<Citizen,'profession'|'skills'|'personality'|'reputation'>;
const choice = (id:string,gold:number,cost=0):CouncilChoiceOffer => ({
  id,title:id,description:id,cost:{gold:cost},effect:{gold},affordable:true,probability:null
});
describe('Bürgerentscheidung nach Persönlichkeit',()=>{
 it('selects a financially feasible trade option using professional knowledge',()=>{
  const options=[choice('gain',800),choice('other',100),{...choice('rich',5000),affordable:false}];
  expect(chooseCitizenCouncilOption(citizen('merchant'),{category:'HANDEL'},options)).toBe('gain');
 });
 it('never picks unaffordable decisions and refuses an empty selection',()=>{
  const options=[{...choice('bad',3000),affordable:false},choice('safe',100)];
  expect(chooseCitizenCouncilOption(citizen('farmer'),{category:'VERSORGUNG'},options)).toBe('safe');
  expect(()=>chooseCitizenCouncilOption(citizen('farmer'),{category:'VERSORGUNG'},[])).toThrow('finanzierbare');
 });
});
