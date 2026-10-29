"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function SubmitCheckinButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="accent"
      disabled={pending}
      className="w-full disabled:opacity-70"
    >
      {pending ? "Submitting check-in…" : "Submit check-in"}
    </Button>
  );
}
