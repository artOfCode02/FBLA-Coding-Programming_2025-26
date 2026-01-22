// ---------------------------
// Import Important Functions
// ---------------------------
import { index_form_handler } from "./js/index.js";

import { make_businesses_table, change_username_handler } from "./js/businesses.js";

import { review_title, review_form_handler, make_reviews_table, back_button_handler } from "./js/reviews.js";

// Ensure document is ready before processing
document.addEventListener('DOMContentLoaded', function () {
    console.log("DOM READY");

    switch (window.location.pathname) {
        case '/':
            console.log("On index page");
            // Call index form handler
            index_form_handler();
            break;
        case '/businesses':
            console.log("On businesses page");
            // Call businesses table handler
            make_businesses_table();
            // Call change username handler
            change_username_handler();
            break;
        case '/reviews':
            console.log("On reviews page");
            // Call review title function
            review_title();
            // Call review form handler
            review_form_handler();
            // Call reviews table function
            make_reviews_table();
            // Call back button handler
            back_button_handler();
            break;
        default:
            console.log("On unknown page:", window.location.pathname);
    } 
});

// Open DevTools when f12 is pressed for debugging
document.addEventListener('keydown', (event) => {
    if (event.key === 'F12') {
        console.log("Opening DevTools via F12 key");
        // Open the browser's developer tools console
        // Note: This may not work in all browsers due to security restrictions
        fetch('/open-dev-tools')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log("DevTools opened successfully.");
                } else {
                    console.error("Failed to open DevTools:", data.message);
                }
            })
            .catch(err => {
                console.error("Error while trying to open DevTools:", err);
            });
    }
});