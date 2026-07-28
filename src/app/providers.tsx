import { Provider as ReduxProvider } from "react-redux";

import { SessionBootstrap } from "../features/auth/SessionBootstrap";
import { App } from "./App";
import { AppShellProvider } from "./appShellContext";
import { store } from "./store";

export function AppProviders() {
  return (
    <ReduxProvider store={store}>
      <SessionBootstrap>
        <AppShellProvider>
          <App />
        </AppShellProvider>
      </SessionBootstrap>
    </ReduxProvider>
  );
}
