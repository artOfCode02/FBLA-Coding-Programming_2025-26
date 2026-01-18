import { getPlaces } from "./location.js"; 
 

// -------------------------
// Businesses Table Listener
// -------------------------
export function make_businesses_table() {
    console.log("Running business table handler");

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
}