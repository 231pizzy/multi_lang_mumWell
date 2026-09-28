import * as React from "react";
import { cn } from "@/lib/utils";

export function Container({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-screen-2xl px-2.5 lg:px-20 md:px-6",
        "flex flex-col gap-6",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
