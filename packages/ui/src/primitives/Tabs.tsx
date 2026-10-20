"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { ReactNode } from "react";
import { cn } from "../cn";

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
  label: string;
  className?: string;
}

export function Tabs({ items, defaultValue, label, className }: TabsProps) {
  return (
    <TabsPrimitive.Root defaultValue={defaultValue ?? items[0]?.value} className={className}>
      <TabsPrimitive.List aria-label={label} className="flex gap-1 border-b border-line pb-px">
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item.value}
            value={item.value}
            className={cn(
              "relative px-3 py-2 text-sm text-ink-muted",
              "hover:text-ink",
              "data-[state=active]:text-ink",
              "data-[state=active]:after:absolute data-[state=active]:after:inset-x-0",
              "data-[state=active]:after:-bottom-px data-[state=active]:after:h-0.5",
              "data-[state=active]:after:bg-ink",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay",
            )}
          >
            {item.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {items.map((item) => (
        <TabsPrimitive.Content
          key={item.value}
          value={item.value}
          className="pt-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
        >
          {item.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}
