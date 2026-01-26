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
    

# Store businesses into cache for faster loading
@app.route('/store-businesses-cache', methods=['POST'])
def cache_businesses():
    if request.is_json:
        data = request.get_json()

        # Validate data
        if not data:
            return jsonify({"success": False, "message": "No data provided."}), 400

        # Remove old cache if it exists
        if 'businesses_cache.json' in os.listdir():
            os.remove('businesses_cache.json')

        # Save new cache
        with open('businesses_cache.json', 'w') as f:
            json.dump(data, f, indent=2)

        return jsonify({"success": True, "message": "Businesses cached successfully."}), 200

    else:
        return jsonify({"success": False, "message": "Request must be JSON."}), 400


# Load businesses from cache
@app.route('/load-businesses-cache')
def load_businesses_cache():
    if os.path.exists('businesses_cache.json'):
        with open('businesses_cache.json', 'r') as f:
            data = json.load(f)

        return jsonify(data), 200
    else:
        return jsonify({"success": False, "message": "No cache found."}), 404
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

@app.route('/delete-review', methods=['POST'])
def delete_review():
    if request.is_json:
        data = request.get_json()

        # Extract variables from arguments
        businessID = data.get('businessID')
        username = data.get('username')

        if not all([businessID, username]):
            return jsonify({
                "success": False,
                "message": "Missing required fields (businessID or username)."
            }), 400

        reviewData = load_reviews()

        # If businessID or username does not exist
        if businessID not in reviewData or username not in reviewData[businessID]:
            return jsonify({
                "success": False,
                "message": "Review does not exist."
            }), 400

        # Remove reviews
        del reviewData[businessID][username]

        # Save reviews
        save_reviews(reviewData)

        return jsonify({
            "success": True,
            "message": "Review removed successfully."
        }), 200

    else:
        return jsonify({
            "success": False,
            "message": "Request must be JSON."
        }), 400

# Fetch reviews based off businessID
@app.route('/all-reviews')
def all_reviews():
    businessID = request.args.get('businessID')

    reviews = load_reviews()
    if businessID not in reviews:
        return jsonify({})

    return jsonify(reviews[businessID])

# The Zen of Python, by Tim Peters
# Beautiful is better than ugly.
# Explicit is better than implicit.
# Simple is better than complex.
# Complex is better than complicated.
# Flat is better than nested.
# Sparse is better than dense.
# Readability counts.
# Special cases aren't special enough to break the rules.
# Although practicality beats purity.
# Errors should never pass silently.
# Unless explicitly silenced.
# In the face of ambiguity, refuse the temptation to guess.
# There should be one-- and preferably only one --obvious way to do it.
# Although that way may not be obvious at first unless you're Dutch.
# Now is better than never.
# Although never is often better than *right* now.
# If the implementation is hard to explain, it's a bad idea.
# If the implementation is easy to explain, it may be a good idea.
# Namespaces are one honking great idea -- let's do more of those!

# End of file
# Finally
# Goodbye.
# We've reached the end.
# This is the end of app.py
# Go on now, you may close it.
# You have my permission.
# Farewell.
# Forever.
# The file has ended here sir...
# Why are you still reading this?
# It's over.
# You can close it now.
# Seriously.
# Stop it.
# Close the file.
# Please.
# Thank you.
# You're still here?
# Wow.
# Impressive dedication.
# But really, it's over.
# Bye.
# THIS IS THE END.
# GO AWAY.
# THE END.
# STOP READING.
# END OF FILE.
# THE END.
# WHY ARE YOU STILL READING THIS?
# GOODBYE.
# I don't have any more lines to give you.
# The end.