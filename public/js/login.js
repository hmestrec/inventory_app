document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const loginError = document.getElementById('login-error');

    loginError.textContent = ''; // Clear any previous error messages

    if (!email || !password) {
        loginError.textContent = 'All fields are required';
        return;
    }

    try {
        console.log("Attempting to log in with email:", email);

        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        console.log("Received response with status:", response.status);

        if (!response.ok) {
            const responseData = await response.json();
            console.error("Response error data:", responseData);
            throw new Error(responseData.message || 'Login failed');
        }

        const responseData = await response.json();
        console.log("Login successful, response data:", responseData);

        // Store user role and email in session storage
        if (responseData && responseData.user) {
            sessionStorage.setItem('userRole', responseData.user.role);
            sessionStorage.setItem('userEmail', responseData.user.email);
            console.log("User role and email stored in session storage.");

            // Redirect based on user role
            if (responseData.user.role === 'admin') {
                console.log("Redirecting to admin page.");
                window.location.href = 'dashboard.html';
            } else {
                console.log("Redirecting to dashboard page.");
                window.location.href = 'dashboard.html';
            }
        } else {
            throw new Error('Invalid response data from server');
        }

    } catch (error) {
        loginError.textContent = `Error: ${error.message}`;
        console.error('Login error:', error);
    }
});
