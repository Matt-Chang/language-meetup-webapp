
// Admin Dashboard Logic - Isolated

// Debug Helper
function adminLog(msg) {
    console.log(msg);
    const log = document.getElementById('debug-log');
    if (log) {
        log.style.display = 'block';
        log.innerHTML += `[${new Date().toLocaleTimeString()}] ${msg}<br>`;
        log.scrollTop = log.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    adminLog('Admin Script Loaded (admin.js)');

    if (localStorage.getItem('site_admin') !== 'true') {
        adminLog('User not authorized. Redirecting...');
        window.location.href = 'index.html';
        return;
    }

    initDashboard();
});

function initDashboard() {
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('site_admin');
            window.location.href = 'index.html';
        });
    }

    // Test Button Logic
    const testBtn = document.getElementById('testChartBtn');
    if (testBtn) {
        testBtn.addEventListener('click', () => {
            adminLog('--- STARTING DIAGNOSTIC TEST ---');
            if (typeof Chart === 'undefined') {
                adminLog('FAIL: Chart.js is NOT loaded.');
                alert('Chart.js is missing. Check internet connection or ad blocker.');
            } else {
                adminLog('PASS: Chart.js is loaded.');
                updateBarChart([{ table: 'free-talk' }, { table: 'it' }, { table: 'it' }]); // Dummy Data
                adminLog('Attempted to render dummy data (1 Free Talk, 2 IT).');
            }
        });
    }

    // Date Logic
    const dateInput = document.getElementById('adminDate');
    if (dateInput) {
        const nextThursday = getNextThursday();
        dateInput.value = nextThursday;

        adminLog(`Default date set to ${nextThursday}`);

        dateInput.addEventListener('change', () => fetchAdminData(dateInput.value));

        const refreshBtn = document.getElementById('refreshAdminBtn');
        if (refreshBtn) refreshBtn.addEventListener('click', () => fetchAdminData(dateInput.value));

        // Initial Fetch
        fetchAdminData(nextThursday);
        // Trend Chart Logic
        const loadTrendBtn = document.getElementById('loadTrendBtn');
        if (loadTrendBtn) {
            // Set default range (last 12 weeks to today + 4 weeks)
            const today = new Date();
            const start = new Date(today);
            start.setDate(today.getDate() - (12 * 7));

            const end = new Date(today);
            end.setDate(today.getDate() + (4 * 7));

            document.getElementById('trendStart').valueAsDate = start;
            document.getElementById('trendEnd').valueAsDate = end;

            loadTrendBtn.addEventListener('click', () => {
                const s = document.getElementById('trendStart').value;
                const e = document.getElementById('trendEnd').value;
                if (s && e) fetchTrendRange(s, e);
            });

        }
    }
}

async function fetchTrendRange(startDate, endDate) {
    adminLog(`Fetching trend data from ${startDate} to ${endDate}...`);

    // 1. Get all Thursdays
    const dates = getThursdaysInRange(startDate, endDate);
    if (dates.length === 0) {
        adminLog('No Thursdays found in this range.');
        return;
    }
    adminLog(`Found ${dates.length} Thursdays. Fetching data...`);

    // 2. Fetch all in parallel
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbwnfxdaWlJ7gD0PEX7JNzn7OMvV6H9AVqQBEIe6BsudItekBVN6BBlt0LtjeKusg9VL/exec';

    try {
        const promises = dates.map(date =>
            fetch(`${scriptUrl}?type=latest&date=${date}`)
                .then(res => res.json())
                .then(data => ({ date: date, count: data.registrants ? data.registrants.length : 0 }))
                .catch(err => ({ date: date, count: 0, error: err }))
        );

        const results = await Promise.all(promises);

        // Filter out errors or handle them? For now just show what we got.
        const validResults = results.sort((a, b) => new Date(a.date) - new Date(b.date));

        adminLog(`Trend data loaded. Points: ${validResults.length}`);
        updateTrendChart(validResults);

    } catch (e) {
        console.error(e);
        adminLog(`Error fetching trend range: ${e.message}`);
    }
}

function getThursdaysInRange(startStr, endStr) {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const dates = [];

    // Advance start to next Thursday if not already
    // Day 4 is Thursday
    let day = start.getDay();
    let diff = (4 - day + 7) % 7;
    // If start is Thursday, diff is 0, so we include it.
    // If start is after Thursday (e.g. Fri), diff is 6, we assume next week? 
    // Usually "range" is inclusive.
    start.setDate(start.getDate() + (diff === 0 ? 0 : diff));

    while (start <= end) {
        dates.push(start.toISOString().split('T')[0]);
        start.setDate(start.getDate() + 7);
    }
    return dates;
}

