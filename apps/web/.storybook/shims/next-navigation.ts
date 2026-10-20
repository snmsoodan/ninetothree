/** Storybook has no router. Every story renders as if it were the current page. */
export function usePathname(): string {
  return "/week/pregnancy-w28";
}

export function useRouter() {
  return {
    push: () => {},
    replace: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
    prefetch: () => {},
  };
}

export function useSearchParams() {
  return new URLSearchParams();
}
