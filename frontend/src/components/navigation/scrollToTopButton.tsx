import { useEffect, useState } from "react";
import LucideIcon from "../icons/lucideIcon";

export default function ScrollToTopButton() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleVisibility = () => {
            setVisible(window.scrollY > 500);
        };

        window.addEventListener("scroll", handleVisibility);
        return () => window.removeEventListener("scroll", handleVisibility);
    });

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 p-3 rounded-full shadow-md transition-opacity z-50
          bg-primary text-primary-foreground hover:bg-primary/90 duration-1000 cursor-pointer
          ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <LucideIcon name="ArrowUp" />
      </button>
    )
}