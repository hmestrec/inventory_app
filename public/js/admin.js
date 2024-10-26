document.addEventListener('DOMContentLoaded', () => {
    const usersTableBody = document.querySelector('#users-table tbody');
    const userError = document.getElementById('user-error');
    const addUserForm = document.getElementById('add-user-form');

    // Helper function to set error messages
    function setUserErrorMessage(message) {
        if (userError) {
            userError.textContent = message;
        } else {
            console.error('Error element not found in the DOM.');
        }
    }

    // Fetch and display users
    async function fetchUsers() {
        usersTableBody.innerHTML = ''; // Clear table body
        setUserErrorMessage('');

        try {
            const response = await fetch('http://localhost:3000/users');
            if (!response.ok) throw new Error('Failed to fetch users.');

            const users = await response.json();

            users.forEach(user => {
                const row = `<tr data-id="${user.id}">
                                <td contenteditable="false">${user.email}</td>
                                <td contenteditable="false">${user.role}</td>
                                <td>
                                    <button class="edit-user-btn" data-id="${user.id}">Edit</button>
                                    <button class="save-user-btn" data-id="${user.id}" style="display:none;">Save</button>
                                    <button class="delete-user-btn" data-id="${user.id}">Delete</button>
                                </td>
                             </tr>`;
                usersTableBody.innerHTML += row;
            });

            // Add event listeners for Edit, Save, and Delete buttons
            document.querySelectorAll('.edit-user-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const row = e.target.closest('tr');
                    toggleEditUserRow(row, true);
                });
            });

            document.querySelectorAll('.save-user-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const row = e.target.closest('tr');
                    await saveUserUpdate(row);
                });
            });

            document.querySelectorAll('.delete-user-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const userId = e.target.getAttribute('data-id');
                    await deleteUser(userId);
                });
            });

        } catch (error) {
            setUserErrorMessage('Error fetching users. Please try again.');
        }
    }

    // Toggle row edit mode
    function toggleEditUserRow(row, isEditing) {
        const editButton = row.querySelector('.edit-user-btn');
        const saveButton = row.querySelector('.save-user-btn');

        if (isEditing) {
            row.querySelectorAll('td[contenteditable]').forEach(cell => {
                cell.contentEditable = true;
                cell.style.backgroundColor = '#f0f8ff'; // Highlight editable cells
            });
            editButton.style.display = 'none';
            saveButton.style.display = 'inline-block';
        } else {
            row.querySelectorAll('td[contenteditable]').forEach(cell => {
                cell.contentEditable = false;
                cell.style.backgroundColor = ''; // Remove highlight
            });
            editButton.style.display = 'inline-block';
            saveButton.style.display = 'none';
        }
    }

    // Save user updates
    async function saveUserUpdate(row) {
        const userId = row.getAttribute('data-id');
        const email = row.children[0].textContent.trim();
        const role = row.children[1].textContent.trim();

        try {
            const response = await fetch(`http://localhost:3000/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, role })
            });

            if (!response.ok) throw new Error(`Failed to save user. Status: ${response.status}`);
            
            setUserErrorMessage('User updated successfully');
            toggleEditUserRow(row, false);
        } catch (error) {
            setUserErrorMessage(`Error saving user: ${error.message}`);
        }
    }

    // Delete user function
    async function deleteUser(userId) {
        try {
            const response = await fetch(`http://localhost:3000/users/${userId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete user.');

            setUserErrorMessage('User deleted successfully');
            fetchUsers(); // Reload user list after deletion
        } catch (error) {
            setUserErrorMessage(`Error deleting user: ${error.message}`);
        }
    }

    // Add new user function
    addUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('user-email').value.trim();
        const password = document.getElementById('user-password').value.trim();
        const role = document.getElementById('user-role').value;

        try {
            const response = await fetch('http://localhost:3000/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role })
            });

            if (!response.ok) throw new Error('Failed to add new user.');

            addUserForm.reset(); // Clear form
            setUserErrorMessage('User added successfully');
            fetchUsers(); // Reload users list
        } catch (error) {
            setUserErrorMessage(`Error adding user: ${error.message}`);
        }
    });

    // Initialize fetch on page load
    fetchUsers();
});
