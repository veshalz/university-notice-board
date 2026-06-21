// ==========================================
// --- 1. DARK MODE & HAMBURGER ENGINE ---
// ==========================================
// Request permission for notifications on load
if ("Notification" in window) {
    Notification.requestPermission();
}

// Function to send a deadline nudge
function sendDeadlineNudge(title, timeLeft) {
    if (Notification.permission === "granted") {
        new Notification("Assignment Deadline Approaching!", {
            body: `${title} is due in ${timeLeft}. Don't forget to submit!`,
            icon: "logo-192.png"
        });
    }
}




document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const bodyEl = document.body;
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const overlay = document.getElementById('sidebar-overlay');


const themeBtn = document.getElementById('theme-toggle-btn');
const themeText = themeBtn ? themeBtn.querySelector('.theme-text') : null;

if (themeBtn && themeText) {
    // 1. Check saved preferences on load
    if (localStorage.getItem('appTheme') === 'dark') {
        document.body.classList.add('dark-mode');
        themeText.textContent = 'Light Mode';
    }

    // 2. Handle the Click Interaction
    themeBtn.addEventListener('click', () => {
        // Toggle the body class (This triggers the global CSS fade and icon roll!)
        document.body.classList.toggle('dark-mode');
        
        const isDark = document.body.classList.contains('dark-mode');
        
        // Save to memory so it remembers their choice tomorrow
        localStorage.setItem('appTheme', isDark ? 'dark' : 'light');
        
        // Instantly swap the text
        themeText.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    });
}

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            if (window.innerWidth <= 992) bodyEl.classList.toggle('sidebar-open-mobile');
            else bodyEl.classList.toggle('sidebar-closed');
        });
    }

    if (overlay) overlay.addEventListener('click', () => bodyEl.classList.remove('sidebar-open-mobile'));

    document.querySelectorAll('.sidebar-link, .sidebar-filter, #theme-toggle').forEach(link => {
        link.addEventListener('click', () => { if (window.innerWidth <= 992) bodyEl.classList.remove('sidebar-open-mobile'); });
    });
});

// ==========================================
// --- 2. QUILL & HELPERS ---
// ==========================================
let quill;
if (document.getElementById('editor-container')) {
    quill = new Quill('#editor-container', {
        theme: 'snow',
        placeholder: 'Write the full notice details, add lists, or embed links here...',
        modules: { toolbar: [ [{ 'header': [1, 2, 3, false] }], ['bold', 'italic', 'underline'], [{ 'list': 'ordered'}, { 'list': 'bullet' }], ['link', 'video'], ['clean'] ] }
    });
}
// ==========================================
// --- PREMIUM TOAST NOTIFICATION ENGINE ---
// ==========================================
function showToast(message, type = 'info') {
    // 1. Create the container if it doesn't exist yet
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    // 2. Map the types to specific emojis
    const emojis = {
        success: '✅',
        error: '🚨',
        info: '💡'
    };

    // 3. Build the Premium Toast
    const toast = document.createElement('div');
    toast.className = `premium-toast toast-${type}`;
    
    toast.innerHTML = `
        <div class="toast-icon">${emojis[type] || '💡'}</div>
        <div style="flex-grow: 1; font-weight: 700; font-size: 0.95rem; line-height: 1.4;">${message}</div>
        <button class="toast-close" style="background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer; transition: color 0.2s;">&times;</button>
    `;

    container.appendChild(toast);

    // 4. Handle clicking the "X" to close early
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('mouseenter', () => closeBtn.style.color = 'var(--danger)');
    closeBtn.addEventListener('mouseleave', () => closeBtn.style.color = 'var(--text-muted)');
    closeBtn.onclick = () => {
        toast.classList.add('closing');
        setTimeout(() => toast.remove(), 400); // Wait for animation to finish
    };

    // 5. Auto-close after 4 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('closing');
            setTimeout(() => toast.remove(), 400);
        }
    }, 4000);
}

