/**
 * The sign-in card, drawn twice in the app's life: once on `/signin`, and once
 * as the account row in Settings. Two buttons and one quiet sentence — a
 * provider's refusal is not something a parent can act on, and an ordinary
 * cancellation deserves no copy at all.
 */
import { View } from "react-native";

import { Body, Button, Card, CardBody, Heading, Screen } from "@ninetothree/ui-native";
import type { Session } from "./auth";

export type AuthPhase = "signed-out" | "working" | "refused" | "cancelled" | "signed-in";

export interface AuthScreenProps {
  session: Session | null;
  phase: AuthPhase;
  /** Apple's own button only exists on iOS; a drawn one would promise a flow that cannot run. */
  appleAvailable: boolean;
  onGoogle: () => void;
  onApple: () => void;
  onSignOut: () => void;
  testID?: string;
}

export function AuthScreen({
  session,
  phase,
  appleAvailable,
  onGoogle,
  onApple,
  onSignOut,
  testID = "screen-signin",
}: AuthScreenProps) {
  const working = phase === "working";

  if (session) {
    const who = session.user.name || session.user.email || "this device";
    return (
      <Screen testID={testID}>
        <View style={{ gap: 4 }}>
          <Heading level={1}>Signed in</Heading>
          <Body
            muted
          >{`This device is signed in as ${who}. Your shelf, pins and household follow you here.`}</Body>
        </View>
        <Button variant="secondary" block onPress={onSignOut} testID="sign-out">
          Sign out
        </Button>
        <Body muted>
          Signing out removes the credential from this device only. Your answers stay in the
          account.
        </Body>
      </Screen>
    );
  }

  return (
    <Screen testID={testID}>
      <View style={{ gap: 4 }}>
        <Heading level={1}>Sign in</Heading>
        <Body muted>
          So the shelf you keep on the phone is the shelf you keep in the browser. No password, no
          third option to decide between.
        </Body>
      </View>

      <Card tone="raised">
        <CardBody>
          <Button block disabled={working} onPress={onGoogle} testID="sign-in-google">
            Continue with Google
          </Button>
          {appleAvailable ? (
            <Button
              variant="secondary"
              block
              disabled={working}
              onPress={onApple}
              testID="sign-in-apple"
            >
              Continue with Apple
            </Button>
          ) : null}
          {working ? <Body muted>Opening the provider…</Body> : null}
          {phase === "refused" ? (
            <Body muted>That did not go through. Nothing changed; try again when you like.</Body>
          ) : null}
          {phase === "cancelled" ? <Body muted>Closed without signing in.</Body> : null}
        </CardBody>
      </Card>

      <Body muted>
        You can use the whole guide without an account. Dates, pins and appointments live on this
        device until you sign in, and signing in is what lets them travel.
      </Body>
    </Screen>
  );
}
