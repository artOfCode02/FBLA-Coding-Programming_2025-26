from flask import Flask, request, jsonify, render_template # Python web framework
import pip._vendor.requests as requests # requests
import os, json

# Top level domain for app (Flask)
app = Flask(__name__)

##########################--- INDEX ---##################################
# Render index.html
@app.route("/")
def index():
    return render_template("index.html")

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

############################################################################

##########################--- BUSINESS ---##################################
BOOKMARKS_FILE = 'bookmarks.json'

# Load bookmarks from bookmarks.json
def load_bookmarks():
    if os.path.exists(BOOKMARKS_FILE):
        with open(BOOKMARKS_FILE, 'r') as f:
            return json.load(f)
    return {}

# Save bookmarks into bookmarks.json
def save_bookmarks(bookmarks):
    with open(BOOKMARKS_FILE, 'w') as f:
        json.dump(bookmarks, f, indent=2)

# Check if business is bookmarked
def check_bookmark(businessID, username):
    bookmarkData = load_bookmarks()
    # If username exists and businessID exists for that username
    if username in bookmarkData and businessID in bookmarkData[username]:
        return True
    
    return False # Else return false

# Render businesses.html
@app.route("/businesses")
def businesses():
    return render_template("businesses.html")

# Check if business is bookmarked
@app.route("/is-bookmarked")
def is_bookmarked():
    # Extract variables from arguments
    username = request.args.get('username')
    businessID = request.args.get('businessID')

    # Form validation
    if not all([username, businessID]):
        return jsonify({
            "success": False,
            "message": "Missing required fields (username or businessID)."
        }), 400
    
    # Run check bookmark function
    bookmarked = check_bookmark(businessID, username)

    # Return result
    return jsonify({
        "success": True,
        "bookmarked": bookmarked
    }), 200

# Post bookmark to bookmarks.json
@app.route("/save-bookmark", methods=['POST'])
def save_bookmark():
    if request.is_json:
        data = request.get_json()

        # Extract variables from arguments
        username = data.get('username')
        businessID = data.get('businessID')
        business_name = data.get('businessName')

        if not all([username, businessID, business_name]):
            return jsonify({
                "success": False,
                "message": "Missing required fields (username, businessID, or businessName)."
            }), 400
        
        bookmarkData = load_bookmarks()

        # Make new username dictionary if none exists
        if not username in bookmarkData:
            bookmarkData[username] = {}

        # Set bookmark
        bookmarkData[username][businessID] = business_name

        # Save bookmarks
        save_bookmarks(bookmarkData)

        return jsonify({
            "success": True,
            "message": "Bookmark saved successfully."
        }), 200
    
    else:
        return jsonify({
            "success": False,
            "message": "Request must be JSON."
        }), 400
    
# Remove bookmark from bookmarks.json
@app.route("/remove-bookmark", methods=['POST'])
def remove_bookmark():
    if request.is_json:
        data = request.get_json()

        # Extract variables from arguments
        username = data.get('username')
        businessID = data.get('businessID')

        if not all([username, businessID]):
            return jsonify({
                "success": False,
                "message": "Missing required fields (username or businessID)."
            }), 400
        
        bookmarkData = load_bookmarks()

        # If username or businessID does not exist
        if username not in bookmarkData or businessID not in bookmarkData[username]:
            return jsonify({
                "success": False,
                "message": "Bookmark does not exist."
            }), 400

        # Remove bookmark
        del bookmarkData[username][businessID]

        # Save bookmarks
        save_bookmarks(bookmarkData)

        return jsonify({
            "success": True,
            "message": "Bookmark removed successfully."
        }), 200
    
    else:
        return jsonify({
            "success": False,
            "message": "Request must be JSON."
        }), 400
    
############################################################################

##########################--- REVIEWS ---##################################
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
    
# Fetch reviews based off businessID
@app.route('/all-reviews')
def all_reviews():
    businessID = request.args.get('businessID')

    reviews = load_reviews()
    if businessID not in reviews:
        return jsonify({})

    return jsonify(reviews[businessID])