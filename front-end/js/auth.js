const API_BASE = "http://localhost:8000";

async function login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    if (!res.ok) { alert("Login failed"); return; }
    const data = await res.json();
    // Save token and role for later API calls
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("full_name", data.full_name);
    // Role-based redirect
    const pages = {
        standard: "user-dashboard.html",
        it_admin: "it-dashboard.html",
        facility_admin: "facility-dashboard.html",
        security: "security-dashboard.html"
    };
    window.location.href = pages[data.role] || "user-dashboard.html";
}

async function register(firstName, lastName, email, password) {
    const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, email, password })
    });
    if (!res.ok) { alert("Registration failed"); return; }
    const data = await res.json();
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("role", data.role);
    window.location.href = "user-dashboard.html";
}