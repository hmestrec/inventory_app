document.addEventListener('DOMContentLoaded', () => {
    const usernameElement = document.getElementById('username');
    const logoutButton = document.getElementById('logout-button');
    const adminLink = document.getElementById('admin-link');

    // Get user information from session storage
    const userEmail = sessionStorage.getItem('userEmail');
    const userRole = sessionStorage.getItem('userRole');


    // Redirect to login page if the user is not logged in
    if (!userEmail) {
        window.location.href = 'login.html';
        return;
    }

    // Display the username in the welcome message
    if (userEmail) {
        usernameElement.textContent = userEmail;
    }

    // Show the admin link only if the user is an admin
    if (userRole === 'admin') {
        adminLink.style.display = 'inline-block';
    }

    // Handle logout by clearing session storage and redirecting to login
    logoutButton.addEventListener('click', () => {
        sessionStorage.clear(); // Clear user data from session storage
        window.location.href = 'login.html'; // Redirect to login page immediately
    });
});
