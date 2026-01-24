// CONSTANTS
// URL parameters
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');
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

        // Construct header row
        reviewsTable.innerHTML = "<tr>\n" +
            "                     <th>Username</th>\n" +
            "                     <th>Stars</th>\n" +
            "                     <th>Review</th>\n" +
            "                     </tr>"

        // Populate table with reviews
        for(const row_username in data) {
            // Get reviews for this user
            const userReviews = data[row_username];

            // Add each review row based on review data for this user
            userReviews.forEach(r => {
                // r[0] = stars, r[1] = review text

                // New row
                const newRow = document.createElement("tr");

                // Column 1, username
                const colUser = document.createElement("td");
                colUser.textContent = row_username;
                newRow.appendChild(colUser);

                // Column 2, stars
                const colStars = document.createElement("td");
                const stars = r[0];
                switch (stars) {
                    case "1":
                        colStars.textContent = "★ ☆ ☆ ☆ ☆";
                        break;
                    case "2":
                        colStars.textContent = "★ ★ ☆ ☆ ☆";
                        break;
                    case "3":
                        colStars.textContent = "★ ★ ★ ☆ ☆";
                        break;
                    case "4":
                        colStars.textContent = "★ ★ ★ ★ ☆";
                        break;
                    case "5":
                        colStars.textContent = "★ ★ ★ ★ ★";
                        break;
                }
                newRow.appendChild(colStars);

                // Column 3, review text
                const colReview = document.createElement("td");
                colReview.textContent = r[1];
                newRow.appendChild(colReview);

                // Column 3, delete review if it's yours
                const colDelete = document.createElement("td");
                if(row_username === username) {
                    const deleteButton = document.createElement("button");
                    deleteButton.textContent = "Delete Review";
                    deleteButton.addEventListener('click', async () => {
                        const confirmation = confirm("Are you sure you want to delete your review(s)?");
                        if(!confirmation) return;

                        try {
                            const response = await fetch('/delete-review', {
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

                            location.reload();
                        } catch (err) {
                            console.error("Error deleting review:", err);
                            alert("Failed to delete review. Check console for details.");
                        }

                    });

                    colDelete.appendChild(deleteButton);
                    newRow.appendChild(colDelete);
                }

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