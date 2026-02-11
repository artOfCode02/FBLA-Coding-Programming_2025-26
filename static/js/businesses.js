import { getPlaces } from './location.js';

// GLOBAL VARIABLES
const username = localStorage.getItem("username") || "Anonymous";

// -------------------------
// Bookmark Management
// -------------------------
async function bookmark_check(button, businessID) {
    const response = await fetch(`/is-bookmarked?username=${encodeURIComponent(username)}&businessID=${encodeURIComponent(businessID)}`);
    const data = await response.json();
    const isBookmarked = data.bookmarked;
    console.log("Bookmark status for businessID", businessID, "is", isBookmarked);

    // Edit bookmark button based on bookmark status
    if(button) {
        if(isBookmarked) {
            button.textContent = "Remove bookmark";
        } else {
            button.textContent = "Bookmark";
        }
    }
}

// Fetch review count for a business
async function fetch_review_count(biz) {
    try {
        const response = await fetch(`/review-count?businessID=${encodeURIComponent(biz.id)}`);
        if (!response.ok) {
            console.warn(`Failed to fetch review count for businessID ${biz.name}: ${response.status}`);
            return 0;
        }
        const data = await response.json();
        return data.count || 0;

    } catch (err) {
        console.error(`Error fetching review count for businessID ${biz.name}:`, err);
        return 0;
    }
}

async function fetch_avg_star_rating(biz) {
    try {
        const response = await fetch(`/average-stars?businessID=${encodeURIComponent(biz.id)}`);
        if (!response.ok) {
            console.warn(`Failed to fetch average rating for businessID ${biz.name}: ${response.status}`);
            return null;
        }
        const data = await response.json();
        console.log("Average star rating for businessID", biz.name, "is", data.average_stars);
        return data.average_stars;
    } catch (err) {
        console.error(`Error fetching average rating for businessID ${biz.name}:`, err);
        return null;
    }
}

