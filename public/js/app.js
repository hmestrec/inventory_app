document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const createUserForm = document.getElementById('create-user-form');
    const loginError = document.getElementById('login-error');
    const createUserError = document.getElementById('create-user-error');
    const addProductForm = document.getElementById('add-product-form');
    const addProductError = document.getElementById('add-product-error');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginSection = document.getElementById('login-section');
    const usernameSpan = document.getElementById('username');
    const productsTableBody = document.querySelector('#products-table tbody');
    const logoutButton = document.getElementById('logout-button');
    
    let isUpdating = false;
    let updateProductId = null;
    let userRole = null;

    // Modal elements
    const modal = document.getElementById('create-user-modal');
    const openModalButton = document.getElementById('openModal');
    const closeModal = document.querySelector('.close');

    // Open modal for creating a new user
    openModalButton.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    // Close the modal
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close the modal if the user clicks outside the modal content
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Handle "Create New User" form submission
    createUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newEmail = document.getElementById('new-email').value;
        const newPassword = document.getElementById('new-password').value;

        console.log('Create User Form Submitted');

        try {
            const response = await fetch('http://localhost:3000/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newEmail, password: newPassword })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Account created successfully:', data);
                createUserError.textContent = 'Account created successfully. You can now log in.';
                createUserError.style.color = 'green';
                modal.style.display = 'none';
            } else {
                const data = await response.json();
                console.error('Failed to create account:', data);
                createUserError.textContent = data.message || 'Failed to create account. Please try again.';
                createUserError.style.color = 'red';
            }
        } catch (error) {
            console.error('Error creating account:', error);
            createUserError.textContent = 'Failed to create account. Please try again.';
        }
    });

    // Handle login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (response.ok) {
                sessionStorage.setItem('loggedInUser', data.user.email);
                sessionStorage.setItem('userRole', data.user.role); // Save the role in sessionStorage

                console.log('Logged in user role:', data.user.role); // Debug log to ensure role is set
                userRole = data.user.role;
                showDashboard(data.user.email);
            } else {
                loginError.textContent = data.message;
            }
        } catch (error) {
            console.error('Error during login:', error);
            loginError.textContent = 'Login failed. Please try again.';
        }
    });

