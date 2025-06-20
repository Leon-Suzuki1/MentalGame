document.addEventListener('DOMContentLoaded', () => {
    // --- Existing Logout & Basic Protection Logic (Moved from inline) ---
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    const jwtToken = sessionStorage.getItem('jwtToken');

    // Basic protection: If no token, consider redirecting to login
    // This is a simple check; more robust checks might involve token validation if possible client-side
    // or relying on API calls to fail with 401.
    if (!jwtToken) {
        // For this example, we'll assume API calls will handle unauthorized access.
        // If direct redirect is desired:
        // window.location.href = 'login.html';
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

    // --- New Streak Display Logic ---
    const streakDisplay = document.getElementById('streakDisplay');
    const API_STREAKS_URL = 'http://localhost:3000/api/streaks'; // Base URL for streaks

    const fetchAndDisplayLoginStreak = async () => {
        if (!jwtToken) {
            if(streakDisplay) streakDisplay.innerHTML = '<p>Please log in to see your streaks.</p>';
            return;
        }
        if (!streakDisplay) return; // Element not on page

        try {
            const response = await fetch(`${API_STREAKS_URL}/login`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${jwtToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                streakDisplay.innerHTML = '<p>Session expired. Please log in again.</p>';
                return;
            }

            const result = await response.json();

            if (response.ok && result.data) {
                const currentStreak = result.data.current_streak || 0;
                streakDisplay.innerHTML = `
                    <p><strong>Current Login Streak:</strong> ${currentStreak} day(s)</p>
                    <!-- <p>Longest Login Streak: ${result.data.longest_streak || 0} day(s)</p> -->
                `;
            } else {
                streakDisplay.innerHTML = '<p>Could not load login streak.</p>';
                console.error("Failed to fetch login streak:", result.message);
            }
        } catch (error) {
            console.error('Error fetching login streak:', error);
            streakDisplay.innerHTML = '<p>Error loading login streak.</p>';
        }
    };

    // Initial fetch of login streak
    fetchAndDisplayLoginStreak();

});