// -------------------------
// Sorting / Filter Logic
// -------------------------
function haversineDistance(lat1, lon1, lat2, lon2) {
    function toRad(x) { return x * Math.PI / 180; }
    const R = 6371; // km

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

export function sort_business_rows(method) {
    const table = document.getElementById('businesses_table');
    if (!table) return;
    const tbody = table.querySelector('tbody') || table;
    const rows = Array.from(tbody.querySelectorAll('tr.business_card'));

    // Parse user's selected location if available
    let userLoc = null;
    try {
        const raw = localStorage.getItem('selectedLocation');
        if (raw) {
            const parsed = JSON.parse(raw);
            userLoc = parsed && (parsed.lat !== undefined ? { lat: parsed.lat, lng: parsed.lng || parsed.lon } : (Array.isArray(parsed) ? { lat: parsed[0], lng: parsed[1] } : null));
        }
    } catch (e) { userLoc = null; }

    const compareAlpha = (a,b) => {
        const na = (a.dataset.bizNameRaw || '').toLowerCase();
        const nb = (b.dataset.bizNameRaw || '').toLowerCase();
        return na.localeCompare(nb);
    };

    const comp = (a,b) => {
        if (method === 'bookmarked') {
            const ab = a.dataset.bookmarked === 'true';
            const bb = b.dataset.bookmarked === 'true';
            if (ab !== bb) return ab ? -1 : 1;
            return compareAlpha(a,b); // tiebreaker
        }
        if (method === 'alpha') return compareAlpha(a,b);
        if (method === 'distance') {
            if (!userLoc) return compareAlpha(a,b);
            const aLat = parseFloat(a.dataset.lat); const aLng = parseFloat(a.dataset.lng);
            const bLat = parseFloat(b.dataset.lat); const bLng = parseFloat(b.dataset.lng);
            const aDist = (isFinite(aLat) && isFinite(aLng)) ? haversineDistance(userLoc.lat, userLoc.lng, aLat, aLng) : Infinity;
            const bDist = (isFinite(bLat) && isFinite(bLng)) ? haversineDistance(userLoc.lat, userLoc.lng, bLat, bLng) : Infinity;
            return aDist - bDist; // closer first (less distance)
        }
        if (method === 'reviews') {
            const aCount = parseInt(a.dataset.reviewCount) || 0;
            const bCount = parseInt(b.dataset.reviewCount) || 0;
            return bCount - aCount; // more reviews first
        }
        if (method === 'avg_stars') {
            const aAvg = parseFloat(a.dataset.avgStars);
            const bAvg = parseFloat(b.dataset.avgStars);
            if ((isNaN(aAvg) && isNaN(bAvg)) || (aAvg === bAvg)) return compareAlpha(a,b);
            if (isNaN(aAvg)) return 1;
            if (isNaN(bAvg)) return -1;
            return bAvg - aAvg; // higher average stars first
        }

        // default relevance: leave as-is (stable sort by original order)
        return 0;
    };

    // For relevance we don't sort; other methods we sort and re-append rows
    if (method === 'relevance') return;

    const sorted = rows.slice().sort(comp);
    sorted.forEach(r => tbody.appendChild(r));
}

export function setup_business_sort() {
    const sel = document.getElementById('business_sort');
    if (!sel) return;
    sel.addEventListener('change', () => {
        sort_business_rows(sel.value);
    });
}


async function manage_bookmark_button(button, businessID, businessName) {
    // Check if business is bookmarked
    const response = await fetch(`/is-bookmarked?username=${encodeURIComponent(username)}&businessID=${encodeURIComponent(businessID)}`);
    const data = await response.json();
    const isBookmarked = data.bookmarked;
    

    // Add event listener to bookmark button if isBookmarked = false
    if(!isBookmarked && button) {
        // Send alert if username is Anonymous
        if(username === "Anonymous") {
            alert("Anonymous users may not bookmark businesses. Please provide a username.");
            return;
        }

        const confirmation = confirm(`Are you sure you want to bookmark ${businessName}?`);
        if(!confirmation) return;

        // Send bookmark request to server
        try {
            const response = await fetch('/save-bookmark', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessID, username, businessName })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                // Throw an error that includes the HTTP status code
                throw new Error(`Server returned status ${response.status}. Response body: ${errorBody}`);
            }

            const result = await response.json();
            console.log("Server response:", result);
        } catch (err) {
            console.error("Error bookmarking business:", err);
            alert("Failed to bookmark business. Check console for details.");
            return;
        }

        console.log(`Bookmarked business: ${businessName} for user: ${username}`);
        alert(`Bookmarked business: ${businessName}`);
    };

    // Add event listner to remove bookmark button if isBookmarked = true
    if(isBookmarked && button) {
        const confirmation = confirm(`Are you sure you want to remove the bookmark for ${businessName}?`);
        if(!confirmation) return;

        // Send remove bookmark request to server
        try {
            const response = await fetch('/remove-bookmark', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessID, username })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                // Throw an error that includes the HTTP status code
                throw new Error(`Server returned status ${response.status}. Response body: ${errorBody}`);
            }

            const result = await response.json();
            console.log("Server response:", result);
        } catch (err) {
            console.error("Error removing bookmark:", err);
            alert("Failed to remove bookmark. Check console for details.");
            return;
        }

        console.log(`Removed bookmark for business: ${businessName} for user: ${username}`);
        alert(`Removed bookmark for business: ${businessName}`);
    }

    location.reload();

}