// ==========================================
// --- PREMIUM CONFIRM MODAL ---
// ==========================================
function showConfirm(message, onConfirm) {
    const overlay = document.createElement('div'); 
    overlay.className = 'modal-overlay active'; 
    overlay.style.zIndex = '3500'; 
    
    overlay.innerHTML = `
        <div class="modal-content" style="max-width: 400px; text-align: center; padding: 30px; border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.2);">
            <div style="font-size: 3.5rem; margin-bottom: 15px;">⚠️</div>
            <h3 style="margin-bottom: 10px; color: var(--text-main); font-size: 1.5rem; font-weight: 800;">
                Are you sure?
            </h3>
            <p style="margin-bottom: 25px; color: var(--text-muted); font-size: 1rem; line-height: 1.5;">
                ${message}
            </p>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button class="btn cancel-btn" style="flex: 1; background: #e2e8f0; color: #475569; font-size: 1.05rem;">Cancel</button>
                <button class="btn confirm-btn" style="flex: 1; background: var(--danger); color: white; font-size: 1.05rem; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);">Yes, Delete</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Wire up the buttons inside the new modal
    overlay.querySelector('.cancel-btn').onclick = () => overlay.remove();
    overlay.querySelector('.confirm-btn').onclick = () => {
        onConfirm(); // This actually runs the Firebase delete command!
        overlay.remove();
    };
    
    // Close if they click the dark background
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}
// ==========================================
// --- 3. STATE & DOM ---
// ==========================================
let notices = [];
let currentUser = null;
let currentUserData = null;
let isLoggedIn = false;
let currentFilter = 'All';
let searchQuery = '';

const allFilters = document.querySelectorAll('.sidebar-filter');
const noticeModal = document.getElementById('notice-modal');
const modalContentArea = document.getElementById('modal-content-area');
if (noticeModal) noticeModal.addEventListener('click', (e) => { if (e.target === noticeModal) noticeModal.classList.remove('active'); }); 

function switchView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));

    if (viewName === 'public') { document.getElementById('view-public').classList.add('active'); }
    if (viewName === 'login') { document.getElementById('view-login').classList.add('active'); document.getElementById('nav-login').classList.add('active'); allFilters.forEach(f => f.classList.remove('active')); }
    if (viewName === 'admin') { document.getElementById('view-admin').classList.add('active'); document.getElementById('nav-login').classList.add('active'); }

    // NEW: Vault View
    if (viewName === 'vault') {
        document.getElementById('view-vault').classList.add('active');
        document.getElementById('nav-vault').classList.add('active');
        renderVault(); // Trigger the specific vault render
    }

}
// Add the click listener for the sidebar
document.getElementById('nav-vault').addEventListener('click', (e) => {
    e.preventDefault();
    switchView('vault');
});


document.getElementById('sidebar-user-profile').addEventListener('click', (e) => { e.preventDefault(); if (isLoggedIn) { switchView(currentUserData && currentUserData.role === 'faculty' ? 'admin' : 'public'); } });
document.getElementById('nav-login').addEventListener('click', (e) => { e.preventDefault(); if (isLoggedIn) { switchView(currentUserData && currentUserData.role === 'faculty' ? 'admin' : 'public'); } else { switchView('login'); } });
document.getElementById('nav-logout').addEventListener('click', (e) => { e.preventDefault(); auth.signOut(); });

allFilters.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault(); const selectedCat = e.currentTarget.getAttribute('data-category'); 
        allFilters.forEach(b => b.classList.toggle('active', b.getAttribute('data-category') === selectedCat));
        currentFilter = selectedCat; searchQuery = '';
        if (document.getElementById('search-input')) document.getElementById('search-input').value = ''; 
        renderNotices(); switchView('public');
    });
});
document.getElementById('search-input')?.addEventListener('input', (e) => { searchQuery = e.target.value; renderNotices(); });




// ==========================================
// --- 4. AUTH & FIREBASE (SECURE FINAL) ---
// ==========================================
auth.onAuthStateChanged((user) => {
    const officeCard = document.getElementById('office-hours-card');
    const toggleWrapper = document.getElementById('faculty-toggle-wrapper');
    const statusText = document.getElementById('status-text');
    const statusToggle = document.getElementById('faculty-status-toggle');
    const askBtn = document.getElementById('student-ask-btn'); // ADD THIS
    // 1. GUEST MODE: Hide the card by default before anything loads
    if (officeCard) officeCard.classList.add('hidden');

    if (user) {
        currentUser = user;
        db.collection("users").doc(user.uid).get().then((doc) => {
            if (doc.exists) {
                currentUserData = doc.data();
                isLoggedIn = true;
                
                const isStudent = currentUserData.role === 'student';
                const isFaculty = currentUserData.role === 'faculty' || currentUserData.role === 'admin';

                // 2. REVEAL the Office Hours card for verified campus users
                if (officeCard) officeCard.classList.remove('hidden');

                // 3. PRIVACY: Hide the toggle switch completely from Students
                if (toggleWrapper) {
                    toggleWrapper.style.display = isFaculty ? 'block' : 'none';
                }
                if (askBtn) askBtn.style.display = isStudent ? 'flex' : 'none'; // ADD THIS

                // 4. LIVE SYNC: Listen for the current status
                db.collection("system").doc("facultyStatus").onSnapshot((statusDoc) => {
                    if (statusDoc.exists) {
                        const isOnline = statusDoc.data().isOnline;
                        if (statusText) {
                            statusText.textContent = isOnline ? "Currently: ONLINE" : "Currently: Offline";
                            statusText.style.color = isOnline ? "var(--success)" : "var(--text-muted)";
                        }
                        if (statusToggle) statusToggle.checked = isOnline;
                    }
                });

                // 5. TEACHER ONLY: Allow clicking the toggle to update the database
                if (isFaculty && statusToggle) {
                    // Reset listener to prevent double-firing
                    const newToggle = statusToggle.cloneNode(true);
                    statusToggle.parentNode.replaceChild(newToggle, statusToggle);
                    
                    newToggle.addEventListener('change', (e) => {
                        const isOnline = e.target.checked;
                        db.collection("system").doc("facultyStatus").set({
                            isOnline: isOnline,
                            lastUpdated: new Date().toLocaleTimeString(),
                            updatedBy: currentUserData.name
                        }, { merge: true })
                        .then(() => showToast(isOnline ? "You are now ONLINE" : "Status set to Offline", "info"))
                        .catch(err => showToast("Sync Error: " + err.message, "error"));
                    });
                }

                // 6. Update Profile Sidebar
                const profileCard = document.getElementById('sidebar-user-profile');
                const logoutNav = document.getElementById('nav-logout');
                const loginNav = document.getElementById('nav-login');

                if (logoutNav) logoutNav.classList.remove('hidden');
                if (profileCard) {
                    profileCard.classList.remove('hidden');
                    document.getElementById('user-profile-name').textContent = currentUserData.name;
                    document.getElementById('user-profile-role').textContent = isStudent ? 'Student' : 'Admin / Faculty';
                    document.getElementById('user-avatar-initial').textContent = currentUserData.name.charAt(0).toUpperCase();
                }

                // 7. ROUTING
                if (isFaculty) {
                    if (loginNav) { 
                        loginNav.classList.remove('hidden'); 
                        loginNav.textContent = 'Admin Dashboard'; 
                    }
                    switchView('admin');
                    renderFeedback();
                    renderDirectQueries();
                    // 2. Faculty Receiving & Replying Logic
function renderDirectQueries() {
    const queriesContainer = document.getElementById('admin-queries-list');
    if (!queriesContainer || !currentUserData || currentUserData.role === 'student') return;

    db.collection("direct_queries").orderBy("timestamp", "desc").onSnapshot(snapshot => {
        queriesContainer.innerHTML = '';
        
        if (snapshot.empty) {
            queriesContainer.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 20px;">Inbox is zero! No new queries.</p>`;
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            const queryDiv = document.createElement('div');
            queryDiv.className = 'admin-list-item';
            
            // Dynamic styling based on whether it has been answered
            queryDiv.style.borderLeft = data.status === 'replied' ? '4px solid #10b981' : '4px solid #f59e0b';
            queryDiv.style.flexDirection = 'column';
            queryDiv.style.alignItems = 'flex-start';
            
            const statusBadge = data.status === 'replied' 
                ? `<span style="background: #dcfce7; color: #16a34a; padding: 3px 8px; border-radius: 12px; font-size: 0.7rem; margin-left: 10px;">Replied</span>` 
                : `<span style="background: #fef3c7; color: #d97706; padding: 3px 8px; border-radius: 12px; font-size: 0.7rem; margin-left: 10px;">Needs Action</span>`;

            let replySection = '';
            let actionButtons = '';

            // Layout A: If already replied, show the reply and an archive button
            if (data.status === 'replied') {
                replySection = `
                    <div style="margin-top: 15px; padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; width: 100%;">
                        <p style="font-size: 0.8rem; color: #3b82f6; font-weight: 800; text-transform: uppercase; margin-bottom: 5px;">↳ Your Reply</p>
                        <p style="font-size: 0.95rem; color: var(--text-main); margin-bottom: 5px;">"${data.replyMessage}"</p>
                        <p style="font-size: 0.8rem; color: var(--text-muted);">${data.replyDate}</p>
                    </div>
                `;
                actionButtons = `<button class="btn archive-query-btn" data-id="${doc.id}" style="background: #e2e8f0; color: #475569; padding: 6px 15px; margin-top: 15px;">Archive (Remove)</button>`;
            } 
            // Layout B: If pending, show the hidden reply box and a Write Reply button
            else {
                replySection = `
                    <div class="reply-container" id="reply-container-${doc.id}" style="margin-top: 15px; width: 100%; display: none;">
                        <textarea id="reply-text-${doc.id}" class="premium-input" placeholder="Type your reply to ${data.studentName}..." rows="3" style="width: 100%; margin-bottom: 10px;"></textarea>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn send-reply-btn" data-id="${doc.id}" style="background: #3b82f6; color: white;">Send Reply</button>
                            <button class="btn cancel-reply-btn" data-id="${doc.id}" style="background: #e2e8f0; color: #475569;">Cancel</button>
                        </div>
                    </div>
                `;
                actionButtons = `<button class="btn open-reply-btn" data-id="${doc.id}" style="background: #10b981; color: white; padding: 6px 15px; margin-top: 15px;">Write Reply</button>`;
            }
            
            queryDiv.innerHTML = `
                <div style="width: 100%;">
                    <div style="font-size: 0.8rem; color: #f59e0b; font-weight: 800; text-transform: uppercase; margin-bottom: 4px; display: flex; align-items: center;">
                        Direct Query ${statusBadge}
                    </div>
                    <h4 style="margin-bottom: 8px; font-weight: 500; line-height: 1.4;">"${data.message}"</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">From: <strong>${data.studentName}</strong> (${data.studentEmail}) • ${data.date}</p>
                </div>
                ${replySection}
                <div id="actions-${doc.id}" style="width: 100%; text-align: right;">
                    ${actionButtons}
                </div>
            `;
            
            queriesContainer.appendChild(queryDiv);
        });

        // Event Listeners for the dynamic buttons
        queriesContainer.querySelectorAll('.open-reply-btn').forEach(btn => btn.onclick = (e) => {
            const id = e.target.getAttribute('data-id');
            document.getElementById(`reply-container-${id}`).style.display = 'block';
            document.getElementById(`actions-${id}`).style.display = 'none';
        });

        queriesContainer.querySelectorAll('.cancel-reply-btn').forEach(btn => btn.onclick = (e) => {
            const id = e.target.getAttribute('data-id');
            document.getElementById(`reply-container-${id}`).style.display = 'none';
            document.getElementById(`actions-${id}`).style.display = 'block';
        });

        queriesContainer.querySelectorAll('.send-reply-btn').forEach(btn => btn.onclick = async (e) => {
            const id = e.target.getAttribute('data-id');
            const text = document.getElementById(`reply-text-${id}`).value;
            if (!text.trim()) return showToast("Reply cannot be empty", "error");
            
            e.target.innerHTML = "⏳ Sending...";
            e.target.disabled = true;

            try {
                // UPDATE FIREBASE WITH THE REPLY!
                await db.collection("direct_queries").doc(id).update({
                    status: 'replied',
                    replyMessage: text,
                    repliedBy: currentUserData.name,
                    replyDate: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()
                });
                showToast("Reply sent to student!", "success");
            } catch(err) {
                showToast("Error: " + err.message, "error");
                e.target.innerHTML = "Send Reply";
                e.target.disabled = false;
            }
        });

        queriesContainer.querySelectorAll('.archive-query-btn').forEach(btn => btn.onclick = (e) => {
            const id = e.target.getAttribute('data-id');
            db.collection("direct_queries").doc(id).delete().then(() => showToast("Archived", "success"));
        });
    });
}
                } else {
                    if (loginNav) loginNav.classList.add('hidden');
                    switchView('public'); 
                    renderStudentQueries();
                }
                renderNotices();
            }
        });
} else {
        // FULL LOGOUT/GUEST RESET
        currentUser = null;
        currentUserData = null;
        isLoggedIn = false;
        
        // 1. Hide the Office Hours card
        if (officeCard) officeCard.classList.add('hidden');
        
        // 2. Clean up the Sidebar UI
        const profileCard = document.getElementById('sidebar-user-profile');
        const logoutNav = document.getElementById('nav-logout');
        const loginNav = document.getElementById('nav-login');
        
        if (profileCard) profileCard.classList.add('hidden');
        if (logoutNav) logoutNav.classList.add('hidden');
        
        if (loginNav) {
            loginNav.classList.remove('hidden');
            loginNav.innerHTML = '🔒 Portal Login'; // Reset the text and icon!
        }
        
        // 3. Clear the login form so old passwords don't stick around
        const loginForm = document.getElementById('login-form');
        if (loginForm) loginForm.reset();

        // 4. Hide the student queries section if it's open
        const studentQueriesSection = document.getElementById('student-queries-section');
        if (studentQueriesSection) studentQueriesSection.style.display = 'none';
        
        // 5. Send them back to the public feed
        switchView('public');
        renderNotices();
    }
});
// ==========================================
// --- 5. MAIN RENDER ENGINE ---
// ==========================================
function getCategoryStyle(category) {
    const styles = { 'Urgent': { bg: '#fee2e2', text: '#ef4444', icon: '🚨' }, 'Assignment': { bg: '#e0e7ff', text: '#4f46e5', icon: '📝' }, 'Event': { bg: '#dbeafe', text: '#3b82f6', icon: '📅' }, 'Syllabus': { bg: '#f3e8ff', text: '#a855f7', icon: '📚' }, 'Sports and Play': { bg: '#dcfce7', text: '#22c55e', icon: '🏏' }, 'Cultural Function': { bg: '#ffedd5', text: '#f97316', icon: '💃' }, 'General': { bg: '#f1f5f9', text: '#64748b', icon: '📢' } };
    return styles[category] || styles['General'];
}
function renderNotices() {
    const publicContainer = document.getElementById('public-notices-container');
    const adminContainer = document.getElementById('admin-notices-list');
    const savedContainer = document.getElementById('saved-notices-container');
    const savedSection = document.getElementById('saved-notices-section');

    if (!publicContainer || !adminContainer) return; 
    publicContainer.innerHTML = ''; 
    adminContainer.innerHTML = ''; 
    if (savedContainer) savedContainer.innerHTML = '';
    document.querySelectorAll('.expand-feed-btn-wrapper').forEach(el => el.remove());

    const isStudent = currentUserData && currentUserData.role === 'student';
    const assignmentFilterBtn = document.querySelector('.sidebar-filter[data-category="Assignment"]');
    if (assignmentFilterBtn) assignmentFilterBtn.style.display = isStudent ? 'block' : 'none';

    let readNotices = JSON.parse(localStorage.getItem('studentReadNotices')) || [];
    let savedNotices = JSON.parse(localStorage.getItem('studentSavedNotices')) || [];
    
    let filteredNotices = [...notices].filter(notice => {
        const matchesCat = currentFilter === 'All' || notice.category === currentFilter;
        const matchesSearch = notice.title.toLowerCase().includes(searchQuery.toLowerCase()) || notice.content.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesSearch;
    });

    let unreadCount = 0; 
    let visiblePublicCount = 0; 
    const PUBLIC_CARD_LIMIT = 6; 

    filteredNotices.forEach(notice => {
        const style = getCategoryStyle(notice.category);
        const isUnread = !readNotices.includes(notice.id); 
        const isSaved = savedNotices.includes(notice.id);
        const isAssignmentLocked = notice.category === 'Assignment' && !isStudent;
        const isFuture = notice.scheduledFor && new Date(notice.scheduledFor) > new Date();

        // 1. GENERATE REUSABLE BLOCKS (For both Card and Modal)
        const likes = notice.likes || 0; 
        const dislikes = notice.dislikes || 0;
        const authorInitial = notice.authorName ? notice.authorName.charAt(0).toUpperCase() : 'A';
        const authorName = notice.authorName || 'University Admin';
        
        const authorHtml = `
            <div class="author-block">
                <div class="author-avatar" style="background-color: ${style.bg}; color: ${style.text};">${authorInitial}</div>
                <div>
                    <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-main);">${authorName}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">📅 ${notice.date}</div>
                </div>
            </div>
        `;

        let rsvpHtml = '';
        if (notice.isRSVP) {
            const hasRSVPd = isStudent && notice.attendees && currentUser && notice.attendees.some(student => student.id === currentUser.uid);
            if (isStudent) {
                if (hasRSVPd) {
                    rsvpHtml = `<div style="margin-top: 15px; padding: 10px; background: #dcfce7; color: #15803d; border-radius: 6px; text-align: center; font-weight: 600; font-size: 0.9rem;">✅ You are attending</div>`;
                } else {
                    rsvpHtml = `<div style="margin-top: 15px; padding: 12px; background: #f8fafc; border-radius: 6px; border: 1px solid var(--border-color); text-align: center;"><p style="margin-bottom: 8px; font-size: 0.9rem; font-weight: 600;">Will you attend?</p><button class="btn rsvp-btn" data-id="${notice.id}" style="background: #3b82f6; width: 100%; color: white;">Yes, Count me in!</button></div>`;
                }
            } else /*if (currentUserData && currentUserData.role === 'faculty')*/ {
                const count = notice.attendees ? notice.attendees.length : 0;
                rsvpHtml = `<div style="margin-top: 15px; padding: 10px; background: #eff6ff; color: #1d4ed8; border-radius: 6px; text-align: center; font-weight: 600; cursor: pointer; border: 1px dashed #bfdbfe;" class="view-rsvp-btn" data-id="${notice.id}">👥 ${count} Students Attending</div>`;
            }
        }

        let assignmentHtml = '';
        if (notice.category === 'Assignment' && notice.deadline) {
            const hasSubmitted = isStudent && Array.isArray(notice.submissions) && currentUser && notice.submissions.some(student => student.id === currentUser.uid);
            let actionButtons = '';
            if (isStudent) {
                if (hasSubmitted) {
                    actionButtons = `<div style="background: #dcfce7; color: #15803d; padding: 12px; border-radius: 12px; font-weight: bold; margin-top: 15px;">✅ You marked this as Turned In</div>`;
                } else {
                    actionButtons = `
                    <div class="assignment-actions">
                        <a href="${notice.submissionLink}" target="_blank" class="btn-open-link submit-link-btn">🔗 Open Link</a>
                        <button class="btn-mark-done mark-done-btn" data-id="${notice.id}">✅ Mark as Done</button>
                    </div>`;
                }
            } else if (currentUserData && currentUserData.role === 'faculty') {
                const count = Array.isArray(notice.submissions) ? notice.submissions.length : 0;
                actionButtons = `<div style="margin-top: 10px; padding: 10px; background: #f3e8ff; color: #7e22ce; border-radius: 6px; font-weight: 600; cursor: pointer; border: 1px dashed #d8b4fe;" class="view-subs-btn" data-id="${notice.id}">📄 ${count} Students Turned it In</div>`;
            }
            assignmentHtml = `<div class="assignment-tracker" data-deadline="${notice.deadline}" data-submitted="${hasSubmitted}" style="margin-top: 15px; padding: 15px; background: ${hasSubmitted ? '#f8fafc' : '#f0fdf4'}; border: 2px solid ${hasSubmitted ? '#e2e8f0' : '#bbf7d0'}; border-radius: 8px; text-align: center;"><h4 style="margin-bottom: 10px;">⏳ Time Remaining</h4><div class="countdown-timer" style="font-size: 1.4rem; font-weight: bold; color: ${hasSubmitted ? '#94a3b8' : 'var(--danger)'}; margin-bottom: 15px;">Calculating...</div>${actionButtons}</div>`;
        }

        let attachmentHtml = '';
        if (notice.attachmentUrl) {
            attachmentHtml = `<div style="margin-top: 15px; padding: 12px; background: rgba(59, 130, 246, 0.05); border: 1px dashed #bfdbfe; border-radius: 8px;"><p style="margin-bottom: 8px; font-size: 0.85rem; font-weight: 700;">📎 Attached Resources</p><a href="${notice.attachmentUrl}" target="_blank" class="btn" style="background: white; color: #3b82f6; border: 1px solid #bfdbfe; display: inline-flex; align-items: center; justify-content: center; width: 100%; text-decoration: none;">View Attached Resource</a></div>`;
        }

        // 2. BUILD THE PUBLIC CARD
   // 1.5 Generate Mini Summary Badges for the Compact Card View
        let summaryIndicators = '';
        if (notice.category === 'Assignment' && notice.deadline) {
            summaryIndicators += `<span style="background: rgba(245, 158, 11, 0.1); color: #d97706; font-size: 0.75rem; padding: 4px 8px; border-radius: 6px; font-weight: 700;">⏳ Assignment</span>`;
        }
        if (notice.isRSVP) {
            summaryIndicators += `<span style="background: rgba(59, 130, 246, 0.1); color: #2563eb; font-size: 0.75rem; padding: 4px 8px; border-radius: 6px; font-weight: 700;">📅 RSVP Inside</span>`;
        }
        if (notice.attachmentUrl) {
            summaryIndicators += `<span style="background: rgba(100, 116, 139, 0.1); color: #475569; font-size: 0.75rem; padding: 4px 8px; border-radius: 6px; font-weight: 700;">📎 Attached Resources</span>`;
        }
        let summaryHtml = summaryIndicators ? `<div style="display: flex; gap: 8px; margin-top: 10px; margin-bottom: 5px; flex-wrap: wrap;">${summaryIndicators}</div>` : '';

        // 2. BUILD THE PUBLIC CARD (COMPACT VIEW)
        const div = document.createElement('div');
        div.className = `notice-card ${isUnread ? 'unread' : ''}`; 
        
        const bookmarkHtml = isStudent ? `<button class="bookmark-btn ${isSaved ? 'saved' : ''}" data-id="${notice.id}" title="Save Notice">${isSaved ? '★' : '☆'}</button>` : '';
        const plainTextPreview = notice.content ? notice.content.replace(/<[^>]+>/g, '') : '';
        const newPillHtml = isUnread ? `<div class="new-notice-pill">✨ New</div>` : '';

        div.innerHTML = `
            ${newPillHtml}
            <div class="card-top-accent" style="background: ${style.text};"></div>
            <div style="margin-bottom: 0.5rem; margin-top: 5px; position: relative;">
                <span class="notice-badge" style="background-color: ${style.bg}; color: ${style.text};">${style.icon} ${notice.category}</span>
                ${bookmarkHtml}
            </div>
            
            <h3 style="margin-bottom: 0.5rem; padding-right: 35px; font-size: 1.3rem;">${notice.title}</h3>
            ${authorHtml}
            
            <p class="notice-content-preview" style="margin-bottom: 10px;">${plainTextPreview.substring(0, 110)}...</p>
            
            ${summaryHtml}
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 15px; border-top: 1px solid var(--border-color);">
                <div style="display: flex; gap: 10px;">
                    <button class="reaction-pill like-btn" data-id="${notice.id}">👍 ${likes}</button>
                    <button class="reaction-pill dislike-btn" data-id="${notice.id}">👎 ${dislikes}</button>
                </div>
                <div style="color: var(--primary-color); font-weight: 700; font-size: 0.85rem; transition: transform 0.2s ease;">
                    Read More ➔
                </div>
            </div>
        `;

      // 3. BUILD THE MODAL INJECTOR
        const buildAndOpenModal = (focusFeedback = false) => { 
            if (isUnread) { 
                readNotices.push(notice.id); 
                localStorage.setItem('studentReadNotices', JSON.stringify(readNotices)); 
                renderNotices(); 
            }
            
            modalContentArea.innerHTML = `
                <div style="margin-bottom: 1rem;"><span class="notice-badge" style="background-color: ${style.bg}; color: ${style.text};">${style.icon} ${notice.category}</span></div>
                <h2 style="margin-bottom: 0.5rem; font-size: 1.8rem; color: var(--text-main); line-height: 1.3;">${notice.title}</h2>
                ${authorHtml}
                <div class="ql-editor" style="padding:0; border:none; min-height: auto; margin-bottom: 1.5rem; font-size: 1.05rem;">${notice.content}</div>
                ${attachmentHtml}
                ${assignmentHtml}
                ${rsvpHtml}
                
                <div style="margin-top: 1.5rem; padding: 15px; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 12px;">
                    <p style="font-weight: 700; margin-bottom: 10px; color: var(--text-main);">💬 Leave Feedback</p>
                    <textarea id="feedback-text" class="premium-input" placeholder="Write your thoughts or questions here..." rows="2" style="margin-bottom: 10px;"></textarea>
                    <button id="submit-feedback-btn" class="btn" style="background: #3b82f6; color: white; width: 100%;">Submit to Faculty</button>
                </div>

                <div style="display: flex; gap: 10px; margin-top: 1.5rem; padding-top: 15px; border-top: 1px solid var(--border-color); align-items: center;">
                    <button class="reaction-pill like-btn" data-id="${notice.id}">👍 ${likes}</button>
                    <button class="reaction-pill dislike-btn" data-id="${notice.id}">👎 ${dislikes}</button>
                </div>
            `;
            
            noticeModal.classList.add('active');
            attachInteractionListeners(); 

            // --- THE LOGIC GOES HERE (Not in the HTML string!) ---
// --- THE LOGIC GOES HERE (Not in the HTML string!) ---
            const feedbackBtn = document.getElementById('submit-feedback-btn');
            if (feedbackBtn) {
                feedbackBtn.onclick = async () => {
                    // 1. CRITICAL CHECK: Make sure they are logged in before trying to read their name!
                    if (!isLoggedIn) {
                        return showToast("Please login to send feedback! 🔒", "error");
                    }

                    const msg = document.getElementById('feedback-text').value;
                    if (!msg.trim()) return showToast("Please enter a message.", "error");
                    
                    // 2. UX Upgrade: Show loading state so the button doesn't look dead
                    const originalText = feedbackBtn.innerHTML;
                    feedbackBtn.innerHTML = "⏳ Sending securely...";
                    feedbackBtn.disabled = true;
                    
                    try {
                        await db.collection("feedback").add({
                            message: msg,
                            noticeId: notice.id,
                            noticeTitle: notice.title,
                            studentName: currentUserData ? currentUserData.name : 'Student', 
                            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                            date: new Date().toLocaleDateString()
                        });
                        
                        showToast("Feedback sent to faculty! ✅", "success");
                        
                        // 3. THIS CLOSES THE MODAL AUTOMATICALLY
                        document.getElementById('notice-modal').classList.remove('active');
                        
                    } catch (err) {
                        // If Firebase blocks it, show the actual error so we can debug!
                        showToast("Database Error: " + err.message, "error");
                        feedbackBtn.innerHTML = originalText;
                        feedbackBtn.disabled = false;
                    }
                };
            }
          if (focusFeedback) {
                setTimeout(() => {
                    const textarea = document.getElementById('feedback-text');
                    if (textarea) textarea.focus();
                }, 300);
            }
            
            // THE FIX: Force the timer to calculate the millisecond the modal opens!
            updateTimers(); 
        };


        div.addEventListener('click', (e) => {
            // Stop it from opening if they are clicking the Like or Feedback buttons!
            if (e.target.closest('button')) return; 
            buildAndOpenModal(); 
        });


        if (!isAssignmentLocked && !isFuture) {
            if (isUnread) unreadCount++;
            if (visiblePublicCount >= PUBLIC_CARD_LIMIT) { div.classList.add('hidden-public-card'); div.style.display = 'none'; }
            publicContainer.appendChild(div);
            visiblePublicCount++;
        }

        // 4. ADMIN INBOX LOGIC
        const adminDiv = document.createElement('div'); adminDiv.className = 'admin-list-item';
        let adminRsvpBtn = notice.isRSVP ? `<button class="btn view-rsvp-btn" style="background: #10b981; color: white;" data-id="${notice.id}">👥 RSVPs</button>` : '';
        let adminSubsBtn = notice.category === 'Assignment' ? `<button class="btn view-subs-btn" style="background: #8b5cf6; color: white;" data-id="${notice.id}">📄 Submissions</button>` : '';
        let statusBadge = isFuture ? `<span style="background: #fef08a; color: #854d0e; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; margin-left: 10px;">⏳ Scheduled</span>` : '';

        adminDiv.innerHTML = `<div class="admin-list-item-left"><h4 style="display:flex; align-items:center;">${notice.title} ${statusBadge}</h4><p>${notice.category} - ${notice.date}</p></div><div class="admin-list-item-actions">${adminSubsBtn}${adminRsvpBtn}<button class="btn delete-btn" style="background:var(--danger); color:white;" data-id="${notice.id}">Delete</button></div>`;
        adminContainer.appendChild(adminDiv);
    });

    if (visiblePublicCount > PUBLIC_CARD_LIMIT) {
        const expandBtnWrap = document.createElement('div'); expandBtnWrap.className = 'expand-feed-btn-wrapper'; expandBtnWrap.style.cssText = 'text-align: center; margin-top: 2.5rem; width: 100%; grid-column: 1 / -1;';
        expandBtnWrap.innerHTML = `<button class="btn" style="background: white; border: 2px solid var(--primary-color); padding: 12px 35px; border-radius: 30px;">Show Older Notices ↓</button>`;
        publicContainer.appendChild(expandBtnWrap);
        expandBtnWrap.querySelector('button').addEventListener('click', function() { document.querySelectorAll('.hidden-public-card').forEach(card => card.style.display = 'flex'); this.parentElement.remove(); });
    }

// 5. SAVED BOOKMARKS COMPACT CARDS
    if (savedSection && savedContainer) {
        if (!isStudent) { 
            savedSection.style.display = 'none'; 
        } else {
            const bookmarkedNotices = filteredNotices.filter(n => savedNotices.includes(n.id) && (!n.scheduledFor || new Date(n.scheduledFor) <= new Date()));
            savedSection.style.display = bookmarkedNotices.length > 0 ? 'block' : 'none';
            
            savedContainer.style.display = 'grid';
            savedContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
            savedContainer.style.gap = '15px';
            
            bookmarkedNotices.forEach(notice => {
                const style = getCategoryStyle(notice.category);
                const savedDiv = document.createElement('div'); 
                savedDiv.className = 'bookmark-mini-card'; 
                savedDiv.style.borderLeft = `4px solid ${style.text}`; 
                
                // FIX 1: Force the cursor to a pointer so the user knows it is clickable
                savedDiv.style.cursor = 'pointer'; 
                
                // We add "pointer-events: none" to the inner text so it doesn't block the click!
                savedDiv.innerHTML = `
                    <div class="bookmark-mini-icon" style="background-color: ${style.bg}; color: ${style.text}; pointer-events: none;">${style.icon}</div>
                    <div class="bookmark-mini-content" style="pointer-events: none;">
                        <div class="bookmark-mini-title">${notice.title}</div>
                        <div class="bookmark-mini-meta"><span>📅 ${notice.date}</span><span>• ${notice.category}</span></div>
                    </div>
                    <button class="bookmark-mini-action remove-bookmark-btn" data-id="${notice.id}" title="Unpin Notice" style="position: relative; z-index: 10;">★</button>
                `;

                // FIX 2: The Proxy Click!
                // Instead of rewriting the modal, we route the click directly to the Main Feed card!
                savedDiv.addEventListener('click', (e) => {
                    // Ignore the click if they are just trying to un-star it
                    if (e.target.closest('.remove-bookmark-btn')) return; 
                    
                    // Find the original full-size card hidden in the DOM and click it behind the scenes
                    const targetBtn = document.querySelector(`.like-btn[data-id="${notice.id}"]`);
                    if (targetBtn) {
                        const mainCard = targetBtn.closest('.notice-card');
                        if (mainCard) mainCard.click();
                    }
                });

                savedContainer.appendChild(savedDiv);
            
        
    
                // Rebuild the modal generator specifically for clicks on the mini-card
                const openBookmarkModal = () => {
                    const likes = notice.likes || 0; const dislikes = notice.dislikes || 0;
                    const authorInitial = notice.authorName ? notice.authorName.charAt(0).toUpperCase() : 'A';
                    const authorName = notice.authorName || 'University Admin';
                    const authorHtml = `<div class="author-block"><div class="author-avatar" style="background-color: ${style.bg}; color: ${style.text};">${authorInitial}</div><div><div style="font-size: 0.95rem; font-weight: 700; color: var(--text-main);">${authorName}</div><div style="font-size: 0.8rem; color: var(--text-muted);">📅 ${notice.date}</div></div></div>`;
                    
                    modalContentArea.innerHTML = `
                        <div style="margin-bottom: 1rem;"><span class="notice-badge" style="background-color: ${style.bg}; color: ${style.text};">${style.icon} ${notice.category}</span></div>
                        <h2 style="margin-bottom: 0.5rem; font-size: 1.8rem; color: var(--text-main); line-height: 1.3;">${notice.title}</h2>
                        ${authorHtml}
                        <div class="ql-editor" style="padding:0; border:none; min-height: auto; margin-bottom: 2rem; font-size: 1.05rem;">${notice.content}</div>
                        
                        <div style="margin-top: 1.5rem; padding: 15px; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 12px;">
                            <p style="font-weight: 700; margin-bottom: 10px; color: var(--text-main);">💬 Leave Feedback</p>
                            <textarea class="premium-input" placeholder="Write your thoughts or questions here..." rows="2" style="margin-bottom: 10px;"></textarea>
                            <button class="btn" onclick="showToast('Feedback sent to admins!', 'success'); document.getElementById('notice-modal').classList.remove('active');" style="background: #3b82f6; color: white; width: 100%;">Securely Submit to Admin</button>
                        </div>

                        <div style="display: flex; gap: 10px; margin-top: 2rem; padding-top: 15px; border-top: 1px solid var(--border-color); align-items: center;">
                            <button class="reaction-pill like-btn" data-id="${notice.id}">👍 ${likes}</button>
                            <button class="reaction-pill dislike-btn" data-id="${notice.id}">👎 ${dislikes}</button>
                        </div>
                    `;
                    noticeModal.classList.add('active');
                    attachInteractionListeners();
                };

                let bookmarkHoverTimer;
                
                savedDiv.addEventListener('mouseenter', () => {
                    bookmarkHoverTimer = setTimeout(() => { openBookmarkModal(); }, 1000);
                });
                
                savedDiv.addEventListener('mouseleave', () => {
                    clearTimeout(bookmarkHoverTimer);
                });

                savedDiv.addEventListener('click', (e) => {
                    if (e.target.closest('.remove-bookmark-btn')) return; 
                    clearTimeout(bookmarkHoverTimer); 
                    openBookmarkModal();
                });

                savedContainer.appendChild(savedDiv);
            });
        }
    }

    // --- NOTIFICATION COUNTER ENGINE ---
    const headerBadge = document.getElementById('unread-badge');
    const allNoticesBtn = document.querySelector('.sidebar-filter[data-category="All"]');

    if (isStudent && unreadCount > 0) {
        if (headerBadge) {
            headerBadge.textContent = `${unreadCount} Unread`;
            headerBadge.style.display = 'inline-block';
        }
        
        if (allNoticesBtn) {
            const existingSidebarBadge = allNoticesBtn.querySelector('.sidebar-badge');
            if (existingSidebarBadge) existingSidebarBadge.remove();
            
            const sidebarBadge = document.createElement('span');
            sidebarBadge.className = 'sidebar-badge';
            sidebarBadge.textContent = unreadCount;
            allNoticesBtn.appendChild(sidebarBadge);
        }
    } else {
        if (headerBadge) headerBadge.style.display = 'none';
        if (allNoticesBtn) {
            const existingSidebarBadge = allNoticesBtn.querySelector('.sidebar-badge');
            if (existingSidebarBadge) existingSidebarBadge.remove();
        }
    }

// --- NOTIFICATION COUNTER ENGINE ---
    // ... (your existing counter code) ...

    attachInteractionListeners(); 
    if (typeof renderPoll === 'function') renderPoll(); // Keeps your poll working if you have it!
    
    // THE FIX: Force the timers to calculate the millisecond the main feed finishes drawing!
    updateTimers();
}



