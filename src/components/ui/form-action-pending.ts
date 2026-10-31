/** Last-resort if a server action never reports idle (network hang). */
export const FORM_ACTION_STUCK_MS = 12_000;

export type FormActionPendingState = {
  localBusy: boolean;
  ignorePending: boolean;
  submitGen: number;
  idleGen: number;
};

export const INITIAL_FORM_ACTION_PENDING: FormActionPendingState = {
  localBusy: false,
  ignorePending: false,
  submitGen: 0,
  idleGen: 0,
};

export type FormActionPendingEvent =
  | { type: "begin" }
  | { type: "idle" }
  | { type: "status"; pending: boolean };

export function reduceFormActionPending(
  state: FormActionPendingState,
  event: FormActionPendingEvent,
): FormActionPendingState {
  switch (event.type) {
    case "begin":
      return {
        localBusy: true,
        ignorePending: false,
        submitGen: state.submitGen + 1,
        idleGen: state.idleGen,
      };
    case "idle":
      return {
        ...state,
        localBusy: false,
        ignorePending: true,
        idleGen: state.submitGen,
      };
    case "status":
      if (event.pending) {
        if (state.submitGen > 0 && state.idleGen === state.submitGen) {
          return state;
        }
        return { ...state, localBusy: true };
      }
      return {
        ...state,
        localBusy: false,
        ignorePending: false,
      };
  }
}

export function isFormActionPending(
  state: FormActionPendingState,
  pending: boolean,
): boolean {
  return state.localBusy || (pending && !state.ignorePending);
}

export function isNextActionRequest(
  input: RequestInfo | URL,
  init?: RequestInit,
): boolean {
  const fromInit = readActionHeader(init?.headers);
  if (fromInit) return true;
  if (typeof Request !== "undefined" && input instanceof Request) {
    return Boolean(
      input.headers.get("Next-Action") || input.headers.get("next-action"),
    );
  }
  return false;
}

function readActionHeader(headers?: HeadersInit): boolean {
  if (!headers) return false;
  const h = headers instanceof Headers ? headers : new Headers(headers);
  return Boolean(h.get("Next-Action") || h.get("next-action"));
}

type IdleListener = () => void;

const idleListeners = new Set<IdleListener>();
let probeInstalled = false;
let actionsInFlight = 0;

export function subscribeServerActionIdle(listener: IdleListener): () => void {
  idleListeners.add(listener);
  return () => {
    idleListeners.delete(listener);
  };
}

function emitServerActionIdle() {
  for (const listener of idleListeners) listener();
}

export function installServerActionIdleProbe() {
  if (typeof window === "undefined" || probeInstalled) return;
  probeInstalled = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const tracked = isNextActionRequest(input, init);
    if (tracked) actionsInFlight += 1;
    try {
      return await originalFetch(input, init);
    } finally {
      if (tracked) {
        actionsInFlight = Math.max(0, actionsInFlight - 1);
        if (actionsInFlight === 0) emitServerActionIdle();
      }
    }
  };
}
