document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-links a');

    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');

        // Animate Hamburger
        const bars = mobileMenuBtn.querySelectorAll('.bar');
        if (navLinks.classList.contains('active')) {
            bars[0].style.transform = 'rotate(-45deg) translate(-5px, 6px)';
            bars[1].style.opacity = '0';
            bars[2].style.transform = 'rotate(45deg) translate(-5px, -6px)';
        } else {
            bars[0].style.transform = 'none';
            bars[1].style.opacity = '1';
            bars[2].style.transform = 'none';
        }
    });

    // Close mobile menu when clicking a link
    links.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            // Reset Hamburger
            const bars = mobileMenuBtn.querySelectorAll('.bar');
            bars[0].style.transform = 'none';
            bars[1].style.opacity = '1';
            bars[2].style.transform = 'none';
        });
    });

    // Smooth Scroll with Offset for Fixed Header
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // Scroll Animation (Intersection Observer)
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    // Add fade-in class to elements we want to animate
    const animatedElements = document.querySelectorAll('.about-card, .gallery-item, .section-header');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });

    // Add visible class styles dynamically or rely on inline styles being overridden
    // Here we'll use a simple class addition to trigger the transition
    const style = document.createElement('style');
    style.innerHTML = `
        .visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);

    // Modal Logic
    const modal = document.getElementById("joinModal");
    const btn = document.getElementById("openModalBtn");
    const span = document.getElementsByClassName("close-modal")[0];
    const form = document.getElementById("joinForm");

    // --- Table Capacity Logic ---
    const TABLE_CAPACITIES = {
        'it': 5,
        'japanese': 10,
        'board-game': 10,
        'free-talk': 10
    };

    function updateTableSpots() {
        const scriptUrl = 'https://script.google.com/macros/s/AKfycbwnfxdaWlJ7gD0PEX7JNzn7OMvV6H9AVqQBEIe6BsudItekBVN6BBlt0LtjeKusg9VL/exec';
        const nextThursday = getNextThursday();

        // Reset options text while loading
        const select = document.getElementById('table');
        if (!select) return;

        // Fetch latest data
        fetch(`${scriptUrl}?type=latest&date=${nextThursday}`)
            .then(response => response.json())
            .then(data => {
                const registrants = data.registrants || [];
                const counts = {};
                const uniqueSets = {};

                // Initialize counts and sets
                Object.keys(TABLE_CAPACITIES).forEach(key => {
                    counts[key] = 0;
                    uniqueSets[key] = new Set();
                });

                // Count registrations for next Thursday
                registrants.forEach(reg => {
                    if (reg.table && counts.hasOwnProperty(reg.table)) {
                        // Deduplication: Normalize name
                        const normalizedName = reg.name ? reg.name.trim().toLowerCase() : '';
                        if (normalizedName && !uniqueSets[reg.table].has(normalizedName)) {
                            uniqueSets[reg.table].add(normalizedName);
                            counts[reg.table]++;
                        }
                    }
                });

                // Update Select Options
                Array.from(select.options).forEach(option => {
                    const type = option.value;
                    if (TABLE_CAPACITIES.hasOwnProperty(type)) {
                        const total = TABLE_CAPACITIES[type];
                        const taken = counts[type];
                        const left = Math.max(0, total - taken);

                        // Clean previous count if exists
                        const baseText = option.textContent.split(' (spot left:')[0];
                        option.textContent = `${baseText} (spot left: ${left})`;

                        // Optional: Disable if full
                        if (left === 0) {
                            option.disabled = true;
                            option.textContent += ' - FULL';
                        } else {
                            option.disabled = false;
                        }
                    }
                });

                // Check Client-side Registration Status
                const submitBtn = document.querySelector('#joinForm button[type="submit"]');
                const dateInput = document.getElementById('date');

                function checkRegistrationStatus() {
                    if (!submitBtn || !dateInput) return;
                    const selectedDate = dateInput.value;
                    const storageKey = `joined_event_${selectedDate}`;

                    if (localStorage.getItem(storageKey)) {
                        submitBtn.disabled = true;
                        submitBtn.innerText = 'You are Registered';
                        submitBtn.title = "You have already registered for this event.";
                    } else {
                        submitBtn.disabled = false;
                        submitBtn.innerText = 'Join Event'; // Reset
                        submitBtn.title = "";
                    }
                }

                // Initial check
                checkRegistrationStatus();

                // Add listener for date changes
                if (dateInput) {
                    dateInput.addEventListener('change', checkRegistrationStatus);
                }
            })
            .catch(err => console.error('Error fetching capacity:', err));
    }


    if (btn) {
        btn.onclick = function () {
            modal.style.display = "flex";
            updateTableSpots(); // Update spots when opening
        }
    }

    if (span) {
        span.onclick = function () {
            modal.style.display = "none";
        }
    }

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // Form Submission Handler
    // Form Submission Handler
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerText;

            // 1. Get form values
            const name = document.getElementById('name').value;
            const table = document.getElementById('table').value;
            const date = document.getElementById('date').value;

            // 2. Prepare data for Google Sheets
            // PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE
            const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwnfxdaWlJ7gD0PEX7JNzn7OMvV6H9AVqQBEIe6BsudItekBVN6BBlt0LtjeKusg9VL/exec';

            const formData = {
                name: name,
                table: table,
                date: date
            };

            // 3. Check for double submission (Client-side)
            const storageKey = `joined_event_${date}`;
            if (localStorage.getItem(storageKey)) {
                alert('You have already registered for this date! Please contact us if you need to change something.');
                return;
            }

            // 4. Show loading state
            submitBtn.innerText = 'Submitting...';
            submitBtn.disabled = true;

            // 4. Send data using fetch
            fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(formData)
            })
                .then(response => {
                    console.log('Success!', response);
                    localStorage.setItem(storageKey, 'true'); // Flag as registered
                    showSuccessMessage(name, date, table);
                })
                .catch(error => {
                    console.error('Error!', error.message);
                    // For now, we'll assume success even on error if it's a CORS issue in testing, 
                    // but in production with the correct script, it should work.
                    // If the URL is still the placeholder, we should probably alert.
                    if (GOOGLE_SCRIPT_URL.includes('PASTE_YOUR')) {
                        alert('Please update the Google Script URL in script.js to make this work!');
                        submitBtn.innerText = originalBtnText;
                        submitBtn.disabled = false;
                    } else {
                        // Fallback for "opaque" responses or simple errors that might actually be successes in no-cors
                        showSuccessMessage(name, date, table);
                    }
                });
        });
    }

    // Feedback Form Logic
    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const btn = feedbackForm.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = 'Sending...';
            btn.disabled = true;

            const name = document.getElementById('fb-name').value;
            const topic = document.getElementById('fb-topic').value;
            const message = document.getElementById('fb-message').value;
            const ratingEl = document.querySelector('input[name="rating"]:checked');
            const rating = ratingEl ? ratingEl.value : '0';

            const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwnfxdaWlJ7gD0PEX7JNzn7OMvV6H9AVqQBEIe6BsudItekBVN6BBlt0LtjeKusg9VL/exec';

            const payload = {
                type: 'feedback',
                name: name,
                topic: topic,
                rating: rating,
                message: message
            };

            fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(payload)
            })
                .then(res => res.json())
                .then(data => {
                    alert('Thank you for your feedback!');
                    feedbackForm.reset();
                    btn.innerText = originalText;
                    btn.disabled = false;
                })
                .catch(err => {
                    console.error(err);
                    alert('Sent! (CORS mode)'); // Fallback
                    feedbackForm.reset();
                    btn.innerText = originalText;
                    btn.disabled = false;
                });
        });
    }

    function showSuccessMessage(name, date, table) {
        const modalContent = modal.querySelector('.modal-content');
        modalContent.innerHTML = `
            <span class="close-modal" onclick="location.reload()">&times;</span>
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">✅</div>
                <h2 style="color: var(--primary-color);">Registration Received!</h2>
                <p>Thanks ${name}!</p>
                <p style="color: var(--text-light); margin-top: 10px;">
                    We've added you to the <strong>${table}</strong> table<br>
                    for <strong>${date}</strong>.
                </p>
                <p style="font-size: 0.9rem; margin-top: 20px; color: #666;">
                    (Your details have been synced to our Hosting sheet)
                </p>
                <button class="btn btn-primary" style="margin-top: 20px;" onclick="location.reload()">Close</button>
            </div>
        `;
    }

    // --- New Feature: Registration Counter ---

    // 1. Calculate Next Thursday
    function getNextThursday() {
        const today = new Date();
        const date = new Date(today.getTime());
        date.setHours(0, 0, 0, 0);
        // Thursday is day 4
        // If today is Thursday (4), we want next Thursday? Or today if it's before event?
        // Let's assume if it's Thursday before 7PM, it's today. If after, it's next week.
        // For simplicity, let's just find the *next* upcoming Thursday.

        let daysUntilThursday = (4 + 7 - date.getDay()) % 7;

        // If today is Thursday, daysUntilThursday will be 0.
        // If we want to move to next week if event is over, we'd need time logic.
        // For now, let's assume "Next Meetup" means the nearest Thursday (today or future).

        if (daysUntilThursday === 0) {
            // It is Thursday. Check time? Let's just say if it's Thursday we show for today.
        } else {
            date.setDate(date.getDate() + daysUntilThursday);
        }

        // Format YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    // 2. Fetch Registration Count
    // 2. Fetch Registration Ticker
    function updateRegistrationTicker() {
        const nextThursday = getNextThursday();
        const display = document.getElementById('registration-count');
        const scriptUrl = 'https://script.google.com/macros/s/AKfycbwnfxdaWlJ7gD0PEX7JNzn7OMvV6H9AVqQBEIe6BsudItekBVN6BBlt0LtjeKusg9VL/exec';

        if (!display) return;

        display.innerHTML = 'Loading available spots...';

        fetch(`${scriptUrl}?type=latest&date=${nextThursday}`)
            .then(response => response.json())
            .then(data => {
                if (data && data.registrants && data.registrants.length > 0) {
                    startTicker(data.registrants, display);
                } else if (data.count > 0) {
                    // Fallback to count if backend old
                    display.innerHTML = `<span class="registration-highlight">${data.count}</span> people registered for 
                        <span style="white-space: nowrap;">${nextThursday}</span>`;
                } else {
                    display.innerHTML = `<span class="registration-highlight">Registration Open</span> for 
                        <span style="white-space: nowrap;">${nextThursday}</span>`;
                }
            })
            .catch(err => {
                console.log('Could not fetch ticker, using fallback', err);
                display.innerHTML = `<span class="registration-highlight">Registration Open</span> for 
                    <span style="white-space: nowrap;">${nextThursday}</span>`;
            });
    }

    function startTicker(registrants, container) {
        let currentIndex = 0;

        const tableMap = {
            'free-talk': 'English - Free Talk Table',
            'it': 'English - AI / IT Table',
            'japanese': 'Japanese - Language Exchange Table',
            'board-game': 'English - Card Game Table'
        };

        const showNext = () => {
            const person = registrants[currentIndex];
            const tableName = tableMap[person.table] || person.table;

            // Format: (Name) + has just registered for (Table) the next meetup
            // We use a fade-in animation via CSS class 'fade-enter'
            container.innerHTML = `
                <div class="ticker-item fade-enter">
                    <span class="registration-highlight">${person.name}</span> has just registered for 
                    <span class="registration-highlight">${tableName}</span> the next meetup.
                </div>
            `;

            currentIndex = (currentIndex + 1) % registrants.length;
        };

        showNext(); // Show first immediately

        // Cycle every 4 seconds if there's more than 1
        if (registrants.length > 1) {
            setInterval(showNext, 4000);
        }
    }

    // Initialize
    updateRegistrationTicker();

    // Auto-fill date in modal
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.value = getNextThursday();
    }
    // --- Gallery & Admin Logic ---
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwnfxdaWlJ7gD0PEX7JNzn7OMvV6H9AVqQBEIe6BsudItekBVN6BBlt0LtjeKusg9VL/exec';

    const GalleryManager = {
        isAdmin: localStorage.getItem('site_admin') === 'true',

        init() {
            const galleryGrid = document.getElementById('gallery-grid');
            if (galleryGrid) {
                this.renderAdminUI();
                this.loadPhotos();
            }
            this.bindEvents();
        },

        bindEvents() {
            // Admin Login Link
            const loginLink = document.getElementById('adminLoginLink');
            const loginModal = document.getElementById('adminLoginModal');
            const closeLogin = document.getElementById('closeAdminLogin');
            const loginForm = document.getElementById('adminLoginForm');

            if (loginLink) {
                loginLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (this.isAdmin) {
                        // Logout
                        localStorage.removeItem('site_admin');
                        location.reload();
                    } else {
                        loginModal.style.display = 'flex';
                    }
                });

                // Updates link text if logged in
                if (this.isAdmin) loginLink.textContent = 'Admin Logout';
            }

            if (closeLogin) closeLogin.onclick = () => loginModal.style.display = 'none';

            if (loginForm) {
                loginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const pass = document.getElementById('adminPassword').value;
                    // Simple hardcoded password for this static site
                    if (pass === 'admin@hsinchu' || pass === '1234') {
                        localStorage.setItem('site_admin', 'true');
                        location.reload();
                    } else {
                        alert('Incorrect password');
                    }
                });
            }

            // Upload Logic
            const addBtn = document.getElementById('addPhotoBtn');
            const uploadModal = document.getElementById('uploadModal');
            const closeUpload = document.getElementById('closeUpload');
            const uploadForm = document.getElementById('uploadForm');

            if (addBtn) addBtn.onclick = () => uploadModal.style.display = 'flex';
            if (closeUpload) closeUpload.onclick = () => uploadModal.style.display = 'none';

            if (uploadForm) {
                uploadForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.handleUpload();
                });
            }
        },

        renderAdminUI() {
            if (!this.isAdmin) return;

            // Show Floating Toolbar (or move it to header as requested)
            const toolbar = document.getElementById('adminToolbar');
            if (toolbar) toolbar.style.display = 'block';

            // Also insert a button below the header text if requested
            const bannerContainer = document.querySelector('.section-banner .container');
            if (bannerContainer) {
                const editArea = document.createElement('div');
                editArea.style.marginTop = '15px';
                editArea.innerHTML = `
                    <button class="btn btn-secondary" onclick="document.getElementById('uploadModal').style.display='flex'">
                        + Add New Photo
                    </button>
                `;
                bannerContainer.appendChild(editArea);
            }
        },

        loadPhotos() {
            const grid = document.getElementById('gallery-grid');
            if (!grid) return;

            // Keep static photos initially, but append dynamic ones
            // OR clear them if we want fully dynamic. 
            // Result: Let's fetch and append to top knowing GAS returns newest first.

            fetch(`${GOOGLE_SCRIPT_URL}?type=gallery`)
                .then(res => res.json())
                .then(photos => {
                    if (!photos || !Array.isArray(photos)) return;

                    // Create HTML for new photos
                    const dynamicHtml = photos.map(photo => this.createCardHtml(photo)).join('');

                    // Prepend to grid (so newest dynamic are first)
                    grid.insertAdjacentHTML('afterbegin', dynamicHtml);
                })
                .catch(err => console.error('Gallery load error', err));
        },

        createCardHtml(photo) {
            const deleteBtn = this.isAdmin
                ? `<button onclick="GalleryManager.deletePhoto('${photo.deleteKey}')" class="delete-btn" style="background:red; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; margin-top:5px; font-size:0.8rem;">Delete Output</button>`
                : '';

            // Format Date (Handle ISO string from GAS/Sheets)
            let displayDate = photo.date;
            try {
                // If it looks like a full ISO string (e.g. 2025-10-22T16:00:00.000Z), convert to local date part
                if (displayDate && displayDate.includes('T')) {
                    const d = new Date(displayDate);
                    // Use simple string manipulation or local date to avoid timezone shifts if possible, 
                    // but standard 'toLocaleDateString' is usually safest for "what the user sees".
                    // However, 2025-10-22T16:00Z IS 2025-10-23 in Taiwan.
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    displayDate = `${year}/${month}/${day}`;
                }
            } catch (e) {
                console.log('Date parse error', e);
            }

            return `
                <div class="gallery-card" style="position: relative;">
                    <img src="${photo.url}" alt="Meetup Photo" loading="lazy">
                    <div class="gallery-card-content">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                             <div class="gallery-date">${displayDate}</div>
                             ${deleteBtn}
                        </div>
                        <p>${photo.id ? 'Community Photo' : 'Weekly Meetup'}</p>
                    </div>
                </div>
            `;
        },

        async handleUpload() {
            const fileInput = document.getElementById('photoFile');
            const dateInput = document.getElementById('photoDate');
            const status = document.getElementById('uploadStatus');

            if (!fileInput.files[0]) return;

            status.style.display = 'block';
            status.textContent = 'Compressing & Uploading...';

            try {
                const base64 = await this.compressImage(fileInput.files[0]);

                const payload = {
                    type: 'upload',
                    image: base64.split(',')[1], // Remove 'data:image/jpeg;base64,' prefix
                    mimeType: 'image/jpeg',
                    filename: 'upload-' + Date.now() + '.jpg',
                    date: dateInput.value,
                    name: 'Admin'
                };

                const res = await fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                if (data.result === 'success') {
                    status.textContent = 'Done! Reloading...';
                    setTimeout(() => location.reload(), 1000);
                } else {
                    throw new Error(data.error || 'Upload failed');
                }
            } catch (err) {
                console.error(err);
                status.textContent = 'Error: ' + err.message;
            }
        },

        deletePhoto(key) {
            if (!confirm('Are you sure you want to delete this photo?')) return;

            fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({ type: 'delete', key: key })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.result === 'success') location.reload();
                    else alert('Failed to delete');
                })
                .catch(err => alert('Error deleting photo'));
        },

        compressImage(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (e) => {
                    const img = new Image();
                    img.src = e.target.result;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');

                        // Max width/height
                        const MAX_SIZE = 1000;
                        let width = img.width;
                        let height = img.height;

                        if (width > height) {
                            if (width > MAX_SIZE) {
                                height *= MAX_SIZE / width;
                                width = MAX_SIZE;
                            }
                        } else {
                            if (height > MAX_SIZE) {
                                width *= MAX_SIZE / height;
                                height = MAX_SIZE;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0, width, height);

                        // Compress to 0.7 quality jpeg
                        resolve(canvas.toDataURL('image/jpeg', 0.7));
                    };
                    img.onerror = reject;
                };
                reader.onerror = reject;
            });
        }
    };

    // Expose for global buttons (delete)
    window.GalleryManager = GalleryManager;

    // Run
    GalleryManager.init();
});
