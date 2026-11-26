/**
 * The two providers, as promises.
 *
 * `useIdTokenAuthRequest` is a hook, so the promise that the sign-in screen
 * wants is parked here rather than in the screen: Google's redirect comes back
 * as a render, and a resolver held in a ref is the smallest bridge between the
 * two shapes. Apple's sheet is already a promise.
 */
import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Google from "expo-auth-session/providers/google";

import type { Providers } from "./auth";

export function useAuthProviders(): Providers & { appleAvailable: boolean } {
  const pending = useRef<((token: string | null) => void) | null>(null);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (!response || !pending.current) return;
    const settle = pending.current;
    pending.current = null;
    settle(response.type === "success" ? (response.params.id_token ?? null) : null);
  }, [response]);

  const google = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!request) {
        resolve(null);
        return;
      }
      pending.current = resolve;
      void promptAsync().catch(() => {
        pending.current = null;
        resolve(null);
      });
    });
  }, [request, promptAsync]);

  const apple = useCallback(async (): Promise<string | null> => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      return credential.identityToken ?? null;
    } catch {
      // A closed sheet is `ERR_REQUEST_CANCELED`; anything else is equally
      // unrecoverable from here, and both leave the app signed out and quiet.
      return null;
    }
  }, []);

  return { google, apple, appleAvailable: Platform.OS === "ios" };
}
