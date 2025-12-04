import json
from initBase import User


def writeReview(user, businessName):
    with open("reviews.json", "r") as file:
        reviewData = json.loads(file.read())
    
    stars = input("Rate our business (1-5): ")
    review = input("Leave a review: ")

    userReview = {f"{user.username}": [f"{stars}", f"{review}"]}
    
    reviewData[businessName] = userReview

    with open("reviews.json", "w") as file:
        file.write(json.dumps(reviewData))

def readReview(businessName):
    with open("reviews.json", "r") as file:
        reviewData = json.loads(file.read())

    if businessName in reviewData:
        review = reviewData[businessName]
        return review
    else:
        return ""