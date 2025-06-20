document.addEventListener('DOMContentLoaded', () => {
    const copingItemsList = document.getElementById('copingItemsList');
    const addCopingItemForm = document.getElementById('addCopingItemForm');
    const newItemText = document.getElementById('newItemText');
    const copingBoxMessage = document.getElementById('copingBoxMessage');
    const API_BASE_URL = 'http://localhost:3000/api/copingbox'; // Adjust if backend URL is different

    const getToken = () => {
        return sessionStorage.getItem('jwtToken'); // Or localStorage, if chosen in auth.js
    };

    const showMessage = (message, type = 'info') => {
        copingBoxMessage.textContent = message;
        copingBoxMessage.className = `message ${type}`; // Ensure 'message' class is always there + type
        copingBoxMessage.style.display = 'block';
        setTimeout(() => {
            copingBoxMessage.style.display = 'none';
            copingBoxMessage.textContent = '';
            copingBoxMessage.className = 'message';
        }, 3000);
    };

    const fetchAndDisplayItems = async () => {
        const token = getToken();
        if (!token) {
            showMessage('You are not logged in. Please log in again.', 'error');
            // Optionally redirect to login: window.location.href = 'login.html';
            copingItemsList.innerHTML = '<li>Please log in to see your items.</li>';
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/items`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) { // Unauthorized
                showMessage('Your session has expired. Please log in again.', 'error');
                sessionStorage.removeItem('jwtToken');
                sessionStorage.removeItem('loggedInUser');
                copingItemsList.innerHTML = '<li>Session expired. Please log in.</li>';
                // Optionally redirect: window.location.href = 'login.html';
                return;
            }

            const result = await response.json();

            if (response.ok) {
                copingItemsList.innerHTML = ''; // Clear loading/previous items
                if (result.data && result.data.length > 0) {
                    result.data.forEach(item => {
                        const li = document.createElement('li');
                        li.textContent = item.item_text;

                        const deleteButton = document.createElement('button');
                        deleteButton.textContent = 'Remove';
                        deleteButton.classList.add('delete-item-btn');
                        deleteButton.onclick = () => handleDeleteItem(item.id);

                        li.appendChild(deleteButton);
                        copingItemsList.appendChild(li);
                    });
                } else {
                    copingItemsList.innerHTML = '<li>Your coping box is empty. Add some items!</li>';
                }
            } else {
                showMessage(result.message || 'Could not fetch items.', 'error');
                copingItemsList.innerHTML = '<li>Could not load items.</li>';
            }
        } catch (error) {
            console.error('Error fetching items:', error);
            showMessage('An error occurred while fetching items.', 'error');
            copingItemsList.innerHTML = '<li>Error loading items.</li>';
        }
    };

    const handleAddItem = async (event) => {
        event.preventDefault();
        const token = getToken();
        const text = newItemText.value.trim();

        if (!text) {
            showMessage('Please enter some text for your coping item.', 'error');
            return;
        }
        if (!token) {
            showMessage('You are not logged in. Please log in again.', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ item_text: text })
            });

            const result = await response.json();

            if (response.ok) {
                showMessage(result.message || 'Item added successfully!', 'success');
                newItemText.value = ''; // Clear textarea
                fetchAndDisplayItems(); // Refresh the list
            } else {
                 if (response.status === 401) {
                    showMessage('Your session has expired. Please log in again.', 'error');
                 } else {
                    showMessage(result.message || 'Could not add item.', 'error');
                 }
            }
        } catch (error) {
            console.error('Error adding item:', error);
            showMessage('An error occurred while adding the item.', 'error');
        }
    };

    const handleDeleteItem = async (itemId) => {
        const token = getToken();
        if (!token) {
            showMessage('You are not logged in. Please log in again.', 'error');
            return;
        }

        // Optional: Add a confirmation dialog
        // if (!confirm('Are you sure you want to remove this item?')) {
        //     return;
        // }

        try {
            const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (response.ok) {
                showMessage(result.message || 'Item removed successfully!', 'success');
                fetchAndDisplayItems(); // Refresh the list
            } else {
                if (response.status === 401) {
                    showMessage('Your session has expired. Please log in again.', 'error');
                } else {
                    showMessage(result.message || 'Could not remove item.', 'error');
                }
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            showMessage('An error occurred while removing the item.', 'error');
        }
    };

    // Attach event listeners
    if (addCopingItemForm) {
        addCopingItemForm.addEventListener('submit', handleAddItem);
    }

    // Initial fetch of items
    fetchAndDisplayItems();
});
