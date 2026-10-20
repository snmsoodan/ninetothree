import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../../../packages/ui/src/**/*.stories.@(ts|tsx)", "../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  core: {
    disableTelemetry: true,
  },
  docs: {
    autodocs: "tag",
  },
  async viteFinal(config) {
    const { fileURLToPath } = await import("node:url");
    const shim = (name: string) => fileURLToPath(new URL(`./shims/${name}`, import.meta.url));
    // The components import from Next.js. Storybook is a Vite app, so both
    // modules are aliased to shims that render the same markup.
    config.resolve ??= {};
    config.resolve.alias = {
      ...(config.resolve.alias as Record<string, string> | undefined),
      "@": fileURLToPath(new URL("../src", import.meta.url)),
      "next/link": shim("next-link.tsx"),
      "next/navigation": shim("next-navigation.ts"),
    };
    // Story files live outside the Vite root, so the React plugin's automatic
    // JSX runtime does not reach them and JSX compiles to React.createElement
    // with no React in scope. Setting it on esbuild covers every file.
    config.esbuild = { ...config.esbuild, jsx: "automatic", jsxImportSource: "react" };
    return config;
  },
};

export default config;
