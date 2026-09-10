import { requireUser } from '../utils/auth';

const releasesUrl = 'https://api.github.com/repos/tobiaswaelde/ezprint/releases/latest';
const cacheTtl = 5 * 60 * 1000;
let cached: { latest: string | null; timestamp: number } | null = null;
let pending: Promise<{ latest: string | null }> | null = null;

async function fetchLatestVersion() {
  try {
    const response = await fetch(releasesUrl, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'ezprint',
      },
    });
    if (!response.ok) return { latest: null };
    const release = (await response.json()) as { tag_name?: string };
    return { latest: release.tag_name?.replace(/^v/, '') ?? null };
  } catch {
    return { latest: null };
  }
}

export default defineEventHandler(async (event) => {
  await requireUser(event);
  if (cached && Date.now() - cached.timestamp < cacheTtl) return { latest: cached.latest };

  pending ??= fetchLatestVersion().finally(() => {
    pending = null;
  });
  const result = await pending;
  if (result.latest) cached = { latest: result.latest, timestamp: Date.now() };
  return result;
});
