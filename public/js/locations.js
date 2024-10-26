document.addEventListener('DOMContentLoaded', () => {
    const locationsTableBody = document.querySelector('#locations-table tbody');
    const locationError = document.getElementById('location-error');
    const locationForm = document.getElementById('location-form');
    const adminLink = document.getElementById('admin-link');

    // Get user information from session storage
    const userRole = sessionStorage.getItem('userRole');

    // Show the admin link only if the user is an admin
    if (userRole === 'admin' && adminLink) {
        adminLink.style.display = 'inline-block';
    }

    
    // Fetch and display locations
    async function fetchLocations() {
        locationsTableBody.innerHTML = ''; // Clear table body

        try {
            const response = await fetch('http://localhost:3000/locations');
            if (!response.ok) throw new Error('Failed to fetch locations.');

            const locations = await response.json();

            locations.forEach(location => {
                const row = `<tr data-id="${location.location_id}">
                                <td contenteditable="false">${location.location_name}</td>
                                <td contenteditable="false">${location.address}</td>
                                <td contenteditable="false">${location.city}</td>
                                <td contenteditable="false">${location.state}</td>
                                <td contenteditable="false">${location.zip_code}</td>
                                <td>
                                    <button class="edit-location-btn" data-id="${location.location_id}">Edit</button>
                                    <button class="save-location-btn" data-id="${location.location_id}" style="display:none;">Save</button>
                                    <button class="delete-location-btn" data-id="${location.location_id}">Delete</button>
                                </td>
                             </tr>`;
                locationsTableBody.innerHTML += row;
            });

            // Add event listeners for the Edit, Save, and Delete buttons
            document.querySelectorAll('.edit-location-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const row = e.target.closest('tr');
                    toggleEditLocationRow(row, true);
                });
            });

            document.querySelectorAll('.save-location-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const row = e.target.closest('tr');
                    await saveLocationUpdate(row);
                });
            });

            document.querySelectorAll('.delete-location-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const locationId = e.target.getAttribute('data-id');
                    await deleteLocation(locationId);
                });
            });

        } catch (error) {
            setMessage(locationError, 'Error fetching locations. Please try again.', false);
        }
    }

    // Toggle row edit mode
    function toggleEditLocationRow(row, isEditing) {
        const editButton = row.querySelector('.edit-location-btn');
        const saveButton = row.querySelector('.save-location-btn');

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

    // Utility function to set message with different colors for success and error
    function setMessage(element, message, isSuccess) {
        element.textContent = message;
        element.style.color = isSuccess ? 'green' : 'red';
    }

    // Save location updates
    async function saveLocationUpdate(row) {
        const locationId = row.getAttribute('data-id');
        const location_name = row.children[0].textContent.trim();
        const address = row.children[1].textContent.trim();
        const city = row.children[2].textContent.trim();
        const state = row.children[3].textContent.trim();
        const zip_code = row.children[4].textContent.trim();

        try {
            const response = await fetch(`http://localhost:3000/locations/${locationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ location_name, address, city, state, zip_code })
            });

            if (!response.ok) throw new Error('Failed to update location.');

            setMessage(locationError, 'Location updated successfully', true);
            toggleEditLocationRow(row, false);
        } catch (error) {
            setMessage(locationError, `Error updating location: ${error.message}`, false);
        }
    }

    // Delete location function
    async function deleteLocation(locationId) {
        try {
            const response = await fetch(`http://localhost:3000/locations/${locationId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete location.');

            setMessage(locationError, 'Location deleted successfully', true);
            fetchLocations(); // Reload location list after deletion
        } catch (error) {
            setMessage(locationError, `Error deleting location: ${error.message}`, false);
        }
    }

    // Add new location function
    locationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const location_name = document.getElementById('location-name').value.trim();
        const address = document.getElementById('location-address').value.trim();
        const city = document.getElementById('location-city').value.trim();
        const state = document.getElementById('location-state').value.trim();
        const zip_code = document.getElementById('location-zip').value.trim();

        try {
            const response = await fetch('http://localhost:3000/locations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ location_name, address, city, state, zip_code })
            });

            if (!response.ok) throw new Error('Failed to add new location.');

            locationForm.reset(); // Clear form
            setMessage(locationError, 'Location added successfully', true);
            fetchLocations(); // Reload locations list
        } catch (error) {
            setMessage(locationError, `Error adding location: ${error.message}`, false);
        }
    });

    // Initialize fetch on page load
    fetchLocations();
});
