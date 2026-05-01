const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:" ? "http://127.0.0.1:8000" : "";

console.log("auth.js loaded. API_BASE:", API_BASE);

// Helper to show/hide global messages
function showAuthMessage(message, isError = true) {
    const msgDiv = document.getElementById("authMessage");
    if (msgDiv) {
        msgDiv.textContent = message;
        msgDiv.style.color = isError ? "var(--danger, red)" : "var(--success, green)";
        msgDiv.style.display = "block";
        // Scroll to message if it's an error and might be hidden
        if (isError) msgDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Helper to show field-specific warnings below inputs
function setFieldWarning(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    // Remove existing warning if any
    const existing = field.parentNode.querySelector(".field-warning");
    if (existing) existing.remove();

    if (message) {
        const warn = document.createElement("div");
        warn.className = "field-warning";
        warn.style.color = "var(--danger, red)";
        warn.style.fontSize = "0.75rem";
        warn.style.marginTop = "4px";
        warn.textContent = message;
        field.parentNode.appendChild(warn);
        field.style.borderColor = "var(--danger, red)";
    } else {
        field.style.borderColor = "";
    }
}

function clearAllWarnings() {
    document.querySelectorAll(".field-warning").forEach(el => el.remove());
    document.querySelectorAll("input").forEach(el => el.style.borderColor = "");
    const msgDiv = document.getElementById("authMessage");
    if (msgDiv) msgDiv.textContent = "";
}

function isValidEmail(email) {
    const re = /^[^\s@]+@(ntc\.edu\.ph|gmail\.com)$/;
    return re.test(email);
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

        localStorage.setItem("token", data.access_token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("full_name", data.full_name);
        localStorage.setItem("email", data.email);

        showAuthMessage("Login successful! Redirecting...", false);

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
            showAuthMessage("Registration successful! Please check email to confirm.", false);
            return;
        }

        showAuthMessage("Account created! Redirecting...", false);
        
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("full_name", data.full_name);

        setTimeout(() => {
            window.location.href = "../standard-user/user-dashboard.html";
        }, 1500);

    } catch (err) {
        console.error("Register Fetch Error:", err);
        showAuthMessage("Connection error. Please try again later.");
    }
}

function initAuth() {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            clearAllWarnings();
            
            const emailField = document.getElementById("email");
            const passwordField = document.getElementById("password");
            
            const email = emailField.value.trim();
            const password = passwordField.value;

            let hasError = false;
            if (!email) { setFieldWarning("email", "Email is required"); hasError = true; }
            else if (!isValidEmail(email)) { setFieldWarning("email", "Please use @ntc.edu.ph or @gmail.com"); hasError = true; }
            
            if (!password) { setFieldWarning("password", "Password is required"); hasError = true; }

            if (!hasError) login(email, password);
        });
    }

    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", (e) => {
            e.preventDefault();
            clearAllWarnings();

            const firstName = document.getElementById("fname").value.trim();
            const lastName = document.getElementById("lname").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;
            const confirm = document.getElementById("confirm").value;

            let hasError = false;
            if (!firstName) { setFieldWarning("fname", "First name is required"); hasError = true; }
            if (!lastName) { setFieldWarning("lname", "Last name is required"); hasError = true; }
            
            if (!email) { setFieldWarning("email", "Email is required"); hasError = true; }
            else if (!isValidEmail(email)) { setFieldWarning("email", "Please use @ntc.edu.ph or @gmail.com"); hasError = true; }
            
            if (!password) { setFieldWarning("password", "Password is required"); hasError = true; }
            else if (password.length < 6) { setFieldWarning("password", "Must be at least 6 characters"); hasError = true; }
            
            if (password !== confirm) { setFieldWarning("confirm", "Passwords do not match"); hasError = true; }

            if (!hasError) register(firstName, lastName, email, password);
        });
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAuth);
} else {
    initAuth();
}
