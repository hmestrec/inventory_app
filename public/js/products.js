document.addEventListener('DOMContentLoaded', () => {
    const productForm = document.getElementById('product-form');
    const productError = document.getElementById('product-error');
    const productsTableBody = document.querySelector('#products-table tbody');
    
    // Quantity Update Modal Elements
    const updateQuantityModal = document.getElementById('update-quantity-modal');
    const modalQuantityInput = document.getElementById('modal-quantity-input');
    const modalUpdateBtn = document.getElementById('modal-update-btn');
    const modalCloseBtn = updateQuantityModal.querySelector('.close');

    let currentProductId = null; // To hold the ID of the product being updated

    // Submit form for adding/updating products
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('product-id').value;
        const name = document.getElementById('product-name').value;
        const description = document.getElementById('product-description').value;
        const price = document.getElementById('product-price').value;
        const quantity = document.getElementById('product-quantity').value;

        const url = id ? `http://localhost:3000/products/${id}` : 'http://localhost:3000/products';
        const method = id ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, price, quantity })
            });

            if (!response.ok) {
                const responseData = await response.json();
                throw new Error(responseData.message || 'Failed to process the request');
            }

            productError.textContent = ''; // Clear any error messages
            productForm.reset();  // Reset form on success
            fetchProducts();  // Reload product list after add/update

        } catch (error) {
            productError.textContent = error.message;
        }
    });

    // Fetch and display products
    async function fetchProducts() {
        productsTableBody.innerHTML = '';  // Clear the table body before loading new data

        try {
            const response = await fetch('http://localhost:3000/products');
            if (!response.ok) throw new Error(`Failed to fetch products. Status: ${response.status}`);

            const products = await response.json();
            if (products.length === 0) {
                productsTableBody.innerHTML = '<tr><td colspan="5">No products available.</td></tr>';
                return;
            }

            products.forEach(product => {
                const row = `<tr>
                                <td>${product.name}</td>
                                <td>${product.description}</td>
                                <td>${product.price}</td>
                                <td>${product.quantity}</td>
                                <td>
                                    <button class="update-qty-btn" data-id="${product.product_id}">Update Qty</button>
                                    <button class="delete-product-btn" data-id="${product.product_id}">Delete</button>
                                </td>
                             </tr>`;
                productsTableBody.innerHTML += row;
            });

            // Add event listeners for the Update Qty and Delete buttons
            document.querySelectorAll('.update-qty-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    currentProductId = e.target.getAttribute('data-id');
                    showUpdateQuantityModal();
                });
            });

            document.querySelectorAll('.delete-product-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const productId = e.target.getAttribute('data-id');
                    await deleteProduct(productId);
                });
            });

        } catch (error) {
            productError.textContent = 'Error fetching products. Please try again.';
        }
    }

    // Show Update Quantity Modal
    function showUpdateQuantityModal() {
        modalQuantityInput.value = ''; // Clear input value
        updateQuantityModal.style.display = 'flex';
    }

    // Hide Update Quantity Modal
    function hideUpdateQuantityModal() {
        updateQuantityModal.style.display = 'none';
    }

    // Update product quantity
    modalUpdateBtn.addEventListener('click', async () => {
        const newQuantity = modalQuantityInput.value;
        if (!newQuantity) return;

        try {
            console.log(`Updating product ID: ${currentProductId} with quantity: ${newQuantity}`);
            
            const response = await fetch(`http://localhost:3000/products/${currentProductId}/quantity`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: newQuantity })
            });

            if (!response.ok) {
                const responseData = await response.json();
                throw new Error(responseData.message || 'Failed to update quantity');
            }

            productError.textContent = 'Quantity updated successfully';
            hideUpdateQuantityModal();
            fetchProducts();  // Reload products list after updating
        } catch (error) {
            productError.textContent = `Error updating quantity: ${error.message}`;
        }
    });

    // Close modal when the user clicks the close button
    modalCloseBtn.addEventListener('click', hideUpdateQuantityModal);

    // Close modal when the user clicks anywhere outside of the modal content
    window.addEventListener('click', (event) => {
        if (event.target == updateQuantityModal) {
            hideUpdateQuantityModal();
        }
    });

    // Delete product function
    async function deleteProduct(id) {
        try {
            const response = await fetch(`http://localhost:3000/products/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                const responseData = await response.json();
                throw new Error(responseData.message || 'Failed to delete the product');
            }

            productError.textContent = 'Product deleted successfully';
            fetchProducts(); // Reload product list after deletion
        } catch (error) {
            productError.textContent = `Error deleting product: ${error.message}`;
        }
    }

    // Initialize fetch on page load
    fetchProducts();
});
