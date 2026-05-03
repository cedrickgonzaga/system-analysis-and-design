const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:" ? "http://127.0.0.1:8000" : "";

// --- UTILITIES ---

async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "../landing-login-register-page/login.html";
        return;
    }

    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        ...options.headers
    };

    const res = await fetch(url, { ...options, headers });
    
    if (res.status === 401) {
        localStorage.clear();
        window.location.href = "../landing-login-register-page/login.html";
        return;
    }
    
    return res;
}

function formatDate(dateStr) {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
}

function getStatusBadge(status) {
    const s = status ? status.toLowerCase() : "pending";
    let cls = "badge-pending"; // default
    if (s === "pending") cls = "badge-pending";
    if (s === "in progress") cls = "badge-progress";
    if (s === "resolved" || s === "claimed") cls = "badge-resolved";
    if (s === "approved") cls = "badge-approved";
    if (s === "rejected") cls = "badge-rejected";
    
    return `<span class="badge ${cls}">${status || "Pending"}</span>`;
}

// --- FORM HANDLERS ---

// Helper for UI feedback
function showFormMessage(formId, message, isError = true) {
    const form = document.getElementById(formId);
    let msgDiv = form.querySelector(".form-feedback");
    if (!msgDiv) {
        msgDiv = document.createElement("div");
        msgDiv.className = "form-feedback";
        msgDiv.style.marginTop = "15px";
        msgDiv.style.fontSize = "0.9rem";
        msgDiv.style.fontWeight = "500";
        form.appendChild(msgDiv);
    }
    msgDiv.textContent = message;
    msgDiv.style.color = isError ? "var(--danger, red)" : "var(--success, green)";
}

// Global submit handler for Facility Issues
async function handleFacilityReport(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector("button[type='submit']");
    const originalBtnText = btn.textContent;

    const category = document.getElementById("category").value;
    const issueName = document.getElementById("issue-name").value;
    const location = document.getElementById("location").value;
    const description = document.getElementById("description").value;
    const fileInput = document.getElementById("attachment");

    if (!category || !issueName || !location) {
        showFormMessage(form.id, "Please fill in all required fields.");
        return;
    }

    try {
        btn.disabled = true;
        btn.textContent = "Submitting...";
        showFormMessage(form.id, "Processing report...", false);

        let imageUrl = null;
        if (fileInput.files.length > 0) {
            showFormMessage(form.id, "Uploading image...", false);
            imageUrl = await uploadImage(fileInput.files[0]);
        }

        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/tickets/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                category,
                issue_name: issueName,
                location,
                description,
                image_url: imageUrl
            })
        });

        if (!res.ok) {
            const err = await res.json();
            let errorMsg = "Failed to submit report";
            if (err.detail) {
                errorMsg = typeof err.detail === 'object' ? JSON.stringify(err.detail) : err.detail;
            }
            throw new Error(errorMsg);
        }

        showFormMessage(form.id, "Success! Your report has been submitted.", false);
        form.reset();
        
        setTimeout(() => {
            window.location.href = "user-dashboard.html";
        }, 2000);

    } catch (err) {
        console.error(err);
        showFormMessage(form.id, err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = originalBtnText;
    }
}

