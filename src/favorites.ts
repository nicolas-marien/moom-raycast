import { LocalStorage } from "@raycast/api";

const FAVORITES_KEY = "favorite-layouts";

type FavoriteLayouts = {
  names: string[];
};

async function readFavorites(): Promise<FavoriteLayouts> {
  const raw = await LocalStorage.getItem<string>(FAVORITES_KEY);

  if (!raw) {
    return { names: [] };
  }

  try {
    const parsed = JSON.parse(raw) as FavoriteLayouts;
    if (!Array.isArray(parsed.names)) {
      return { names: [] };
    }

    return { names: parsed.names.filter((name) => typeof name === "string" && name.trim().length > 0) };
  } catch {
    return { names: [] };
  }
}

async function writeFavorites(names: string[]): Promise<void> {
  const value: FavoriteLayouts = { names };
  await LocalStorage.setItem(FAVORITES_KEY, JSON.stringify(value));
}

export async function getFavoriteLayouts(): Promise<string[]> {
  const { names } = await readFavorites();
  return names;
}

export async function setFavoriteLayouts(names: string[]): Promise<string[]> {
  const cleaned = names.filter((name, index, all) => name.trim().length > 0 && all.indexOf(name) === index);
  await writeFavorites(cleaned);
  return cleaned;
}

export async function addFavoriteLayout(name: string): Promise<string[]> {
  const favorites = await getFavoriteLayouts();
  const withoutName = favorites.filter((favorite) => favorite !== name);
  const updated = [name, ...withoutName];
  return setFavoriteLayouts(updated);
}

export async function removeFavoriteLayout(name: string): Promise<string[]> {
  const favorites = await getFavoriteLayouts();
  const updated = favorites.filter((favorite) => favorite !== name);
  return setFavoriteLayouts(updated);
}