function renderVault() {
    const vaultContainer = document.getElementById('vault-container');
    const emptyState = document.getElementById('vault-empty-state');
    const savedIds = JSON.parse(localStorage.getItem('studentSavedNotices')) || [];
    
    // Filter notices: Must be saved AND have an attachment
    const vaultedNotices = notices.filter(n => savedIds.includes(n.id) && n.attachmentUrl);

    if (vaultedNotices.length === 0) {
        vaultContainer.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    vaultContainer.innerHTML = vaultedNotices.map(notice => `
        <div class="vault-card">
            <div class="file-icon">📄</div>
            <div style="flex-grow: 1; overflow: hidden;">
                <h4 style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${notice.title}</h4>
                <p style="font-size: 0.8rem; color: var(--text-muted);">${notice.category} • ${notice.date}</p>
            </div>
            <a href="${notice.attachmentUrl}" target="_blank" class="btn" style="background: var(--primary-color); color: white; padding: 8px 12px;">Open</a>
        </div>
    `).join('');
}

// --- ADMIN FEEDBACK RENDERER ---
function renderFeedback() {
    const feedbackContainer = document.getElementById('admin-feedback-list');
    
    // THE FIX: We changed this so it allows 'admin', 'faculty', or any staff role to see it!
    if (!feedbackContainer || currentUserData.role === 'student') return;

    // Listen to the feedback collection in real-time
    db.collection("feedback").orderBy("timestamp", "desc").onSnapshot(snapshot => {
        feedbackContainer.innerHTML = '';
// ... (keep the rest of the function exactly the same)
        
        if (snapshot.empty) {
            feedbackContainer.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 20px;">All caught up! No new feedback.</p>`;
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            const feedbackDiv = document.createElement('div');
            feedbackDiv.className = 'admin-list-item';
            feedbackDiv.style.borderLeft = '4px solid var(--primary-color)';
            
            feedbackDiv.innerHTML = `
                <div class="admin-list-item-left">
                    <div style="font-size: 0.8rem; color: var(--primary-color); font-weight: 800; text-transform: uppercase; margin-bottom: 4px;">
                        Re: ${data.noticeTitle || 'General'}
                    </div>
                    <h4 style="margin-bottom: 4px;">"${data.message}"</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Sent by: <strong>${data.studentName}</strong> • ${data.date}</p>
                </div>
                <div class="admin-list-item-actions">
                    <button class="btn resolve-feedback-btn" data-id="${doc.id}" style="background: #10b981; color: white; padding: 6px 15px;">Resolve</button>
                </div>
            `;
            
            feedbackContainer.appendChild(feedbackDiv);
        });

        // Add "Resolve" functionality to remove feedback once read
        feedbackContainer.querySelectorAll('.resolve-feedback-btn').forEach(btn => {
            btn.onclick = (e) => {
                const id = e.target.getAttribute('data-id');
                db.collection("feedback").doc(id).delete().then(() => {
                    showToast("Feedback resolved and archived", "success");
                });
            };
        });
    });
}

