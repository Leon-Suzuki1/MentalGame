document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const showJournalFormButton = document.getElementById('showJournalFormButton');
    const journalFormSection = document.getElementById('journalFormSection');
    const journalForm = document.getElementById('journalForm');
    const journalEntryIdInput = document.getElementById('journalEntryId');
    const journalTitleInput = document.getElementById('journalTitle');
    const journalContentInput = document.getElementById('journalContent');
    const cancelEditButton = document.getElementById('cancelEditButton');
    const journalMessage = document.getElementById('journalMessage');
    const journalEntriesList = document.getElementById('journalEntriesList');
    const formTitle = document.getElementById('formTitle'); // To change between "New" and "Edit"

    const API_BASE_URL = 'http://localhost:3000/api/journal';

    // Utility to get JWT token
    const getToken = () => sessionStorage.getItem('jwtToken');

    // Utility to display messages
    const showMessage = (message, type = 'info') => {
        journalMessage.textContent = message;
        journalMessage.className = `message ${type}`;
        journalMessage.style.display = 'block';
        setTimeout(() => {
            journalMessage.style.display = 'none';
            journalMessage.textContent = '';
            journalMessage.className = 'message';
        }, 3000);
    };

    // Show/Hide Form
    const showForm = (isEditMode = false, entry = null) => {
        formTitle.textContent = isEditMode ? 'Edit Journal Entry' : 'New Journal Entry';
        journalEntryIdInput.value = isEditMode && entry ? entry.id : '';
        journalTitleInput.value = isEditMode && entry ? entry.title || '' : '';
        journalContentInput.value = isEditMode && entry ? entry.content : '';
        journalFormSection.style.display = 'block';
        showJournalFormButton.style.display = 'none'; // Hide "Create New" button
    };

    const hideForm = () => {
        journalForm.reset();
        journalEntryIdInput.value = ''; // Clear hidden ID field
        journalFormSection.style.display = 'none';
        showJournalFormButton.style.display = 'block'; // Show "Create New" button
        formTitle.textContent = 'New Journal Entry';
    };

    // Fetch and display all journal entries
    const fetchJournalEntries = async () => {
        const token = getToken();
        if (!token) {
            showMessage('Please log in to manage your journal.', 'error');
            journalEntriesList.innerHTML = '<p>Please log in.</p>';
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/entries`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 401) {
                showMessage('Session expired. Please log in again.', 'error');
                journalEntriesList.innerHTML = '<p>Session expired.</p>';
                return;
            }
            const result = await response.json();

            if (response.ok) {
                journalEntriesList.innerHTML = ''; // Clear previous entries
                if (result.data && result.data.length > 0) {
                    result.data.forEach(entry => {
                        const entryDiv = document.createElement('div');
                        entryDiv.className = 'journal-entry-item';
                        entryDiv.innerHTML = `
                            <h3>${entry.title || 'Untitled Entry'}</h3>
                            <p class="entry-date">Created: ${new Date(entry.created_at).toLocaleDateString()}</p>
                            <p class="entry-content-preview">${entry.content.substring(0, 100)}...</p>
                            <button class="edit-entry-btn button-secondary" data-id="${entry.id}">Edit</button>
                            <button class="delete-entry-btn button-danger" data-id="${entry.id}">Delete</button>
                        `;
                        journalEntriesList.appendChild(entryDiv);
                    });
                } else {
                    journalEntriesList.innerHTML = '<p>No journal entries yet. Create your first one!</p>';
                }
            } else {
                showMessage(result.message || 'Could not fetch journal entries.', 'error');
            }
        } catch (error) {
            console.error('Fetch entries error:', error);
            showMessage('Error fetching entries.', 'error');
        }
    };

    // Handle Journal Form Submission (Create or Update)
    journalForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const token = getToken();
        if (!token) {
            showMessage('Please log in.', 'error');
            return;
        }

        const entryId = journalEntryIdInput.value;
        const title = journalTitleInput.value.trim();
        const content = journalContentInput.value.trim();

        if (!content) {
            showMessage('Content cannot be empty.', 'error');
            return;
        }

        const method = entryId ? 'PUT' : 'POST';
        const url = entryId ? `${API_BASE_URL}/entries/${entryId}` : `${API_BASE_URL}/entries`;

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, content })
            });

            const result = await response.json();

            if (response.ok) {
                showMessage(result.message || `Entry ${entryId ? 'updated' : 'saved'}!`, 'success');
                hideForm();
                fetchJournalEntries(); // Refresh list
            } else {
                showMessage(result.message || 'Failed to save entry.', 'error');
            }
        } catch (error) {
            console.error('Save entry error:', error);
            showMessage('Error saving entry.', 'error');
        }
    });

    // Event Delegation for Edit and Delete buttons on the list
    journalEntriesList.addEventListener('click', async (event) => {
        const token = getToken();
        if (!token) {
            showMessage('Please log in.', 'error');
            return;
        }

        const target = event.target;
        const entryId = target.dataset.id;

        if (target.classList.contains('edit-entry-btn')) {
            // Fetch the specific entry to edit
            try {
                const response = await fetch(`${API_BASE_URL}/entries/${entryId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to fetch entry for editing.');
                const result = await response.json();
                if (result.data) {
                    showForm(true, result.data);
                } else {
                    showMessage('Could not load entry for editing.', 'error');
                }
            } catch (error) {
                showMessage(error.message, 'error');
            }
        } else if (target.classList.contains('delete-entry-btn')) {
            if (confirm('Are you sure you want to delete this journal entry?')) {
                try {
                    const response = await fetch(`${API_BASE_URL}/entries/${entryId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const result = await response.json();
                    if (response.ok) {
                        showMessage(result.message || 'Entry deleted.', 'success');
                        fetchJournalEntries(); // Refresh list
                    } else {
                        showMessage(result.message || 'Failed to delete entry.', 'error');
                    }
                } catch (error) {
                    console.error('Delete entry error:', error);
                    showMessage('Error deleting entry.', 'error');
                }
            }
        }
    });

    // Event Listeners for form controls
    showJournalFormButton.addEventListener('click', () => showForm(false));
    cancelEditButton.addEventListener('click', hideForm);

    // Initial actions
    fetchJournalEntries(); // Load entries on page start
});
