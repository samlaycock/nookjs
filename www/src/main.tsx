import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";

import { DocsLayout } from "./components/docs-layout";
import { Layout } from "./components/layout";
import { ErrorsAPI } from "./pages/docs/api/errors";
import { InterpreterAPI } from "./pages/docs/api/interpreter";
import { ResourceTrackerAPI } from "./pages/docs/api/resource-tracker";
import { SandboxAPI } from "./pages/docs/api/sandbox";
import { AsyncExamples } from "./pages/docs/examples/async";
import { BasicExamples } from "./pages/docs/examples/basic";
import { PluginsExamples } from "./pages/docs/examples/plugins";
import { Features } from "./pages/docs/features";
import { Globals } from "./pages/docs/globals";
import { Installation } from "./pages/docs/installation";
import { Introduction } from "./pages/docs/introduction";
import { Modules } from "./pages/docs/modules";
import { Presets } from "./pages/docs/presets";
import { QuickStart } from "./pages/docs/quick-start";
import { Security } from "./pages/docs/security";
import { Playground } from "./pages/playground";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Playground />} />
          <Route path="/docs" element={<DocsLayout />}>
            <Route index element={<Introduction />} />
            <Route path="installation" element={<Installation />} />
            <Route path="quick-start" element={<QuickStart />} />
            <Route path="security" element={<Security />} />
            <Route path="presets" element={<Presets />} />
            <Route path="globals" element={<Globals />} />
            <Route path="modules" element={<Modules />} />
            <Route path="features" element={<Features />} />
            <Route path="api/sandbox" element={<SandboxAPI />} />
            <Route path="api/interpreter" element={<InterpreterAPI />} />
            <Route path="api/errors" element={<ErrorsAPI />} />
            <Route path="api/resource-tracker" element={<ResourceTrackerAPI />} />
            <Route path="examples/basic" element={<BasicExamples />} />
            <Route path="examples/async" element={<AsyncExamples />} />
            <Route path="examples/plugins" element={<PluginsExamples />} />
            <Route path="*" element={<Navigate to="/docs" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