// Global submit handler for Found Items
async function handleFoundItemReport(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector("button[type='submit']");
    const originalBtnText = btn.textContent;

    const itemName = document.getElementById("item-name").value;
    const location = document.getElementById("location").value;
    const category = document.getElementById("category").value;
    const possession = form.querySelector('input[name="possession"]:checked').value;
    const description = document.getElementById("description").value;
    const fileInput = document.getElementById("attachment");

    if (!itemName || !location || !category) {
        showFormMessage(form.id, "Please fill in all required fields.");
        return;
    }

    try {
        btn.disabled = true;
        btn.textContent = "Submitting...";
        showFormMessage(form.id, "Processing report...", false);

        let imageUrl = null;
        if (fileInput.files.length > 0) {
            showFormMessage(form.id, "Uploading image...", false);
            imageUrl = await uploadImage(fileInput.files[0]);
        }

        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/items/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                item_name: itemName,
                location,
                category,
                description,
                image_url: imageUrl,
                possession: possession
            })
        });

        if (!res.ok) {
            const err = await res.json();
            let errorMsg = "Failed to submit report";
            if (err.detail) {
                errorMsg = typeof err.detail === 'object' ? JSON.stringify(err.detail) : err.detail;
            }
            throw new Error(errorMsg);
        }

        showFormMessage(form.id, "Success! Item reported successfully.", false);
        form.reset();

        setTimeout(() => {
            window.location.href = "user-dashboard.html";
        }, 2000);

    } catch (err) {
        console.error(err);
        showFormMessage(form.id, err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = originalBtnText;
    }
}

// Initialize listeners
document.addEventListener("DOMContentLoaded", () => {
    const facilityForm = document.getElementById("reportFacilityForm");
    if (facilityForm) facilityForm.addEventListener("submit", handleFacilityReport);

    const foundItemForm = document.getElementById("reportFoundItemForm");
    if (foundItemForm) foundItemForm.addEventListener("submit", handleFoundItemReport);
    
    const summaryMonth = document.getElementById("summary-month");
    if (summaryMonth) {
        summaryMonth.addEventListener("change", loadSummaryPreview);
        // Force picker on click for desktop browsers
        summaryMonth.addEventListener("click", (e) => {
            if (typeof e.target.showPicker === 'function') {
                e.target.showPicker();
            }
        });
    }

    // Page Loaders
    const path = window.location.pathname;
    if (path.includes("activity-history.html")) loadActivityHistory();
    if (path.includes("lost-found-gallery.html")) loadLostFoundGallery();
    if (path.includes("it-dashboard.html") || path.includes("facility-dashboard.html")) loadAdminDashboard();
    if (path.includes("it-tickets.html") || path.includes("facility-tickets.html")) loadAdminTickets();
    if (path.includes("security-dashboard.html")) loadSecurityDashboard();
    if (path.includes("security-pending-posts.html")) loadPendingItems();
    if (path.includes("security-gallery.html")) loadSecurityGallery();
});

