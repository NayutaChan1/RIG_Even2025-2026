const MESSIER_BASE = 'https://bluejack.binus.ac.id';
const ROOMBORROWING_URL = `${MESSIER_BASE}/borrowing/api/booking/transactions/active`

function todayRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return {
    startDate: `${y}-${m}-${d}T00:00:00`,
    endDate: `${y}-${m}-${d}T23:59:59`,
  };
}

export async function getActiveBorrowings(token: string) {
  
  const { startDate, endDate } = todayRange();

  const params = new URLSearchParams({
    startDate,
    endDate,
    includeUnapproved: 'true',
    includeOnsiteStatus: 'true',
  });

  const response = await fetch(`${ROOMBORROWING_URL}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Messier API error: ${response.status}`);
  }

  let rawData = await response.json();
  rawData = rawData.data;
  const transactions = Array.isArray(rawData) ? rawData : [];
  console.log(transactions);

  return transactions.map(tx => ({
    id: tx.id,
    roomNumber: tx.roomNumber,
    roomIn: tx.roomIn,
    roomOut: tx.roomOut,
    borrower: {
      username: tx.borrowerUsername,
      division: tx.borrowerDivision,
      identityCode: tx.borrowerIdentityCode,
    },
    returner: {
      username: tx.returnerUsername,
      division: tx.returnerDivision,
      identityCode: tx.returnerIdentityCode,
    },
  }));
}
