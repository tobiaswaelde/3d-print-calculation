import { z } from 'zod';

const integrationUrlSchema = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return (
        ['http:', 'https:'].includes(url.protocol) &&
        !url.username &&
        !url.password &&
        !url.search &&
        !url.hash
      );
    } catch {
      return false;
    }
  }, 'validation.integrationUrl');

const credentialSchema = z
  .string()
  .trim()
  .max(4096)
  .nullable()
  .optional()
  .transform((value) => (value === undefined ? undefined : value || null));

export const integrationSettingsSchema = z.object({
  spoolman: z.object({
    enabled: z.boolean(),
    url: integrationUrlSchema,
    authorization: credentialSchema,
  }),
  bambubuddy: z.object({
    enabled: z.boolean(),
    url: integrationUrlSchema,
    apiKey: credentialSchema,
  }),
});

export type IntegrationSettingsInput = z.input<typeof integrationSettingsSchema>;

export interface IntegrationSettingsDto {
  spoolman: {
    enabled: boolean;
    url: string;
    authorizationConfigured: boolean;
  };
  bambubuddy: {
    enabled: boolean;
    url: string;
    apiKeyConfigured: boolean;
  };
}
