import { getCookie } from 'h3';

const MESSIER_BASE = 'https://bluejack.binus.ac.id/lapi';
const ROOMBORROWING_URL = `${MESSIER_BASE}/API/Room/GetRoomBorrowingTransactionsByDate`
// const MESSIER_BASE = 'https://bluejack.binus.ac.id';
// const ROOMBORROWING_URL = `${MESSIER_BASE}/borrowing/api/booking/transactions/active`
const GETROOMS_URL = `${MESSIER_BASE}/API/Room/GetRooms`
const TRANSACTIONS_URL = `${MESSIER_BASE}/API/Room/GetTransactions`

export default defineEventHandler(async (event) => {
  const authUser = getCookie(event, 'auth_user');

  if (!authUser) {
    throw createError({ statusCode: 401, message: 'Not authenticated' });
  }

  let parsed: { token?: string };
  try {
    parsed = JSON.parse(authUser);
  } catch {
    throw createError({ statusCode: 401, message: 'Invalid auth cookie' });
  }

  if (!parsed.token) {
    throw createError({ statusCode: 401, message: 'No Messier token found' });
  }

//   const params = new URLSearchParams({
//     startDate: '2026-05-4T00:00:00',
//     endDate: '2026-05-4T23:59:59',
//     includeUnapproved: 'true',
//     includeOnsiteStatus: 'true',
//   });

    const params = new URLSearchParams({
    startDate: '2026-01-01T00:00:00',
    endDate: '2026-07-19T00:00:00',
    status:'All'
  });

  const response = await fetch(`${ROOMBORROWING_URL}?${params}`, {
    headers: {
      Authorization: `Bearer ${parsed.token}`,
      'Content-Type': 'application/json',
    },
  });

  console.log(response.status);
    console.log(response.url);

  const data = await response.json();

  return {
    status: response.status,
    ok: response.ok,
    data,
  };
});
