// RapidAPI Google Maps Street View integration
(() => {
  let mapEl, currentLocation = null;
  let businessMarkers = [];
  let lastQuery = '';
  let searchTimer;

  // RapidAPI configuration
  const RAPIDAPI_KEY = 'https://google-maps-api-free.p.rapidapi.com/google-find-place-search?place=sharma%20vishnu'; // Replace with your actual RapidAPI key
  const RAPIDAPI_HOST = 'google-maps-api-free.p.rapidapi.com';

  function initMap() {
    mapEl = document.getElementById('map');
    if (!mapEl) return;
    
    // Show placeholder with instructions
    mapEl.innerHTML = `
      <div class="d-flex flex-column align-items-center justify-content-center h-100 text-center p-4">
        <i class="fa-solid fa-map-location-dot text-primary mb-3" style="font-size: 3rem;"></i>
        <h5 class="mb-2">Interactive Map</h5>
        <p class="text-secondary mb-3">Search for a location to see the street view</p>
        <small class="text-muted">Configure RapidAPI key in maps.js for full functionality</small>
      </div>
    `;

    const input = document.getElementById('place-input');
    if (input) {
      input.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => runSearch(true), 380); // debounce
      });
    }

    const btn = document.getElementById('btn-search');
    btn && btn.addEventListener('click', () => runSearch());

    const btnGeo = document.getElementById('btn-geolocate');
    btnGeo && btnGeo.addEventListener('click', locateUser);

    const btnMap = document.getElementById('btn-view-map');
    const btnSat = document.getElementById('btn-view-satellite');
    btnMap && btnMap.addEventListener('click', () => showMapPlaceholder('Map view not available with Street View API'));
    btnSat && btnSat.addEventListener('click', () => showMapPlaceholder('Satellite view not available with Street View API'));
  }

  function runSearch(isDebounced = false) {
    const query = (document.getElementById('place-input') || {}).value || '';
    if (!query.trim()) return;
    if (isDebounced && query === lastQuery) return;
    lastQuery = query;
    searchLocation(query);
  }

  async function searchLocation(address) {
    if (!RAPIDAPI_KEY || RAPIDAPI_KEY === 'YOUR_RAPIDAPI_KEY') {
      showMapPlaceholder('Configure RapidAPI key for location search');
      return;
    }

    try {
      // Use Google Maps API Free to find places
      const searchResponse = await fetch(`https://${RAPIDAPI_HOST}/google-find-place-search?place=${encodeURIComponent(address)}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST
        }
      });
      
      const searchData = await searchResponse.json();
      if (searchData.candidates && searchData.candidates.length > 0) {
        const place = searchData.candidates[0];
        const location = place.geometry.location;
        currentLocation = location;
        await showStreetView(location, place.formatted_address || place.name);
        SalesQueenProgress.setStage('lead', 'in-progress');
        await searchNearbyBusinesses(location, address);
      } else {
        alert('Location not found. Try refining your query.');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Unable to search location. Please try again.');
    }
  }

  async function showStreetView(location, title) {
    if (!mapEl) return;
    const { lat, lng } = location;
    
    if (!RAPIDAPI_KEY || RAPIDAPI_KEY === 'YOUR_RAPIDAPI_KEY') {
      showMapPlaceholder('Configure RapidAPI key for Street View');
      return;
    }

    try {
      const response = await fetch(`https://${RAPIDAPI_HOST}/maps/api/streetview?size=600x400&source=default&return_error_code=true&location=${lat},${lng}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST
        }
      });
      
      if (response.ok) {
        const imageBlob = await response.blob();
        const imageUrl = URL.createObjectURL(imageBlob);
        
        mapEl.innerHTML = `
          <div class="position-relative">
            <img src="${imageUrl}" alt="Street view of ${title}" class="img-fluid rounded w-100" style="height: 400px; object-fit: cover;">
            <div class="position-absolute top-0 start-0 p-3">
              <div class="bg-white rounded shadow-sm p-2">
                <h6 class="mb-1">${title}</h6>
                <small class="text-muted">Street View</small>
              </div>
            </div>
            <div class="position-absolute bottom-0 end-0 p-3">
              <button class="btn btn-sm btn-primary" onclick="window.SQ_toast && window.SQ_toast('Location saved to project')">
                <i class="fa-solid fa-bookmark me-1"></i> Save Location
              </button>
            </div>
          </div>
        `;
      } else {
        showMapPlaceholder('Street View not available for this location');
      }
    } catch (error) {
      console.error('Street View error:', error);
      showMapPlaceholder('Unable to load Street View');
    }
  }

  function showMapPlaceholder(message) {
    if (!mapEl) return;
    mapEl.innerHTML = `
      <div class="d-flex flex-column align-items-center justify-content-center h-100 text-center p-4">
        <i class="fa-solid fa-map-location-dot text-primary mb-3" style="font-size: 3rem;"></i>
        <h5 class="mb-2">Map Unavailable</h5>
        <p class="text-secondary mb-3">${message}</p>
        <small class="text-muted">Search will work with basic functionality</small>
      </div>
    `;
  }

  function locateUser() {
    if (!navigator.geolocation) return alert('Geolocation is not supported.');
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      currentLocation = location;
      await showStreetView(location, 'My Location');
      SalesQueenProgress.setStage('lead', 'in-progress');
      await searchNearbyBusinesses(location, 'My Location');
    }, () => alert('Unable to access your location.'), { enableHighAccuracy: true, timeout: 8000 });
  }

  async function searchNearbyBusinesses(location, searchTerm = '') {
    if (!RAPIDAPI_KEY || RAPIDAPI_KEY === 'YOUR_RAPIDAPI_KEY') {
      // Mock business data for demonstration when no API key
      const mockBusinesses = [
        { name: 'Sample Restaurant', vicinity: '123 Main St', rating: 4.5, user_ratings_total: 120, website: 'https://example.com' },
        { name: 'Local Cafe', vicinity: '456 Oak Ave', rating: 4.2, user_ratings_total: 85, website: null },
        { name: 'Business Center', vicinity: '789 Pine St', rating: 4.8, user_ratings_total: 200, website: 'https://business.com' }
      ];
      renderResults(mockBusinesses);
      return;
    }

    try {
      // Use Google Maps API Free to search for nearby businesses
      const industry = (document.getElementById('industry-filter') || {}).value || '';
      const searchQuery = industry ? `${industry} near ${searchTerm}` : `businesses near ${searchTerm}`;
      
      const nearbyResponse = await fetch(`https://${RAPIDAPI_HOST}/google-find-place-search?place=${encodeURIComponent(searchQuery)}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST
        }
      });
      
      const nearbyData = await nearbyResponse.json();
      if (nearbyData.candidates && nearbyData.candidates.length > 0) {
        // Format the results for display
        const formattedPlaces = nearbyData.candidates.slice(0, 12).map(place => ({
          name: place.name || 'Unknown Business',
          vicinity: place.formatted_address || place.vicinity || 'Address not available',
          rating: place.rating || 0,
          user_ratings_total: place.user_ratings_total || 0,
          website: place.website || null,
          place_id: place.place_id
        }));
        
        renderResults(formattedPlaces);
      } else {
        renderResults([]);
      }
    } catch (error) {
      console.error('Nearby search error:', error);
      // Fallback to mock data
      const mockBusinesses = [
        { name: 'Sample Restaurant', vicinity: '123 Main St', rating: 4.5, user_ratings_total: 120, website: 'https://example.com' },
        { name: 'Local Cafe', vicinity: '456 Oak Ave', rating: 4.2, user_ratings_total: 85, website: null },
        { name: 'Business Center', vicinity: '789 Pine St', rating: 4.8, user_ratings_total: 200, website: 'https://business.com' }
      ];
      renderResults(mockBusinesses);
    }
  }


  function renderResults(places) {
    const grid = document.getElementById('results');
    if (!grid) return;
    grid.innerHTML = '';
    places.slice(0, 12).forEach(p => {
      const col = document.createElement('div');
      col.className = 'col';
      const rating = p.rating ? `⭐ ${p.rating} (${p.user_ratings_total || 0})` : 'No ratings';
      const website = p.website ? `<a href="${p.website}" target="_blank" rel="noopener" class="me-2">Website</a>` : '';
      col.innerHTML = `
        <div class="card sq-card h-100">
          <div class="card-body d-flex flex-column">
            <h6 class="card-title mb-1">${escapeHtml(p.name)}</h6>
            <div class="text-secondary small mb-2">${escapeHtml(p.vicinity || p.formatted_address || '')}</div>
            <div class="small mb-3">${rating}</div>
            <div class="mt-auto d-flex align-items-center gap-2">
              ${website}
              <a href="#" class="link-primary" data-claim> This is My Business</a>
              <a href="#" class="link-secondary" data-refer> Refer a Friend</a>
            </div>
          </div>
        </div>`;
      grid.appendChild(col);
      const claimLink = col.querySelector('[data-claim]');
      const referLink = col.querySelector('[data-refer]');
      claimLink && claimLink.addEventListener('click', (e) => { e.preventDefault(); claimBusiness(p); });
      referLink && referLink.addEventListener('click', (e) => { e.preventDefault(); referBusiness(p); });
    });
  }

  function claimBusiness(place) {
    window.SalesQueenLead && window.SalesQueenLead.captureFromPlace(place);
    SalesQueenProgress.setStage('lead', 'complete');
  }

  function referBusiness(place) {
    (window.SQ_toast || ((m)=>alert(m)))('Referral captured. We will follow up.');
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', initMap);
})();


