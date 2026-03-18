import { Action, ActionPanel, Icon, List, Toast, showToast } from "@raycast/api";
import { useCallback, useEffect, useMemo, useState } from "react";
import { addFavoriteLayout, getFavoriteLayouts, removeFavoriteLayout } from "./favorites";
import { applyLayout, listLayouts } from "./moom";

type DataState = {
  layouts: string[];
  favorites: string[];
  isLoading: boolean;
  error?: string;
};

export default function ListLayoutCommand() {
  const [state, setState] = useState<DataState>({
    layouts: [],
    favorites: [],
    isLoading: true,
  });

  const loadData = useCallback(async () => {
    setState((previous) => ({ ...previous, isLoading: true, error: undefined }));

    try {
      const [layouts, favorites] = await Promise.all([listLayouts(), getFavoriteLayouts()]);
      setState({ layouts, favorites, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setState({ layouts: [], favorites: [], isLoading: false, error: message });
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const favoritesSet = useMemo(() => new Set(state.favorites), [state.favorites]);
  const favoriteLayouts = useMemo(
    () => state.favorites.filter((name) => state.layouts.includes(name)),
    [state.favorites, state.layouts],
  );
  const otherLayouts = useMemo(
    () => state.layouts.filter((name) => !favoritesSet.has(name)),
    [state.layouts, favoritesSet],
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

  const onAddFavorite = useCallback(async (name: string) => {
    try {
      const updated = await addFavoriteLayout(name);
      setState((previous) => ({ ...previous, favorites: updated }));
      await showToast({ style: Toast.Style.Success, title: `Added favorite: ${name}` });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await showToast({ style: Toast.Style.Failure, title: "Failed to save favorite", message });
    }
  }, []);

  const onRemoveFavorite = useCallback(async (name: string) => {
    try {
      const updated = await removeFavoriteLayout(name);
      setState((previous) => ({ ...previous, favorites: updated }));
      await showToast({ style: Toast.Style.Success, title: `Removed favorite: ${name}` });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await showToast({ style: Toast.Style.Failure, title: "Failed to update favorite", message });
    }
  }, []);

  return (
    <List isLoading={state.isLoading} searchBarPlaceholder="Search Moom layouts..." isShowingDetail={false}>
      {state.error ? (
        <List.EmptyView
          title="Unable to load layouts"
          description={state.error}
          actions={
            <ActionPanel>
              <Action title="Retry" onAction={loadData} icon={Icon.ArrowClockwise} />
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
  return (
    <List.Item
      title={name}
      icon={isFavorite ? Icon.Star : Icon.Window}
      accessories={isFavorite ? [{ icon: Icon.Star, tooltip: "Favorite" }] : []}
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
