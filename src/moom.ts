import { runAppleScript } from "@raycast/utils";

export class MoomError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MoomError";
  }
}

function buildErrorMessage(rawError: unknown): string {
  const message = rawError instanceof Error ? rawError.message : String(rawError);

  if (message.includes("Application isn't running") || message.includes('Can\'t get application "Moom"')) {
    return "Moom is not running. Start Moom and try again.";
  }

  if (message.includes("Not authorized") || message.includes("-1743")) {
    return "Raycast is not allowed to control Moom. Enable Automation permissions in System Settings > Privacy & Security > Automation.";
  }

  return `Moom AppleScript failed: ${message}`;
}

export async function listLayouts(): Promise<string[]> {
  try {
    const result = await runAppleScript(`
      tell application "Moom"
        set layoutList to list of layouts
        set AppleScript's text item delimiters to linefeed
        return layoutList as text
      end tell
    `);

    return result
      .split("\n")
      .map((name) => name.trim())
      .filter(Boolean);
  } catch (error) {
    throw new MoomError(buildErrorMessage(error));
  }
}

export async function applyLayout(name: string): Promise<void> {
  const escapedName = name.replaceAll('"', '\\"');

  try {
    await runAppleScript(`
      tell application "Moom"
        apply layout "${escapedName}"
      end tell
    `);
  } catch (error) {
    throw new MoomError(buildErrorMessage(error));
  }
}

export async function saveLayout(name: string, mode: "replace" | "merge"): Promise<void> {
  const escapedName = name.replaceAll('"', '\\"');
  const command = mode === "replace" ? "save layout and replace" : "save layout and merge with";

  try {
    await runAppleScript(`
      tell application "Moom"
        ${command} "${escapedName}"
      end tell
    `);
  } catch (error) {
    throw new MoomError(buildErrorMessage(error));
  }
}