// Handle "Add or Update Product" form submission
addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('product-name').value;
    const description = document.getElementById('product-description').value;
    const price = document.getElementById('product-price').value;
    const quantity = document.getElementById('product-quantity').value;

    const url = isUpdating ? `http://localhost:3000/products/${updateProductId}` : 'http://localhost:3000/products';
    const method = isUpdating ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description, price, quantity })
        });

        if (response.ok) {
            addProductForm.reset();
            isUpdating = false;
            updateProductId = null;
            fetchProducts();
        } else {
            const data = await response.json();
            if (data.message) {
                addProductError.textContent = data.message; // Show error message if product name is duplicate
            }
        }
    } catch (error) {
        console.error('Error adding/updating product:', error);
        addProductError.textContent = 'Failed to add/update product. Please try again.';
    }
});


    // Update product quantity
    async function updateProductQuantity(id, quantity) {
        try {
            const response = await fetch(`http://localhost:3000/products/${id}/quantity`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity })
            });

            if (response.ok) {
                fetchProducts();
            } else {
                console.error('Error updating quantity');
            }
        } catch (error) {
            console.error('Error updating quantity:', error);
        }
    }

    // Show the dashboard after login and fetch products
    function showDashboard(email) {
        // Hide the login section and display the dashboard section
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        usernameSpan.textContent = email;
    
        // Fetch and display the products
        fetchProducts();
        
        // Fetch and display the clients
        fetchClients();     // Ensure this function is fetching client data properly
        
        // Fetch and display the inventory locations
        fetchLocations();   // Ensure this function is fetching inventory data properly
    
        // Show the client section after login
        document.getElementById('client-section').style.display = 'block';
    
        // Show the inventory section after login
        document.getElementById('inventory-section').style.display = 'block';
    
        // Get the user's role from session storage
        userRole = sessionStorage.getItem('userRole');
    
        // Show the "Add Product" section only for admins
        if (userRole === 'admin') {
            document.getElementById('add-product-section').style.display = 'block';
        } else {
            document.getElementById('add-product-section').style.display = 'none';
        }
    }
    

    // Fetch and display products from the server
    async function fetchProducts() {
        productsTableBody.innerHTML = '';
        try {
            const response = await fetch('http://localhost:3000/products');
            const products = await response.json();

            products.forEach(product => {
                const row = `<tr>
                                <td>${product.name}</td>
                                <td>${product.description}</td>
                                <td>${product.price}</td>
                                <td><input type="number" class="qty-input" data-id="${product.product_id}" value="${product.quantity}" /></td>
                                <td>
                                    ${userRole === 'admin' ? `<button class="delete-btn" data-id="${product.product_id}">Delete</button>` : ''}
                                    <button class="update-btn" data-id="${product.product_id}">Update</button>
                                </td>
                             </tr>`;
                productsTableBody.innerHTML += row;
            });

            // Add event listeners for quantity updates
            document.querySelectorAll('.qty-input').forEach(input => {
                input.addEventListener('change', async (e) => {
                    const productId = e.target.getAttribute('data-id');
                    const newQuantity = e.target.value;
                    if (productId && newQuantity) {
                        console.log(`Updating product with ID: ${productId}, Quantity: ${newQuantity}`);
                        await updateProductQuantity(productId, newQuantity);
                    }
                });
            });

            // Add delete event listeners
            if (userRole === 'admin') {
                document.querySelectorAll('.delete-btn').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        const productId = e.target.getAttribute('data-id');
                        await deleteProduct(productId);
                    });
                });
            }

            // Add update event listeners
            document.querySelectorAll('.update-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const productId = e.target.getAttribute('data-id');
                    await loadProductForUpdate(productId);
                });
            });
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    }

    // Load product data into form for updating
    async function loadProductForUpdate(id) {
        try {
            const product = await fetch(`http://localhost:3000/products/${id}`).then(res => res.json());
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-description').value = product.description;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-quantity').value = product.quantity;

            isUpdating = true;
            updateProductId = id;
        } catch (error) {
            console.error('Error loading product for update:', error);
        }
    }

    // Handle product deletion
    async function deleteProduct(id) {
        try {
            const response = await fetch(`http://localhost:3000/products/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                fetchProducts();
            } else {
                const data = await response.json();
                console.error(data.message);
                alert(data.message);
            }
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    }

    const addClientForm = document.getElementById('add-client-form');
    let isUpdatingClient = false;
    let updateClientId = null;
    
    // Function to fetch and display clients
    async function fetchClients() {
        const clientsTableBody = document.getElementById('clients-table-body');
        clientsTableBody.innerHTML = '';  // Clear the table before populating
    
        try {
            const response = await fetch('http://localhost:3000/clients');
            const clients = await response.json();
    
            clients.forEach(client => {
                const row = `<tr>
                                <td>${client.client_name}</td>
                                <td>${client.address}</td>
                                <td>${client.contact_email}</td>
                                <td>${client.phone_number}</td>
                                <td>
                                    <button class="edit-client-btn" data-id="${client.client_id}">Edit</button>
                                    <button class="delete-client-btn" data-id="${client.client_id}">Delete</button>
                                </td>
                            </tr>`;
                clientsTableBody.innerHTML += row;
            });
    
            // Add event listeners for the edit and delete buttons
            document.querySelectorAll('.edit-client-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const clientId = e.target.getAttribute('data-id');
                    loadClientForUpdate(clientId);
                });
            });
    
            document.querySelectorAll('.delete-client-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const clientId = e.target.getAttribute('data-id');
                    await deleteClient(clientId);
                });
            });
    
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    }
    
    // Function to load a client for updating
    async function loadClientForUpdate(clientId) {
        try {
            const response = await fetch(`http://localhost:3000/clients/${clientId}`);
            const client = await response.json();
            
            // Populate the form fields with the client data
            document.getElementById('client-name').value = client.client_name;
            document.getElementById('address').value = client.address;
            document.getElementById('contact-email').value = client.contact_email;
            document.getElementById('phone-number').value = client.phone_number;
    
            // Set an update flag and save the client ID to update later
            isUpdatingClient = true;
            updateClientId = clientId;
    
        } catch (error) {
            console.error('Error loading client for update:', error);
        }
    }
    
    // Function to delete a client
    async function deleteClient(clientId) {
        try {
            const response = await fetch(`http://localhost:3000/clients/${clientId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
    
            if (response.ok) {
                fetchClients();  // Refresh the clients list
            } else {
                const data = await response.json();
                console.error('Failed to delete client:', data.message);
            }
        } catch (error) {
            console.error('Error deleting client:', error);
        }
    }
    
    // Form submission handler for adding or updating clients
    addClientForm.addEventListener('submit', async (e) => {
        e.preventDefault();
    
        const clientName = document.getElementById('client-name').value;
        const address = document.getElementById('address').value;
        const contactEmail = document.getElementById('contact-email').value;
        const phoneNumber = document.getElementById('phone-number').value;
    
        const url = isUpdatingClient ? `http://localhost:3000/clients/${updateClientId}` : 'http://localhost:3000/clients';
        const method = isUpdatingClient ? 'PUT' : 'POST';
    
        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ client_name: clientName, address, contact_email: contactEmail, phone_number: phoneNumber })
            });
    
            if (response.ok) {
                addClientForm.reset();  // Clear the form
                isUpdatingClient = false;  // Reset update flag
                updateClientId = null;  // Clear the client ID
                fetchClients();  // Refresh the clients list
            } else {
                const data = await response.json();
                console.error('Failed to update/add client:', data.message);
            }
        } catch (error) {
            console.error('Error adding/updating client:', error);
        }
    });
    
    // Initial fetch for clients on page load
    fetchClients();
    