// Call this inside your main auth listener or at the end of renderNotices
if (currentUserData && currentUserData.role === 'faculty') {
    renderFeedback();
}
// ==========================================
// --- 6. LISTENERS (Interactions & Admin) ---
// ==========================================
function attachInteractionListeners() {
    // 1. Bookmarks
    document.querySelectorAll('.bookmark-btn, .remove-bookmark-btn').forEach(btn => btn.onclick = (e) => { 
        e.preventDefault(); e.stopPropagation(); 
        const id = e.currentTarget.getAttribute('data-id'); 
        let saved = JSON.parse(localStorage.getItem('studentSavedNotices')) || []; 
        if (saved.includes(id)) { saved = saved.filter(savedId => savedId !== id); showToast("Removed from bookmarks", "info"); } 
        else { saved.push(id); showToast("Pinned to Dashboard!", "success"); } 
        localStorage.setItem('studentSavedNotices', JSON.stringify(saved)); 
        renderNotices(); 
    });
    
    // 2. Like Buttons
    document.querySelectorAll('.like-btn').forEach(btn => btn.onclick = (e) => { 
        e.stopPropagation(); 
        if (!isLoggedIn) return showToast("Please login to like notices! 🔒", "error");

        const id = e.currentTarget.getAttribute('data-id'); 
        const button = e.currentTarget;
        
        if (localStorage.getItem(`voted_notice_${id}`)) {
            button.classList.add('shake');
            setTimeout(() => button.classList.remove('shake'), 400);
            return showToast("Already reacted!", "info"); 
        }

        createLikeBurst(e.clientX, e.clientY);
        button.classList.add('liked-pop'); 
        setTimeout(() => button.classList.remove('liked-pop'), 400); 
        
        const currentLikes = parseInt(button.textContent.replace(/[^0-9]/g, '')) || 0;
        button.innerHTML = `👍 ${currentLikes + 1}`; 
        localStorage.setItem(`voted_notice_${id}`, 'true'); 

        db.collection("notices").doc(id).update({ 
            likes: firebase.firestore.FieldValue.increment(1) 
        }).catch(err => {
            showToast("Database Error: " + err.message, "error");
            button.innerHTML = `👍 ${currentLikes}`; 
            localStorage.removeItem(`voted_notice_${id}`);
        }); 
    });

    // 3. RSVP and Mark as Done
    document.querySelectorAll('.rsvp-btn, .mark-done-btn').forEach(btn => btn.onclick = (e) => { 
        e.stopPropagation(); 
        if (!isLoggedIn) return showToast("Please login", "error"); 
        const id = e.currentTarget.getAttribute('data-id'); 
        const field = e.currentTarget.classList.contains('rsvp-btn') ? 'attendees' : 'submissions'; 
        
        const originalText = btn.innerHTML;
        btn.innerHTML = "⏳ Saving...";
        btn.style.opacity = "0.7";

        db.collection("notices").doc(id).update({ 
            [field]: firebase.firestore.FieldValue.arrayUnion({ id: currentUser.uid, name: currentUserData.name }) 
        }).then(() => showToast("Action confirmed!", "success"))
          .catch(() => {
              alert("Firebase blocked this request! Check your database rules.");
              btn.innerHTML = originalText;
              btn.style.opacity = "1";
          }); 
    });
    
    // 4. Delete Notice (Admin)
    document.querySelectorAll('.delete-btn').forEach(btn => btn.onclick = (e) => { 
        e.stopPropagation();
        const id = e.target.getAttribute('data-id'); 
        showConfirm('Delete this notice permanently?', () => db.collection("notices").doc(id).delete().then(() => showToast("Deleted!", "success"))); 
    });

    // 5. View RSVPs (Admin)
    document.querySelectorAll('.view-rsvp-btn').forEach(btn => btn.onclick = (e) => { 
        e.stopPropagation();
        const id = e.target.getAttribute('data-id'); 
        const notice = notices.find(n => n.id === id);
        
        if (notice && notice.attendees && notice.attendees.length > 0) {
            const listHtml = notice.attendees.map(student => `
                <div style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 10px;">
                    <span style="background: #dbeafe; color: #1d4ed8; width: 30px; height: 30px; display: flex; justify-content: center; align-items: center; border-radius: 50%; font-weight: bold;">${student.name.charAt(0).toUpperCase()}</span>
                    <strong style="color: var(--text-main);">${student.name}</strong>
                </div>
            `).join('');
            showAlert("👥 Students Attending", listHtml);
        } else {
            showAlert("👥 Students Attending", "<p style='text-align:center; padding: 20px 0;'>No students have RSVP'd yet.</p>");
        }
    });

    // 6. View Submissions (Admin)
    document.querySelectorAll('.view-subs-btn').forEach(btn => btn.onclick = (e) => { 
        e.stopPropagation();
        const id = e.target.getAttribute('data-id'); 
        const notice = notices.find(n => n.id === id);
        
        if (notice && notice.submissions && notice.submissions.length > 0) {
            const listHtml = notice.submissions.map(student => `
                <div style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 10px;">
                    <span style="background: #f3e8ff; color: #7e22ce; width: 30px; height: 30px; display: flex; justify-content: center; align-items: center; border-radius: 50%; font-weight: bold;">${student.name.charAt(0).toUpperCase()}</span>
                    <strong style="color: var(--text-main);">${student.name}</strong>
                </div>
            `).join('');
            showAlert("📄 Submissions Received", listHtml);
        } else {
            showAlert("📄 Submissions Received", "<p style='text-align:center; padding: 20px 0;'>No submissions received yet.</p>");
        }
    });
}
// ==========================================
// --- 7. FORMS (Login, Publish, Polls) ---
// ==========================================
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); const email = document.getElementById('email').value; const password = document.getElementById('password').value;
        const submitBtn = e.target.querySelector('button[type="submit"]'); const originalBtnText = submitBtn.innerHTML; submitBtn.innerHTML = '⏳ Verifying...'; submitBtn.disabled = true;
        auth.signInWithEmailAndPassword(email, password).then(() => showToast('Credentials accepted!', 'success')).catch(error => showToast("Login Failed: " + error.message, 'error')).finally(() => { submitBtn.innerHTML = originalBtnText; submitBtn.disabled = false; });
    });
}

