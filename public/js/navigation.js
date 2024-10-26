document.addEventListener('DOMContentLoaded', () => {
    const usernameElement = document.getElementById('username');
    const logoutButton = document.getElementById('logout-button');
    const adminLink = document.getElementById('admin-link');

    // Get user information from session storage
    const userEmail = sessionStorage.getItem('userEmail');
    const userRole = sessionStorage.getItem('userRole');

    // Function to handle redirection
    function redirectToLogin() {
        console.log("Redirecting to login page...");
        window.location.href = 'login.html';
    }

    // If user information is not available, redirect to login
    if (!userEmail) {
        redirectToLogin();
        return;  // Stop further execution if not logged in
    }

    // If user is logged in, set the username (only if the element exists)
    if (usernameElement && userEmail) {
        usernameElement.textContent = userEmail;
    }

    // If the user is an admin, show the admin link (only if the element exists)
    if (adminLink && userRole === 'admin') {
        adminLink.style.display = 'inline-block';
    }

    // Handle logout (only if the element exists)
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            console.log("Logging out...");
            sessionStorage.clear();  // Clear user data from session storage
            redirectToLogin();  // Redirect to login page
        });
    }
});
