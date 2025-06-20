document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');
    const API_BASE_URL = 'http://localhost:3000/api/auth';

    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            messageDiv.textContent = '';
            messageDiv.className = '';

            const email = registerForm.email.value;
            const password = registerForm.password.value;
            const age = registerForm.age.value ? parseInt(registerForm.age.value) : null;
            const gender = registerForm.gender.value;
            const calming_strategies = registerForm.calming_strategies.value;

            const userData = { email, password, age, gender, calming_strategies };

            try {
                const response = await fetch(`${API_BASE_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });
                const data = await response.json();
                if (response.ok) {
                    messageDiv.textContent = data.message || 'Registration successful! Redirecting to login...';
                    messageDiv.className = 'message success';
                    registerForm.reset();
                    setTimeout(() => { window.location.href = 'login.html'; }, 2000);
                } else {
                    messageDiv.textContent = data.message || 'Registration failed. Please try again.';
                    messageDiv.className = 'message error';
                }
            } catch (error) {
                console.error('Registration error:', error);
                messageDiv.textContent = 'An error occurred during registration. Please try again.';
                messageDiv.className = 'message error';
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            messageDiv.textContent = ''; // Clear previous messages
            messageDiv.className = ''; // Clear previous classes

            const email = loginForm.email.value;
            const password = loginForm.password.value;

            const credentials = { email, password };

            try {
                const response = await fetch(`${API_BASE_URL}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(credentials)
                });

                const data = await response.json();

                if (response.ok) {
                    messageDiv.textContent = data.message || 'Login successful! Redirecting...';
                    messageDiv.className = 'message success';

                    // Store the JWT
                    if (data.token) {
                        sessionStorage.setItem('jwtToken', data.token);
                    }
                    // Also store user email for convenience if needed, or rely on token decoding elsewhere
                    if(data.user && data.user.email) {
                        sessionStorage.setItem('loggedInUser', data.user.email);
                    }

                    loginForm.reset();
                    setTimeout(() => {
                        window.location.href = 'dashboard.html'; // Redirect to a dashboard page
                    }, 1500);
                } else {
                    messageDiv.textContent = data.message || 'Login failed. Please check your credentials.';
                    messageDiv.className = 'message error';
                    sessionStorage.removeItem('jwtToken'); // Clear any stale token on failed login
                    sessionStorage.removeItem('loggedInUser');
                }
            } catch (error) {
                console.error('Login error:', error);
                messageDiv.textContent = 'An error occurred during login. Please try again.';
                messageDiv.className = 'message error';
                sessionStorage.removeItem('jwtToken'); // Clear any stale token on error
                sessionStorage.removeItem('loggedInUser');
            }
        });
    }
});
