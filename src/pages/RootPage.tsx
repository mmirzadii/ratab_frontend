import { Navigate } from "react-router-dom";

import { useAppSelector } from "../app/hooks";
import { LandingPage } from "./LandingPage";

export function RootPage() {
  const token = useAppSelector((state) => state.auth.token);

  if (token) {
    return <Navigate replace to="/companies" />;
  }

  return <LandingPage />;
}
