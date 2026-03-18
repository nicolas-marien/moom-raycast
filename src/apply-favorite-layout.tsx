import { Action, ActionPanel, Icon, List, Toast, showToast } from "@raycast/api";
import { useCallback, useEffect, useState } from "react";
import { getFavoriteLayouts, removeFavoriteLayout, setFavoriteLayouts } from "./favorites";
import { applyLayout, listLayouts } from "./moom";

type State = {
  favorites: string[];
  isLoading: boolean;
  error?: string;
};

export default function ApplyFavoriteLayoutCommand() {
  const [state, setState] = useState<State>({ favorites: [], isLoading: true });

  const load = useCallback(async () => {
    setState((previous) => ({ ...previous, isLoading: true, error: undefined }));

    try {
      const [allLayouts, favorites] = await Promise.all([listLayouts(), getFavoriteLayouts()]);
      const validFavorites = favorites.filter((name) => allLayouts.includes(name));

      if (validFavorites.length !== favorites.length) {
        await setFavoriteLayouts(validFavorites);
        setState({ favorites: validFavorites, isLoading: false });
      } else {
        setState({ favorites, isLoading: false });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setState({ favorites: [], isLoading: false, error: message });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onApply = useCallback(async (name: string) => {
    try {
      await applyLayout(name);
      await showToast({ style: Toast.Style.Success, title: `Applied layout: ${name}` });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await showToast({ style: Toast.Style.Failure, title: "Failed to apply favorite", message });
    }
  }, []);

  const onRemove = useCallback(async (name: string) => {
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
    <List isLoading={state.isLoading} searchBarPlaceholder="Search favorite layouts...">
      {state.error ? (
        <List.EmptyView
          title="Unable to load favorites"
          description={state.error}
          actions={
            <ActionPanel>
              <Action title="Retry" onAction={load} icon={Icon.ArrowClockwise} />
            </ActionPanel>
          }
        />
      ) : state.favorites.length === 0 ? (
        <List.EmptyView
          icon={Icon.Star}
          title="No favorite layouts yet"
          description="Open “List Layouts” and add favorites with Command+F."
        />
      ) : (
        state.favorites.map((name) => (
          <List.Item
            key={name}
            title={name}
            icon={Icon.Star}
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
        ))
      )}
    </List>
  );
}
