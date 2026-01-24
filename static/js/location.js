// Geoapify api key
const API_KEY = "fdcb2789a931407f84d539feaf6621fb";

async function getLocationFromIP() {
    console.log("Getting location from IP address...");

    try {
        const response = await fetch('https://ipinfo.io/json');
        const data = await response.json();
        console.log(data); // Full info: city, region, country, loc, etc.

        // 'loc' gives latitude and longitude as a string: "lat,lon"
        if (data && data.loc) {
            const [lat, lon] = data.loc.split(',');
            console.log("Latitude:", lat, "Longitude:", lon);
            return { lat: parseFloat(lat), lon: parseFloat(lon) };
        } else {
            console.warn('ipinfo did not return loc');
            return null;
        }
    } catch (err) {
        console.error("Could not get location from IP:", err);
        return null;
    }
}

function getBrowserLocation() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            (err) => {
                console.warn('Browser geolocation failed or denied:', err);
                resolve(null);
            },
            { timeout: 8000 }
        );
    });
}

// Get places from Geoapify
export async function getPlaces() {
    console.log("Fetching places from Geoapify...");

    // Try IP geolocation first, fall back to browser geolocation, then to a sensible default
    let loc = await getLocationFromIP();
    if (!loc) {
        loc = await getBrowserLocation();
    }
    if (!loc) {
        // Default to continental US center if no location available
        loc = { lat: 39.8283, lon: -98.5795 };
        console.warn('Using default location:', loc);
    }

    const { lat, lon } = loc;
    console.log('Using coordinates:', lat, lon);

    const business_category = "catering";

    // Only include categories param if provided
    const params = new URLSearchParams({ lat: String(lat), lon: String(lon), limit: '50', apiKey: API_KEY });
    if (business_category) params.set('categories', business_category);
    const url = `https://api.geoapify.com/v2/places?${params.toString()}`;

    

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data || !Array.isArray(data.features)) {
            console.warn('Geoapify returned no features', data);
            return [];
        }

        // Map and filter out incomplete entries
        const businesses = data.features.map(feature => {
            const props = feature.properties || {};

            const city = props.city || props.county || '';
            const state = props.state || '';

            if (!props.place_id || !props.name || !props.street) return null;

            const region = city && state ? `${city}, ${state}` : (city || state || '');

            const business = {
                id: props.place_id,
                name: props.name,
                street: props.street,
                city: region
            };
            console.log('Found business:', business);

            return business;
        }).filter(Boolean);

         // Cache business in businesses.json for faster loading
        const businesses_cache_response = await fetch('/store-businesses-cache', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(businesses)
        });
        // Error checking for '/cache_business' endpoint
        if (!businesses_cache_response.ok) {
            const errorBody = await businesses_cache_response.text();
            console.error(`Failed to cache businesses. Server returned status ${businesses_cache_response.status}. Response body: ${errorBody}`);
        }
        
    } catch (err) {
        console.error("Error: ", err)
    }
}