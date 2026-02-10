function add_businesses_markers(map, businesses) {
    if (!map) {
        console.error("Map instance is required to add markers");
        return;
    }

    if (!Array.isArray(businesses)) {
        console.error("Businesses should be an array");
        return;
    }

    // keep a global registry of markers keyed by business id for cross-interaction
    if (!window.businessMarkers) window.businessMarkers = {};

    businesses.forEach(business => {
        if (business.lat && business.lon) {
            const marker = L.marker([business.lat, business.lon]).addTo(map);
            // Bind a tooltip for the business name (will be opened on click)
            try {
                marker.bindTooltip(`${business.name}`, { direction: 'top', offset: [0, -12], permanent: false, opacity: 0.95 });
            } catch (e) {
                // fallback to popup if tooltip binding fails
                marker.bindPopup(`
                    <b>${business.name}</b>
                    <br>
                    ${business.street}
                    <br>
                    ${business.city}
                `);
            }

            // store marker by business id for lookup from list items
            if (business.id !== undefined && business.id !== null) {
                window.businessMarkers[business.id] = marker;
            }

            // Clicking a marker should highlight and scroll the corresponding list entry
            marker.on('click', function () {
                try {
                    // clear any existing highlights/tooltips
                    if (window.businessMarkers) {
                        Object.keys(window.businessMarkers).forEach(id => {
                            const m = window.businessMarkers[id];
                            try { if (m.closeTooltip) m.closeTooltip(); } catch (e) {}
                            try { m.setZIndexOffset(0); } catch (e) {}
                            const r = document.querySelector(`[data-business-id="${id}"]`);
                            if (r) r.classList.remove('list-highlight');
                        });
                    }

                    const row = document.querySelector(`[data-business-id="${business.id}"]`);
                    if (row) {
                        row.classList.add('list-highlight');
                        try { row.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
                    }

                    try { marker.setZIndexOffset(1000); } catch (e) {}
                    try { if (marker.openTooltip) marker.openTooltip(); } catch (e) {}
                } catch (e) {
                    console.warn('Error during marker click highlight', e);
                }
            });
        } else {
            console.warn("Skipping business with missing coordinates:", business);
        }
    });
}

export function init_map() {
    console.log("Initializing map...");
    
    const mapContainer = document.getElementById('businesses_map');
    if (!mapContainer) {
        console.error("Map container not found");
        return;
    }

    // Get user coordinates from localStorage (set by geolocation dialog)
    try {
        var loc = JSON.parse(localStorage.getItem('selectedLocation'));

        if (loc && typeof loc.lat === 'number' && typeof loc.lon === 'number') {
            console.log("Found location in localStorage:", loc);
        } else {
            console.warn("No valid location found in localStorage");
        }
    } catch (err) {
        console.error("Error parsing location from localStorage:", err);
    }

    try {
        // Initialize the map container centered on user location,
        // defaulting to continental US center if no location available
        var map = L.map(mapContainer).setView([
            loc ? loc.lat : 39.8283,
            loc ? loc.lon : -98.5795],
            14
        ); 

        // Expose map globally so other modules (businesses.js) can pan/inspect bounds
        window.businessMap = map;

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        // Add a marker at the user's current location (if available)
        try {
            if (loc && typeof loc.lat === 'number' && typeof loc.lon === 'number') {
                const userIcon = L.icon({
                    iconUrl: '/static/leaflet/images/current-location.png',
                    iconSize: [16, 16],
                    iconAnchor: [16, 32]
                });

                // Add user location marker and bind a tooltip 'Current Location'
                window.userLocationMarker = L.marker([loc.lat, loc.lon], { icon: userIcon, interactive: true }).addTo(map);
                    try {
                        const iconSize = (userIcon && userIcon.options && userIcon.options.iconSize) ? userIcon.options.iconSize : [32, 32];
                        const vertOffset = -Math.ceil(iconSize[1] / 2) - 6;
                        window.userLocationMarker.bindTooltip('Current Location', { direction: 'top', offset: [0, vertOffset], opacity: 0.95 });
                    } catch (e) {
                        console.warn('Failed to bind tooltip to user location marker', e);
                    }
            }
        } catch (e) {
            console.warn('Failed to add user location marker', e);
        }

    } catch (err) {
        console.error("Error initializing map:", err);
    }

    // Load businesses data from sessionStorage and add markers
    console.log("Loading businesses data from sessionStorage for markers");

    if (sessionStorage.getItem('businesses')) {
        add_businesses_markers(map, JSON.parse(sessionStorage.getItem('businesses')));
    } else {
        console.warn("No businesses data found in sessionStorage to add markers");
    }

    // Clicking on the map background clears any marker/list highlights
    try {
        map.on('click', function () {
            if (window.businessMarkers) {
                Object.keys(window.businessMarkers).forEach(id => {
                    const m = window.businessMarkers[id];
                    try { if (m.closeTooltip) m.closeTooltip(); } catch (e) {}
                    try { m.setZIndexOffset(0); } catch (e) {}
                    const r = document.querySelector(`[data-business-id="${id}"]`);
                    if (r) r.classList.remove('list-highlight');
                });
            }
        });
    } catch (e) {
        console.warn('Failed to attach map click clear handler', e);
    }

}