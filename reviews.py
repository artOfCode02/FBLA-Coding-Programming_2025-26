import json
from initBase import User


def writeReview(user, businessID, stars, review):
    with open("reviews.json", "r") as file:
        reviewData = json.loads(file.read())

    userReview = {f"{user.username}": [f"{stars}", f"{review}"]}
    
    reviewData[businessID] = userReview

    with open("reviews.json", "w") as file:
        file.write(json.dumps(reviewData))


def reviewsAmount(businessID):
    with open("reviews.json", "r") as file:
        reviewData = json.loads(file.read())
    amount = len(reviewData[businessID])
    return amount