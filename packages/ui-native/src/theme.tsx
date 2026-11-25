import { createContext, useContext, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { themeFor, type NativeTheme, type ThemeMode } from "@ninetothree/tokens";

/**
 * The tokens, handed down the tree.
 *
 * React Native has no cascade, so the only way a button knows what `ink` is
 * without every screen passing colours around is a context. The default value
 * is the light theme, not an error: a primitive rendered outside a provider —
 * in a test, in a modal's new root, in a share extension — should still draw.
 */
const ThemeContext = createContext<NativeTheme>(themeFor("light"));

export interface ThemeProviderProps {
  /** Omit to follow the system. Native reports it as `useColorScheme()`. */
  mode?: ThemeMode;
  children: ReactNode;
}

/** Explicit choice wins; otherwise the lamp follows the room. */
export function resolveMode(mode: ThemeMode | undefined, system: string | null): ThemeMode {
  return mode ?? (system === "dark" ? "dark" : "light");
}

export function ThemeProvider({ mode, children }: ThemeProviderProps) {
  const resolved = resolveMode(mode, useColorScheme());
  return <ThemeContext.Provider value={themeFor(resolved)}>{children}</ThemeContext.Provider>;
}

export function useTheme(): NativeTheme {
  return useContext(ThemeContext);
}
