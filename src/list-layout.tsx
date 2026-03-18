import { Action, ActionPanel, Icon, List, Toast, showToast } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useCallback, useMemo } from "react";
import { addFavoriteLayout, getFavoriteLayouts, removeFavoriteLayout } from "./favorites";
import { applyLayout, listLayouts } from "./moom";
import { useLayoutEmoji } from "./use-layout-emoji";

type LayoutsData = {
  layouts: string[];
  favorites: string[];
};

async function loadLayoutsAndFavorites(): Promise<LayoutsData> {
  const [layouts, favorites] = await Promise.all([listLayouts(), getFavoriteLayouts()]);
  return { layouts, favorites };
}

export default function ListLayoutCommand() {
  const { data, isLoading, error, revalidate } = useCachedPromise(loadLayoutsAndFavorites, [], {
    initialData: { layouts: [], favorites: [] },
    keepPreviousData: true,
  });

  const favoritesSet = useMemo(() => new Set(data.favorites), [data.favorites]);
  const favoriteLayouts = useMemo(
    () => data.favorites.filter((name) => data.layouts.includes(name)),
    [data.favorites, data.layouts],
  );
  const otherLayouts = useMemo(
    () => data.layouts.filter((name) => !favoritesSet.has(name)),
    [data.layouts, favoritesSet],
  );

  const onApplyLayout = useCallback(async (name: string) => {
    try {
      await applyLayout(name);
      await showToast({ style: Toast.Style.Success, title: `Applied layout: ${name}` });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await showToast({ style: Toast.Style.Failure, title: "Failed to apply layout", message });
    }
  }, []);

  const onAddFavorite = useCallback(
    async (name: string) => {
      try {
        await addFavoriteLayout(name);
        revalidate();
        await showToast({ style: Toast.Style.Success, title: `Added favorite: ${name}` });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await showToast({ style: Toast.Style.Failure, title: "Failed to save favorite", message });
      }
    },
    [revalidate],
  );

  const onRemoveFavorite = useCallback(
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
    <List isLoading={isLoading} searchBarPlaceholder="Search Moom layouts..." isShowingDetail={false}>
      {error ? (
        <List.EmptyView
          title="Unable to load layouts"
          description={error.message}
          actions={
            <ActionPanel>
              <Action title="Retry" onAction={revalidate} icon={Icon.ArrowClockwise} />
            </ActionPanel>
          }
        />
      ) : (
        <>
          {favoriteLayouts.length > 0 ? (
            <List.Section title="Favorites">
              {favoriteLayouts.map((name) => (
                <LayoutItem
                  key={`favorite-${name}`}
                  name={name}
                  isFavorite
                  onApply={onApplyLayout}
                  onAddFavorite={onAddFavorite}
                  onRemoveFavorite={onRemoveFavorite}
                />
              ))}
            </List.Section>
          ) : null}

          <List.Section title="All Layouts">
            {otherLayouts.length > 0 ? (
              otherLayouts.map((name) => (
                <LayoutItem
                  key={`layout-${name}`}
                  name={name}
                  isFavorite={false}
                  onApply={onApplyLayout}
                  onAddFavorite={onAddFavorite}
                  onRemoveFavorite={onRemoveFavorite}
                />
              ))
            ) : (
              <List.Item title="No layouts found" icon={Icon.ExclamationMark} />
            )}
          </List.Section>
        </>
      )}
    </List>
  );
}

type LayoutItemProps = {
  name: string;
  isFavorite: boolean;
  onApply: (name: string) => Promise<void>;
  onAddFavorite: (name: string) => Promise<void>;
  onRemoveFavorite: (name: string) => Promise<void>;
};

function LayoutItem({ name, isFavorite, onApply, onAddFavorite, onRemoveFavorite }: LayoutItemProps) {
  const emoji = useLayoutEmoji(name);

  return (
    <List.Item
      title={name}
      icon={{ source: emoji }}
      actions={
        <ActionPanel>
          <Action title="Apply Layout" onAction={() => onApply(name)} icon={Icon.Play} />
          {isFavorite ? (
            <Action
              title="Remove from Favorites"
              onAction={() => onRemoveFavorite(name)}
              icon={Icon.Trash}
              shortcut={{ modifiers: ["cmd"], key: "f" }}
            />
          ) : (
            <Action
              title="Add to Favorites"
              onAction={() => onAddFavorite(name)}
              icon={Icon.Star}
              shortcut={{ modifiers: ["cmd"], key: "f" }}
            />
          )}
        </ActionPanel>
      }
    />
  );
}
