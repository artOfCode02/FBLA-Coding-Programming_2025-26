// ---------------------------
// Import Important Functions
// ---------------------------
import { index_form_handler, change_geolocation_handler_index } from "./js/index.js";

import { make_businesses_table, change_geolocation_handler } from "./js/businesses.js";

import { review_title, review_form_handler, make_reviews_table, back_button_handler } from "./js/reviews.js";

import { init_map } from "./js/map.js";

// Ensure document is ready before processing
document.addEventListener('DOMContentLoaded', function () {
    console.log("DOM READY");

    switch (window.location.pathname) {
        case '/':
            console.log("On index page");
            // Call index form handler
            index_form_handler();
            // Call index change geolocation handler (dialog on index page)
            change_geolocation_handler_index();
            break;
        case '/businesses':
            console.log("On businesses page");
            // Call businesses table handler
            make_businesses_table();
            // Call change username handler
            change_username_handler();
            // Call change geolocation handler
            change_geolocation_handler();
            // Call map initialization
            init_map();
            break;
        case '/reviews':
            console.log("On reviews page");
            // Call change reviews username handler
            change_username_handler();
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

                localStorage.setItem('username', newUsername);

                location.reload();
                
                alert(`Username changed to: ${newUsername}`);
            } else {
                alert("Username cannot be empty.");
            }
        });
    } else {
        console.log("Change username form NOT found on this page");
    }
}