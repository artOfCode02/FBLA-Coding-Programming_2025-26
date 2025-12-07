from pyexpat import features
import pip._vendor.requests as requests
from initBase import User
import reviews
import curses
import json
from curses import wrapper

API_KEY = "fdcb2789a931407f84d539feaf6621fb"
url = "https://api.geoapify.com/v2/places"


def displayStats(stdscr, data, cursorY):
	stdscr.clear()
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
			businessID = ID
		else:
			highlightColor = curses.color_pair(1)

		stdscr.addstr(i + 2, col1, name, highlightColor)
		stdscr.addstr(i + 2, col2, street, highlightColor)
		stdscr.addstr(i + 2, col3, region, highlightColor)

		i += 1

	return businessID


def printReviews(stdscr, businessID, cursorY):
	try:
		stdscr.clear()

		col1 = 0
		col2 = int((curses.COLS - 1) / 5)

		with open("reviews.json", "r") as file:
			reviewData = json.loads(file.read())

		if (cursorY == 0):
			stdscr.addstr(0, 0, "Press here to move back.", curses.color_pair(2))
		else:
			stdscr.addstr(0, 0, "Press here to move back.", curses.color_pair(1))

		if (cursorY == 1):
			stdscr.addstr(1, 0, "Enter review here. >>", curses.color_pair(2))
		else:
			stdscr.addstr(1, 0, "Enter review here. >>", curses.color_pair(1))

		businessReviews = reviewData.get(businessID)
		if businessReviews is None:
			if (cursorY == 2):
				stdscr.addstr(2, 0, "No reviews present.", curses.color_pair(2))
			else:
				stdscr.addstr(2, 0, "No reviews present.", curses.color_pair(1))
			return


		i = 0
		for user, review in businessReviews.items():
			stdscr.addstr(i + 2, col1, user)
			stdscr.addstr(i + 2, col2, review[0] + " star(s)")
			stdscr.addstr(i + 2, 2 * col2, review[1])

			i += 1
	except Exception as err:
		raise err


def makeReview(stdscr, user, businessID, cursorY):
	stdscr.move(1, 0)
	stdscr.clrtoeol()

	stars = ""
	userReview = ""

	curses.echo()
	
	string = ""
	char = stdscr.getch()

	stdscr.move(1, 17)
	while char != (10 or 13):
		stdscr.addstr(1, 0, "How many stars?: ")
		
	
	stdscr.clrtoeol()
	stdscr.addstr(1, 0, "How many stars?: ")
	stdscr.getstr(stars)

	curses.noecho()

	reviews.writeReview(user, businessID, stars, userReview)



def handleUserInput(stdscr, ch, windowID, cursorY, data, user, businessID):
	quitProgram = False

	if ch == curses.KEY_UP and (cursorY > 2 and windowID == 0) or (cursorY > 0 and windowID == 1): # Move cursor up
		cursorY -= 1
	elif ch == curses.KEY_DOWN and ((windowID == 0 and cursorY < (curses.LINES - 1 and len(data["features"]) + 1)) or (windowID == 1 and cursorY < 1)): # Move cursor down
		cursorY += 1
	elif ch == (10 or 13) and windowID == 0: # Switch to review window
		cursorY = 1
		windowID = 1
	elif ch == (10 or 13) and cursorY == 0 and windowID == 1: # Switch back to main window
		cursorY = 2
		windowID = 0
	elif ch == (10 or 13) and windowID == 1 and cursorY == 1: # Make a review on the review window
		cursorY = 1
		makeReview(stdscr, user, businessID, cursorY)
	elif ch == 81:
		quitProgram = True

	return windowID, cursorY, quitProgram



def manageWindow(stdscr, cursorY, windowID, data, businessID):
	if windowID == 0:
		businessID = displayStats(stdscr, data, cursorY)
	elif windowID == 1:
		printReviews(stdscr, businessID, cursorY)

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
	quitProgram = False
	while not(ch == 81 or quitProgram):
		windowID, cursorY, quitProgram = handleUserInput(stdscr, ch, windowID, cursorY, data, user, businessID)
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