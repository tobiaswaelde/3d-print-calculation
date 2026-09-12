import { z } from 'zod';

export const restoreAuthorizationSchema = z.object({ password: z.string().min(1).max(256) });

export type RestoreStatus = 'pending' | 'succeeded' | 'rolled_back';
