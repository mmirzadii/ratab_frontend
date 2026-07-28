import { useEffect, type PropsWithChildren } from "react";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { authApi } from "./authApi";
import { sessionMissing, sessionRestored } from "./authSlice";

/**
 * Restores the server session on app start via CSRF bootstrap + GET /api/auth/me/.
 * Does not store session IDs or tokens in web storage.
 */
export function SessionBootstrap({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.auth.status);

  useEffect(() => {
    if (status !== "unknown") {
      return;
    }

    let cancelled = false;

    async function bootstrap() {
      try {
        await dispatch(authApi.endpoints.getCsrf.initiate(undefined, { forceRefetch: true }));
      } catch {
        // Cookie may already exist from a prior visit; continue to /me/.
      }

      try {
        const user = await dispatch(
          authApi.endpoints.getCurrentUser.initiate(undefined, { forceRefetch: true })
        ).unwrap();
        if (!cancelled) {
          dispatch(sessionRestored(user));
        }
      } catch {
        if (!cancelled) {
          dispatch(sessionMissing());
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [dispatch, status]);

  return children;
}
