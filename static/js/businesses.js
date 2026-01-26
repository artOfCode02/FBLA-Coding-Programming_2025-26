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
        try {
            const response = await fetch('/load-businesses-cache')
            const businesses = await response.json();
            console.log("Businesses fetched:", businesses);

            // Clear previous rows
            const tbody = businessesTable.querySelector("tbody");
            if(tbody) tbody.innerHTML = "";

            businesses.forEach(biz => {
                // Create a new row
                const newRow = document.createElement('tr');

                // First column, business name
                const colName = document.createElement('td');
                colName.textContent = biz.name;
                newRow.appendChild(colName);

                // Second column, street address
                const colStreet = document.createElement('td');
                colStreet.textContent = biz.street;
                newRow.appendChild(colStreet);

                // Third column, city
                const colCity = document.createElement('td');
                colCity.textContent = biz.city;
                newRow.appendChild(colCity);

                // Fourth column, bookmark business
                const colBookmarkButton = document.createElement('td');
                const bookmarkButton = document.createElement('button');
                bookmark_check(bookmarkButton, biz.id);

                bookmarkButton.addEventListener('click', () => {  
                    bookmark_check(bookmarkButton, biz.id);                      
                    manage_bookmark_button(bookmarkButton, biz.id, biz.name);
                });

                colBookmarkButton.appendChild(bookmarkButton);
                newRow.appendChild(colBookmarkButton);

                // Fifth column, open reviews button
                const colReviewButton = document.createElement('td');
                const reviewButton = document.createElement('button');
                reviewButton.textContent = "Open reviews...";

                reviewButton.addEventListener('click', () => {
                    const username_encoded = encodeURIComponent(username);
                    const businessID = biz.id;
                    const businessName = encodeURIComponent(biz.name);

                    console.log("Navigating to reviews page for business:", biz.name);
                    window.location.href = `/reviews?username=${username_encoded}&businessID=${businessID}&businessName=${businessName}`;
                });

                colReviewButton.appendChild(reviewButton);
                newRow.appendChild(colReviewButton);


                // Append the new row to the table body
                tbody.appendChild(newRow);
            });
        } catch (err) {
            console.error("Error fetching businesses:", err);
            alert("Failed to load businesses. Check console for details.");
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
    const changeLocationBgOverlay = document.getElementById('geolocation_dialog_container');

    if(changeLocationButton && changeLocationDialog) {
        changeLocationButton.addEventListener('click', () => {
            changeLocationDialog.showModal();

        });

        const geolocationForm = document.getElementById('geolocation_form');
        const geolocationCancel = document.getElementById('geolocation_cancel');

        if(geolocationForm && geolocationCancel) {
            geolocationForm.addEventListener('submit', (event) => {
                event.preventDefault();

                const newLocation = document.getElementById('geolocation_input').value.trim();
                if(newLocation) {
                    console.log("Changing location to:", newLocation);
                    const urlParams = new URLSearchParams(window.location.search);
                    urlParams.set('location', newLocation);
                    window.location.search = urlParams.toString();

                    alert(`Location changed to: ${newLocation}`);
                } else {
                    alert("Location cannot be empty.");
                }
            });

            geolocationCancel.addEventListener('click', () => {
                changeLocationDialog.close();
            });
        } else {
            console.log("Geolocation form or cancel button NOT found on this page");
        }
    } else {
        console.log("Change location button or dialog NOT found on this page");
    }
}