document.getElementById('notice-category')?.addEventListener('change', (e) => { const fields = document.getElementById('assignment-fields'); if (fields) fields.style.display = (e.target.value === 'Assignment') ? 'block' : 'none'; });

document.getElementById('notice-form')?.addEventListener('submit', async (e) => {
    e.preventDefault(); const submitBtn = e.target.querySelector('button[type="submit"]'); const originalBtnText = submitBtn.innerHTML; submitBtn.innerHTML = '⏳ Publishing...'; submitBtn.disabled = true; submitBtn.style.opacity = '0.7';
    try {
        const category = document.getElementById('notice-category').value;
        const scheduledInput = document.getElementById('notice-scheduled-time') ? document.getElementById('notice-scheduled-time').value : null;
        const publishTime = scheduledInput ? new Date(scheduledInput).toISOString() : new Date().toISOString();
        const resourceLinkInput = document.getElementById('notice-file-url');
        const resourceLink = resourceLinkInput && resourceLinkInput.value.trim() !== "" ? resourceLinkInput.value : null;

        await db.collection("notices").add({
            title: document.getElementById('notice-title').value, category: category, content: quill ? quill.root.innerHTML : document.getElementById('notice-content').value,
            attachmentUrl: resourceLink, attachmentName: resourceLink ? "View Attached Resource" : null, likes: 0, dislikes: 0,
            isRSVP: document.getElementById('notice-rsvp') ? document.getElementById('notice-rsvp').checked : false, attendees: [], 
            deadline: category === 'Assignment' ? document.getElementById('notice-deadline').value : null, submissionLink: category === 'Assignment' ? document.getElementById('notice-link').value : null, submissions: category === 'Assignment' ? [] : null, 
            authorId: currentUser.uid, authorName: currentUserData.name, date: new Date().toLocaleDateString(), timestamp: firebase.firestore.FieldValue.serverTimestamp(), scheduledFor: publishTime 
        });
        showToast(scheduledInput ? 'Notice Scheduled! ⏳' : 'Notice Published!', 'success'); e.target.reset(); if (quill) quill.root.innerHTML = ''; if (document.getElementById('assignment-fields')) document.getElementById('assignment-fields').style.display = 'none';
    } catch (err) { showToast("Error: " + err.message, 'error'); } finally { submitBtn.innerHTML = originalBtnText; submitBtn.disabled = false; submitBtn.style.opacity = '1'; }
});

