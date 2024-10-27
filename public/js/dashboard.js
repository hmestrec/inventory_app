document.addEventListener('DOMContentLoaded', () => {
    const usernameElement = document.getElementById('username');
    const logoutButton = document.getElementById('logout-button');
    const adminLink = document.getElementById('admin-link');

    // Get user information from session storage
    const userEmail = sessionStorage.getItem('userEmail');
    const userRole = sessionStorage.getItem('userRole');

    // Debugging Logs
    console.log("Loaded dashboard.js");
    console.log("User Email from session storage:", userEmail);
    console.log("User Role from session storage:", userRole);

    // Redirect to login page if the user is not logged in
    if (!userEmail) {
        console.log("User email not found, redirecting to login...");
        window.location.href = 'login.html';
        return;
    }

    // Display the username in the welcome message
    if (userEmail) {
        usernameElement.textContent = userEmail;
        console.log("User email set in the welcome message");
    }

    // Show the admin link only if the user is an admin
    if (userRole === 'admin') {
        adminLink.style.display = 'inline-block';
        console.log("Admin link is now visible");
    }

    // Handle logout by clearing session storage and redirecting to login
    logoutButton.addEventListener('click', () => {
        console.log("Logging out...");
        sessionStorage.clear(); // Clear user data from session storage
        window.location.href = 'login.html'; // Redirect to login page immediately
    });
});
