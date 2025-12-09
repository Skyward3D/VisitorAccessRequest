// ============================================
// ⚠️ CONFIGURATION - Replace with your values
// ============================================
const FRESHSERVICE_DOMAIN = 'YOUR_DOMAIN.freshservice.com';
const API_KEY = 'YOUR_API_KEY';

// ⚠️ SECURITY WARNING:
// Do NOT commit your actual API key to a public repository!
// For production, use a serverless function (Netlify/Vercel) to proxy requests.
// ============================================

// Location Data
const locationData = {
    sydney: {
        campuses: {
            "eastern-creek": { name: "Eastern Creek" },
            "marsden-park": { name: "Marsden Park" }
        }
    },
    melbourne: {
        campuses: {
            "brooklyn": { name: "Brooklyn" },
            "laverton": { name: "Laverton" }
        }
    },
    canberra: {
        campuses: {
            "hume1": { name: "Hume 1" },
            "hume2": { name: "Hume 2" },
            "beard": { name: "Beard" },
            "fyshwick": { 
                name: "Fyshwick",
                locations: [
                    { id: "fy1", name: "CBR-FY1" },
                    { id: "fy2", name: "CBR-FY2" }
                ]
            }
        }
    },
    auckland: {
        campuses: {
            "silverdale": { name: "Silverdale" },
            "hobsonville1": { name: "Hobsonville 1" },
            "hobsonville2": { name: "Hobsonville 2" }
        }
    }
};

const cityNames = {
    sydney: "Sydney",
    canberra: "Canberra",
    auckland: "Auckland",
    melbourne: "Melbourne"
};

