import { getPlaces } from './location.js';

// GLOBAL VARIABLES
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get("username") || "Anonymous";

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
        const urlParamsLocal = new URLSearchParams(window.location.search);
        const addressParam = urlParamsLocal.get('address') || '';
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
                const newRow = document.createElement('tr');
                newRow.classList.add('business-card');

                const cell = document.createElement('td');
                cell.colSpan = 5;
                cell.classList.add('business-card-cell');

                const nameEl = document.createElement('div');
                nameEl.classList.add('biz-name');
                nameEl.textContent = biz.name;

                const addrEl = document.createElement('div');
                addrEl.classList.add('biz-addr');
                addrEl.textContent = `${biz.street} • ${biz.city}`;

                const controlsEl = document.createElement('div');
                controlsEl.classList.add('biz-controls');

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
                cell.appendChild(controlsEl);

                newRow.appendChild(cell);
                tbody.appendChild(newRow);
            });
        } catch (err) {
            console.error('Error fetching businesses:', err);
            alert('Failed to load businesses. Check console for details.');
        }
    } else {
        console.log("Businesses table NOT found on this page");
    }  
}

// -------------------------
// Change Username Handler
// -------------------------
export function change_username_handler() {
    const changeUsernameForm = document.getElementById('change_username_form');

    if(changeUsernameForm) {
        changeUsernameForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const confirmation = confirm("Are you sure you want to change your username? This will reload the page.");
            if(!confirmation) return;

            const newUsername = document.getElementById('change_username_input').value.trim();
            if(newUsername) {
                // Update URL with new username param
                console.log("Changing username to:", newUsername);
                const urlParams = new URLSearchParams(window.location.search);
                urlParams.set('username', newUsername);
                window.location.search = urlParams.toString();

                alert(`Username changed to: ${newUsername}`);
            } else {
                alert("Username cannot be empty.");
            }
        });
    } else {
        console.log("Change username form NOT found on this page");
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

                        // Update URL with new address param while preserving username
                        const params = new URLSearchParams(window.location.search);
                        params.set('address', newLocation);
                        window.location.search = params.toString();
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