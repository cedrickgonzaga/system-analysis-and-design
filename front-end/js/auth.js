const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:" ? "http://127.0.0.1:8000" : "";

function showAuthMessage(message, isError = true) {
    const msgDiv = document.getElementById("authMessage");
    if (msgDiv) {
        msgDiv.textContent = message;
        msgDiv.style.color = isError ? "var(--danger, red)" : "var(--success, green)";
    }
}

async function login(email, password) {
    showAuthMessage("Signing in...", false);
    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            showAuthMessage(data.detail || "Login failed. Please check your credentials.");
            return;
        }

        // Save token and user info
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("full_name", data.full_name);
        localStorage.setItem("email", data.email);

        showAuthMessage("Login successful! Redirecting...", false);

        // Role-based redirect
        const pages = {
            standard: "../standard-user/user-dashboard.html",
            it_admin: "../it-admin/it-dashboard.html",
            facility_admin: "../facility-admin/facility-dashboard.html",
            security: "../security-admin/security-dashboard.html"
        };
        
        setTimeout(() => {
            window.location.href = pages[data.role] || "../standard-user/user-dashboard.html";
        }, 1000);

    } catch (err) {
        console.error("Login Fetch Error:", err);
        showAuthMessage("Connection error. Is the backend running?");
    }
}

async function register(firstName, lastName, email, password) {
    showAuthMessage("Creating account...", false);
    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                first_name: firstName, 
                last_name: lastName, 
                email: email, 
                password: password 
            })
        });

        const data = await res.json();

        if (!res.ok) {
            showAuthMessage(data.detail || "Registration failed.");
            return;
        }

        if (data.access_token === "CONFIRM_EMAIL") {
            showAuthMessage("Registration successful! Please check your email to confirm your account before logging in.", false);
            return;
        }

        showAuthMessage("Account created successfully! Redirecting...", false);
        
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("full_name", data.full_name);

        setTimeout(() => {
            window.location.href = "../standard-user/user-dashboard.html";
        }, 1500);

    } catch (err) {
        console.error(err);
        showAuthMessage("Connection error. Please try again later.");
    }
}

// Event Listeners for Forms
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            login(email, password);
        });
    }

    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const firstName = document.getElementById("fname").value;
            const lastName = document.getElementById("lname").value;
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            const confirm = document.getElementById("confirm").value;

            if (password !== confirm) {
                showAuthMessage("Passwords do not match.");
                return;
            }

            if (password.length < 6) {
                showAuthMessage("Password must be at least 6 characters.");
                return;
            }

            register(firstName, lastName, email, password);
        });
    }
});
