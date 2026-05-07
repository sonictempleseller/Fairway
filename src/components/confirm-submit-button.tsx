"use client";

// A submit button for forms that require a confirmation prompt.
// Tiny client island — uses the browser's built-in window.confirm so we
// don't have to install or wire up a dialog component for this.

import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof Button>, "type" | "onClick"> & {
  message: string;
  children: React.ReactNode;
};

export function ConfirmSubmitButton({ message, children, ...rest }: Props) {
  return (
    <Button
      type="submit"
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
      {...rest}
    >
      {children}
    </Button>
  );
}
