/**
 * `expo-secure-store`, as the three methods the auth module asks for.
 *
 * Kept apart from `auth.ts` so the logic around it can be tested without a
 * device and without mocking an Expo module's shape.
 */
import * as SecureStore from "expo-secure-store";

import type { SecureStorePort } from "./auth";

export const keychain: SecureStorePort = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  deleteItem: (key) => SecureStore.deleteItemAsync(key),
};