// -------------------------
// Businesses Table Listener
// -------------------------
export async function make_businesses_table() {
    console.log("Running business table handler");

    const businessesTable = document.getElementById('businesses_table');
    
    if(businessesTable) {
        // If an address param was provided, ensure we fetch places for it first
        const addressParam = localStorage.getItem('selectedAddress') || '';
        if (addressParam) {
            console.log('Address param found on businesses page:', addressParam);
            // Ensure the cache is populated for this address
            await getPlaces(addressParam);
        }
        try {
            // Try sessionStorage first, then fall back to server cache
            let businesses = [];
            const stored = sessionStorage.getItem('businesses');
            if (stored) {
                try {
                    businesses = JSON.parse(stored);
                    console.log('Loaded businesses from sessionStorage:', businesses);
                } catch (e) {
                    console.warn('Failed to parse businesses from sessionStorage', e);
                    businesses = [];
                }
            }

            if (!businesses || businesses.length === 0) {
                const response = await fetch('/load-businesses-cache');
                if (response.ok) {
                    businesses = await response.json();
                    console.log('Loaded businesses from server cache:', businesses);
                } else {
                    console.warn('No businesses found in server cache');
                    businesses = [];
                }
            }

            // Clear previous rows
            const tbody = businessesTable.querySelector('tbody');
            if (tbody) tbody.innerHTML = '';

            // Render each business as a card-like row
            businesses.forEach(biz => {
                let rcount, ravg;

                // Store review count as a data attribute
                fetch_review_count(biz).then(count => {
                    newRow.dataset.reviewCount = count;
                    rcount = count;
                }).catch(err => {
                    console.warn('Failed to fetch review count for businessID', biz.id, err);
                    newRow.dataset.reviewCount = 0;
                    rcount = 0;
                });

                // Store avg star rating as a data attribute
                fetch_avg_star_rating(biz).then(avg => {
                    if (avg !== null) {
                        newRow.dataset.avgStars = avg;
                        ravg = avg.tofixed(1);
                    }
                }).catch(err => {
                    console.warn('Failed to fetch average star rating for businessID', biz.id, err);
                    ravg = 0;
                });

                const newRow = document.createElement('tr');
                newRow.classList.add('business_card');
                // mark the row with the business id for map interaction
                if (biz.id !== undefined && biz.id !== null) {
                    newRow.dataset.businessId = biz.id;
                    newRow.id = `business_${biz.id}`;
                }

                // preserve raw name/address for search highlighting
                newRow.dataset.bizNameRaw = biz.name || '';
                newRow.dataset.bizAddrRaw = `${biz.street || ''} • ${biz.city || ''}`;

                const cell = document.createElement('td');
                cell.colSpan = 5;
                cell.classList.add('business_card_cell');

                const nameEl = document.createElement('div');
                nameEl.classList.add('biz_name');
                nameEl.textContent = biz.name;

                const addrEl = document.createElement('div');
                addrEl.classList.add('biz_addr');
                addrEl.textContent = `${biz.street} • ${biz.city}`;

                const reviewsInfo = document.createElement('div');
                reviewsInfo.classList.add('biz_review_info');
                reviewsInfo.textContent = `Number of reviews: ${rcount} ★ Average ratings: ${ravg}`

                const controlsEl = document.createElement('div');
                controlsEl.classList.add('biz_controls');

                const bookmarkButton = document.createElement('button');
                bookmark_check(bookmarkButton, biz.id);
                bookmarkButton.addEventListener('click', () => {
                    bookmark_check(bookmarkButton, biz.id);
                    manage_bookmark_button(bookmarkButton, biz.id, biz.name);
                });

                const reviewButton = document.createElement('button');
                reviewButton.textContent = 'Open reviews...';
                reviewButton.addEventListener('click', () => {
                    const username_encoded = encodeURIComponent(username);
                    const businessID = biz.id;
                    const businessName = encodeURIComponent(biz.name);
                    window.location.href = `/reviews?username=${username_encoded}&businessID=${businessID}&businessName=${businessName}`;
                });

                controlsEl.appendChild(bookmarkButton);
                controlsEl.appendChild(reviewButton);

                cell.appendChild(nameEl);
                cell.appendChild(addrEl);
                cell.appendChild(reviewsInfo);
                cell.appendChild(controlsEl);


                // highlight marker when hovering list item (vice versa)
                newRow.addEventListener('mouseenter', () => {
                    try {
                        const marker = window.businessMarkers && window.businessMarkers[biz.id];
                        // If marker exists and map is available, pan/center map to it when outside bounds
                        if (marker && window.businessMap) {
                            try {
                                const latlng = marker.getLatLng && marker.getLatLng();
                                const bounds = window.businessMap.getBounds && window.businessMap.getBounds();
                                if (latlng && bounds && !bounds.contains(latlng)) {
                                    try { window.businessMap.flyTo(latlng, window.businessMap.getZoom(), { duration: 0.6 }); } catch (e) { window.businessMap.panTo(latlng); }
                                }
                            } catch (e) {
                                console.warn('Error while ensuring marker is in view', e);
                            }
                            try { marker.openTooltip(); } catch (e) {}
                        } else if (marker) {
                            try { marker.openTooltip(); } catch (e) {}
                        }

                        newRow.classList.add('list-highlight');
                    } catch (e) { console.warn('Error highlighting marker from list hover', e); }
                });
                newRow.addEventListener('mouseleave', () => {
                    try {
                        const marker = window.businessMarkers && window.businessMarkers[biz.id];
                        if (marker) {
                            try { marker.closeTooltip(); } catch (e) {}
                        }
                        newRow.classList.remove('list-highlight');
                    } catch (e) { console.warn('Error removing marker highlight from list leave', e); }
                });

                newRow.appendChild(cell);
                tbody.appendChild(newRow);
                });

                // After rendering rows, fetch bookmark flags and lat/lng for sorting purposes
                try {
                    const bookmarkPromises = businesses.map(async (biz) => {
                        if (!biz || biz.id === undefined || biz.id === null) return;
                        try {
                            const resp = await fetch(`/is-bookmarked?username=${encodeURIComponent(username)}&businessID=${encodeURIComponent(biz.id)}`);
                            if (!resp.ok) return;
                            const data = await resp.json();
                            const row = document.getElementById(`business_${biz.id}`);
                            if (row) row.dataset.bookmarked = data.bookmarked ? 'true' : 'false';

                            // store lat/lng if provided in the business object
                            const lat = biz.lat || biz.latitude || biz.lat;
                            const lng = biz.lon || biz.longitude || biz.lng || biz.lon;
                            if (row && lat !== undefined && lng !== undefined) {
                                row.dataset.lat = lat;
                                row.dataset.lng = lng;
                            } else {
                                // fallback to marker position if available
                                const marker = window.businessMarkers && window.businessMarkers[biz.id];
                                if (marker && marker.getLatLng) {
                                    const ll = marker.getLatLng();
                                    if (row) { row.dataset.lat = ll.lat; row.dataset.lng = ll.lng; }
                                }
                            }
                        } catch (e) { /* ignore per-row fetch errors */ }
                    });

                    await Promise.all(bookmarkPromises);

                    // Apply current sort choice if any
                    try { const sel = document.getElementById('business_sort'); if (sel) sort_business_rows(sel.value); } catch (e) {}
                } catch (e) { console.warn('Error populating bookmark/distance metadata', e); }
        } catch (err) {
            console.error('Error fetching businesses:', err);
            alert('Failed to load businesses. Check console for details.');
        }
    } else {
        console.log("Businesses table NOT found on this page");
    }  
}