// Selected values
let selectedCity = null;
let selectedCampus = null;
let selectedLocation = null;

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('visitorForm');
    const submitBtn = document.getElementById('submitBtn');
    const statusDiv = document.getElementById('status');

    // Location elements
    const cityCardsContainer = document.getElementById('city-cards');
    const campusCardsContainer = document.getElementById('campus-cards');
    const locationGroup = document.getElementById('location-group');
    const locationCardsContainer = document.getElementById('location-cards');
    const selectionText = document.getElementById('selection-text');

    // Hidden inputs
    const selectedCityInput = document.getElementById('selectedCity');
    const selectedCampusInput = document.getElementById('selectedCampus');
    const selectedLocationInput = document.getElementById('selectedLocation');

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('visitDate').setAttribute('min', today);

    // ============================================
    // Location Selection Functions
    // ============================================

    function updateSummary() {
        const parts = [];
        if (selectedCity) {
            parts.push(cityNames[selectedCity]);
        }
        if (selectedCampus) {
            parts.push(locationData[selectedCity].campuses[selectedCampus].name);
        }
        if (selectedLocation) {
            parts.push(selectedLocation);
        }
        if (parts.length > 0) {
            selectionText.textContent = parts.join(" → ");
        } else {
            selectionText.textContent = "No location selected";
        }
    }

    function clearActiveCards(container) {
        const cards = container.getElementsByClassName('card');
        for (let i = 0; i < cards.length; i++) {
            cards[i].classList.remove('active');
        }
    }

    function handleCityClick(event) {
        const card = event.currentTarget;
        
        clearActiveCards(cityCardsContainer);
        card.classList.add('active');
        
        selectedCity = card.getAttribute('data-city');
        selectedCampus = null;
        selectedLocation = null;
        
        // Update hidden inputs
        selectedCityInput.value = cityNames[selectedCity];
        selectedCampusInput.value = '';
        selectedLocationInput.value = '';
        
        // Build campus cards
        const campuses = locationData[selectedCity].campuses;
        campusCardsContainer.innerHTML = '';
        
        Object.keys(campuses).forEach(function(key) {
            const campus = campuses[key];
            
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card';
            cardDiv.setAttribute('data-campus', key);
            cardDiv.onclick = handleCampusClick;
            
            const nameDiv = document.createElement('div');
            nameDiv.className = 'name';
            nameDiv.textContent = campus.name;
            
            cardDiv.appendChild(nameDiv);
            campusCardsContainer.appendChild(cardDiv);
        });
        
        // Hide location group
        locationGroup.classList.add('hidden');
        updateSummary();
    }

    function handleCampusClick(event) {
        const card = event.currentTarget;
        
        clearActiveCards(campusCardsContainer);
        card.classList.add('active');
        
        selectedCampus = card.getAttribute('data-campus');
        selectedLocation = null;
        
        const campusData = locationData[selectedCity].campuses[selectedCampus];
        
        // Update hidden inputs
        selectedCampusInput.value = campusData.name;
        selectedLocationInput.value = '';
        
        // Check if this campus has locations
        if (campusData.locations && campusData.locations.length > 0) {
            locationGroup.classList.remove('hidden');
            locationCardsContainer.innerHTML = '';
            
            campusData.locations.forEach(function(loc) {
                const cardDiv = document.createElement('div');
                cardDiv.className = 'card';
                cardDiv.setAttribute('data-location', loc.name);
                cardDiv.onclick = handleLocationClick;
                
                const nameDiv = document.createElement('div');
                nameDiv.className = 'name';
                nameDiv.textContent = loc.name;
                
                cardDiv.appendChild(nameDiv);
                locationCardsContainer.appendChild(cardDiv);
            });
        } else {
            locationGroup.classList.add('hidden');
        }
        
        updateSummary();
    }

    function handleLocationClick(event) {
        const card = event.currentTarget;
        
        clearActiveCards(locationCardsContainer);
        card.classList.add('active');
        
        selectedLocation = card.getAttribute('data-location');
        selectedLocationInput.value = selectedLocation;
        updateSummary();
    }

    // Attach click handlers to city cards
    const cityCards = cityCardsContainer.getElementsByClassName('card');
    for (let i = 0; i < cityCards.length; i++) {
        cityCards[i].onclick = handleCityClick;
    }

    // ============================================
    // Form Submission
    // ============================================

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validate location selection
        if (!selectedCity || !selectedCampus) {
            setStatus('error', '❌ Please select a city and campus before submitting.');
            return;
        }
        
        // Show loading state
        setStatus('loading', 'Submitting your request...');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        // Build location string
        const locationParts = [cityNames[selectedCity], locationData[selectedCity].campuses[selectedCampus].name];
        if (selectedLocation) {
            locationParts.push(selectedLocation);
        }
        const fullLocation = locationParts.join(' → ');

        // Gather form data
        const formData = {
            location: fullLocation,
            visitorName: document.getElementById('visitorName').value,
            visitorEmail: document.getElementById('visitorEmail').value,
            visitorCompany: document.getElementById('visitorCompany').value,
            hostName: document.getElementById('hostName').value,
            hostEmail: document.getElementById('hostEmail').value,
            purpose: document.getElementById('purpose').value,
            visitDate: document.getElementById('visitDate').value,
            arrivalTime: document.getElementById('arrivalTime').value,
            departureTime: document.getElementById('departureTime').value || 'Not specified'
        };

        // Format the ticket description
        const description = `
            <h3>Visitor Access Request</h3>
            <p><strong>Location:</strong> ${formData.location}</p>
            <hr>
            <p><strong>Visitor Name:</strong> ${formData.visitorName}</p>
            <p><strong>Visitor Email:</strong> ${formData.visitorEmail}</p>
            <p><strong>Visitor Company:</strong> ${formData.visitorCompany}</p>
            <hr>
            <p><strong>Host Name:</strong> ${formData.hostName}</p>
            <p><strong>Host Email:</strong> ${formData.hostEmail}</p>
            <hr>
            <p><strong>Purpose of Visit:</strong> ${formData.purpose}</p>
            <p><strong>Visit Date:</strong> ${formData.visitDate}</p>
            <p><strong>Arrival Time:</strong> ${formData.arrivalTime}</p>
            <p><strong>Departure Time:</strong> ${formData.departureTime}</p>
        `;

        // Freshservice ticket payload
        const ticketData = {
            email: formData.visitorEmail,
            subject: `Visitor Access Request: ${formData.visitorName} - ${formData.location} - ${formData.visitDate}`,
            description: description,
            status: 2,      // Open
            priority: 2,    // Medium
            cc_emails: [formData.hostEmail]
        };

        try {
            const response = await fetch(`https://${FRESHSERVICE_DOMAIN}/api/v2/tickets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + btoa(API_KEY + ':X')
                },
                body: JSON.stringify(ticketData)
            });

            if (response.ok) {
                const result = await response.json();
                setStatus('success', `✅ Request submitted successfully! Ticket #${result.ticket.id} has been created.`);
                form.reset();
                resetLocationSelection();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.description || `HTTP Error: ${response.status}`);
            }
        } catch (error) {
            console.error('Submission error:', error);
            setStatus('error', `❌ Failed to submit request: ${error.message}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Request';
        }
    });

    function setStatus(type, message) {
        statusDiv.className = `status show ${type}`;
        statusDiv.textContent = message;
    }

    function resetLocationSelection() {
        selectedCity = null;
        selectedCampus = null;
        selectedLocation = null;
        
        clearActiveCards(cityCardsContainer);
        campusCardsContainer.innerHTML = '<div class="card disabled"><div class="name">Select a city first</div></div>';
        locationGroup.classList.add('hidden');
        selectionText.textContent = 'No location selected';
        
        selectedCityInput.value = '';
        selectedCampusInput.value = '';
        selectedLocationInput.value = '';
    }
});