import { useEffect, type PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { GlassCard } from "../../shared/components/GlassCard";
import { useGetCurrentUserQuery } from "./authApi";
import { logout, setCurrentUser } from "./authSlice";

export function RequireAuth({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);
  const { data, error, isFetching, isLoading } = useGetCurrentUserQuery(undefined, {
    skip: !token
  });

  useEffect(() => {
    if (data) {
      dispatch(setCurrentUser(data));
    }
  }, [data, dispatch]);

  useEffect(() => {
    if (error) {
      dispatch(logout());
    }
  }, [dispatch, error]);

  if (!token) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  if (error) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  if (!user && (isLoading || isFetching)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ratab-night p-6 text-slate-100">
        <GlassCard className="max-w-sm p-6 text-center">
          <p className="text-lg font-black">در حال بررسی نشست</p>
          <p className="mt-2 text-sm leading-7 text-slate-300">
            اطلاعات کاربر از بک‌اند توسعه دریافت می‌شود.
          </p>
        </GlassCard>
      </div>
    );
  }

  return children;
}
