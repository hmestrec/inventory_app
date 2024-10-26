document.addEventListener('DOMContentLoaded', () => {
    const locationsTableBody = document.querySelector('#locations-table tbody');
    const locationError = document.getElementById('location-error');
    const locationForm = document.getElementById('location-form');

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
            locationError.textContent = 'Error fetching locations. Please try again.';
        }
    }

    // Toggle row edit mode
    function toggleEditLocationRow(row, isEditing) {
        const editButton = row.querySelector('.edit-location-btn');
        const saveButton = row.querySelector('.save-location-btn');

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

            locationError.textContent = 'Location updated successfully';
            toggleEditLocationRow(row, false);
        } catch (error) {
            locationError.textContent = `Error updating location: ${error.message}`;
        }
    }

    // Delete location function
    async function deleteLocation(locationId) {
        try {
            const response = await fetch(`http://localhost:3000/locations/${locationId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete location.');

            locationError.textContent = 'Location deleted successfully';
            fetchLocations(); // Reload location list after deletion
        } catch (error) {
            locationError.textContent = `Error deleting location: ${error.message}`;
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
            locationError.textContent = 'Location added successfully';
            fetchLocations(); // Reload locations list
        } catch (error) {
            locationError.textContent = `Error adding location: ${error.message}`;
        }
    });

    // Initialize fetch on page load
    fetchLocations();
});
