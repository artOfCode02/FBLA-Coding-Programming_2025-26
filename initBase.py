import pip._vendor.requests as requests

class User:
    def __init__(self):
        self.username = input("Enter a username (Default = \"Anonomyous\"): ") or "Anonomyous"
        self.location = requests.get("https://ipinfo.io/json").json()
        self.latitude, self.longitude = self.location["loc"].split(",")
        self.businessType = self.getBusinessCategory()

    @staticmethod
    def getBusinessCategory():
        category = input("What type of business are you looking for? (food or retail): ")

        if category == "food":
            returnCategory = "catering"
        elif category == "retail":
            returnCategory = "commercial"

        return returnCategory
    
    
    