document.addEventListener('DOMContentLoaded', () => {
    const seatsContainer = document.getElementById('seats');
    const summary = document.getElementById('summary');
    const payBtn = document.getElementById('payBtn');
    const qrSection = document.getElementById('qrSection');
    const confirmBtn = document.getElementById('confirmBtn');

    const rows = 9; // Approx 99 seats
    const cols = 11;
    const bookedSet = new Set(BOOKED.map(String));
    const selected = new Set();
    const seatElements = []; // store seat elements for easy management

    // --- generate seats ---
    for (let r = 1; r <= rows; r++) {
        for (let c = 1; c <= cols; c++) {
            const num = (r - 1) * cols + c;
            const el = document.createElement('div');
            el.className = 'seat';
            el.dataset.seat = num;
            el.textContent = num;
            if (bookedSet.has(String(num))) el.classList.add('booked');
            el.addEventListener('click', handleSeatClick);
            seatsContainer.appendChild(el);
            seatElements.push(el);
        }
    }

    // --- handle seat click ---
    function handleSeatClick(event) {
        const el = event.currentTarget;
        if (el.classList.contains('booked')) return;

        const id = el.dataset.seat;
        if (selected.has(id)) {
            selected.delete(id);
            el.classList.remove('selected');
        } else {
            selected.add(id);
            el.classList.add('selected');
        }
        updateSummary();
    }

    // --- update seat summary ---
    function updateSummary() {
        if (selected.size === 0) {
            summary.textContent = 'No seats selected';
            payBtn.disabled = true;
        } else {
            const seats = Array.from(selected).sort((a, b) => a - b);
            const total = seats.length * PRICE;
            summary.innerHTML = `Seats: ${seats.join(', ')} <br> Total: ₹${total}`;
            payBtn.disabled = false;
        }
    }

    // --- pay button click ---
    payBtn.addEventListener('click', async () => {
        if (selected.size === 0) return;
        const seats = Array.from(selected);
        payBtn.disabled = true;
        payBtn.textContent = 'Processing...';

        try {
            const res = await fetch('/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ movie_id: MOVIE, seats })
            });
            const data = await res.json();

            if (data.error) {
                alert(data.error);
                payBtn.disabled = false;
                payBtn.textContent = 'Pay';
                return;
            }

            // --- simulated payment ---
            if (data.message === 'qr_ready') {
                // show QR section
                qrSection.style.display = 'block';
                payBtn.style.display = 'none';

                // disable seat selection while QR is displayed
                seatElements.forEach(el => el.removeEventListener('click', handleSeatClick));
            }

        } catch (err) {
            console.error(err);
            alert('Error creating order.');
            payBtn.disabled = false;
            payBtn.textContent = 'Pay';
        }
    });

    // --- confirm QR payment ---
    confirmBtn.addEventListener('click', async () => {
        if (selected.size === 0) return;

        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Confirming...';
        const seats = Array.from(selected);

        try {
            const res = await fetch('/confirm-booking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ movie_id: MOVIE, seats })
            });
            const data = await res.json();

            if (data.error) {
                alert(data.error);
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'Confirm Payment';
                return;
            }

            // mark seats booked visually
            seats.forEach(s => {
                const el = document.querySelector(`[data-seat='${s}']`);
                if (el) {
                    el.classList.remove('selected');
                    el.classList.add('booked');
                }
            });

            // reset selection & summary
            selected.clear();
            updateSummary();

            alert('Payment confirmed via QR and booking completed!');

            // hide QR section and reset Pay button
            qrSection.style.display = 'none';
            payBtn.style.display = 'inline-block';
            payBtn.disabled = true;
            payBtn.textContent = 'Pay';

            // re-enable seat selection
            seatElements.forEach(el => el.addEventListener('click', handleSeatClick));

            // reset confirm button
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirm Payment';

        } catch (err) {
            console.error(err);
            alert('Error confirming payment via QR.');
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirm Payment';
        }
    });
});

// Read booking data from HTML attributes
const dataBox = document.getElementById("bookingData");

const BOOKED = JSON.parse(dataBox.dataset.booked);
const MOVIE = parseInt(dataBox.dataset.movie);
const PRICE = parseInt(dataBox.dataset.price);

console.log("Loaded from backend:");
console.log("Booked seats →", BOOKED);
console.log("Movie ID →", MOVIE);
console.log("Price →", PRICE);


// -------------------- Predefined responses --------------------
const responses = {
    "hi": "Hello! How can I help you today?",
    "hello": "Hi! Ask me anything about movies or booking.",
    "movie": "You can check all available movies on the homepage!",
    "movies": "We have multiple movies available. Click a movie to see details.",
    "price": "Ticket price varies between ₹150 to ₹200 depending on the movie.",
    "booking": "To book a ticket, open any movie and select your seats.",
    "payment": "We support QR code payment currently.",
    "qr": "Scan the QR code and click 'Confirm Payment'.",
    "help": "You can ask about movies, booking, price, or payment."
};

// -------------------- Sending User Message --------------------
document.getElementById('sendBtn').addEventListener('click', sendMessage);
document.getElementById('userInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
    const input = document.getElementById('userInput');
    const message = input.value.trim();

    if (!message) return;

    addMessage(message, 'user-message');
    input.value = '';

    setTimeout(() => {
        const key = message.toLowerCase();
        let reply = "Sorry, I didn't understand that. Try asking about movies, booking, or payment.";

        if (responses[key]) {
            reply = responses[key];
        }

        addMessage(reply, 'bot-message');
    }, 500);
}

// -------------------- Add Message to Chat --------------------
function addMessage(text, className) {
    const messagesDiv = document.getElementById('messages');
    const msgDiv = document.createElement('div');

    msgDiv.className = `message ${className}`;
    msgDiv.textContent = text;

    messagesDiv.appendChild(msgDiv);

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// -------------------- Close Chat --------------------
document.getElementById('closeChat').addEventListener('click', () => {
    document.getElementById('chatbot').style.display = 'none';
    document.getElementById('chatToggle').style.display = 'block';
});

// -------------------- Open Chat --------------------
document.getElementById('chatToggle').addEventListener('click', () => {
    document.getElementById('chatbot').style.display = 'flex';
    document.getElementById('chatToggle').style.display = 'none';
});
