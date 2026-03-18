import { Action, ActionPanel, Alert, Form, Icon, Toast, confirmAlert, showToast } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useCallback } from "react";
import { listLayouts, saveLayout } from "./moom";

type SaveFormValues = {
  name: string;
  mode: "replace" | "merge";
};

export default function SaveCurrentLayoutCommand() {
  const { data: layouts, revalidate } = useCachedPromise(listLayouts, [], {
    initialData: [],
    keepPreviousData: true,
  });

  const handleSubmit = useCallback(
    async (values: SaveFormValues) => {
      const name = values.name.trim();

      if (!name) {
        await showToast({ style: Toast.Style.Failure, title: "Layout name is required" });
        return;
      }

      const savingToast = await showToast({
        style: Toast.Style.Animated,
        title: `Saving layout: ${name}`,
      });

      try {
        const existingLayouts = await listLayouts();
        const alreadyExists = existingLayouts.some((layoutName) => layoutName === name);

        if (values.mode === "replace" && alreadyExists) {
          const confirmed = await confirmAlert({
            icon: Icon.ExclamationMark,
            title: `Replace existing layout "${name}"?`,
            message: "This will overwrite the saved layout with your currently visible windows.",
            primaryAction: {
              title: "Replace",
              style: Alert.ActionStyle.Destructive,
            },
            dismissAction: {
              title: "Cancel",
              style: Alert.ActionStyle.Cancel,
            },
          });

          if (!confirmed) {
            savingToast.style = Toast.Style.Success;
            savingToast.title = "Save cancelled";
            return;
          }
        }

        await saveLayout(name, values.mode);
        savingToast.style = Toast.Style.Success;
        savingToast.title = values.mode === "replace" ? `Saved (replace): ${name}` : `Saved (merge): ${name}`;
        revalidate();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        savingToast.style = Toast.Style.Failure;
        savingToast.title = "Failed to save layout";
        savingToast.message = message;
      }
    },
    [revalidate],
  );

  return (
    <Form
      navigationTitle="Save Current Layout"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save Layout" icon={Icon.Download} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="name"
        title="Layout Name"
        placeholder="e.g. Writing Focus"
        info="Uses currently visible windows in Moom"
      />
      <Form.Dropdown id="mode" title="Save Mode" defaultValue="replace">
        <Form.Dropdown.Item value="replace" title="Replace" icon={Icon.ArrowClockwise} />
        <Form.Dropdown.Item value="merge" title="Merge" icon={Icon.Plus} />
      </Form.Dropdown>
      <Form.Description text={`Known layouts: ${layouts.length}`} />
    </Form>
  );
}
