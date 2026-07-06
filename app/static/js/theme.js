document.addEventListener("DOMContentLoaded", () => {
    const getTheme = () => {
        return document.documentElement.getAttribute("data-bs-theme");
    };

    const setTheme = (theme) => {
        document.documentElement.setAttribute("data-bs-theme", theme);
        localStorage.setItem("theme", theme);
        
        // Dispatch custom event so stats.js or other charts can listen and re-render
        window.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
    };

    // Listen for click on theme toggle buttons
    document.addEventListener("click", (e) => {
        const btn = e.target.closest("#theme_toggle_btn");
        if (btn) {
            e.preventDefault();
            const currentTheme = getTheme();
            const newTheme = currentTheme === "dark" ? "light" : "dark";
            setTheme(newTheme);
        }
    });
});
