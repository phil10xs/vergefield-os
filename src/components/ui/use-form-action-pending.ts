"use client";

import { useCallback, useEffect, useReducer, useTransition } from "react";
import { useFormStatus } from "react-dom";
import {
  FORM_ACTION_STUCK_MS,
  INITIAL_FORM_ACTION_PENDING,
  installServerActionIdleProbe,
  isFormActionPending,
  reduceFormActionPending,
  subscribeServerActionIdle,
} from "@/components/ui/form-action-pending";

/**
 * Clears a pending flag when the server-action request finishes.
 * useTransition / useFormStatus can stay true after the response, which
 * left "Sending…" stuck. A timeout clears a hung request.
 */
export function useClearedPending(pending: boolean) {
  const [state, dispatch] = useReducer(
    reduceFormActionPending,
    INITIAL_FORM_ACTION_PENDING,
  );

  useEffect(() => {
    installServerActionIdleProbe();
    return subscribeServerActionIdle(() => {
      dispatch({ type: "idle" });
    });
  }, []);

  useEffect(() => {
    dispatch({ type: "status", pending });
  }, [pending]);

  const active = isFormActionPending(state, pending);

  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => {
      dispatch({ type: "idle" });
    }, FORM_ACTION_STUCK_MS);
    return () => window.clearTimeout(timer);
  }, [active]);

  const beginSubmit = useCallback(() => {
    dispatch({ type: "begin" });
  }, []);

  return { pending: active, beginSubmit };
}

export function useFormActionPending() {
  const { pending } = useFormStatus();
  return useClearedPending(pending);
}

export function useSafeTransition() {
  const [pending, startTransition] = useTransition();
  const cleared = useClearedPending(pending);
  return [cleared.pending, startTransition, cleared.beginSubmit] as const;
}
