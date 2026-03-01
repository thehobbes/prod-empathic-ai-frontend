import MainPage from "../pages/MainPage.jsx";
import { resolveBackendApiBaseUrl } from "../lib/runtime";

export default function HomePage() {
  return (
    <MainPage
      apiBaseUrl={resolveBackendApiBaseUrl()}
      humeConfigId={process.env.HUME_CONFIG_ID ?? process.env.NEXT_PUBLIC_HUME_CONFIG_ID ?? ""}
    />
  );
}
