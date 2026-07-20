import { getCookie } from 'h3';

const MESSIER_BASE = 'https://bluejack.binus.ac.id/lapi';

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

  const params = new URLSearchParams({
    startDate: '2026-06-10T00:00:00',
    endDate: '2026-06-10T23:59:59',
    includeUnapproved: 'true',
    includeOnsiteStatus: 'true',
  });

  const response = await fetch(`${MESSIER_BASE}/API/Room/GetTransactions?${params}`, {
    headers: {
      Authorization: `Bearer ${parsed.token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  return {
    status: response.status,
    ok: response.ok,
    data,
  };
});