// -------------------------
// Change Geolocation
// -------------------------
export function change_geolocation_handler() {
    const changeLocationButton = document.getElementById('change_current_location');
    const changeLocationDialog = document.getElementById('geolocation_dialog');

    if (changeLocationButton && changeLocationDialog) {
        changeLocationButton.addEventListener('click', () => {
            changeLocationDialog.showModal();
        });

        const geolocationForm = document.getElementById('geolocation_form');
        const geolocationCancel = document.getElementById('geolocation_cancel');

        if (geolocationForm && geolocationCancel) {
            geolocationForm.addEventListener('submit', async (event) => {
                event.preventDefault();

                let newLocation = document.getElementById('change_geolocation_street_address').value.trim();
                newLocation += ", " + document.getElementById('change_geolocation_city').value.trim();
                newLocation += ", " + document.getElementById('change_geolocation_state').value;

                if (newLocation) {
                    try {
                        console.log('Changing location to:', newLocation);
                        // Populate cache for new address
                        await getPlaces(newLocation);

                        // Set new address to localStorage, then relaod
                        localStorage.setItem('selectedAddress', newLocation);
                        location.reload();
                    } catch (err) {
                        console.error('Failed to change location:', err);
                        alert('Failed to change location. See console for details.');
                    }
                } else {
                    alert('Location cannot be empty.');
                }
            });

            geolocationCancel.addEventListener('click', () => {
                changeLocationDialog.close();
            });
        } else {
            console.log('Geolocation form or cancel button NOT found on this page');
        }
    } else {
        console.log('Change location button or dialog NOT found on this page');
    }
}

