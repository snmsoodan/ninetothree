import type { Preview } from "@storybook/react-vite";
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    // The product is a calm reading surface, not a dashboard. Stories are
    // rendered on the same paper background the app uses so contrast
    // findings from the a11y addon are the ones a parent would hit.
    backgrounds: {
      options: {
        paper: { name: "paper", value: "#faf7f2" },
        ink: { name: "ink", value: "#1c1a17" },
      },
    },
    a11y: {
      // Playwright runs axe against every story in CI. Letting the addon run
      // it too makes the two collide ("Axe is already running"), so the panel
      // is manual: a developer clicks Run when they want it.
      manual: true,
      config: {
        rules: [
          // Every story is a fragment, so there is no page landmark to find.
          { id: "landmark-one-main", enabled: false },
          { id: "region", enabled: false },
        ],
      },
    },
    controls: { expanded: true },
  },
  initialGlobals: {
    backgrounds: { value: "paper" },
  },
};

export default preview;
