import { useCachedPromise } from "@raycast/utils";
import { getCachedLayoutEmoji, getFallbackLayoutEmoji, suggestLayoutEmoji } from "./layout-emoji";

async function resolveLayoutEmoji(layoutName: string): Promise<string> {
  const cached = await getCachedLayoutEmoji(layoutName);
  if (cached) {
    return cached;
  }

  return suggestLayoutEmoji(layoutName);
}

export function useLayoutEmoji(layoutName: string): string {
  const { data } = useCachedPromise(resolveLayoutEmoji, [layoutName], {
    initialData: getFallbackLayoutEmoji(),
    keepPreviousData: true,
  });

  return data;
}
