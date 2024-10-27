document.addEventListener('DOMContentLoaded', () => {
    const usersTableBody = document.querySelector('#users-table tbody');
    const userError = document.getElementById('user-error');
    const addUserForm = document.getElementById('add-user-form');

    // Helper function to set success or error messages
    function setUserMessage(message, isSuccess) {
        if (userError) {
            userError.textContent = message;
            userError.style.color = isSuccess ? 'green' : 'red';
        } else {
            console.error('Error element not found in the DOM.');
        }
    }

    // Fetch and display users
    async function fetchUsers() {
        usersTableBody.innerHTML = ''; // Clear table body
        setUserMessage('', false);

        try {
            const response = await fetch('https://sheltered-ocean-88352-000ba16da54d.herokuapp.com/users');
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
            setUserMessage('Error fetching users. Please try again.', false);
        }
    }

    // Toggle row edit mode
    function toggleEditUserRow(row, isEditing) {
        const editButton = row.querySelector('.edit-user-btn');
        const saveButton = row.querySelector('.save-user-btn');

        if (isEditing) {
            row.classList.add('editing'); // Add the 'editing' class to change background color
            row.querySelectorAll('td[contenteditable]').forEach(cell => {
                cell.contentEditable = true;
                cell.style.backgroundColor = '#444'; // Set darker background while editing
                cell.style.color = '#fff'; // Set text color to white for better contrast
            });
            editButton.style.display = 'none';
            saveButton.style.display = 'inline-block';
        } else {
            row.classList.remove('editing'); // Remove the 'editing' class to reset background color
            row.querySelectorAll('td[contenteditable]').forEach(cell => {
                cell.contentEditable = false;
                cell.style.backgroundColor = ''; // Reset background color
                cell.style.color = ''; // Reset text color
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
            const response = await fetch(`https://sheltered-ocean-88352-000ba16da54d.herokuapp.com/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, role })
            });

            if (!response.ok) throw new Error(`Failed to save user. Status: ${response.status}`);
            
            setUserMessage('User updated successfully', true);
            toggleEditUserRow(row, false);
        } catch (error) {
            setUserMessage(`Error saving user: ${error.message}`, false);
        }
    }

    // Delete user function
    async function deleteUser(userId) {
        try {
            console.log(`Attempting to delete user with ID: ${userId}`); // Log user ID for debugging

            const response = await fetch(`https://sheltered-ocean-88352-000ba16da54d.herokuapp.com/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const responseText = await response.text(); // Get the response text for more details
                console.error(`Failed to delete user. Status Code: ${response.status}, Response: ${responseText}`);
                throw new Error('Failed to delete user.');
            }

            console.log('User deleted successfully'); // Log success for debugging
            setUserMessage('User deleted successfully', true);
            await fetchUsers(); // Reload user list after deletion
        } catch (error) {
            console.error(`Error deleting user: ${error.message}`); // Log the full error details
            setUserMessage(`Error deleting user: ${error.message}`, false);
        }
    }

    // Add new user function
    addUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('user-email').value.trim();
        const password = document.getElementById('user-password').value.trim();
        const role = document.getElementById('user-role').value;

        try {
            const response = await fetch('https://sheltered-ocean-88352-000ba16da54d.herokuapp.com/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role })
            });

            if (!response.ok) throw new Error('Failed to add new user.');

            addUserForm.reset(); // Clear form
            setUserMessage('User added successfully', true);
            fetchUsers(); // Reload users list
        } catch (error) {
            setUserMessage(`Error adding user: ${error.message}`, false);
        }
    });

    // Initialize fetch on page load
    fetchUsers();
});
