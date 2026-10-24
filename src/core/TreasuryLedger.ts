export interface TreasuryEntry { reason: string; amount: number }
export interface TreasuryReport { date: string; opening: number; closing: number; entries: TreasuryEntry[] }
/** Reconcile actual treasury mutations, including clamped shortages and random events. */
export class TreasuryLedger {
  private balance: number;
  private entries: TreasuryEntry[]=[];
  constructor(private date:string,private opening:number) {this.balance=opening;}
  public checkpoint(reason:string,balance:number):void {
    if(!Number.isFinite(balance))throw Error('Ungültiger Kassenbestand nach '+reason);
    const amount=balance-this.balance;
    if(Math.abs(amount)>.000001)this.entries.push({reason,amount});
    this.balance=balance;
  }
  public report():TreasuryReport {return {date:this.date,opening:this.opening,closing:this.balance,entries:this.entries.map(e=>({...e}))};}
}
export function validateTreasuryReport(value:unknown):TreasuryReport {
  const r=value as TreasuryReport;
  if(!r||typeof r.date!=='string'||r.date.length>60||!Number.isFinite(r.opening)||!Number.isFinite(r.closing)||
    !Array.isArray(r.entries)||r.entries.length>50||r.entries.some(e=>!e||typeof e.reason!=='string'||e.reason.length>250||!Number.isFinite(e.amount))||
    Math.abs(r.opening+r.entries.reduce((sum,e)=>sum+e.amount,0)-r.closing)>.01)throw Error('Beschädigte Kassenabrechnung im Spielstand.');
  return structuredClone(r);
}
