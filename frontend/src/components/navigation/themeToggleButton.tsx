import LucideIcon from "../icons/lucideIcon";
import { useTheme } from "../theme/themeProvider";

export default function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className={`fixed bottom-6 right-20 p-3 rounded-full shadow-md transition-opacity z-50
        bg-primary text-primary-foreground hover:bg-primary/90 duration-1000 cursor-pointer`}
      aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
    >
      <LucideIcon name={theme === "dark" ? "Sun" : "Moon"} />
    </button>
  );
}
