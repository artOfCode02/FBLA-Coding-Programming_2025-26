// write a line in format "<h1>Review for {username}</h1>" where {username} is the username from the URL params
export function review_title() {
    console.log("Running review title function");

    const urlParams = new URLSearchParams(window.location.search);
    const write_username = document.getElementById('write_username');
    if(write_username) {
        write_username.innerHTML = urlParams.get('username')
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

            const urlParams = new URLSearchParams(window.location.search);
            const username = urlParams.get('username');
            const businessID = urlParams.get('businessID');

            const stars = document.querySelector('input[name="rating"]:checked').value;
            const review = document.getElementById('user_review').value;


            console.log("Review form values:", { username, businessID, stars, review });

            if (!stars || !review) {
                alert("Invalid input, try again.");
                console.warn("Stars or review missing");
                return;
            }

            const confirmation = confirm("Submit Review?");
            if (!confirmation) {
                return;
            }

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
export function make_reviews_table() {
    // Load reviews @ reviews.html
    const loadReviewsButton = document.getElementById('load_reviews');
    const reviewsTable = document.getElementById('reviews_table');
    if(loadReviewsButton && reviewsTable) {
        console.log("Adding listener for reviews_table.")

        loadReviewsButton.addEventListener('click', async function () {
            const urLParams = new URLSearchParams(window.location.search);
            const businessID = urLParams.get('businessID');

            let response = await fetch(`/all-reviews?businessID=${businessID}`);
            const data = await response.json();

            reviewsTable.innerHTML = "<tr>\n" +
                "                     <th>Username</th>\n" +
                "                     <th>Stars</th>\n" +
                "                     <th>Review</th>\n" +
                "                     </tr>"

            for(const username in data) {
                const userReviews = data[username];

                userReviews.forEach(r => {
                    const newRow = document.createElement("tr");

                    const colUser = document.createElement("td");
                    colUser.textContent = username;
                    newRow.appendChild(colUser);

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

                    const colReview = document.createElement("td");
                    colReview.textContent = r[1];
                    newRow.appendChild(colReview);

                    reviewsTable.appendChild(newRow);
                });

            }
        });
    }
}

export function back_button_handler() {
    console.log("Running back button handler");

    // Back button @ review.html
    const backButton = document.getElementById('redirect_back');
    if(backButton) {
        backButton.addEventListener('click', function () {
            const urlParams = new URLSearchParams(window.location.search);
            const username = encodeURIComponent(urlParams.get('username'));

            window.location.href = `/businesses?username=${username}`;
        });
    }
}