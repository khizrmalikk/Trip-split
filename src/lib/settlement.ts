/**
 * Smart settlement algorithm to minimize number of transactions
 * 
 * Example:
 * - Alice paid $100, owes $40 → net: +$60 (creditor)
 * - Bob paid $20, owes $60 → net: -$40 (debtor)
 * - Charlie paid $30, owes $50 → net: -$20 (debtor)
 * 
 * Settlement:
 * 1. Bob pays Alice $40
 * 2. Charlie pays Alice $20
 * Done in 2 transactions (instead of potential 6)
 */

export interface Balance {
  userId: string;
  userName: string;
  net: number; // positive = owed money, negative = owes money
}

export interface Settlement {
  from: string; // userId
  fromName: string;
  to: string; // userId
  toName: string;
  amount: number;
}

export function calculateSettlements(balances: Balance[]): Settlement[] {
  const settlements: Settlement[] = [];
  
  // Separate into debtors and creditors
  const debtors = balances.filter(b => b.net < 0).map(b => ({ ...b }));
  const creditors = balances.filter(b => b.net > 0).map(b => ({ ...b }));
  
  // Sort by absolute value (largest first)
  debtors.sort((a, b) => a.net - b.net); // most negative first
  creditors.sort((a, b) => b.net - a.net); // most positive first
  
  let i = 0; // debtor index
  let j = 0; // creditor index
  
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    
    const debtAmount = Math.abs(debtor.net);
    const creditAmount = creditor.net;
    
    const settlementAmount = Math.min(debtAmount, creditAmount);
    
    // Create settlement transaction
    settlements.push({
      from: debtor.userId,
      fromName: debtor.userName,
      to: creditor.userId,
      toName: creditor.userName,
      amount: Number(settlementAmount.toFixed(2)),
    });
    
    // Update balances
    debtor.net += settlementAmount;
    creditor.net -= settlementAmount;
    
    // Move to next if settled
    if (Math.abs(debtor.net) < 0.01) i++;
    if (Math.abs(creditor.net) < 0.01) j++;
  }
  
  return settlements;
}
