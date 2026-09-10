import { getSessionUser } from '../../utils/auth';

export default defineEventHandler(async (event) => ({ user: await getSessionUser(event) }));
