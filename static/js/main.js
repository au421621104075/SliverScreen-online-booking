// Simple auto slider
document.addEventListener('DOMContentLoaded', function () {
    const slides = document.querySelectorAll('.slide');
    if (!slides || slides.length === 0) return;
    const slidesWrap = document.querySelector('.slides');
    const dotsWrap = document.getElementById('slider-dots');
    let idx = 0;

    slides.forEach((s, i) => {
        const btn = document.createElement('button');
        if (i === 0) btn.classList.add('active');
        btn.addEventListener('click', () => { go(i) });
        dotsWrap.appendChild(btn);
    });

    function go(i) {
        idx = i;
        slidesWrap.style.transform = `translateX(-${100 * i}%)`;
        [...dotsWrap.children].forEach((d, di) => d.classList.toggle('active', di === i));
    }

    setInterval(() => {
        idx = (idx + 1) % slides.length;
        go(idx);
    }, 3500);
});

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
