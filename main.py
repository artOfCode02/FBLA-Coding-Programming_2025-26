import pip._vendor.requests 

API_KEY = "fdcb2789a931407f84d539feaf6621fb"
url = "https://api.geoapify.com/v2/places"


def getUserCity():
    city = input("What is your city?: ")
    location = pip._vendor.requests.get("https://ipinfo.io/json").json()
    

    return location

def getBusinessCategory():
    category = input("What type of business are you looking for? (food, retail, services): ")

    if category == "resturant":
        returnCategory = "catering"
    elif category == "shopping":
        returnCategory = "commercial"
    elif category == "entertainment":
        returnCategory = "entertainment"

    return returnCategory



##############################################
# MAIN PROGRAM

latitude, longitude = getUserCity()["loc"].split(",")

params = {
    "categories": f"{getBusinessCategory()}",
    "filter": f"circle:{longitude},{latitude},5000",
    "limit": 10,
    "apiKey": API_KEY
}

response = pip._vendor.requests.get(url, params=params)
data = response.json()

for place in data["features"]:
    name = place["properties"]["name"]
    address = place["properties"]["formatted"]
    print(name, "-", address)

##############################################
