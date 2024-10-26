document.addEventListener('DOMContentLoaded', () => {
    const clientsTableBody = document.querySelector('#clients-table tbody');
    const clientError = document.getElementById('client-error');
    const clientForm = document.getElementById('client-form'); // Assuming there's a form with this ID for adding clients

    // Helper function to set error messages
    function setClientErrorMessage(message) {
        if (clientError) {
            clientError.textContent = message;
        } else {
            console.error('Error element not found in the DOM.');
        }
    }

    // Fetch and display clients
    async function fetchClients() {
        clientsTableBody.innerHTML = ''; // Clear table body
        setClientErrorMessage('');

        try {
            const response = await fetch('http://localhost:3000/clients');
            if (!response.ok) throw new Error('Failed to fetch clients.');

            const clients = await response.json();

            clients.forEach(client => {
                const row = `<tr data-id="${client.client_id}">
                                <td contenteditable="false">${client.client_name}</td>
                                <td contenteditable="false">${client.address}</td>
                                <td contenteditable="false">${client.contact_email}</td>
                                <td contenteditable="false">${client.phone_number}</td>
                                <td>
                                    <button class="edit-client-btn" data-id="${client.client_id}">Edit</button>
                                    <button class="save-client-btn" data-id="${client.client_id}" style="display:none;">Save</button>
                                    <button class="delete-client-btn" data-id="${client.client_id}">Delete</button>
                                </td>
                             </tr>`;
                clientsTableBody.innerHTML += row;
            });

            // Add event listeners for the Edit, Save, and Delete buttons
            document.querySelectorAll('.edit-client-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const row = e.target.closest('tr');
                    toggleEditClientRow(row, true);
                });
            });

            document.querySelectorAll('.save-client-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const row = e.target.closest('tr');
                    await saveClientUpdate(row);
                });
            });

            document.querySelectorAll('.delete-client-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const clientId = e.target.getAttribute('data-id');
                    await deleteClient(clientId);
                });
            });

        } catch (error) {
            setClientErrorMessage('Error fetching clients. Please try again.');
        }
    }

    // Toggle row edit mode
    function toggleEditClientRow(row, isEditing) {
        const editButton = row.querySelector('.edit-client-btn');
        const saveButton = row.querySelector('.save-client-btn');

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

    // Save client updates
    async function saveClientUpdate(row) {
        const clientId = row.getAttribute('data-id');
        const client_name = row.children[0].textContent.trim();
        const address = row.children[1].textContent.trim();
        const contact_email = row.children[2].textContent.trim();
        const phone_number = row.children[3].textContent.trim();

        try {
            const response = await fetch(`http://localhost:3000/clients/${clientId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ client_name, address, contact_email, phone_number })
            });

            if (!response.ok) throw new Error('Failed to save client.');

            setClientErrorMessage('Client updated successfully');
            toggleEditClientRow(row, false);
        } catch (error) {
            setClientErrorMessage(`Error saving client: ${error.message}`);
        }
    }

    // Delete client function
    async function deleteClient(clientId) {
        try {
            const response = await fetch(`http://localhost:3000/clients/${clientId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete client.');

            setClientErrorMessage('Client deleted successfully');
            fetchClients(); // Reload client list after deletion
        } catch (error) {
            setClientErrorMessage(`Error deleting client: ${error.message}`);
        }
    }

    // Add new client function
    clientForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const client_name = document.getElementById('client-name').value.trim();
        const address = document.getElementById('address').value.trim();
        const contact_email = document.getElementById('contact-email').value.trim();
        const phone_number = document.getElementById('phone-number').value.trim();

        try {
            const response = await fetch('http://localhost:3000/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ client_name, address, contact_email, phone_number })
            });

            if (!response.ok) throw new Error('Failed to add new client.');

            clientForm.reset(); // Clear form
            setClientErrorMessage('Client added successfully');
            fetchClients(); // Reload clients list
        } catch (error) {
            setClientErrorMessage(`Error adding client: ${error.message}`);
        }
    });

    // Initialize fetch on page load
    fetchClients();
});
