import { Provider as ReduxProvider } from "react-redux";

import { App } from "./App";
import { AppShellProvider } from "./appShellContext";
import { store } from "./store";

export function AppProviders() {
  return (
    <ReduxProvider store={store}>
      <AppShellProvider>
        <App />
      </AppShellProvider>
    </ReduxProvider>
  );
}
