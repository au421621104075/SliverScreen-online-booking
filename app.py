import os
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret')

db = SQLAlchemy(app)

# ---- Models ----
class Movie(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    poster = db.Column(db.String(255), nullable=True)
    price = db.Column(db.Integer, default=150)  # price in INR per seat

class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    movie_id = db.Column(db.Integer, db.ForeignKey('movie.id'), nullable=False)
    seats = db.Column(db.String(255), nullable=False)  # comma-separated seat numbers
    paid = db.Column(db.Boolean, default=False)

# ---- Helpers ----
def create_tables():
    db.create_all()
    # seed some movies if none
    if Movie.query.count() == 0:
        m1 = Movie(
            title='dark-knight',
            description='A moving story of hope and color.',
            poster='images/dark-knight.jpg',
            price=150
        )
        m2 = Movie(
            title='loki',
            description='Fast-paced thriller with stunning chases.',
            poster='images/loki_movie.jpg',
            price=200
        )
        m3 = Movie(
            title='Inception',
            description='thriller fantasic.',
            poster='images/inception.jpg',
            price=100
        )
        m4 = Movie(
            title='Alvin',
            description=' Comedy thriller fantasic.',
            poster='images/alvin.jpg',
            price=150
        )
        m5 = Movie(
            title='Interstellar',
            description=' Comedy thriller fantasic.',
            poster='images/interstellar.jpg',
            price=120
        )
        db.session.add_all([m1, m2 , m3 ,m4 ,m5])
        db.session.commit()

with app.app_context():
    create_tables()

# ---- Routes ----
@app.route('/')
def index():
    movies = Movie.query.all()
    banners = ['images/loki.webp', 'images/interstellar.jpg']
    return render_template('index.html', movies=movies, banners=banners)

@app.route("/movie/<int:movie_id>")
def movie_details(movie_id):
    movie = Movie.query.get_or_404(movie_id)
    return render_template('movie-details.html', movie=movie)

@app.route('/booking/<int:movie_id>')
def booking(movie_id):
    movie = Movie.query.get_or_404(movie_id)
    # gather already booked seats for this movie
    bookings = Booking.query.filter_by(movie_id=movie_id).all()
    booked = []
    for b in bookings:
        booked += [s for s in b.seats.split(',') if s]
    return render_template('booking.html', movie=movie, booked=booked)

# --- create booking (QR payment) ---
@app.route('/create-order', methods=['POST'])
def create_order():
    data = request.json
    movie_id = data.get('movie_id')
    seats = data.get('seats', [])
    if not seats:
        return jsonify({'error': 'No seats selected'}), 400

    movie = Movie.query.get(movie_id)
    if not movie:
        return jsonify({'error': 'Invalid movie'}), 400

    seats_str = ','.join(map(str, seats))
    booking = Booking(movie_id=movie_id, seats=seats_str, paid=False)
    db.session.add(booking)
    db.session.commit()

    # Frontend will show QR code after this
    return jsonify({'booking_id': booking.id, 'message': 'qr_ready'})

# --- confirm QR booking ---
@app.route('/confirm-booking', methods=['POST'])
def confirm_booking():
    data = request.json
    movie_id = data.get('movie_id')
    seats = data.get('seats', [])
    if not seats:
        return jsonify({'error': 'No seats selected'}), 400

    seats_str = ','.join(map(str, seats))
    booking = Booking(movie_id=movie_id, seats=seats_str, paid=True)
    db.session.add(booking)
    db.session.commit()

    return jsonify({'ok': True, 'message': 'Booking confirmed via QR'})

# --- API to fetch booked seats for a movie ---
@app.route('/api/booked/<int:movie_id>')
def api_booked(movie_id):
    bookings = Booking.query.filter_by(movie_id=movie_id).all()
    booked = []
    for b in bookings:
        booked += [s for s in b.seats.split(',') if s]
    return jsonify({'booked': booked})

@app.route('/reset-bookings')
def reset_bookings():
    Booking.query.delete()
    db.session.commit()
    return "All bookings cleared!"
#http://127.0.0.1:5000/reset-bookings

if __name__ == '__main__':
    # Use Render's port or default 5000
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
