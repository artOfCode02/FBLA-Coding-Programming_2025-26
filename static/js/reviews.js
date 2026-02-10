// CONSTANTS
// URL parameters
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username') || "Anonymous";
const businessID = urlParams.get('businessID');
const businessName = urlParams.get('businessName');


// write a line in format "<h1>Writing review as {username} for {businessName}</h1>" where {username} is the username from the URL params
export function review_title() {
    console.log("Running review title function");

    const write_username = document.getElementById('write_username');
    if(write_username) {
        write_username.innerHTML = username
    }

    const write_business_name = document.getElementById('write_business_name');
    if(write_business_name) {
        write_business_name.innerHTML = businessName
    }
}

// Write a review and submit it to reviews.json
export function review_form_handler() {
    console.log("Running review form handler");

    const reviewForm = document.getElementById('writeReview');
    if(reviewForm) {
        console.log("Review form exists, attaching listener");

        reviewForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            console.log("Review form submitted");

            const stars = document.querySelector('input[name="rating"]:checked').value;
            const review = document.getElementById('user_review').value;

            console.log("Review form values:", { username, businessID, stars, review });

            if (!stars || !review) {
                alert("Invalid input, try again.");
                console.warn("Stars or review missing");
                return;
            }

            if (username === "Anonymous") {
                alert("You must set a username to submit a review.");
                console.warn("Attempt to submit review with anonymous username");
                return;
            }

            const confirmation = confirm("Submit Review?");
            if (!confirmation) return;

            try {
                const response = await fetch('/save-review', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ businessID, username, stars, review })
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    // Throw an error that includes the HTTP status code
                    throw new Error(`Server returned status ${response.status}. Response body: ${errorBody}`);
                }

                const result = await response.json();
                console.log("Server response:", result);

                location.reload();
            } catch (err) {
                console.error("Error sending review to server:", err);
                alert("Failed to save review. Check console for details.");
            }
        });
    } else {
        console.log("Review form NOT found on this page");
    }
}


// Create the table of reviews
export async function make_reviews_table() {
    // Load reviews @ reviews.html
    console.log("Running make reviews table function");
    const reviewsTable = document.getElementById('reviews_table');

    if(reviewsTable) {
        console.log("Adding listener for reviews_table.")

        // Get reviews data from server
        const response = await fetch(`/all-reviews?businessID=${businessID}`);
        const data = await response.json();

        // Clear existing content and render review cards
        reviewsTable.innerHTML = '';

        // If there are no reviews at all, show a greyed-out message
        let hasAny = false;
        for (const k in data) {
            if (Array.isArray(data[k]) && data[k].length > 0) { hasAny = true; break; }
        }
        if (!hasAny) {
            const newRow = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 3;
            cell.classList.add('no_reviews');
            cell.textContent = 'No Reviews Present';
            newRow.appendChild(cell);
            reviewsTable.appendChild(newRow);
            return;
        }

        for (const row_username in data) {
            const userReviews = data[row_username];

            userReviews.forEach(r => {
                const stars = r[0];
                const text = r[1];

                // Create row and single cell containing a review card
                const newRow = document.createElement('tr');
                newRow.classList.add('review_card');

                const cell = document.createElement('td');
                cell.colSpan = 3;
                cell.classList.add('review_card_cell');

                // Author (bold) at top
                const authorEl = document.createElement('div');
                authorEl.classList.add('review_author');
                authorEl.textContent = row_username;

                // Stars
                const starsEl = document.createElement('div');
                starsEl.classList.add('review_stars');
                switch (stars) {
                    case '1': starsEl.textContent = '★ ☆ ☆ ☆ ☆'; break;
                    case '2': starsEl.textContent = '★ ★ ☆ ☆ ☆'; break;
                    case '3': starsEl.textContent = '★ ★ ★ ☆ ☆'; break;
                    case '4': starsEl.textContent = '★ ★ ★ ★ ☆'; break;
                    case '5': starsEl.textContent = '★ ★ ★ ★ ★'; break;
                    default: starsEl.textContent = '';
                }

                // Review text
                const textEl = document.createElement('div');
                textEl.classList.add('review_text');
                textEl.textContent = text;

                // Controls container (delete button placed bottom-right)
                const controlsEl = document.createElement('div');
                controlsEl.classList.add('review_controls');

                if (row_username === username) {
                    const deleteButton = document.createElement('button');
                    deleteButton.classList.add('review_delete');
                    deleteButton.textContent = 'Delete Review';
                    deleteButton.addEventListener('click', async () => {
                        const confirmation = confirm('Are you sure you want to delete your review?');
                        if (!confirmation) return;

                        try {
                            const response = await fetch('/delete-review', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ businessID, username })
                            });

                            if (!response.ok) {
                                const errorBody = await response.text();
                                throw new Error(`Server returned status ${response.status}. Response body: ${errorBody}`);
                            }

                            await response.json();
                            location.reload();
                        } catch (err) {
                            console.error('Error deleting review:', err);
                            alert('Failed to delete review. Check console for details.');
                        }
                    });

                    controlsEl.appendChild(deleteButton);
                }

                cell.appendChild(authorEl);
                cell.appendChild(starsEl);
                cell.appendChild(textEl);
                cell.appendChild(controlsEl);

                newRow.appendChild(cell);
                reviewsTable.appendChild(newRow);
            });
        }
    }
}

export function back_button_handler() {
    console.log("Running back button handler");

    // Back button @ review.html
    const backButton = document.getElementById('redirect_back');
    if(backButton) {
        backButton.addEventListener('click', function () {
            window.location.href = `/businesses?username=${username}`;
        });
    }
}