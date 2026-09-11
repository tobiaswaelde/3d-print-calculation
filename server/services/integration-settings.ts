import type { AppSettings } from '../../prisma/generated/client/client';
import type { IntegrationSettingsDto } from '#shared/schemas/integration-settings';
import { integrationSettingsSchema } from '#shared/schemas/integration-settings';
import { db } from '../utils/db';
import { apiError } from '../utils/http';
import { parseBody } from '../utils/validation';

export type IntegrationName = 'SPOOLMAN' | 'BAMBUBUDDY';

export interface EffectiveIntegrationConfig {
  enabled: boolean;
  url: string | null;
  credential: string | null;
}

function effectiveConfig(settings: AppSettings, name: IntegrationName): EffectiveIntegrationConfig {
  if (name === 'SPOOLMAN') {
    const url = settings.spoolmanUrl ?? process.env.SPOOLMAN_URL ?? null;
    return {
      enabled: settings.spoolmanEnabled ?? !!url,
      url,
      credential: settings.spoolmanAuthorization ?? process.env.SPOOLMAN_AUTHORIZATION ?? null,
    };
  }
  const url = settings.bambubuddyUrl ?? process.env.BAMBUBUDDY_URL ?? null;
  return {
    enabled: settings.bambubuddyEnabled ?? !!url,
    url,
    credential: settings.bambubuddyApiKey ?? process.env.BAMBUBUDDY_API_KEY ?? null,
  };
}

export async function getIntegrationConfig(name: IntegrationName) {
  const settings = await db.appSettings.findUniqueOrThrow({ where: { id: 1 } });
  return effectiveConfig(settings, name);
}

function dto(settings: AppSettings): IntegrationSettingsDto {
  const spoolman = effectiveConfig(settings, 'SPOOLMAN');
  const bambubuddy = effectiveConfig(settings, 'BAMBUBUDDY');
  return {
    spoolman: {
      enabled: spoolman.enabled,
      url: spoolman.url ?? '',
      authorizationConfigured: !!spoolman.credential,
    },
    bambubuddy: {
      enabled: bambubuddy.enabled,
      url: bambubuddy.url ?? '',
      apiKeyConfigured: !!bambubuddy.credential,
    },
  };
}

export async function readIntegrationSettings() {
  return dto(await db.appSettings.findUniqueOrThrow({ where: { id: 1 } }));
}

export async function updateIntegrationSettings(input: unknown) {
  const data = parseBody(integrationSettingsSchema, input);
  const current = await db.appSettings.findUniqueOrThrow({ where: { id: 1 } });
  const spoolmanUrl = data.spoolman.url || null;
  const bambubuddyUrl = data.bambubuddy.url || null;
  const spoolmanAuthorization =
    data.spoolman.authorization === undefined
      ? current.spoolmanAuthorization
      : data.spoolman.authorization || null;
  const bambubuddyApiKey =
    data.bambubuddy.apiKey === undefined ? current.bambubuddyApiKey : data.bambubuddy.apiKey || null;

  if (data.spoolman.enabled && !spoolmanUrl) apiError(422, 'INTEGRATION_CONFIG', 'errors.integrationConfig');
  if (data.bambubuddy.enabled && (!bambubuddyUrl || !(bambubuddyApiKey ?? process.env.BAMBUBUDDY_API_KEY)))
    apiError(422, 'INTEGRATION_CONFIG', 'errors.integrationConfig');

  return dto(
    await db.appSettings.update({
      where: { id: 1 },
      data: {
        spoolmanEnabled: data.spoolman.enabled,
        spoolmanUrl,
        spoolmanAuthorization,
        bambubuddyEnabled: data.bambubuddy.enabled,
        bambubuddyUrl,
        bambubuddyApiKey,
      },
    }),
  );
}
