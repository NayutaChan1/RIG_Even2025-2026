import { testConnection } from '../utils/db';

export default defineEventHandler(async (event) => {
    const result = await testConnection();
    return result;
});