import pip._vendor.requests as requests
from initBase import User
import reviews
import curses
from curses import wrapper

API_KEY = "fdcb2789a931407f84d539feaf6621fb"
url = "https://api.geoapify.com/v2/places"


def displayStats(stdscr, data):
	col1 = 0 # Business name column
	col2 = int((curses.COLS - 1) / 4) # Address column
	col3 = int((curses.COLS - 1) / 2) # City + state column
	col4 = int(3 * ((curses.COLS - 1) / 4)) # Reviews column

	i = 0
	for place in data["features"]:
		name = place["properties"]["name"]
		houseNumber = place["properties"]["housenumber"]
		street = place["properties"]["street"]
		city = place["properties"]["city"]
		state = place["properties"]["state"]
		address = houseNumber + " " + street
		region = city + ", " + state

		#reviews = reviews.readReview(name)

		stdscr.addstr(i + 2, col1, name)
		stdscr.addstr(i + 2, col2, address)
		stdscr.addstr(i + 2, col3, region)

		input()

		++i

##############################################
# MAIN PROGRAM #

def main():
	user = User()

	params = {
		"categories": f"{user.businessType}",
		"filter": f"circle:{user.longitude},{user.latitude},5000",
		"limit": 10,
		"apiKey": API_KEY
	}

	response = requests.get(url, params=params)
	data = response.json()

	stdscr = curses.initscr()
	curses.cbreak()
	curses.noecho()
	stdscr.keypad(True)

	displayStats(stdscr, data)

	wrapper(stdscr)

	# for place in data["features"]:
	# 	name = place["properties"]["name"]
	# 	houseNumber = place["properties"]["housenumber"]
	# 	street = place["properties"]["street"]
	# 	city = place["properties"]["city"]
	# 	state = place["properties"]["state"]
	# 	zipcode = place["properties"]["postcode"]
	# 	address = place["properties"]["formatted"]
	# 	print(name, "-", houseNumber, street, city + ", " + state)
	# 	#reviews.writeReview(user, name)
	# 	reviews.readReview("Papa John's")

################################################


if __name__ == "__main__":
	main()