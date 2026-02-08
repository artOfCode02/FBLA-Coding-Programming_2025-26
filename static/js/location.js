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


// Get places from Geoapify
export async function getPlaces(address="") {
    console.log("Fetching places from Geoapify...");

    //Try browser geolocation first, then fall back on IP geolocation, then to a sensible default
    let loc = null;

    if(address) {
        console.log("Using provided address:", address);

        let response = await fetch(`/get-location-from-address?address=${encodeURIComponent(address)}`);

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.latitude !== null && data.longitude !== null) {
                loc = { lat: data.latitude, lon: data.longitude };
            }
        }
    }
    if (!loc) {
        loc = await getLocationFromIP();
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

        // Cache businesses in sessionStorage for faster, client-side loading
        try {
            sessionStorage.setItem('businesses', JSON.stringify(businesses));
            // Also store the address/coords used to fetch these businesses
            if (address) {
                sessionStorage.setItem('businesses_address', address);
            } else {
                sessionStorage.removeItem('businesses_address');
            }
        } catch (err) {
            console.warn('Failed to write businesses to sessionStorage:', err);
        }
        return businesses;
        
    } catch (err) {
        console.error("Error: ", err)
    }
}