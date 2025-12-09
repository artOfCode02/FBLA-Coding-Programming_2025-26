from flask import Flask, request, jsonify, render_template
import pip._vendor.requests as requests
import json
import os

app = Flask(__name__)

REVIEWS_FILE = 'reviews.json'

def load_reviews():
    if os.path.exists(REVIEWS_FILE):
        with open(REVIEWS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_reviews(reviews):
    with open(REVIEWS_FILE, 'w') as f:
        json.dump(reviews, f, indent=2)

@app.route('/all-reviews')
def all_reviews():
    businessID = request.args.get('businessID')

    reviews = load_reviews()
    if businessID not in reviews:
        return jsonify({})

    return jsonify(reviews[businessID])

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/businesses")
def businesses():
    return render_template("businesses.html")

@app.route("/reviews")
def reviews():
    return render_template("reviews.html")

SECRET_KEY = "6LdOWCYsAAAAAEpCKUp6SV-tXZ-J3ecTFFzOfm_6"

@app.route("/initCaptcha", methods=["POST"])
def initCaptcha():
    token = request.form.get("g-recaptcha-response")
    if not token:
        return jsonify({"success": False, "message": "Captcha missing."}), 400

    verify_url = "https://www.google.com/recaptcha/api/siteverify"
    payload = {
        "secret": SECRET_KEY,
        "response": token,
    }

    response = requests.post(verify_url, data=payload)
    result = response.json()

    if not result.get("success"):
        return jsonify({"success": False, "message": "Captcha failed."})

    return jsonify({"success": True, "message": "Captcha passed!"})




