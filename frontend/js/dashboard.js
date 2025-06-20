document.addEventListener('DOMContentLoaded', () => {
    // --- Existing Logout & Basic Protection Logic ---
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    const jwtToken = sessionStorage.getItem('jwtToken');

    if (!jwtToken) {
        console.log("No JWT token found, user might not be logged in.");
    }

    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('loggedInUser');
            sessionStorage.removeItem('jwtToken');
            window.location.href = 'login.html';
        });
    }

    // --- Streak Display Logic ---
    const streakDisplayArea = document.getElementById('streakDisplay');
    const API_STREAKS_URL = 'http://localhost:3000/api/streaks';

    // Clear any static "Loading..." message and prepare for dynamic streak elements
    if (streakDisplayArea) {
        streakDisplayArea.innerHTML = '';
    }

    const createStreakElement = (id, defaultText) => {
        const p = document.createElement('p');
        p.id = id;
        p.textContent = defaultText;
        if (streakDisplayArea) {
            streakDisplayArea.appendChild(p);
        }
        return p;
    };

    const loginStreakElement = createStreakElement('loginStreakP', 'Loading login streak...');
    const journalingStreakElement = createStreakElement('journalingStreakP', 'Loading journaling streak...');
    const surveyStreakElement = createStreakElement('surveyStreakP', 'Loading survey streak...'); // New element

    const fetchStreakData = async (streakType, element) => {
        if (!jwtToken) {
            element.textContent = `Please log in to see your ${streakType} streak.`;
            return;
        }
        if (!element) return;

        try {
            const response = await fetch(`${API_STREAKS_URL}/${streakType}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${jwtToken}` }
            });

            if (response.status === 401) {
                element.textContent = `Session expired for ${streakType} streak.`;
                return;
            }
            const result = await response.json();
            if (response.ok && result.data) {
                const streakName = streakType.charAt(0).toUpperCase() + streakType.slice(1).replace('_', ' '); // Format for display
                element.innerHTML = `<strong>Current ${streakName} Streak:</strong> ${result.data.current_streak || 0} day(s)`;
            } else {
                element.textContent = `Could not load ${streakType} streak.`;
            }
        } catch (error) {
            element.textContent = `Error loading ${streakType} streak.`;
        }
    };

    // Initial fetch of all streaks
    if (streakDisplayArea) {
        fetchStreakData('login', loginStreakElement);
        fetchStreakData('journaling', journalingStreakElement);
        fetchStreakData('survey', surveyStreakElement); // Fetch survey streak
    }
});
