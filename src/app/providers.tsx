import { Provider as ReduxProvider } from "react-redux";

import { App } from "./App";
import { store } from "./store";

export function AppProviders() {
  return (
    <ReduxProvider store={store}>
      <App />
    </ReduxProvider>
  );
}