// -------------------------
// Search / Highlight Logic
// -------------------------
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function clearHighlightsInElement(el, text) {
    if (!el) return;
    el.textContent = text;
}

function highlightText(el, text, query) {
    if (!query) { clearHighlightsInElement(el, text); return false; }
    const re = new RegExp(escapeRegExp(query), 'gi');
    if (!re.test(text)) { clearHighlightsInElement(el, text); return false; }
    const replaced = text.replace(re, (m) => `<span class="search-match">${m}</span>`);
    el.innerHTML = replaced;
    return true;
}

function scoreMatch(text, query) {
    if (!query) return Infinity;
    const t = (text || '').toLowerCase();
    const q = query.toLowerCase();
    const idx = t.indexOf(q);
    if (idx === -1) return Infinity;
    if (idx === 0) return -1; // startsWith is best
    return idx;
}

export function setup_business_search() {
    // Prevent double-initialization if the setup was already run
    if (window._business_search_setup_done) return;

    // Grab the search input element; if it's not present the page doesn't support searching
    const input = document.getElementById('business_search');
    if (!input) return;
    window._business_search_setup_done = true;

    // Listen for input events and run the search/highlight routine on each change
    input.addEventListener('input', () => {
        // Normalize query (trim whitespace)
        const q = (input.value || '').trim();

        // Locate the table and all business rows; bail out early if not available
        const table = document.getElementById('businesses_table');
        if (!table) return;
        const rows = Array.from(table.querySelectorAll('tr.business_card'));

        // Track the best (closest) matching row and its score
        let bestRow = null;
        let bestScore = Infinity;

        // Iterate rows to apply highlighting and compute a simple proximity score
        rows.forEach(row => {
            const nameEl = row.querySelector('.biz_name');
            const addrEl = row.querySelector('.biz_addr');

            // Use stored raw text (dataset) when available to avoid stacking highlights
            const rawName = row.dataset.bizNameRaw || (nameEl && nameEl.textContent) || '';
            const rawAddr = row.dataset.bizAddrRaw || (addrEl && addrEl.textContent) || '';

            // Highlight matched substrings in-place for both name and address
            const nameMatched = highlightText(nameEl, rawName, q);
            const addrMatched = highlightText(addrEl, rawAddr, q);

            // Score how well this row matches the query (lower is better)
            const nameScore = scoreMatch(rawName, q);
            const addrScore = scoreMatch(rawAddr, q);
            const rowScore = Math.min(nameScore, addrScore);

            // Ensure previous closest-match state is cleared before selecting a new one
            row.classList.remove('closest-match');

            // Keep track of the row with the best (lowest) score
            if (rowScore < bestScore) {
                bestScore = rowScore;
                bestRow = row;
            }
        });

        // If we found a best match and there is an actual query, mark it and bring it into view
        if (bestRow && bestScore !== Infinity && q.length > 0) {
            bestRow.classList.add('closest-match');
            try {
                const container = document.getElementById('businesses_list');
                const rect = bestRow.getBoundingClientRect();
                const contRect = container.getBoundingClientRect();
                if (rect.top < contRect.top || rect.bottom > contRect.bottom) {
                    // Smooth-scroll the best match into the center of the scrollable list
                    bestRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } catch (e) {
                // If scrolling fails for any reason, silently ignore
            }
        }

        // If query is empty, restore original un-highlighted text and remove all closest markers
        if (!q) {
            rows.forEach(row => {
                const nameEl = row.querySelector('.biz_name');
                const addrEl = row.querySelector('.biz_addr');
                if (nameEl && row.dataset.bizNameRaw) nameEl.textContent = row.dataset.bizNameRaw;
                if (addrEl && row.dataset.bizAddrRaw) addrEl.textContent = row.dataset.bizAddrRaw;
                row.classList.remove('closest-match');
            });
        }
    });
}
