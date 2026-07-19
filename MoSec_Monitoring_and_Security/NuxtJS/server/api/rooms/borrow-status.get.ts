import { getActiveBorrowings } from '~~/server/utils/borrow-status';

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

  return await getActiveBorrowings(parsed.token);
});