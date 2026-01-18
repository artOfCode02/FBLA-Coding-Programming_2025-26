from flask import Flask, request, jsonify, render_template # Python web framework
import pip._vendor.requests as requests # requests
import json
import os

# Top level domain for app (Flask)
app = Flask(__name__)

REVIEWS_FILE = 'reviews.json'

# Load reviews from reviews.json
def load_reviews():
    if os.path.exists(REVIEWS_FILE):
        with open(REVIEWS_FILE, 'r') as f:
            return json.load(f)
    return {}

# Save reviews into reviews.json
def save_reviews(reviews):
    with open(REVIEWS_FILE, 'w') as f:
        json.dump(reviews, f, indent=2)

# Fetch reviews based off businessID
@app.route('/all-reviews')
def all_reviews():
    businessID = request.args.get('businessID')

    reviews = load_reviews()
    if businessID not in reviews:
        return jsonify({})

    return jsonify(reviews[businessID])

# Render index.html
@app.route("/")
def index():
    return render_template("index.html")

# Render businesses.html
@app.route("/businesses")
def businesses():
    return render_template("businesses.html")

# Render reviews.html
@app.route("/reviews")
def reviews():
    return render_template("reviews.html")

# Post reviews to reviews.json based using:
# businessID,
# username,
# stars,
# review
@app.route("/save-review", methods=['POST'])
def save_review():
    if request.is_json:
        data = request.get_json()

        # Extract variables from aruments
        businessID = data.get('businessID')
        username = data.get('username')
        stars = data.get('stars')
        review = data.get('review')

        #Form validation
        if not all([businessID, stars, review]):
            return jsonify({
                "success": False,
                "message": "Missing required fields (businessID, stars, or review)."
            }), 400

        reviewData = load_reviews()

        # Make new business dictionary if none exists
        if not businessID in reviewData:
            reviewData[businessID] = {}

        # Set new username dictionary if none exists
        if not username in reviewData[businessID]:
            reviewData[businessID][username] = []

        # Save to review data
        reviewData[businessID][username].append([stars, review])

        # Load it back to review.json
        save_reviews(reviewData)

        # Message success
        return jsonify({
            "success": True,
            "message": "Review saved successfully!",
            "received_id": businessID
        }), 200
    else:
        # Body not JSON
        return jsonify({"success": False, "message": "Request body must be JSON"}), 400

# Google Recaptcha secret key
SECRET_KEY = "6LdOWCYsAAAAAEpCKUp6SV-tXZ-J3ecTFFzOfm_6"

# Used for the captcha in index.html
@app.route("/initCaptcha", methods=["POST"])
def initCaptcha():
    token = request.form.get("g-recaptcha-response")

    # Check if token exists
    if not token:
        return jsonify({"success": False, "message": "Captcha missing."}), 400

    verify_url = "https://www.google.com/recaptcha/api/siteverify"
    payload = {
        "secret": SECRET_KEY,
        "response": token,
    }

    # Verify captcha using secret key @ the verify url
    response = requests.post(verify_url, data=payload)
    result = response.json()

    # If captcha is not successful
    if not result.get("success"):
        return jsonify({"success": False, "message": "Captcha failed."}), 400

    return jsonify({"success": True, "message": "Captcha passed!"}), 200




