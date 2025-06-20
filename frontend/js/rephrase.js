document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const rephraseForm = document.getElementById('rephraseForm');
    const rephraseEntryIdInput = document.getElementById('rephraseEntryId');
    const negativeThoughtInput = document.getElementById('negativeThought');
    const rephrasedThoughtInput = document.getElementById('rephrasedThought');
    const thoughtCategoryInput = document.getElementById('thoughtCategory');
    const cancelRephraseEditButton = document.getElementById('cancelRephraseEditButton');
    const rephraseMessage = document.getElementById('rephraseMessage');
    const rephrasedThoughtsList = document.getElementById('rephrasedThoughtsList');
    const rephraseFormTitle = document.getElementById('rephraseFormTitle'); // h2 title for the form

    const API_BASE_URL = 'http://localhost:3000/api/rephrase';

    // Utility to get JWT token
    const getToken = () => sessionStorage.getItem('jwtToken');

    // Utility to display messages
    const showMessage = (message, type = 'info') => {
        rephraseMessage.textContent = message;
        rephraseMessage.className = `message ${type}`; // Ensure 'message' class is always there + type
        rephraseMessage.style.display = 'block';
        setTimeout(() => {
            rephraseMessage.style.display = 'none';
            rephraseMessage.textContent = '';
            rephraseMessage.className = 'message';
        }, 3000);
    };

    // Reset form to "Add New" mode
    const resetFormToAddMode = () => {
        rephraseForm.reset();
        rephraseEntryIdInput.value = '';
        rephraseFormTitle.textContent = 'Add New Thought Pair';
        cancelRephraseEditButton.style.display = 'none';
        rephraseForm.querySelector('button[type="submit"]').textContent = 'Save Pair';
    };

    // Fetch and display all rephrased thought pairs
    const fetchRephrasedThoughts = async () => {
        const token = getToken();
        if (!token) {
            showMessage('Please log in to manage your rephrased thoughts.', 'error');
            rephrasedThoughtsList.innerHTML = '<p>Please log in.</p>';
            return;
        }

        try {
            const response = await fetch(API_BASE_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 401) {
                showMessage('Session expired. Please log in again.', 'error');
                rephrasedThoughtsList.innerHTML = '<p>Session expired.</p>';
                return;
            }
            const result = await response.json();

            if (response.ok) {
                rephrasedThoughtsList.innerHTML = ''; // Clear previous items
                if (result.data && result.data.length > 0) {
                    result.data.forEach(pair => {
                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'rephrased-thought-item';
                        itemDiv.innerHTML = `
                            <div class="thought-content">
                                <p><strong>Negative:</strong> ${pair.negative_thought}</p>
                                <p><strong>Rephrased:</strong> ${pair.rephrased_thought}</p>
                                ${pair.category ? `<p class="category-tag"><em>Category: ${pair.category}</em></p>` : ''}
                                <small class="date-display">Saved: ${new Date(pair.created_at).toLocaleDateString()}</small>
                            </div>
                            <div class="thought-actions">
                                <button class="edit-rephrase-btn button-secondary" data-id="${pair.id}">Edit</button>
                                <button class="delete-rephrase-btn button-danger" data-id="${pair.id}">Delete</button>
                            </div>
                        `;
                        rephrasedThoughtsList.appendChild(itemDiv);
                    });
                } else {
                    rephrasedThoughtsList.innerHTML = '<p>No rephrased thoughts saved yet. Add your first one!</p>';
                }
            } else {
                showMessage(result.message || 'Could not fetch rephrased thoughts.', 'error');
            }
        } catch (error) {
            console.error('Fetch rephrased thoughts error:', error);
            showMessage('Error fetching your saved thoughts.', 'error');
        }
    };

    // Handle Form Submission (Create or Update)
    rephraseForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const token = getToken();
        if (!token) {
            showMessage('Please log in to save.', 'error');
            return;
        }

        const entryId = rephraseEntryIdInput.value;
        const negative_thought = negativeThoughtInput.value.trim();
        const rephrased_thought = rephrasedThoughtInput.value.trim();
        const category = thoughtCategoryInput.value.trim();

        if (!negative_thought || !rephrased_thought) {
            showMessage('Both negative and rephrased thoughts are required.', 'error');
            return;
        }

        const method = entryId ? 'PUT' : 'POST';
        const url = entryId ? `${API_BASE_URL}/${entryId}` : API_BASE_URL;
        const payload = { negative_thought, rephrased_thought, category: category || null };

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok) {
                showMessage(result.message || `Thought pair ${entryId ? 'updated' : 'saved'} successfully!`, 'success');
                resetFormToAddMode();
                fetchRephrasedThoughts(); // Refresh list
            } else {
                showMessage(result.message || 'Failed to save thought pair.', 'error');
            }
        } catch (error) {
            console.error('Save thought pair error:', error);
            showMessage('Error saving thought pair.', 'error');
        }
    });

    // Event Delegation for Edit and Delete buttons
    rephrasedThoughtsList.addEventListener('click', async (event) => {
        const token = getToken();
        if (!token) {
            showMessage('Please log in to perform this action.', 'error');
            return;
        }

        const target = event.target;
        const entryId = target.dataset.id;

        if (target.classList.contains('edit-rephrase-btn') && entryId) {
            // Fetch the specific pair to edit
            try {
                const response = await fetch(`${API_BASE_URL}/${entryId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to fetch thought pair for editing.');

                const result = await response.json();
                if (result.data) {
                    rephraseEntryIdInput.value = result.data.id;
                    negativeThoughtInput.value = result.data.negative_thought;
                    rephrasedThoughtInput.value = result.data.rephrased_thought;
                    thoughtCategoryInput.value = result.data.category || '';
                    rephraseFormTitle.textContent = 'Edit Thought Pair';
                    rephraseForm.querySelector('button[type="submit"]').textContent = 'Update Pair';
                    cancelRephraseEditButton.style.display = 'inline-block';
                    rephraseFormSection.scrollIntoView({ behavior: 'smooth' }); // Scroll to form
                } else {
                    showMessage('Could not load thought pair for editing.', 'error');
                }
            } catch (error) {
                showMessage(error.message, 'error');
            }
        } else if (target.classList.contains('delete-rephrase-btn') && entryId) {
            if (confirm('Are you sure you want to delete this thought pair?')) {
                try {
                    const response = await fetch(`${API_BASE_URL}/${entryId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const result = await response.json();
                    if (response.ok) {
                        showMessage(result.message || 'Thought pair deleted.', 'success');
                        fetchRephrasedThoughts(); // Refresh list
                    } else {
                        showMessage(result.message || 'Failed to delete thought pair.', 'error');
                    }
                } catch (error) {
                    console.error('Delete thought pair error:', error);
                    showMessage('Error deleting thought pair.', 'error');
                }
            }
        }
    });

    // Cancel Edit Button
    cancelRephraseEditButton.addEventListener('click', resetFormToAddMode);

    // Initial actions
    fetchRephrasedThoughts(); // Load saved thoughts on page start
});
