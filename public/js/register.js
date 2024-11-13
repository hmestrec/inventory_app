document.getElementById('register-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const registerError = document.getElementById('register-error');
    const registerForm = document.getElementById('register-form');
    const companyName = document.getElementById('company-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    // Check if fields are filled
    if (!companyName || !email || !password) {
        registerError.textContent = 'All fields are required';
        return;
    }

    try {
        const response = await fetch('https://sheltered-ocean-88352-000ba16da54d.herokuapp.com/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyName, email, password })
        });

        if (!response.ok) {
            const responseData = await response.json();
            throw new Error(responseData.message || 'Failed to register user');
        }

        registerError.textContent = 'User registered successfully!';
        registerForm.reset();
    } catch (error) {
        registerError.textContent = `Error: ${error.message}`;
    }
});