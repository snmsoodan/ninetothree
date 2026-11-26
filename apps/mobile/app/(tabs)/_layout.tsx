/**
 * Five tabs, the same five the web's header has, in the same order.
 *
 * `week` exists as a route but not a tab: the week is a detail page of "This
 * week", and a sixth tab for something you always reach by tapping Today would
 * be a tab that is never pressed.
 */
import { Tabs } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { useTheme } from "@ninetothree/ui-native";
import { TABS } from "../../src/routes";

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.color.paper },
        headerTintColor: theme.color.ink,
        headerShadowVisible: false,
        tabBarActiveTintColor: theme.color.sage,
        tabBarInactiveTintColor: theme.color.inkMuted,
        tabBarStyle: { backgroundColor: theme.color.paperRaised, borderTopColor: theme.color.line },
        tabBarLabelStyle: { fontFamily: theme.fontFamily.sans, fontSize: theme.fontSize.sm },
        sceneStyle: { backgroundColor: theme.color.paper },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarAccessibilityLabel: tab.label,
            tabBarIcon: ({ color, size }) => (
              <Feather name={tab.icon} size={size} color={String(color)} />
            ),
          }}
        />
      ))}
      <Tabs.Screen name="week" options={{ href: null }} />
    </Tabs>
  );
}