// ==========================================
// --- 8. LIVE POLLS & CHARTS ---
// ==========================================
let livePollData = null;
db.collection("dashboardStats").doc("currentPoll").onSnapshot(doc => { if (doc.exists) { livePollData = doc.data(); renderPoll(); } else { livePollData = null; if (document.getElementById('quick-poll-section')) document.getElementById('quick-poll-section').style.display = 'none'; } });

document.getElementById('poll-form')?.addEventListener('submit', (e) => {
    e.preventDefault(); const options = []; for(let i=1; i<=4; i++) { const text = document.getElementById(`poll-opt-${i}`).value; if(text.trim() !== '') options.push({ id: `opt${i}`, text: text, votes: 0 }); }
    db.collection("dashboardStats").doc("currentPoll").set({ question: document.getElementById('admin-poll-question').value, options: options, pollId: "poll_" + new Date().getTime() }).then(() => { showToast("Poll published live!", "success"); e.target.reset(); });
});

function renderPoll() {
    const pollArea = document.getElementById('poll-options-area'); const pollSection = document.getElementById('quick-poll-section');
    if (!isLoggedIn || !currentUserData || currentUserData.role !== 'student' || !livePollData) { if (pollSection) pollSection.style.display = 'none'; return; }
    if (pollSection) pollSection.style.display = 'block'; if (document.getElementById('poll-question')) document.getElementById('poll-question').textContent = livePollData.question;
    
    if (localStorage.getItem(`voted_${livePollData.pollId}`)) {
        const totalVotes = livePollData.options.reduce((sum, opt) => sum + opt.votes, 0); const maxVotes = Math.max(...livePollData.options.map(o => o.votes)); 
        pollArea.innerHTML = livePollData.options.map(opt => { const pct = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100); const isWinner = opt.votes === maxVotes && totalVotes > 0; return `<div class="poll-result-bar ${isWinner ? 'winner-bar' : ''}"><div class="poll-result-fill ${isWinner ? 'winner' : ''}" style="width: ${pct}%"></div><span style="font-weight: 600; z-index: 2;">${isWinner ? '🏆 ' : ''}${opt.text}</span><span style="font-weight: 700; z-index: 2;">${pct}%</span></div>`; }).join('');
    } else {
        pollArea.innerHTML = livePollData.options.map(opt => `<button class="poll-option-btn" data-id="${opt.id}">${opt.text}</button>`).join('');
        document.querySelectorAll('.poll-option-btn').forEach(btn => btn.addEventListener('click', (e) => {
            const optIndex = livePollData.options.findIndex(o => o.id === e.currentTarget.getAttribute('data-id'));
            if (optIndex > -1) { livePollData.options[optIndex].votes++; db.collection("dashboardStats").doc("currentPoll").update({ options: livePollData.options }).then(() => { localStorage.setItem(`voted_${livePollData.pollId}`, 'true'); showToast("Vote recorded!", "success"); }); }
        }));
    }
}
// ==========================================
// --- 9. LIVE COUNTDOWN ENGINE ---
// ==========================================
// ==========================================
// --- 9. LIVE COUNTDOWN ENGINE ---
// ==========================================
function updateTimers() {
    document.querySelectorAll('.assignment-tracker').forEach(tracker => {
        const deadlineStr = tracker.getAttribute('data-deadline'); 
        const isSubmitted = tracker.getAttribute('data-submitted') === 'true'; 
        const timerEl = tracker.querySelector('.countdown-timer');
        const actionButtons = tracker.querySelector('.assignment-actions'); 

        if (!deadlineStr || !timerEl) return;
        
        if (isSubmitted) { 
            timerEl.textContent = "🎉 COMPLETED"; 
            timerEl.style.color = "#10b981"; 
            return; 
        }
        
        const diff = new Date(deadlineStr).getTime() - new Date().getTime();
        
        // If the deadline has officially hit zero...
        if (diff <= 0) { 
            timerEl.innerHTML = `🚨 DEADLINE PASSED`; 
            timerEl.style.color = "var(--danger)"; 
            
            if (actionButtons) {
                actionButtons.innerHTML = `<div style="color: var(--danger); font-weight: 700; padding: 10px; background: #fee2e2; border-radius: 8px; width: 100%; border: 1px dashed #fca5a5;">❌ Assignment Locked</div>`;
            }
        } else {
            // Calculate Days, Hours, Minutes, AND Seconds!
            const d = Math.floor(diff / (1000 * 60 * 60 * 24)); 
            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)); 
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            
            // Dynamic UX Color: Turns red if less than 1 day remains!
            if (d === 0) {
                timerEl.style.color = "var(--danger)";

                timerEl.classList.add('timer-urgent'); // Trigger the pulse!
            } else {
                timerEl.style.color = "#f59e0b"; // Warning orange for future dates

                timerEl.classList.remove('timer-urgent'); // Remove pulse if time is added back
            }

            timerEl.textContent = `${d}d ${h}h ${m}m ${s}s`;
        }
    });
}

