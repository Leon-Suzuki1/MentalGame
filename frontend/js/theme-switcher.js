(function() { // IIFE to avoid polluting global scope
    const THEME_KEY = 'themePreference';
    const DARK_MODE_CLASS = 'dark-mode';
    let currentTheme = ''; // To be set by applyInitialTheme

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add(DARK_MODE_CLASS);
            currentTheme = 'dark';
        } else {
            document.body.classList.remove(DARK_MODE_CLASS);
            currentTheme = 'light';
        }
        // Store preference
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (e) {
            console.warn("LocalStorage not available. Theme preference will not be saved.");
        }
    };

    const toggleTheme = () => {
        const newTheme = document.body.classList.contains(DARK_MODE_CLASS) ? 'light' : 'dark';
        applyTheme(newTheme);
        // Dispatch an event that the theme has changed, so UI elements can update if needed
        document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
    };

    const applyInitialTheme = () => {
        let preferredTheme = 'light'; // Default to light
        try {
            const savedTheme = localStorage.getItem(THEME_KEY);
            if (savedTheme) {
                preferredTheme = savedTheme;
            } else {
                // Check OS preference if no saved theme
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    preferredTheme = 'dark';
                }
            }
        } catch (e) {
            console.warn("LocalStorage not available. Defaulting to light theme.");
            // Fallback to OS preference if localStorage fails but matchMedia is available
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                preferredTheme = 'dark';
            }
        }
        applyTheme(preferredTheme);
        // Initial themeChanged event for any listeners that need to know the starting theme
        // This event might fire before other scripts are loaded and listening, so they might need to check theme on their own init.
        document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: preferredTheme } }));
    };

    // Expose toggleTheme and getCurrentTheme globally if needed by other scripts or inline event handlers
    // For a toggle button, it's better to add event listener from this script once the button exists.
    window.themeSwitcher = {
        toggle: toggleTheme,
        getCurrentTheme: () => currentTheme, // Getter for the current theme
        applyTheme: applyTheme // Expose applyTheme if external triggers are needed (e.g. settings page)
    };

    // Apply theme as soon as possible
    // DOMContentLoaded might be too late and cause a flash of unstyled/wrongly styled content (FOUC/FURC)
    // So, this script should be placed in <head> or at the very start of <body> if possible,
    // or this initial application should be very minimal and only set the class.
    // For simplicity here, we assume it's run before major rendering.
    applyInitialTheme();

    // Add this towards the end of the IIFE in theme-switcher.js
   document.addEventListener('DOMContentLoaded', () => {
        const themeToggleBtn = document.getElementById('themeToggleBtn');
        if (themeToggleBtn) {
            const updateButtonText = (theme) => {
                // Example: Update text or use icons. For simplicity, text.
                // Could also toggle an icon class if using icon fonts.
                if (theme === 'dark') {
                    themeToggleBtn.textContent = 'Switch to Light Mode';
                } else {
                    themeToggleBtn.textContent = 'Switch to Dark Mode';
                }
            };

            // Initial button text based on current theme
            if (window.themeSwitcher && typeof window.themeSwitcher.getCurrentTheme === 'function') {
                 updateButtonText(window.themeSwitcher.getCurrentTheme());
            }


            themeToggleBtn.addEventListener('click', () => {
                if (window.themeSwitcher && typeof window.themeSwitcher.toggle === 'function') {
                    window.themeSwitcher.toggle(); // This will trigger the 'themeChanged' event
                }
            });

            // Listen for theme changes to update button text
            document.addEventListener('themeChanged', (event) => {
                updateButtonText(event.detail.theme);
            });
        }
    });

})();
