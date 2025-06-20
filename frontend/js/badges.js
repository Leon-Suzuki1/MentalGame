document.addEventListener('DOMContentLoaded', () => {
    const earnedBadgesList = document.getElementById('earnedBadgesList');
    const allBadgesList = document.getElementById('allBadgesList');
    const API_BADGES_URL = 'http://localhost:3000/api/badges';

    const getToken = () => sessionStorage.getItem('jwtToken');

    const displayBadges = (element, badges, earnedBadgeIds = new Set()) => {
        if (!element) return;
        element.innerHTML = ''; // Clear loading message

        if (!badges || badges.length === 0) {
            element.innerHTML = '<p>No badges to display in this section.</p>';
            return;
        }

        badges.forEach(badge => {
            const badgeDiv = document.createElement('div');
            badgeDiv.className = 'badge-item';
            if (earnedBadgeIds.has(badge.id) || badge.earned_at) { // Check if badge is earned
                badgeDiv.classList.add('earned');
            } else if (!badge.earned_at && element.id === 'allBadgesList') { // For all badges list, if not earned
                badgeDiv.classList.add('unearned');
            }

            // Basic icon placeholder if icon_url is missing or broken
            const iconHtml = badge.icon_url ?
                `<img src="${badge.icon_url}" alt="${badge.name}" class="badge-icon" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">` +
                `<div class="badge-icon-placeholder" style="display:none;">${badge.name.substring(0,1)}</div>` :
                `<div class="badge-icon-placeholder">${badge.name.substring(0,1)}</div>`;


            badgeDiv.innerHTML = `
                ${iconHtml}
                <div class="badge-info">
                    <h4>${badge.name}</h4>
                    <p>${badge.description}</p>
                    ${badge.earned_at ? `<p class="earned-date">Earned: ${new Date(badge.earned_at).toLocaleDateString()}</p>` : ''}
                </div>
            `;
            element.appendChild(badgeDiv);
        });
    };

    const fetchEarnedBadges = async () => {
        const token = getToken();
        if (!token) {
            if(earnedBadgesList) earnedBadgesList.innerHTML = '<p>Please log in to see your badges.</p>';
            return new Set(); // Return empty set if not logged in
        }

        try {
            const response = await fetch(`${API_BADGES_URL}/user`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                 if(earnedBadgesList) earnedBadgesList.innerHTML = `<p>Could not load your badges (${response.statusText})</p>`;
                 return new Set();
            }
            const result = await response.json();
            if (result.data) {
                const earnedIds = new Set(result.data.map(b => b.id));
                displayBadges(earnedBadgesList, result.data, earnedIds);
                return earnedIds;
            } else {
                if(earnedBadgesList) earnedBadgesList.innerHTML = '<p>No badges earned yet.</p>';
                return new Set();
            }
        } catch (error) {
            console.error('Error fetching earned badges:', error);
            if(earnedBadgesList) earnedBadgesList.innerHTML = '<p>Error loading earned badges.</p>';
            return new Set();
        }
    };

    const fetchAllSystemBadges = async (earnedBadgeIds) => {
        const token = getToken(); // Needed even for 'all' if it's protected
        if (!token && allBadgesList) { // If endpoint is protected and no token
             allBadgesList.innerHTML = '<p>Could not load all badges (not logged in).</p>';
             return;
        }


        try {
            const response = await fetch(`${API_BADGES_URL}/all`, {
                 headers: { 'Authorization': `Bearer ${token}` } // Assuming /all is also protected
            });
            if (!response.ok) {
                if(allBadgesList) allBadgesList.innerHTML = `<p>Could not load all badges (${response.statusText})</p>`;
                return;
            }
            const result = await response.json();
            if (result.data) {
                displayBadges(allBadgesList, result.data, earnedBadgeIds);
            } else {
                 if(allBadgesList) allBadgesList.innerHTML = '<p>No system badges found.</p>';
            }
        } catch (error) {
            console.error('Error fetching all system badges:', error);
            if(allBadgesList) allBadgesList.innerHTML = '<p>Error loading all system badges.</p>';
        }
    };

    // Run fetches
    (async () => {
        const earnedBadgeIds = await fetchEarnedBadges();
        await fetchAllSystemBadges(earnedBadgeIds);
    })();

});