// 1. Run instantly on load
updateTimers();

// 2. THE FIX: Update every 1 second (1000ms) instead of 1 minute!
setInterval(updateTimers, 1000);


// ==========================================
// --- 10. LIVE CHARTS ENGINE (Admin & Public) ---
// ==========================================
if (typeof Chart !== 'undefined') {
    
    // 1. ADVANCED CHART CONFIGURATION (With Gradients!)
    const createChartConfig = (ctx, labels, data, colors, type='bar') => { 
        let dynamicColors = colors;
        if (type === 'bar') {
            dynamicColors = colors.map(hex => {
                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, hex); 
                gradient.addColorStop(1, hex + '00'); 
                return gradient;
            });
        }

        return {
            type: type, 
            data: { 
                labels: labels, 
                datasets: [{ 
                    data: data, 
                    backgroundColor: dynamicColors,
                    hoverBackgroundColor: colors,
                    hoverOffset: type === 'doughnut' ? 18 : 0, 
                    borderRadius: type === 'bar' ? 8 : 0,
                    borderSkipped: false,
                    borderWidth: type === 'doughnut' ? 5 : 0, 
                    borderColor: '#ffffff',
                    barThickness: type === 'bar' ? 36 : undefined,
                }] 
            }, 
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                layout: { padding: type === 'doughnut' ? 20 : 0 }, 
                animation: {
                    duration: 2000, 
                    easing: 'easeOutExpo' 
                },
                plugins: {
                    legend: { 
                        display: type === 'doughnut', 
                        position: 'bottom',
                        labels: {
                            usePointStyle: true, 
                            pointStyle: 'circle',
                            padding: 25,
                            font: { size: 13, weight: '700', family: "'Segoe UI', sans-serif" },
                            color: '#64748b' 
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                        titleColor: '#94a3b8',
                        bodyColor: '#ffffff',
                        bodyFont: { size: 15, weight: 'bold' },
                        padding: 15,
                        cornerRadius: 12,
                        displayColors: type === 'doughnut', 
                        boxPadding: 6,
                        caretSize: 8 
                    }
                },
                scales: type === 'bar' ? {
                    y: {
                        beginAtZero: true,
                        border: { display: false }, 
                        grid: { color: 'rgba(148, 163, 184, 0.15)', borderDash: [4, 4] }, 
                        ticks: { color: '#94a3b8', font: { weight: '600' }, padding: 10 }
                    },
                    x: {
                        border: { display: false }, 
                        grid: { display: false }, 
                        ticks: { color: '#94a3b8', font: { weight: '600' } }
                    }
                } : undefined,
                cutout: type === 'doughnut' ? '80%' : undefined 
            } 
        };
    };

    // 2. Initialize the ADMIN charts 
    const adminChartCtx = document.getElementById('adminChart');
    const adminEventsCtx = document.getElementById('adminEventsChart');
    
    let adminChart = adminChartCtx ? new Chart(adminChartCtx.getContext('2d'), createChartConfig(adminChartCtx.getContext('2d'), ['Mon','Tue','Wed','Thur','Fri','Sat'], [0,0,0,0,0,0], ['#b91c1c','#3b82f6','#10b981','#f59e0b','#8b5cf6','#64748b'], 'bar')) : null;
    let adminEventsChart = adminEventsCtx ? new Chart(adminEventsCtx.getContext('2d'), createChartConfig(adminEventsCtx.getContext('2d'), ['Tech','Sports','Arts'], [0,0,0], ['#3b82f6','#10b981','#ef4444'], 'doughnut')) : null;

    // 3. Initialize the PUBLIC Student charts
    const publicChartCtx = document.getElementById('publicChart');
    const publicEventsCtx = document.getElementById('publicEventsChart');
    
    let publicChart = publicChartCtx ? new Chart(publicChartCtx.getContext('2d'), createChartConfig(publicChartCtx.getContext('2d'), ['Mon','Tue','Wed','Thur','Fri','Sat'], [0,0,0,0,0,0], ['#b91c1c','#3b82f6','#10b981','#f59e0b','#8b5cf6','#64748b'], 'bar')) : null;
    let publicEventsChart = publicEventsCtx ? new Chart(publicEventsCtx.getContext('2d'), createChartConfig(publicEventsCtx.getContext('2d'), ['Tech','Sports','Arts'], [0,0,0], ['#3b82f6','#10b981','#ef4444'], 'doughnut')) : null;

    // 4. REAL-TIME FIREBASE LISTENERS 
    db.collection("dashboardStats").doc("currentAttendance").onSnapshot(doc => { 
        if (doc.exists) { 
            const data = doc.data().percentages || [0,0,0,0,0,0];
            if (adminChart) { adminChart.data.datasets[0].data = data; adminChart.update(); } 
            if (publicChart) { publicChart.data.datasets[0].data = data; publicChart.update(); } 
        } 
    });
    
    db.collection("dashboardStats").doc("currentEvents").onSnapshot(doc => { 
        if (doc.exists) { 
            const data = doc.data().counts || [0,0,0];
            if (adminEventsChart) { adminEventsChart.data.datasets[0].data = data; adminEventsChart.update(); } 
            if (publicEventsChart) { publicEventsChart.data.datasets[0].data = data; publicEventsChart.update(); } 
        } 
    });
    
    // 5. SECURE FORM SUBMISSIONS 
    const updateChartForm = document.getElementById('update-chart-form');
    if(updateChartForm) {
        updateChartForm.addEventListener('submit', async (e) => { 
            e.preventDefault(); 
            const btn = e.target.querySelector('button');
            btn.innerHTML = '⏳...'; btn.disabled = true;
            try {
                const data = ['mon', 'tue', 'wed', 'thur', 'fri', 'sat'].map(id => Number(document.getElementById(`${id}-att`).value));
                await db.collection("dashboardStats").doc("currentAttendance").set({ percentages: data }, {merge: true});
                showToast("Campus Attendance Live Updated! 📈", "success"); 
                e.target.reset();
            } catch(err) { showToast("Database Error: " + err.message, "error"); } 
            finally { btn.innerHTML = 'Update Live'; btn.disabled = false; }
        });
    }

    const updateEventsForm = document.getElementById('update-events-form');
    if(updateEventsForm) {
        updateEventsForm.addEventListener('submit', async (e) => { 
            e.preventDefault(); 
            const btn = e.target.querySelector('button');
            btn.innerHTML = '⏳...'; btn.disabled = true;
            try {
                const data = [Number(document.getElementById('tech-val').value), Number(document.getElementById('sports-val').value), Number(document.getElementById('arts-val').value)];
                await db.collection("dashboardStats").doc("currentEvents").set({ counts: data }, {merge: true});
                showToast("Event Registrations Live Updated! 🎯", "success"); 
                e.target.reset();
            } catch(err) { showToast("Database Error: " + err.message, "error"); } 
            finally { btn.innerHTML = 'Update'; btn.disabled = false; }
        });
    }
}





