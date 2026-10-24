import type { Kingdom } from './Kingdom';

export const ADMIN_DOMAINS = ['economy','construction','research','military','culture','civic'] as const;
export type AdministrationDomain = typeof ADMIN_DOMAINS[number];
export type AdministrationPolicy = 'safe'|'normal'|'bold';
export interface AdministrationPreferences {
  policy: AdministrationPolicy;
  domains: Record<AdministrationDomain,boolean>;
}
export const ADMIN_LABELS:Record<AdministrationDomain,string> = {
  economy:'Wirtschaft & Vorräte',construction:'Bau & Modernisierung',research:'Forschung',
  military:'Garnison & Ausbildung',culture:'Kultur & Zusammenhalt',civic:'Bürgeraufträge'
};
export const ADMIN_POLICIES = {
  safe:{label:'Sicher',months:6,fraction:.05,tax:.12},
  normal:{label:'Normal',months:3,fraction:.12,tax:.15},
  bold:{label:'Gewagt',months:1,fraction:.25,tax:.20}
} as const;
export function defaultAdministration():AdministrationPreferences {
  return {policy:'safe',domains:{economy:false,construction:false,research:false,military:false,culture:false,civic:false}};
}
export function validateAdministration(value:unknown):AdministrationPreferences {
  const p=value as AdministrationPreferences;
  if(!p||!Object.prototype.hasOwnProperty.call(ADMIN_POLICIES,p.policy)||!p.domains||
    ADMIN_DOMAINS.some(key=>typeof p.domains[key]!=='boolean'))throw Error('Ungültige Verwaltungsautomatik.');
  return {policy:p.policy,domains:Object.fromEntries(ADMIN_DOMAINS.map(key=>[key,p.domains[key]])) as AdministrationPreferences['domains']};
}
/** One shared discretionary budget per month. Income never replenishes this allowance. */
export function administrationBudget(kingdom:Kingdom,policy:AdministrationPolicy):{reserve:number;budget:number;foodReserve:number} {
  const rules=ADMIN_POLICIES[policy],balance=kingdom.getMonthlyBalance();
  const reserve=Math.max(500,Math.ceil(balance.consumption.gold*rules.months));
  return {reserve,budget:Math.floor(Math.max(0,kingdom.resources.gold-reserve)*rules.fraction),
    foodReserve:Math.max(300,Math.ceil(balance.consumption.food*rules.months))};
}
