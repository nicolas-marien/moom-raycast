import { Action, ActionPanel, Icon, List, Toast, showToast } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useCallback } from "react";
import { getFavoriteLayouts, removeFavoriteLayout, setFavoriteLayouts } from "./favorites";
import { applyLayout, listLayouts } from "./moom";
import { useLayoutEmoji } from "./use-layout-emoji";

type FavoritesData = {
  favorites: string[];
};

async function loadFavoriteLayouts(): Promise<FavoritesData> {
  const [allLayouts, favorites] = await Promise.all([listLayouts(), getFavoriteLayouts()]);
  const validFavorites = favorites.filter((name) => allLayouts.includes(name));

  if (validFavorites.length !== favorites.length) {
    await setFavoriteLayouts(validFavorites);
  }

  return { favorites: validFavorites };
}

export default function ApplyFavoriteLayoutCommand() {
  const { data, isLoading, error, revalidate } = useCachedPromise(loadFavoriteLayouts, [], {
    initialData: { favorites: [] },
    keepPreviousData: true,
  });

  const onApply = useCallback(async (name: string) => {
    try {
      await applyLayout(name);
      await showToast({ style: Toast.Style.Success, title: `Applied layout: ${name}` });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await showToast({ style: Toast.Style.Failure, title: "Failed to apply favorite", message });
    }
  }, []);

  const onRemove = useCallback(
    async (name: string) => {
      try {
        await removeFavoriteLayout(name);
        revalidate();
        await showToast({ style: Toast.Style.Success, title: `Removed favorite: ${name}` });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await showToast({ style: Toast.Style.Failure, title: "Failed to update favorite", message });
      }
    },
    [revalidate],
  );

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search favorite layouts...">
      {error ? (
        <List.EmptyView
          title="Unable to load favorites"
          description={error.message}
          actions={
            <ActionPanel>
              <Action title="Retry" onAction={revalidate} icon={Icon.ArrowClockwise} />
            </ActionPanel>
          }
        />
      ) : data.favorites.length === 0 ? (
        <List.EmptyView
          icon={Icon.Star}
          title="No favorite layouts yet"
          description="Open “List Layouts” and add favorites with Command+F."
        />
      ) : (
        data.favorites.map((name) => (
          <FavoriteLayoutItem key={name} name={name} onApply={onApply} onRemove={onRemove} />
        ))
      )}
    </List>
  );
}

type FavoriteLayoutItemProps = {
  name: string;
  onApply: (name: string) => Promise<void>;
  onRemove: (name: string) => Promise<void>;
};

function FavoriteLayoutItem({ name, onApply, onRemove }: FavoriteLayoutItemProps) {
  const emoji = useLayoutEmoji(name);

  return (
    <List.Item
      key={name}
      title={name}
      icon={{ source: emoji }}
      actions={
        <ActionPanel>
          <Action title="Apply Layout" onAction={() => onApply(name)} icon={Icon.Play} />
          <Action
            title="Remove from Favorites"
            onAction={() => onRemove(name)}
            icon={Icon.Trash}
            shortcut={{ modifiers: ["cmd"], key: "f" }}
          />
        </ActionPanel>
      }
    />
  );
}
