import { Outlet } from "react-router-dom";
import { Header } from "./header";
import { Footer } from "./footer";
import ScrollToTopButton from "../navigation/scrollToTopButton";
import ThemeToggleButton from "../navigation/themeToggleButton";

export function Layout() {
  return (
    <div className="flex min-h-svh flex-col font-neo">
      <Header />
      <main className="flex-1 w-full mx-auto max-w-7xl">
        <Outlet />
      </main>
      <Footer />
      <ScrollToTopButton />
      <ThemeToggleButton />
    </div>
  );
}