// HELPER: Create YouTube-style particle burst
function createLikeBurst(x, y) {
    const particles = ['❤️', '✨', '👍', '💖', '🔥'];
    for (let i = 0; i < 8; i++) {
        const p = document.createElement('div');
        p.className = 'like-particle';
        p.textContent = particles[Math.floor(Math.random() * particles.length)];
        
        // Randomize direction
        const destX = (Math.random() - 0.5) * 200;
        const destY = -Math.random() * 150 - 50;
        
        p.style.setProperty('--x', `${destX}px`);
        p.style.setProperty('--y', `${destY}px`);
        p.style.left = `${x}px`;
        p.style.top = `${y}px`;
        
        document.body.appendChild(p);
        
        // Cleanup memory after animation ends
        setTimeout(() => p.remove(), 800);
    }
}
// ==========================================
// --- 11. PWA INSTALL MODAL ENGINE ---
// ==========================================
let deferredPrompt;
const installAppBtn = document.getElementById('install-app-btn'); // Sidebar button
const installModal = document.getElementById('custom-install-modal');
const closeModalBtn = document.getElementById('closeModal');
const confirmInstallBtn = document.getElementById('confirmInstall'); // Green button inside modal

// 1. Catch the native browser install prompt
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the browser from showing its own default popup
    e.preventDefault();
    // Save the event so we can trigger it later
    deferredPrompt = e;
    // Show your sidebar button because the app is ready to be installed!
    if (installAppBtn) {
        installAppBtn.style.display = 'flex';
    }
});

if (installAppBtn && installModal && confirmInstallBtn) {
    // 2. Open your custom UI modal when clicking the sidebar button
    installAppBtn.addEventListener('click', (e) => {
        e.preventDefault();
        installModal.style.display = 'flex';
    });

    // 3. THE MAGIC: Trigger the actual installation!
    confirmInstallBtn.addEventListener('click', async () => {
        // Hide your custom modal first
        installModal.style.display = 'none';
        
        if (deferredPrompt) {
            // Show the native browser install prompt
            deferredPrompt.prompt();
            
            // Wait for the user to click "Install" or "Cancel" on the native prompt
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response: ${outcome}`);
            
            // The prompt can only be used once, so destroy it
            deferredPrompt = null;
            
            // If they installed it, hide the sidebar button so they don't see it again
            if (outcome === 'accepted') {
                installAppBtn.style.display = 'none';
            }
        } else {
            // Fallback for iOS/Safari users (they have to use the share menu)
            showToast("To install on iOS: Tap Share ➔ 'Add to Home Screen'", "info");
        }
    });

    // 4. Close the modal when clicking "Maybe Later"
    closeModalBtn.addEventListener('click', () => {
        installModal.style.display = 'none';
    });

    // 5. Close modal if user clicks the dark background outside the box
    installModal.addEventListener('click', (e) => {
        if (e.target === installModal) {
            installModal.style.display = 'none';
        }
    });
}

// 6. Cleanup after successful installation
window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    if (installAppBtn) installAppBtn.style.display = 'none';
    console.log('Camp Connect was successfully installed!');
});



// ==========================================
// --- DIRECT FACULTY MAILBOX ENGINE ---
// ==========================================

// 1. Student Sending Logic
const askFacultyBtn = document.getElementById('student-ask-btn');
if (askFacultyBtn) {
    askFacultyBtn.addEventListener('click', () => {
        const modalContentArea = document.getElementById('modal-content-area');
        const noticeModal = document.getElementById('notice-modal');
        
       // Repurpose the existing modal for a direct message form with Premium UX
        modalContentArea.innerHTML = `
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <div style="width: 64px; height: 64px; background: #f0fdf4; color: #10b981; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 2rem; margin: 0 auto 1rem auto; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.1);">
                    ✉️
                </div>
                <h2 style="font-size: 1.8rem; color: var(--text-main); font-weight: 800; margin-bottom: 8px;">Message Faculty</h2>
                <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; padding: 0 10px;">
                    Send a direct question regarding your coursework or assignments. Faculty will review this during their active office hours.
                </p>
            </div>
            
            <div style="position: relative; margin-bottom: 20px;">
                <textarea id="direct-query-text" class="premium-input" placeholder="Type your detailed question here... (e.g., I need help clarifying the syllabus...)" rows="5" style="width: 100%; padding: 16px; border-radius: 12px; resize: vertical; line-height: 1.6; font-size: 1rem;"></textarea>
            </div>
            
            <button id="send-query-btn" class="btn premium-theme-btn" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; box-shadow: 0 6px 20px rgba(16, 185, 129, 0.25); width: 100%; padding: 14px; font-size: 1.1rem;">
                Send Secure Message ➔
            </button>
        `;
        
        noticeModal.classList.add('active');

        document.getElementById('send-query-btn').onclick = async (e) => {
            const msg = document.getElementById('direct-query-text').value;
            if (!msg.trim()) return showToast("Message cannot be empty.", "error");
            
            const btn = e.target;
            btn.innerHTML = "⏳ Sending...";
            btn.disabled = true;

            try {
                await db.collection("direct_queries").add({
                    message: msg,
                    studentName: currentUserData.name,
                    studentEmail: currentUser.email,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
                    status: 'unread'
                });
                
                showToast("Message sent to Faculty! ✅", "success");
                noticeModal.classList.remove('active');
            } catch (err) {
                showToast("Error: " + err.message, "error");
                btn.innerHTML = "Send Secure Message ➔";
                btn.disabled = false;
            }
        };
    });
}

// 2. Faculty Receiving Logic
function renderDirectQueries() {
    const queriesContainer = document.getElementById('admin-queries-list');
    if (!queriesContainer || !currentUserData || currentUserData.role === 'student') return;

    db.collection("direct_queries").orderBy("timestamp", "desc").onSnapshot(snapshot => {
        queriesContainer.innerHTML = '';
        
        if (snapshot.empty) {
            queriesContainer.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 20px;">Inbox is zero! No new queries.</p>`;
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            const queryDiv = document.createElement('div');
            queryDiv.className = 'admin-list-item';
            queryDiv.style.borderLeft = '4px solid #f59e0b'; // Gold border for queries
            
            queryDiv.innerHTML = `
                <div class="admin-list-item-left" style="width: 70%;">
                    <div style="font-size: 0.8rem; color: #f59e0b; font-weight: 800; text-transform: uppercase; margin-bottom: 4px;">
                        Direct Query
                    </div>
                    <h4 style="margin-bottom: 8px; font-weight: 500; line-height: 1.4;">"${data.message}"</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">From: <strong>${data.studentName}</strong> (${data.studentEmail}) • ${data.date}</p>
                </div>
                <div class="admin-list-item-actions">
                    <button class="btn resolve-query-btn" data-id="${doc.id}" style="background: #10b981; color: white; padding: 6px 15px;">Mark Resolved</button>
                </div>
            `;
            
            queriesContainer.appendChild(queryDiv);
        });

        // Archive logic
        queriesContainer.querySelectorAll('.resolve-query-btn').forEach(btn => {
            btn.onclick = (e) => {
                const id = e.target.getAttribute('data-id');
                db.collection("direct_queries").doc(id).delete().then(() => {
                    showToast("Query resolved and cleared from inbox.", "success");
                });
            };
        });
    });
}

// Trigger this when a faculty member logs in
if (currentUserData && (currentUserData.role === 'faculty' || currentUserData.role === 'admin')) {
    renderDirectQueries();
}


// 3. Student Inbox Render Logic
function renderStudentQueries() {
    const container = document.getElementById('student-queries-container');
    const section = document.getElementById('student-queries-section');
    
    if (!container || !section || !currentUser || currentUserData.role !== 'student') return;

    // Fetch only the queries belonging to this specific student
    db.collection("direct_queries")
      .where("studentEmail", "==", currentUser.email)
      .onSnapshot(snapshot => {
        if (snapshot.empty) {
            section.style.display = 'none';
            return;
        }
        
        section.style.display = 'block';
        container.innerHTML = '';
        
        // Sort newest to oldest
        let queries = snapshot.docs.map(doc => doc.data());
        queries.sort((a, b) => new Date(b.date) - new Date(a.date)); 

        queries.forEach(data => {
            const statusColor = data.status === 'replied' ? '#10b981' : '#f59e0b';
            const statusText = data.status === 'replied' ? '✅ Faculty Replied' : '⏳ Pending Response';
            
            let replyHtml = '';
            if (data.status === 'replied') {
                replyHtml = `
                    <div style="margin-top: 12px; padding: 12px; background: #f0fdf4; border-left: 3px solid #10b981; border-radius: 0 8px 8px 0;">
                        <p style="font-size: 0.8rem; color: #16a34a; font-weight: bold; margin-bottom: 3px;">Reply from ${data.repliedBy}:</p>
                        <p style="font-size: 0.95rem; color: var(--text-main);">${data.replyMessage}</p>
                    </div>
                `;
            }

            container.innerHTML += `
                <div style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 0.8rem; color: var(--text-muted);">${data.date}</span>
                        <span style="font-size: 0.75rem; font-weight: bold; color: ${statusColor}; background: ${statusColor}15; padding: 3px 8px; border-radius: 12px;">${statusText}</span>
                    </div>
                    <p style="font-size: 0.95rem; font-weight: 500;">" ${data.message} "</p>
                    ${replyHtml}
                </div>
            `;
        });
    });
}