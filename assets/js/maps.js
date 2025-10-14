// Google Maps integration (optional if API key provided)
// Exposes global callback SQ_initMap for Maps JS API to invoke
(() => {
  let map, autocomplete, marker;
  let infoWindow;
  let businessMarkers = [];
  let lastQuery = '';
  let searchTimer;

  function initMap() {
    const mapEl = document.getElementById('map');
    if (!mapEl || !window.google || !google.maps) return;
    map = new google.maps.Map(mapEl, {
      center: { lat: 20.5937, lng: 78.9629 }, // India center as neutral default
      zoom: 5,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true
    });
    infoWindow = new google.maps.InfoWindow();

    const input = document.getElementById('place-input');
    if (input && google.maps.places) {
      autocomplete = new google.maps.places.Autocomplete(input, {
        fields: ['geometry', 'formatted_address', 'name'],
        types: ['geocode']
      });
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place || !place.geometry) return;
        focusPlace(place.geometry.location, place.name || place.formatted_address);
        SalesQueenProgress.setStage('lead', 'in-progress');
      });
    }

    const btn = document.getElementById('btn-search');
    btn && btn.addEventListener('click', () => runSearch());

    const input = document.getElementById('place-input');
    input && input.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => runSearch(true), 380); // debounce
    });

    const btnGeo = document.getElementById('btn-geolocate');
    btnGeo && btnGeo.addEventListener('click', locateUser);

    const btnMap = document.getElementById('btn-view-map');
    const btnSat = document.getElementById('btn-view-satellite');
    btnMap && btnMap.addEventListener('click', () => map.setMapTypeId('roadmap'));
    btnSat && btnSat.addEventListener('click', () => map.setMapTypeId('hybrid'));
  }

  function runSearch(isDebounced = false) {
    const query = (document.getElementById('place-input') || {}).value || '';
    if (!query.trim()) return;
    if (isDebounced && query === lastQuery) return;
    lastQuery = query;
    geocodeAddress(query);
  }

  function geocodeAddress(address) {
    if (!google || !google.maps) return;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const loc = results[0].geometry.location;
        focusPlace(loc, results[0].formatted_address);
        SalesQueenProgress.setStage('lead', 'in-progress');
        searchNearbyBusinesses(loc);
      } else {
        alert('Location not found. Try refining your query.');
      }
    });
  }

  function focusPlace(latLng, title) {
    if (!map) return;
    map.setCenter(latLng);
    map.setZoom(13);
    if (!marker) {
      marker = new google.maps.Marker({ map });
    }
    marker.setPosition(latLng);
    marker.setTitle(title || '');
  }

  function locateUser() {
    if (!navigator.geolocation) return alert('Geolocation is not supported.');
    navigator.geolocation.getCurrentPosition((pos) => {
      const latLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      focusPlace(latLng, 'My Location');
      SalesQueenProgress.setStage('lead', 'in-progress');
      searchNearbyBusinesses(latLng);
    }, () => alert('Unable to access your location.'), { enableHighAccuracy: true, timeout: 8000 });
  }

  function clearBusinessMarkers() {
    businessMarkers.forEach(m => m.setMap(null));
    businessMarkers = [];
  }

  function searchNearbyBusinesses(latLng) {
    if (!google.maps.places) return;
    clearBusinessMarkers();
    const service = new google.maps.places.PlacesService(map);
    const industry = (document.getElementById('industry-filter') || {}).value || '';
    const request = {
      location: latLng,
      radius: 3000,
      type: industry ? [industry] : undefined,
      keyword: industry || undefined
    };
    service.nearbySearch(request, (results, status) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK || !results) return;
      renderResults(results);
      results.slice(0, 12).forEach(place => addBusinessMarker(place));
    });
  }

  function addBusinessMarker(place) {
    const m = new google.maps.Marker({
      map,
      position: place.geometry.location,
      title: place.name,
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
      }
    });
    m.addListener('click', () => openInfo(place, m));
    businessMarkers.push(m);
  }

  function openInfo(place, m) {
    const rating = place.rating ? `⭐ ${place.rating} (${place.user_ratings_total || 0})` : 'No ratings';
    const website = place.website ? `<a href="${place.website}" target="_blank" rel="noopener">Website</a>` : '';
    const content = `
      <div style="max-width:240px">
        <strong>${escapeHtml(place.name)}</strong><br>
        <span>${escapeHtml(place.vicinity || place.formatted_address || '')}</span><br>
        <small>${rating}</small><br>
        <div class="mt-1">${website}</div>
        <div class="mt-2">
          <button class="btn btn-sm btn-primary" id="iw-cta-claim">This is My Business</button>
        </div>
      </div>`;
    infoWindow.setContent(content);
    infoWindow.open({ map, anchor: m });
    // Defer binding after DOM is set in InfoWindow
    setTimeout(() => {
      const btn = document.getElementById('iw-cta-claim');
      if (btn) btn.addEventListener('click', () => claimBusiness(place));
    }, 0);
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
    showToast('Referral captured. We will follow up.');
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  // Expose callback for Google Maps script
  window.SQ_initMap = initMap;
})();


