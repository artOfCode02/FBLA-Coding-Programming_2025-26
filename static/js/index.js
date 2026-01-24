import { getPlaces } from "./location.js";


// -------------------------
// Init Page Form Listener
// -------------------------
export function index_form_handler() {
    console.log("Running index form handler");

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

            // Submit Captcha for handling
            const formData = new FormData(initForm);
            formData.append("g-recaptcha-response", captcha);
            const res = await fetch("/initCaptcha", {
                method: "POST",
                body: formData
            });

            let data;
            try {
                data = await res.json();
            } catch (err) {
                console.error('Failed to parse captcha response:', err);
                alert('Captcha verification failed (network). Please try again.');
                grecaptcha.reset();
                return;
            }

            console.log(data);

            // Ensure server-side verification passed before continuing
            if (!res.ok || !data.success) {
                alert('Captcha verification failed: ' + (data.message || 'Please try again.'));
                try { grecaptcha.reset(); } catch (e) { /* ignore */ }
                return;
            }

            const username = document.getElementById('username').value;
            const business_category = (document.getElementById('business_category') || { value: '' }).value;

            console.log("Username:", username, "Category:", business_category);

            // Cache businesses before redirecting
            await getPlaces(business_category);

            // Navigate to businesses page with URL params
            window.location.href = `/businesses?username=${encodeURIComponent(username)}&category=${encodeURIComponent(business_category)}`;
        });
    } else {
        console.log("Init form NOT found on this page");
    }
}

// Link the back button
export function make_back_button() {
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
}