async function loadSecurityDashboard() {
    console.log("Loading Security Dashboard...");
    const pendingCount = document.getElementById("stats-pending");
    const galleryCount = document.getElementById("stats-gallery");
    const claimedCount = document.getElementById("stats-claimed");
    const recentTable = document.getElementById("recent-items-table");

    try {
        // Stats: Pending vs All Items
        const allItemsRes = await fetchWithAuth(`${API_BASE}/admin/items`);
        const allItems = await allItemsRes.json();
        console.log("Security items fetched:", allItems.length);
        
        const pending = allItems.filter(i => i.status === "pending");
        const displayedApproved = allItems.filter(i => i.status === "approved");
        const claimedRecords = allItems.filter(i => i.status === "claimed");
        
        // Calculate Claimed This Month
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const claimedThisMonth = claimedRecords.filter(i => {
            const d = new Date(i.updated_at || i.created_at);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        if (pendingCount) pendingCount.textContent = pending.length;
        if (galleryCount) galleryCount.textContent = displayedApproved.length;
        if (claimedCount) claimedCount.textContent = claimedThisMonth.length;

        // Table 1: Recent Active Items
        if (recentTable) {
            recentTable.innerHTML = "";
            const activeItems = allItems.filter(i => i.status !== "claimed").slice(0, 5);
            if (activeItems.length === 0) {
                recentTable.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">No active items.</td></tr>`;
            } else {
                activeItems.forEach(item => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>#${item.id}</td>
                        <td><strong>${item.item_name}</strong></td>
                        <td>${item.location}</td>
                        <td>${formatDate(item.created_at)}</td>
                        <td>${getStatusBadge(item.status)}</td>
                    `;
                    recentTable.appendChild(row);
                });
            }
        }

        // Table 2: Claims Log (Audit Trail)
        const logTableBody = document.getElementById("claims-log-table-body");
        if (logTableBody) {
            logTableBody.innerHTML = "";
            if (claimedRecords.length === 0) {
                logTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">No handover records found.</td></tr>`;
            } else {
                claimedRecords.forEach(item => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${formatDate(item.updated_at || item.created_at)}</td>
                        <td><strong>${item.item_name}</strong></td>
                        <td style="color:var(--success); font-weight:600;">${item.claimer_name || "Unknown"}</td>
                        <td>${item.claimer_email || "-"}</td>
                        <td style="font-size: 0.8rem;">${item.poster ? item.poster.full_name : "Finder"}</td>
                    `;
                    logTableBody.appendChild(row);
                });
            }
        }
    } catch (err) {
        console.error(err);
    }
}

async function loadPendingItems() {
    const tableBody = document.querySelector("#pending-items-table-body");
    if (!tableBody) return;

    try {
        const res = await fetchWithAuth(`${API_BASE}/admin/items?status=pending`);
        const items = await res.json();

        if (items.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:40px; color:var(--text-muted);">No pending items to review.</td></tr>`;
            return;
        }

        tableBody.innerHTML = "";
        items.forEach((item, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>
                    <div style="width:60px; height:60px; background:var(--bg-alt); border-radius:4px; overflow:hidden; display:flex; align-items:center; justify-content:center;">
                        ${item.image_url ? `<img src="${item.image_url}" style="width:100%; height:100%; object-fit:cover;">` : `<span style="font-size:1.5rem;">📦</span>`}
                    </div>
                </td>
                <td>${(index + 1).toString().padStart(3, '0')}</td>
                <td>${item.poster ? item.poster.full_name : "Unknown"}</td>
                <td><strong>${item.item_name}</strong></td>
                <td>${item.category}</td>
                <td>${item.location}</td>
                <td>${formatDate(item.created_at)}</td>
                <td>
                    <div style="display:flex; gap:6px;">
                        <button class="btn btn-success btn-sm" onclick="updateItemStatus(${item.id}, 'approved')">Approve</button>
                        <button class="btn btn-danger btn-sm" onclick="updateItemStatus(${item.id}, 'rejected')">Reject</button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (err) {
        console.error(err);
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--danger);">Error loading pending items.</td></tr>`;
    }
}


async function loadSecurityGallery() {
    const galleryGrid = document.querySelector(".gallery-grid");
    if (!galleryGrid) return;

    try {
        const res = await fetchWithAuth(`${API_BASE}/admin/items`);
        const items = await res.json();

        if (items.length === 0) {
            galleryGrid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--text-muted);">No items in the system.</div>`;
            return;
        }

        galleryGrid.innerHTML = "";
        items.forEach(item => {
            const card = document.createElement("div");
            card.className = "gallery-item";
            const isClaimed = item.status === "claimed";
            
            card.innerHTML = `
                <div class="gallery-thumb" style="overflow:hidden;">
                    ${item.image_url ? `<img src="${item.image_url}" style="width:100%; height:100%; object-fit:cover;">` : `
                        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; font-size:1rem; color:var(--text-muted); height:100%;">
                            <span style="font-size:2.5rem;">📦</span>
                            <span style="font-size:0.7rem;">No image uploaded</span>
                        </div>
                    `}
                </div>
                <div class="gallery-info">
                    <h4>${item.item_name}</h4>
                    <p>📍 ${item.location}</p>
                    <p style="margin-top:4px; font-size:0.75rem; color:var(--text-muted);">🕐 ${formatDate(item.created_at)}</p>
                    <p style="margin-top:4px;">${getStatusBadge(item.status)}</p>
                    ${isClaimed ? `
                        <div style="margin-top:10px; padding-top:10px; border-top:1px dashed var(--border); font-size:0.8rem;">
                            <div style="font-weight:600; color:var(--success);">Claimed By:</div>
                            <div>${item.claimer_name || "Unknown"}</div>
                            <div style="font-style:italic; opacity:0.8;">${item.claimer_email || ""}</div>
                        </div>
                    ` : ""}
                </div>
                <div class="gallery-actions">
                    <button class="btn btn-success btn-sm" ${isClaimed ? 'disabled' : ''} onclick="updateItemStatus(${item.id}, 'claimed')">
                        ${isClaimed ? 'Claimed' : 'Mark as Claimed'}
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteItem(${item.id})">Delete</button>
                </div>
            `;
            galleryGrid.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        galleryGrid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--danger);">Error loading items.</div>`;
    }
}

async function deleteItem(itemId) {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
        const res = await fetchWithAuth(`${API_BASE}/admin/items/${itemId}`, {
            method: "DELETE"
        });
        if (!res.ok) throw new Error("Failed to delete item");
        loadSecurityGallery();
    } catch (err) {
        console.error(err);
        alert("Error deleting item.");
    }
}


async function markMyItemClaimed(itemId, itemName) {
    const claimerName = prompt(`Marking "${itemName}" as claimed.\n\nWho received the item? (Enter their name):`);
    if (!claimerName) return;
    
    const claimerEmail = prompt("Enter their email (optional):");

    try {
        const res = await fetchWithAuth(`${API_BASE}/items/${itemId}/mark-claimed/`, {
            method: "PATCH",
            body: JSON.stringify({
                claimer_name: claimerName,
                claimer_email: claimerEmail || ""
            })
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.detail || "Failed to mark as claimed");
        }

        alert("Item successfully marked as claimed. It will no longer appear in the public gallery.");
        loadLostFoundGallery();

    } catch (err) {
        console.error("Mark Claimed Error:", err);
        alert("Error: " + (err.message || "Connection failed. Check if backend is running."));
    }
}


async function updateItemStatus(itemId, newStatus) {
    try {
        // If marking as claimed, ask for claimer info
        if (newStatus === 'claimed') {
            const claimerName = prompt("Enter the Full Name of the student who claimed this item:");
            if (!claimerName) return; // Cancel if no name
            const claimerEmail = prompt("Enter their School Email (optional):");
            
            const res = await fetchWithAuth(`${API_BASE}/admin/items/${itemId}/mark-claimed/`, {
                method: "PATCH",
                body: JSON.stringify({ 
                    claimer_name: claimerName, 
                    claimer_email: claimerEmail || "" 
                })
            });
            if (!res.ok) throw new Error("Failed to mark as claimed");
        } else {
            const res = await fetchWithAuth(`${API_BASE}/admin/items/${itemId}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status: newStatus })
            });
            if (!res.ok) throw new Error("Failed to update status");
        }
        
        // Refresh based on current page
        const path = window.location.pathname;
        if (path.includes("security-pending-posts.html")) loadPendingItems();
        if (path.includes("security-gallery.html")) loadSecurityGallery();
        if (path.includes("security-dashboard.html")) loadSecurityDashboard();

    } catch (err) {
        console.error(err);
        alert("Error updating item status.");
    }
}


async function loadAdminTickets() {
    const ticketTable = document.getElementById("admin-tickets-table");
    if (!ticketTable) return;

    try {
        const res = await fetchWithAuth(`${API_BASE}/admin/tickets`);
        const tickets = await res.json();

        if (tickets.length === 0) {
            ticketTable.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">No tickets found.</td></tr>`;
            return;
        }

        ticketTable.innerHTML = "";
        tickets.forEach(t => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>#T-${t.id.toString().padStart(3, '0')}</td>
                <td>${t.reporter ? t.reporter.full_name : "Unknown"}</td>
                <td><strong>${t.issue_name}</strong></td>
                <td>${t.location}</td>
                <td>${formatDate(t.created_at)}</td>
                <td>${getStatusBadge(t.status)}</td>
                <td>
                    <select class="form-control" style="padding:5px 10px; font-size:0.8rem; border-radius:999px;" 
                        onchange="updateTicketStatus(${t.id}, this.value)">
                        <option value="Pending" ${t.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="In Progress" ${t.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Resolved" ${t.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                    </select>
                </td>
            `;
            ticketTable.appendChild(row);
        });

    } catch (err) {
        console.error(err);
        ticketTable.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--danger);">Error loading tickets.</td></tr>`;
    }
}


async function updateTicketStatus(ticketId, newStatus) {
    try {
        const res = await fetchWithAuth(`${API_BASE}/admin/tickets/${ticketId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status: newStatus })
        });

        if (!res.ok) throw new Error("Failed to update status");

        // Refresh stats or tables based on the current page
        const path = window.location.pathname;
        if (path.includes("dashboard")) loadAdminDashboard();
        if (path.includes("tickets.html")) loadAdminTickets();

    } catch (err) {
        console.error(err);
        alert("Error updating status.");
    }
}


async function loadAdminDashboard() {
    console.log("Loading Admin Dashboard (IT/Facility)...");
    const pendingCount = document.getElementById("stats-pending");
    const progressCount = document.getElementById("stats-progress");
    const resolvedCount = document.getElementById("stats-resolved");
    const ticketTable = document.getElementById("recent-tickets-table");

    try {
        // 1. Load Stats
        const statsRes = await fetchWithAuth(`${API_BASE}/admin/dashboard-stats`);
        const stats = await statsRes.json();
        console.log("Admin stats fetched:", stats);
        
        if (pendingCount) pendingCount.textContent = stats.pending;
        if (progressCount) progressCount.textContent = stats.in_progress;
        if (resolvedCount) resolvedCount.textContent = stats.resolved;

        // 2. Load Recent Tickets
        if (ticketTable) {
            const ticketRes = await fetchWithAuth(`${API_BASE}/admin/tickets`);
            const tickets = await ticketRes.json();

            if (tickets.length === 0) {
                ticketTable.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">No tickets found.</td></tr>`;
                return;
            }

            ticketTable.innerHTML = "";
            tickets.slice(0, 5).forEach(t => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>#${t.id}</td>
                    <td><strong>${t.issue_name}</strong></td>
                    <td>${t.location}</td>
                    <td>${formatDate(t.created_at)}</td>
                    <td>${getStatusBadge(t.status)}</td>
                `;
                ticketTable.appendChild(row);
            });
        }

    } catch (err) {
        console.error(err);
    }
}


window.allGalleryItems = [];

async function loadLostFoundGallery() {
    const galleryContainer = document.getElementById("gallery-grid");
    if (!galleryContainer) return;

    try {
        const res = await fetchWithAuth(`${API_BASE}/items/gallery`);
        const approvedItems = await res.json();
        
        window.allGalleryItems = approvedItems || [];
        renderGallery(window.allGalleryItems);

    } catch (err) {
        console.error(err);
        galleryContainer.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--danger);">Error loading gallery.</div>`;
    }
}

function renderGallery(items) {
    const galleryContainer = document.getElementById("gallery-grid");
    if (!galleryContainer) return;

    if (items.length === 0) {
        galleryContainer.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--text-muted);">No items found.</div>`;
        return;
    }

    galleryContainer.innerHTML = "";
    const currentUserEmail = localStorage.getItem("email");

    items.forEach(item => {
        const card = document.createElement("div");
        card.className = "gallery-item card";
        
        const posterName = item.poster ? item.poster.full_name : "Unknown";
        const posterEmail = item.poster ? item.poster.school_email : "No email provided";
        const isMyPost = currentUserEmail === posterEmail;
        
        // Determine possession text and icon
        const isAtSecurity = item.possession === "security";
        const posText = isAtSecurity ? "At Security Office" : "With Finder";
        const posIcon = isAtSecurity ? "🏢" : "👤";
        const posClass = isAtSecurity ? "badge-approved" : "badge-progress";

        card.innerHTML = `
            <div class="gallery-img" style="border-radius: var(--radius-sm); overflow: hidden; height: 180px; cursor: zoom-in;" onclick="openImageModal('${item.image_url || ''}', '${item.item_name.replace(/'/g, "\\'")}')">
                ${item.image_url ? `<img src="${item.image_url}" alt="${item.item_name}" style="width:100%; height:100%; object-fit:cover;">` : `<div style="display:flex; align-items:center; justify-content:center; height:100%; background:var(--bg-alt); color:var(--text-muted); font-size: 3rem;">📦</div>`}
            </div>
            <div class="gallery-content" style="padding-top: 14px;">
                <div style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <span class="badge ${posClass}" style="font-size: 0.75rem;">${posIcon} ${posText}</span>
                    ${isMyPost ? `<span class="badge badge-pending" style="font-size: 0.65rem;">Your Post</span>` : ""}
                </div>
                <div class="gallery-item-title" style="font-size: 1.1rem; font-weight: 600; margin-bottom: 4px;">${item.item_name}</div>
                <div class="gallery-item-meta" style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5;">
                    📍 Found: ${item.location} <br>
                    🕐 ${formatDate(item.created_at)}
                </div>
                
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); font-size: 0.85rem;">
                    <div style="font-weight: 600; color: var(--text);">Finder Information:</div>
                    <div style="color: var(--text-muted);">${posterName} ${isMyPost ? "(You)" : ""}</div>
                    <a href="mailto:${posterEmail}" style="color:var(--accent); text-decoration:none;">${posterEmail}</a>
                </div>

                <div style="display:flex; gap:10px; margin-top:16px;">
                    ${isMyPost ? 
                        `<button class="btn btn-success btn-full" onclick="markMyItemClaimed(${item.id}, '${item.item_name.replace(/'/g, "\\'")}')">Mark as Claimed</button>` :
                        (isAtSecurity ? 
                            `<button class="btn btn-primary btn-full" onclick="startClaimProcess(${item.id}, '${item.item_name.replace(/'/g, "\\'")}')">Claim Now</button>` : 
                            `<a href="mailto:${posterEmail}?subject=Found Item: ${item.item_name}" class="btn btn-secondary btn-full" style="text-decoration:none; text-align:center; display:flex; align-items:center; justify-content:center;">Contact Finder</a>`
                        )
                    }
                </div>
            </div>
        `;
        galleryContainer.appendChild(card);
    });
}

// --- CLAIM LOGIC ---
function startClaimProcess(itemId, itemName) {
    alert(`To claim your item: "${itemName}"\n\n` +
          `Please proceed to the Security Office.\n` +
          `Location: Ground Floor (1st Floor), right side of Room 101.\n\n` +
          `Note: Bring your school ID or any valid identification for verification.`);
}

window.filterGallery = function() {
    if (!window.allGalleryItems) return;
    
    const searchInput = document.getElementById("gallery-search");
    const categorySelect = document.getElementById("gallery-category");
    
    const query = searchInput ? searchInput.value.toLowerCase() : "";
    const category = categorySelect ? categorySelect.value : "";

    const filtered = window.allGalleryItems.filter(item => {
        const matchesName = item.item_name.toLowerCase().includes(query);
        const matchesCategory = category === "" || item.category === category;
        return matchesName && matchesCategory;
    });
    
    renderGallery(filtered);
};


async function loadActivityHistory() {
    const tableBody = document.getElementById("activity-table-body");
    if (!tableBody) return;

    try {
        const res = await fetchWithAuth(`${API_BASE}/tickets/activity`);
        const data = await res.json();

        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">No activity history found.</td></tr>`;
            return;
        }

        tableBody.innerHTML = "";
        data.forEach((item, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${(index + 1).toString().padStart(3, '0')}</td>
                <td>${item.type}</td>
                <td><strong>${item.title}</strong></td>
                <td>${item.location}</td>
                <td>${formatDate(item.date_submitted)}</td>
                <td>${getStatusBadge(item.status)}</td>
            `;
            tableBody.appendChild(row);
        });

    } catch (err) {
        console.error(err);
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--danger);">Error loading history.</td></tr>`;
    }
}


// --- SUMMARY FUNCTIONS ---

async function loadSummaryPreview() {
    const monthInput = document.getElementById("summary-month").value;
    const tableBody = document.getElementById("summary-table-body");
    const title = document.getElementById("summary-title");
    if (!monthInput || !tableBody) return;

    try {
        const [year, month] = monthInput.split("-");
        const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
        title.textContent = `Preview — ${monthName} ${year} (Resolved Tickets)`;

        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">Loading...</td></tr>`;

        const res = await fetchWithAuth(`${API_BASE}/admin/tickets/summary?month=${monthInput}`);
        const tickets = await res.json();

        if (tickets.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--text-muted);">No resolved tickets found for this month.</td></tr>`;
            return;
        }

        tableBody.innerHTML = "";
        tickets.forEach(t => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>#${t.id.toString().padStart(3, '0')}</td>
                <td><strong>${t.issue_name}</strong></td>
                <td>${t.location}</td>
                <td>${t.reporter ? t.reporter.full_name : "Unknown"}</td>
                <td>${formatDate(t.updated_at)}</td>
            `;
            tableBody.appendChild(row);
        });

    } catch (err) {
        console.error(err);
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--danger);">Error loading summary data.</td></tr>`;
    }
}

function generateSummary() {
    const monthInput = document.getElementById("summary-month").value;
    if (!monthInput) {
        alert("Please select a month first.");
        return;
    }
    window.print();
}

// --- IMAGE MODAL LOGIC ---
function openImageModal(imageUrl, itemName) {
    if (!imageUrl) return; // Ignore if no image

    let modal = document.getElementById("image-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "image-modal";
        modal.style.cssText = `
            display: flex; position: fixed; inset: 0; z-index: 1000;
            background: rgba(0, 0, 0, 0.85); align-items: center; justify-content: center;
            opacity: 0; transition: opacity 0.2s; pointer-events: none;
            backdrop-filter: blur(4px);
        `;
        
        modal.innerHTML = `
            <div style="position: relative; max-width: 90%; max-height: 90%; display: flex; flex-direction: column; align-items: center;">
                <button onclick="closeImageModal()" style="
                    position: absolute; top: -40px; right: 0;
                    background: none; border: none; color: white; font-size: 2rem;
                    cursor: pointer; padding: 10px; line-height: 1;
                ">&times;</button>
                <img id="image-modal-img" src="" alt="Expanded Image" style="max-width: 100%; max-height: 80vh; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                <div id="image-modal-caption" style="color: white; margin-top: 15px; font-size: 1.2rem; font-weight: 500; text-align: center;"></div>
            </div>
        `;
        
        // Close when clicking outside the image
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeImageModal();
        });
        
        document.body.appendChild(modal);
    }

    document.getElementById("image-modal-img").src = imageUrl;
    document.getElementById("image-modal-caption").textContent = itemName;
    
    // Show modal
    modal.style.pointerEvents = "auto";
    requestAnimationFrame(() => {
        modal.style.opacity = "1";
    });
}

function closeImageModal() {
    const modal = document.getElementById("image-modal");
    if (modal) {
        modal.style.opacity = "0";
        modal.style.pointerEvents = "none";
        setTimeout(() => {
            document.getElementById("image-modal-img").src = "";
        }, 200); // clear image after fade out
    }
}

