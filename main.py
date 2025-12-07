import pip._vendor.requests as requests
from initBase import User
import reviews
import curses
import json
from curses import wrapper

API_KEY = "fdcb2789a931407f84d539feaf6621fb"
url = "https://api.geoapify.com/v2/places"


def displayStats(stdscr, data, cursorY):
	col1 = 0 # Business name column
	col2 = int((curses.COLS - 1) / 4) # Address column
	col3 = int((curses.COLS - 1) / 2) # City + state column
	col4 = int(3 * ((curses.COLS - 1) / 4)) # Reviews column

	i = 0
	for place in data["features"]:
		name = place["properties"]["name"]
		street = place["properties"]["street"]
		city = place["properties"]["city"]
		state = place["properties"]["state_code"]
		ID = place["properties"]["place_id"]
		region = city + ", " + state

		if cursorY == i + 2:
			highlightColor = curses.color_pair(2)
		else:
			highlightColor = curses.color_pair(1)

		stdscr.addstr(i + 2, col1, name, highlightColor)
		stdscr.addstr(i + 2, col2, street, highlightColor)
		stdscr.addstr(i + 2, col3, region, highlightColor)

		i += 1

	return ID


def printReviews(stdscr, businessID):
	try:
		col1 = 0
		col2 = int((curses.COLS - 1) / 5)

		with open("reviews.json", "r") as file:
			reviewData = json.loads(file.read())

		i = 0
		for user, review in reviewData[businessID].items():
			stdscr.addstr(i + 2, col1, user)
			stdscr.addstr(i + 2, col2, review)

			i += 1
	except Exception as err:
		raise err


def handleUserInput(ch, windowID, cursorY):
	if ch == curses.KEY_UP and cursorY > 2:
		cursorY -= 1
	elif ch == curses.KEY_DOWN and cursorY < curses.LINES - 1:
		cursorY += 1
	elif ch == (10 or 13) and windowID == 0:
		windowID = 1
	elif ch == 27 and windowID == 1:
		windowID = 0

	return windowID, cursorY



def manageWindow(stdscr, cursorY, windowID, data, businessID):
	if windowID == 0:
		businessID = displayStats(stdscr, data, cursorY)
	elif windowID == 1:
		printReviews(stdscr, businessID)

	return businessID


	





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

	# Set up curses
	stdscr = curses.initscr()
	curses.cbreak()
	curses.noecho()
	stdscr.keypad(True)
	curses.start_color()
	curses.init_pair(1, curses.COLOR_WHITE, curses.COLOR_BLACK) # Normal color
	curses.init_pair(2, curses.COLOR_BLACK, curses.COLOR_WHITE) # Highlight color

	cursorY = 2
	windowID = 0
	businessID = displayStats(stdscr, data, cursorY)
	stdscr.refresh()
	ch = stdscr.getch()
	while ch != 81:
		windowID, cursorY = handleUserInput(ch, windowID, cursorY)
		businessID = manageWindow(stdscr, cursorY, windowID, data, businessID)
		stdscr.refresh()

		ch = stdscr.getch()



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