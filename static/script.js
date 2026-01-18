// ---------------------------
// Import Important Functions
// ---------------------------
import { index_form_handler } from "./index.js";

import { make_businesses_table } from "./businesses.js";

import { review_title, review_form_handler, make_reviews_table  } from "./reviews.js";

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
            break;
        case '/reviews':
            console.log("On reviews page");
            // Call review title function
            review_title();
            // Call review form handler
            review_form_handler();
            // Call reviews table function
            make_reviews_table();
            break;
        default:
            console.log("On unknown page:", window.location.pathname);
    } 
});