const addLocationForm = document.getElementById('add-location-form');
const locationsTableBody = document.getElementById('locations-table-body');

async function fetchLocations() {
    const locationsTableBody = document.getElementById('locations-table-body');
    locationsTableBody.innerHTML = '';  // Clear the table before populating

    try {
        const response = await fetch('http://localhost:3000/locations');
        const locations = await response.json();

        locations.forEach(location => {
            const row = `<tr>
                            <td>${location.location_name}</td>
                            <td>${location.address}</td>
                            <td>${location.city}</td>
                            <td>${location.state}</td>
                            <td>${location.zip_code}</td>
                            <td>
                                <button class="edit-location-btn" data-id="${location.location_id}">Edit</button>
                                <button class="delete-location-btn" data-id="${location.location_id}">Delete</button>
                            </td>
                        </tr>`;
            locationsTableBody.innerHTML += row;
        });

        // Add event listeners for the edit and delete buttons
        document.querySelectorAll('.edit-location-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const locationId = e.target.getAttribute('data-id');
                loadLocationForUpdate(locationId);
            });
        });

        document.querySelectorAll('.delete-location-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const locationId = e.target.getAttribute('data-id');
                await deleteLocation(locationId);
            });
        });

    } catch (error) {
        console.error('Error fetching locations:', error);
    }
}

async function loadLocationForUpdate(locationId) {
    try {
        const location = await fetch(`http://localhost:3000/locations/${locationId}`).then(res => res.json());
        
        // Populate the form fields with the location data
        document.getElementById('location-name').value = location.location_name;
        document.getElementById('location-address').value = location.address;
        document.getElementById('location-city').value = location.city;
        document.getElementById('location-state').value = location.state;
        document.getElementById('location-zip').value = location.zip_code;

        // Set an update flag and save the location ID to update later
        isUpdatingLocation = true;
        updateLocationId = locationId;

    } catch (error) {
        console.error('Error loading location for update:', error);
    }
}

async function deleteLocation(locationId) {
    try {
        const response = await fetch(`http://localhost:3000/locations/${locationId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            fetchLocations();  // Refresh the locations list
        } else {
            const data = await response.json();
            console.error('Failed to delete location:', data.message);
        }
    } catch (error) {
        console.error('Error deleting location:', error);
    }
}


// Initial fetch for locations on page load
fetchLocations();


    // Handle logout
    logoutButton.addEventListener('click', () => {
        sessionStorage.clear();
        location.reload();
    });

    // Check if user is already logged in
    if (sessionStorage.getItem('loggedInUser')) {
        showDashboard(sessionStorage.getItem('loggedInUser'));
    }
});
