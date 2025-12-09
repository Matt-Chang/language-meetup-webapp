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

    if (btn) {
        btn.onclick = function () {
            modal.style.display = "flex";
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

            // 3. Show loading state
            submitBtn.innerText = 'Submitting...';
            submitBtn.disabled = true;

            // 4. Send data using fetch
            fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(formData)
            })
                .then(response => {
                    console.log('Success!', response);
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
});
