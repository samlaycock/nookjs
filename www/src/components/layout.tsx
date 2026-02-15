import { DiGithubBadge, DiNpm } from "react-icons/di";
import { Link, Outlet, useLocation } from "react-router";

export function Layout() {
  const location = useLocation();
  const isDocsPage = location.pathname.startsWith("/docs");

  return (
    <div className="flex flex-col min-h-screen w-screen font-mono bg-neutral-950 [--site-header-height:4rem] sm:[--site-header-height:5rem]">
      <header className="sticky top-0 z-50 flex flex-row justify-between items-center gap-4 p-4 sm:gap-6 sm:p-6 border-b border-neutral-800 bg-neutral-950">
        <div className="flex flex-row items-center gap-6">
          <Link to="/" className="flex flex-col">
            <h1 className="text-amber-50 text-xl font-semibold">
              Nook<span className="text-amber-500">JS</span>
            </h1>
          </Link>
          <nav className="flex flex-row gap-4">
            <Link
              to="/"
              className={`text-sm hover:text-amber-400 transition-colors ${
                location.pathname === "/"
                  ? "text-amber-500"
                  : "text-neutral-400"
              }`}
            >
              <span className="sm:hidden">Play</span>
              <span className="hidden sm:inline">Playground</span>
            </Link>
            <Link
              to="/docs"
              className={`text-sm hover:text-amber-400 transition-colors ${
                isDocsPage ? "text-amber-500" : "text-neutral-400"
              }`}
            >
              <span className="sm:hidden">Docs</span>
              <span className="hidden sm:inline">Documentation</span>
            </Link>
          </nav>
        </div>
        <div className="flex flex-row items-center gap-2">
          <a
            href="https://www.npmjs.com/package/nookjs"
            target="_blank"
            rel="noreferrer"
          >
            <DiNpm size={32} className="fill-amber-500 hover:fill-amber-400" />
          </a>
          <a
            href="https://github.com/samlaycock/nookjs"
            target="_blank"
            rel="noreferrer"
          >
            <DiGithubBadge
              size={32}
              className="fill-amber-500 hover:fill-amber-400"
            />
          </a>
        </div>
      </header>
      <Outlet />
      <footer className="flex flex-row justify-center py-2 px-4 border-t border-neutral-800">
        <span className="text-neutral-600 text-sm">
          &copy;{" "}
          <a
            href="https://github.com/samlaycock"
            target="_blank"
            rel="noreferrer"
            className="hover:underline hover:underline-offset-4"
          >
            Samuel Laycock
          </a>{" "}
          {new Date().getFullYear()}
        </span>
      </footer>
    </div>
  );
}
