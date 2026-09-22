"use client";

import { ReactNode, useEffect, useRef } from "react";

type HelpMessageScrollProps = {
  children: ReactNode;
  messageCount: number;
};

export function HelpMessageScroll({
  children,
  messageCount,
}: HelpMessageScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [messageCount]);

  return (
    <div
      ref={containerRef}
      className="mt-6 min-h-[260px] max-h-[55vh] space-y-4 overflow-y-auto pr-2"
    >
      {children}
    </div>
  );
}
