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

            console.log("Username entered:", username);

            // Persist username in localStorage so other pages can read it
            try { 
                localStorage.setItem('username', username); 
            } catch (err) { 
                console.warn('Failed to save username to localStorage', err); 
            }

            // Cache businesses before redirecting
            // Use any address set via the geolocation dialog (stored in localStorage)
            const storedAddress = localStorage.getItem('selectedAddress') || '';
            await getPlaces(storedAddress);

            // Navigate to businesses page; username and address are stored in localStorage
            window.location.href = `/businesses`;
        });
    } else {
        console.log("Init form NOT found on this page");
    }
}

// -------------------------
// Index Change Geolocation
// -------------------------
export function change_geolocation_handler_index() {
    const changeLocationButton = document.getElementById('change_current_location');
    const changeLocationDialog = document.getElementById('geolocation_dialog');

    if (changeLocationButton && changeLocationDialog) {
        changeLocationButton.addEventListener('click', (e) => {
            e.preventDefault();
            changeLocationDialog.showModal();
        });

        const geolocationForm = document.getElementById('geolocation_form');
        const geolocationCancel = document.getElementById('geolocation_cancel');

        if (geolocationForm && geolocationCancel) {
            geolocationForm.addEventListener('submit', (event) => {
                event.preventDefault();

                let newLocation = document.getElementById('change_geolocation_street_address').value.trim();
                newLocation += ", " + document.getElementById('change_geolocation_city').value.trim();
                newLocation += ", " + document.getElementById('change_geolocation_state').value;

                if (newLocation) {
                    // Store chosen address so the main form can use it
                    localStorage.setItem('selectedAddress', newLocation);
                    changeLocationDialog.close();
                    alert(`Location set to: ${newLocation}`);
                } else {
                    alert("Location cannot be empty.");
                }
            });

            geolocationCancel.addEventListener('click', () => {
                changeLocationDialog.close();
            });
        }
    } else {
        console.log("Change location button or dialog NOT found on this page");
    }
}

