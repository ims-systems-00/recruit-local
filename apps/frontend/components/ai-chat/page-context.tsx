'use client';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import type {
  AgentClientActionDto,
  AgentPageActionDefDto,
  AgentPageContextDto,
} from '@rl/types';

/**
 * Page awareness for Alice.
 *
 * Pages describe themselves with `usePageContext` and expose things Alice may do
 * to them with `usePageAction`. The chat reads a snapshot when it sends a
 * message, and runs whatever actions come back.
 *
 * Everything lives in refs, not state: registering a page must not re-render
 * the app, and the snapshot only matters at the moment a message is sent.
 *
 * Safety rules for anyone adding an action:
 * - An action fills the form. It must never submit, navigate, or call an API
 *   that saves — the user saves with the page's own button.
 * - Treat `args` as untrusted: validate them and throw a readable `Error` when
 *   they cannot be applied. The message is shown to the user.
 * - Enforce the page's own limits in the handler (e.g. max selections).
 */

export type PageActionHandler = (
  args: Record<string, unknown>,
) => void | string | Promise<void | string>;

export interface PageActionRegistration extends AgentPageActionDefDto {
  handler: PageActionHandler;
  /** Defaults to true. False registers nothing; see `usePageAction`. */
  enabled?: boolean;
}

export interface ClientActionReport {
  /** Human-readable lines for what was applied. */
  applied: string[];
  failed: { name: string; message: string }[];
}

interface Registry {
  context: Map<symbol, Omit<AgentPageContextDto, 'actions'>>;
  actions: Map<
    string,
    { def: AgentPageActionDefDto; handler: { current: PageActionHandler } }
  >;
}

interface AgentPageApi {
  registerContext: (
    key: symbol,
    context: Omit<AgentPageContextDto, 'actions'>,
  ) => () => void;
  registerAction: (
    def: AgentPageActionDefDto,
    handler: { current: PageActionHandler },
  ) => () => void;
  getPageContext: () => AgentPageContextDto | undefined;
  runClientActions: (
    actions: AgentClientActionDto[],
  ) => Promise<ClientActionReport>;
}

const AgentPageContext = createContext<AgentPageApi | null>(null);

export function AgentPageProvider({ children }: { children: ReactNode }) {
  const registry = useRef<Registry>({ context: new Map(), actions: new Map() });

  const api = useMemo<AgentPageApi>(
    () => ({
      registerContext: (key, context) => {
        registry.current.context.set(key, context);
        return () => {
          registry.current.context.delete(key);
        };
      },

      registerAction: (def, handler) => {
        const entry = { def, handler };
        registry.current.actions.set(def.name, entry);
        return () => {
          // Only remove our own entry: a remounting page may already have
          // registered a replacement under the same name.
          if (registry.current.actions.get(def.name) === entry) {
            registry.current.actions.delete(def.name);
          }
        };
      },

      getPageContext: () => {
        // The most recently registered context is the most specific one — a
        // step section mounts inside its page.
        const contexts = [...registry.current.context.values()];
        const context = contexts[contexts.length - 1];
        if (!context) return undefined;

        const actions = [...registry.current.actions.values()].map(
          (entry) => entry.def,
        );
        return { ...context, ...(actions.length ? { actions } : {}) };
      },

      runClientActions: async (actions) => {
        const report: ClientActionReport = { applied: [], failed: [] };

        // Sequential: actions may build on each other (fill, then fill more).
        for (const action of actions) {
          const entry = registry.current.actions.get(action.name);
          if (!entry) {
            report.failed.push({
              name: action.name,
              message: 'This page has changed, so that could not be applied.',
            });
            continue;
          }

          try {
            const message = await entry.handler.current(action.args ?? {});
            if (message) report.applied.push(message);
          } catch (error) {
            report.failed.push({
              name: action.name,
              message:
                error instanceof Error
                  ? error.message
                  : 'That could not be applied.',
            });
          }
        }

        return report;
      },
    }),
    [],
  );

  return (
    <AgentPageContext.Provider value={api}>
      {children}
    </AgentPageContext.Provider>
  );
}

/** For the chat: read the current page and run returned actions. */
export function useAgentPage() {
  const api = useContext(AgentPageContext);

  return {
    getPageContext: useCallback(() => api?.getPageContext(), [api]),
    runClientActions: useCallback(
      async (actions: AgentClientActionDto[]): Promise<ClientActionReport> =>
        api ? api.runClientActions(actions) : { applied: [], failed: [] },
      [api],
    ),
  };
}

/**
 * Describe the page to Alice. `state` should be small and current — what is
 * selected, what is filled — not the page's data.
 *
 * Re-registers only when the serialized context changes, so passing a fresh
 * object each render is fine.
 *
 * Pass `null` to register nothing. That is for a component that sometimes
 * describes the page and sometimes does not — the hook still runs every render,
 * which `if (condition) usePageContext(...)` would not.
 */
export function usePageContext(
  context: Omit<AgentPageContextDto, 'actions'> | null,
) {
  const api = useContext(AgentPageContext);
  const key = useRef(Symbol('page-context')).current;
  const serialized = context ? JSON.stringify(context) : null;

  useEffect(() => {
    if (!api || !serialized) return;
    return api.registerContext(key, JSON.parse(serialized));
  }, [api, key, serialized]);
}

/**
 * Let Alice perform one action on this page. The handler always sees the
 * latest render's closure, so it can use current form state without the
 * action being re-registered each render.
 *
 * `enabled: false` registers nothing — for an action a page offers only
 * sometimes, such as one that edits what the viewer does not own. It is a guard
 * against confusing Alice, not a security boundary: the handler is still the
 * place that validates, and the save behind it is still authorized server-side.
 */
export function usePageAction({
  handler,
  enabled = true,
  ...def
}: PageActionRegistration) {
  const api = useContext(AgentPageContext);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const serialized = JSON.stringify(def);

  useEffect(() => {
    if (!api || !enabled) return;
    return api.registerAction(JSON.parse(serialized), handlerRef);
  }, [api, enabled, serialized]);
}
