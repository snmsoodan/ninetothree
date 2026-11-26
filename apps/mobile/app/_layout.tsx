/**
 * The shell: read storage, then draw.
 *
 * Nothing renders until the store has its bytes, because a returning parent
 * must never see the welcome screen flash and disappear. The splash is held
 * for exactly that long — no minimum, no animation — and then the router takes
 * over.
 */
import { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Screen, Skeleton, ThemeProvider, useTheme } from "@ninetothree/ui-native";
import { bootStorage } from "../src/boot";
import { StoreProvider, type AppStore } from "../src/store-context";
import { SessionProvider } from "../src/session-context";
import { STACK_SCREENS } from "../src/routes";
import { HelpButton } from "../src/triage-screen";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [app, setApp] = useState<AppStore | null>(null);

  useEffect(() => {
    let alive = true;
    void bootStorage(AsyncStorage).then((booted) => {
      if (!alive) return;
      setApp({ store: booted.store, io: booted.io });
      void SplashScreen.hideAsync();
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar style="auto" />
        {app ? (
          <StoreProvider value={app}>
            <SessionProvider>
              <RootStack />
            </SessionProvider>
          </StoreProvider>
        ) : (
          <BootSplash />
        )}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootStack() {
  const theme = useTheme();
  const router = useRouter();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.color.paper },
        headerTintColor: theme.color.ink,
        headerTitleStyle: { color: theme.color.ink, fontWeight: "500" },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.color.paper },
        // The same corner, on every screen the tabs do not own: a week opened
        // from a texted link gets the help button too.
        headerRight: () => <HelpButton onPress={() => router.push("/safety")} />,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {STACK_SCREENS.map((screen) => (
        <Stack.Screen
          key={screen.path}
          name={screen.path.replace(/^\//, "")}
          options={{ title: screen.title }}
        />
      ))}
    </Stack>
  );
}

/** Paper and a skeleton, so the first frame is the app's colour rather than white. */
function BootSplash() {
  return (
    <Screen scroll={false} testID="boot-splash">
      <Skeleton height={28} width="60%" />
      <Skeleton height={16} width="85%" />
      <Skeleton height={16} width="70%" />
    </Screen>
  );
}