function getNextThursday() {
    const today = new Date();
    const date = new Date(today.getTime());
    date.setHours(0, 0, 0, 0);

    let daysUntilThursday = (4 + 7 - date.getDay()) % 7;

    if (daysUntilThursday !== 0) {
        date.setDate(date.getDate() + daysUntilThursday);
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function fetchAdminData(selectedDate) {
    adminLog(`Fetching data for ${selectedDate}...`);

    const scriptUrl = 'https://script.google.com/macros/s/AKfycbwnfxdaWlJ7gD0PEX7JNzn7OMvV6H9AVqQBEIe6BsudItekBVN6BBlt0LtjeKusg9VL/exec';

    fetch(`${scriptUrl}?type=latest&date=${selectedDate}`)
        .then(res => res.json())
        .then(data => {
            adminLog(`Data received. Count: ${data.registrants ? data.registrants.length : 0}`);

            if (typeof Chart === 'undefined') {
                adminLog('CRITICAL: Chart.js library not loaded!');
                return;
            }

            // Future-Proofing: Process Data with Filters (currently just passing through)
            // In the future, we can pass { venue: '...' } as a second arg
            const processedData = processData(data.registrants || [], {});

            updateBarChart(processedData);
            updateNewVsReturningChart(processedData);
            updateLanguageChart(processedData);
        })
        .catch(err => {
            console.error('Admin Fetch Error', err);
            adminLog(`Fetch Error: ${err.message}`);
        });
}

// Future-Proofing: Centralized Data Processing
function processData(registrants, filters) {
    // If we add venue later, we can filter here:
    // if (filters.venue) {
    //    return registrants.filter(r => r.venue === filters.venue);
    // }
    return registrants;
}

let barChartInstance = null;
let newReturningChartInstance = null;
let languageChartInstance = null;

function updateBarChart(registrants) {
    // 1. Count occurrences dynamically
    const counts = {};
    registrants.forEach(r => {
        // Normalize table name if needed, or just use as is
        const t = r.table ? r.table.trim() : 'Unknown';
        counts[t] = (counts[t] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const data = Object.values(counts);

    // 2. Generate Colors
    const backgroundColors = labels.map((_, i) => getColor(i, 0.6));
    const borderColors = labels.map((_, i) => getColor(i, 1));

    // 3. Format Labels for Display (Optional: capitalization)
    const displayLabels = labels.map(l => formatTableName(l));

    const canvas = document.getElementById('tableChart');
    if (!canvas) {
        adminLog('Error: tableChart canvas not found');
        return;
    }
    const ctx = canvas.getContext('2d');

    if (barChartInstance) barChartInstance.destroy();

    try {
        barChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: displayLabels,
                datasets: [{
                    label: '# of Registrants',
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Fits container
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
        adminLog(`Bar Chart rendered with ${labels.length} groups: ${labels.join(', ')}`);

    } catch (e) {
        console.error('BarChart Error:', e);
        adminLog(`BarChart Render Error: ${e.message}`);
    }
}

function updateNewVsReturningChart(registrants) {
    const counts = { 'New': 0, 'Returning': 0 };

    registrants.forEach(r => {
        // "Yes" means First Time
        if (r.first_time === 'Yes') {
            counts['New']++;
        } else {
            counts['Returning']++;
        }
    });

    const ctx = document.getElementById('newReturningChart');
    if (!ctx) return;

    if (newReturningChartInstance) newReturningChartInstance.destroy();

    newReturningChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['New Members', 'Returning Members'],
            datasets: [{
                data: [counts['New'], counts['Returning']],
                backgroundColor: ['#2ecc71', '#3498db'], // Green, Blue
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function updateLanguageChart(registrants) {
    const counts = {};

    registrants.forEach(r => {
        let lang = r.languages || 'Unknown';
        // Simple normalization if needed
        counts[lang] = (counts[lang] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const data = Object.values(counts);
    const bgColors = labels.map((_, i) => getColor(i, 0.7));

    const ctx = document.getElementById('languageChart');
    if (!ctx) return;

    if (languageChartInstance) languageChartInstance.destroy();

    languageChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: bgColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// Helper: predefined nice palette + modulo for infinite
function getColor(index, alpha) {
    const palette = [
        [249, 115, 22],  // Orange
        [31, 41, 55],    // Dark Grey
        [255, 206, 86],  // Yellow
        [75, 192, 192],  // Teal
        [54, 162, 235],  // Blue
        [153, 102, 255], // Purple
        [255, 99, 132],  // Red
        [46, 204, 113],  // Green
    ];
    const c = palette[index % palette.length];
    return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
}

function formatTableName(raw) {
    // Simple map or fallback formatter
    const map = {
        'free-talk': 'Free Talk',
        'it': 'AI / IT',
        'japanese': 'Japanese',
        'board-game': 'Card Games'
    };
    if (map[raw]) return map[raw];

    // Fallback: simple capitalize
    return raw.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

let trendChartInstance = null;

function updateTrendChart(dataPoints) {
    const canvas = document.getElementById('trendChart');
    if (!canvas) {
        adminLog('Error: trendChart canvas not found');
        return;
    }
    const ctx = canvas.getContext('2d');

    if (trendChartInstance) trendChartInstance.destroy();

    const dates = dataPoints.map(d => d.date);
    const counts = dataPoints.map(d => d.count);

    try {
        trendChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Total Registrants',
                    data: counts,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    tension: 0.1,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Registration Trend (Weekly)'
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
        adminLog('Trend Chart rendered successfully');
    } catch (e) {
        console.error('TrendChart Error:', e);
        adminLog(`TrendChart Render Error: ${e.message}`);
    }
}
