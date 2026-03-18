import { AI, LocalStorage } from "@raycast/api";

const EMOJI_CACHE_KEY = "layout-emoji-cache-v1";
const FALLBACK_EMOJI = "❔";

type EmojiCache = Record<string, string>;

function normalizeLayoutName(name: string): string {
  return name.trim().toLocaleLowerCase();
}

function extractEmoji(value: string): string | undefined {
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

  for (const { segment } of segmenter.segment(value.trim())) {
    if (/\p{Extended_Pictographic}/u.test(segment)) {
      return segment;
    }
  }

  return undefined;
}

async function readCache(): Promise<EmojiCache> {
  const raw = await LocalStorage.getItem<string>(EMOJI_CACHE_KEY);

  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as EmojiCache;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
}

async function writeCache(cache: EmojiCache): Promise<void> {
  await LocalStorage.setItem(EMOJI_CACHE_KEY, JSON.stringify(cache));
}

export async function getCachedLayoutEmoji(layoutName: string): Promise<string | undefined> {
  const cache = await readCache();
  const key = normalizeLayoutName(layoutName);
  return cache[key];
}

export async function suggestLayoutEmoji(layoutName: string): Promise<string> {
  const key = normalizeLayoutName(layoutName);
  const cache = await readCache();
  const cached = cache[key];

  if (cached) {
    return cached;
  }

  try {
    const response = await AI.ask(
      `You select one emoji for a macOS window layout name. Reply with exactly one emoji and nothing else. Layout name: ${layoutName}`,
    );
    const emoji = extractEmoji(response);

    if (emoji) {
      const updatedCache = { ...cache, [key]: emoji };
      await writeCache(updatedCache);
      return emoji;
    }
  } catch {
    return FALLBACK_EMOJI;
  }

  return FALLBACK_EMOJI;
}

export function getFallbackLayoutEmoji(): string {
  return FALLBACK_EMOJI;
}
