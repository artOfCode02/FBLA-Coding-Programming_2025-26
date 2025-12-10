/* SUBMIT INIT FORM */
document.addEventListener('DOMContentLoaded', function () {
    console.log("DOM READY");

    // -------------------------
    // Init Page Form Listener
    // -------------------------
    const initForm = document.getElementById('userDetails');
    if(initForm) {
        console.log("Init form exists, attaching listener");

        // Submit init form @ index.html
        initForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            console.log("Init form submitted");

            // Get captcha response
            const captcha = grecaptcha.getResponse();
            if(!captcha) {
                event.preventDefault();
                alert("Please complete the CAPTCHA");
                return;
            }

            const formData = new FormData(initForm);
            formData.append("g-recaptcha-response", captcha);
            const res = await fetch("/initCaptcha", {
                method: "POST",
                body: formData
            });

            const data = await res.json();
            console.log(data);


            let username = document.getElementById('username')?.value || "Anonymous";
            let business_category = document.getElementById('business_category')?.value || "General";

            console.log("Username:", username, "Category:", business_category);

            // Navigate to businesses page with URL params
            window.location.href = `/businesses?username=${encodeURIComponent(username)}&category=${encodeURIComponent(business_category)}`;
        });
    } else {
        console.log("Init form NOT found on this page");
    }

    // -------------------------
    // Businesses Table Listener
    // -------------------------
    const loadBusinessesButton = document.getElementById('loadBusinesses');
    const businessesTable = document.getElementById('businesses_table');
    if(loadBusinessesButton && businessesTable) {
        console.log("Businesses table and load button exist, attaching listener");

        // Load businesses @ businesses.html
        loadBusinessesButton.addEventListener('click', async function () {
            console.log("Load Businesses button clicked");

            try {
                const businesses = await getPlaces();
                console.log("Businesses fetched:", businesses);

                // Clear previous rows
                const tbody = businessesTable.querySelector("tbody");
                if(tbody) tbody.innerHTML = "";

                businesses.forEach(biz => {
                    const newRow = document.createElement('tr');

                    const colName = document.createElement('td');
                    colName.textContent = biz.name;
                    newRow.appendChild(colName);

                    const colStreet = document.createElement('td');
                    colStreet.textContent = biz.street;
                    newRow.appendChild(colStreet);

                    const colCity = document.createElement('td');
                    colCity.textContent = biz.city;
                    newRow.appendChild(colCity);

                    const colButton = document.createElement('td');
                    const reviewButton = document.createElement('button');
                    reviewButton.textContent = "Open reviews...";

                    reviewButton.addEventListener('click', () => {
                        const urlParams = new URLSearchParams(window.location.search);
                        const username = encodeURIComponent(urlParams.get("username") || "Anonymous");
                        const businessID = biz.id;
                        const businessName = encodeURIComponent(biz.name);
                        const businessCategory = encodeURIComponent(urlParams.get('category'));

                        console.log("Navigating to reviews page for business:", biz.name);
                        window.location.href = `/reviews?username=${username}&businessID=${businessID}&businessName=${businessName}&category=${businessCategory}`;
                    });

                    colButton.appendChild(reviewButton);
                    newRow.appendChild(colButton);

                    tbody.appendChild(newRow);
                });

            } catch (err) {
                console.error("Error fetching businesses:", err);
            }
        });
    } else {
        console.log("Businesses table or load button NOT found on this page");
    }

    // -------------------------
    // Review Form Listener
    // -------------------------
    const urlParams = new URLSearchParams(window.location.search);
    const write_username = document.getElementById('write_username');
    if(write_username) {
        write_username.innerHTML = urlParams.get('username')
    }

    // Write review @ review.html
    const reviewForm = document.getElementById('writeReview');
    if(reviewForm) {
        console.log("Review form exists, attaching listener");

        reviewForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            console.log("Review form submitted");

            const urlParams = new URLSearchParams(window.location.search);
            const username = urlParams.get('username') || "Anonymous";
            const businessID = urlParams.get('businessID');

            const stars = document.querySelector('input[name="rating"]:checked').value;
            const review = document.getElementById('user_review').value;


            console.log("Review form values:", { username, businessID, stars, review });

            if (!stars || !review) {
                alert("Invalid input, try again.");
                console.warn("Stars or review missing");
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
                "        <th>Username</th>\n" +
                "        <th>Stars</th>\n" +
                "        <th>Review</th>\n" +
                "    </tr>"

            for(const username in data) {
                const userReviews = data[username];

                userReviews.forEach(r => {
                    const newRow = document.createElement("tr");

                    const colUser = document.createElement("td");
                    colUser.textContent = username;
                    newRow.appendChild(colUser);

                    const colStars = document.createElement("td");
                    colStars.textContent = r[0];
                    newRow.appendChild(colStars);

                    const colReview = document.createElement("td");
                    colReview.textContent = r[1];
                    newRow.appendChild(colReview);

                    reviewsTable.appendChild(newRow);
                });

            }
        });
    }

    // Back button @ review.html
    const backButton = document.getElementById('redirect_back');
    if(backButton) {
        backButton.addEventListener('click', function () {
            const urlParams = new URLSearchParams(window.location.search);
            const username = encodeURIComponent(urlParams.get('username'));
            const category = encodeURIComponent(urlParams.get('category'));

            window.location.href = `/businesses?username=${username}&category=${category}`;
        });
    }
});



async function getLocationFromIP() {
    try {
        const response = await fetch('https://ipinfo.io/json');
        const data = await response.json();
        console.log(data); // Full info: city, region, country, loc, etc.

        // 'loc' gives latitude and longitude as a string: "lat,lon"
        const [lat, lon] = data.loc.split(',');
        console.log("Latitude:", lat, "Longitude:", lon);
        return { lat: parseFloat(lat), lon: parseFloat(lon) };
    } catch (err) {
        console.error("Could not get location from IP:", err);
        return null;
    }
}

// Geoapify api key
const API_KEY = "fdcb2789a931407f84d539feaf6621fb";

// Get places from Geoapify
async function getPlaces() {
    const {lat, lon} = await getLocationFromIP()
    console.log(lat, lon);

    const urlParams = new URLSearchParams(window.location.search);
    const business_category = urlParams.get("category");

    const url = `https://api.geoapify.com/v2/places?lat=${lat}&lon=${lon}&categories=${business_category}&limit=50&apiKey=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        return data.features.map(places => {
            const props = places.properties;

            let city = props.city || "";
            let state = props.state || "";

            let region = city + ", " + state;

            let business = {
                id: props.place_id || "",
                name: props.name || "",
                street: props.street || "",
                city: region
            };
            console.log(business);

            return business;
        })
    } catch (err) {
        console.error("Error: ", err)
    }
}


