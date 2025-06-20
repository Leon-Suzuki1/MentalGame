document.addEventListener('DOMContentLoaded', () => {
    // --- Existing Logout & Basic Protection Logic ---
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    const jwtToken = sessionStorage.getItem('jwtToken');

    if (!jwtToken) {
        console.log("No JWT token found, user might not be logged in.");
        // Redirect or disable features if necessary
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
    const streakDisplayArea = document.getElementById('streakDisplay'); // Main area for all streaks

    // Create specific element for login streak
    const loginStreakElement = document.createElement('p');
    loginStreakElement.id = 'loginStreakP';
    loginStreakElement.textContent = 'Loading login streak...';
    if(streakDisplayArea) {
        streakDisplayArea.innerHTML = ''; // Clear "Loading streaks..." or any previous content
        streakDisplayArea.appendChild(loginStreakElement);
    }

    // Create specific element for journaling streak
    const journalingStreakElement = document.createElement('p');
    journalingStreakElement.id = 'journalingStreakP';
    journalingStreakElement.textContent = 'Loading journaling streak...';
    if(streakDisplayArea) {
        streakDisplayArea.appendChild(journalingStreakElement);
    }


    const API_STREAKS_URL = 'http://localhost:3000/api/streaks';

    const fetchAndDisplayLoginStreak = async () => {
        if (!jwtToken) {
            if (loginStreakElement) loginStreakElement.textContent = 'Please log in to see your login streak.';
            return;
        }
        if (!loginStreakElement) return;

        try {
            const response = await fetch(`${API_STREAKS_URL}/login`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${jwtToken}` }
            });

            if (response.status === 401) {
                loginStreakElement.textContent = 'Session expired for login streak.';
                return;
            }
            const result = await response.json();
            if (response.ok && result.data) {
                loginStreakElement.innerHTML = `<strong>Current Login Streak:</strong> ${result.data.current_streak || 0} day(s)`;
            } else {
                loginStreakElement.textContent = 'Could not load login streak.';
            }
        } catch (error) {
            loginStreakElement.textContent = 'Error loading login streak.';
        }
    };

    const fetchAndDisplayJournalingStreak = async () => {
        if (!jwtToken) {
            if (journalingStreakElement) journalingStreakElement.textContent = 'Please log in to see your journaling streak.';
            return;
        }
        if (!journalingStreakElement) return;

        try {
            const response = await fetch(`${API_STREAKS_URL}/journaling`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${jwtToken}` }
            });

            if (response.status === 401) {
                journalingStreakElement.textContent = 'Session expired for journaling streak.';
                return;
            }
            const result = await response.json();
            if (response.ok && result.data) {
                journalingStreakElement.innerHTML = `<strong>Current Journaling Streak:</strong> ${result.data.current_streak || 0} day(s)`;
            } else {
                journalingStreakElement.textContent = 'Could not load journaling streak.';
            }
        } catch (error) {
            journalingStreakElement.textContent = 'Error loading journaling streak.';
        }
    };

    // Initial fetch of streaks
    if (streakDisplayArea) { // Only fetch if the display area exists
        fetchAndDisplayLoginStreak();
        fetchAndDisplayJournalingStreak();
    }
});
