import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router";

const DOCS_NAV = [
  {
    title: "Getting Started",
    items: [
      { title: "Introduction", path: "/docs" },
      { title: "Installation", path: "/docs/installation" },
      { title: "Quick Start", path: "/docs/quick-start" },
    ],
  },
  {
    title: "Core Concepts",
    items: [
      { title: "Security Model", path: "/docs/security" },
      { title: "Presets", path: "/docs/presets" },
      { title: "Global Injection", path: "/docs/globals" },
      { title: "ES Modules", path: "/docs/modules" },
      { title: "Feature Control", path: "/docs/features" },
    ],
  },
  {
    title: "API Reference",
    items: [
      { title: "Interpreter", path: "/docs/api/interpreter" },
      { title: "Error Types", path: "/docs/api/errors" },
      { title: "Resource Tracker", path: "/docs/api/resource-tracker" },
    ],
  },
  {
    title: "Examples",
    items: [
      { title: "Basic Usage", path: "/docs/examples/basic" },
      { title: "Async Operations", path: "/docs/examples/async" },
      { title: "Plugin Systems", path: "/docs/examples/plugins" },
    ],
  },
];

export function DocsLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navContent = (
    <nav className="flex flex-col gap-6">
      {DOCS_NAV.map((section) => (
        <div key={section.title}>
          <h3 className="text-neutral-400 text-xs uppercase tracking-wider mb-2">
            {section.title}
          </h3>
          <ul className="flex flex-col gap-1">
            {section.items.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-1 px-2 text-sm rounded transition-colors ${
                    location.pathname === item.path
                      ? "text-amber-500 bg-neutral-800"
                      : "text-neutral-300 hover:text-amber-400 hover:bg-neutral-800/50"
                  }`}
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex-1 flex flex-col md:flex-row">
      {/* Mobile menu button */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-neutral-800">
        <span className="text-neutral-400 text-sm">Documentation</span>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-neutral-400 hover:text-amber-400 p-1"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-30 left-0 right-0 bg-neutral-950 border-b border-neutral-800 p-4 z-50 max-h-[calc(100vh-120px)] overflow-y-auto">
          {navContent}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-neutral-800 p-4 overflow-y-auto">
        {navContent}
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
