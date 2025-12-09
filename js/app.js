// ============================================
// ⚠️ CONFIGURATION - Replace with your values
// ============================================
const FRESHSERVICE_DOMAIN = 'YOUR_DOMAIN.freshservice.com';
const API_KEY = 'YOUR_API_KEY';

// ⚠️ SECURITY WARNING:
// Do NOT commit your actual API key to a public repository!
// For production, use a serverless function (Netlify/Vercel) to proxy requests.
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('visitorForm');
    const submitBtn = document.getElementById('submitBtn');
    const statusDiv = document.getElementById('status');

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('visitDate').setAttribute('min', today);

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Show loading state
        setStatus('loading', 'Submitting your request...');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        // Gather form data
        const formData = {
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
            subject: `Visitor Access Request: ${formData.visitorName} - ${formData.visitDate}`,
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
});