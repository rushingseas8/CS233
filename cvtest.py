import cv2
import numpy as np
import matplotlib.pyplot as plt
import math
import random

# TODOs: 
# - add adaptive steps to the check. once initial guess is made, check with
#   roughly twice the radius away, and tighten the arc we're exploring in (45
#   degrees? 22.5?). Repeat until we can't find any more points, then we have
#   an upper limit to the length of the line (+/- 25%). Then backtrack, and the
#   point we find at the end is our best guess to the actual line.
# - we could also do m = initial guess, then turn that into a theta, and guess
#   +/- an angle based on the iteration. Then get the points (x1, y1) and 
#   (x2, y2) at +theta and -theta, and investigate along the line between these
#   two points (vs. an arc). Then we gather up a collection of guess points 
#   either equidistant (every radius or so steps) or adaptive (double each
#   iteration), and either do a least squares line of best fit, or take some
#   average.
# - also we should make the lines drawn more accurate (fit what we estimate
#   the line to be, not more, and not less).
# - once we have a line in one direction, look in the other direction to get
#   the full line
# - some way to throw away arcs and short lines while picking up actual short
#   lines properly
def customLineDetect(img, gray, x, y):
    startPoint = (x, y)
    if not isBlack(gray, x, y):
        return

    radius = 5

    if x < radius or x > img.shape[0] - radius or y < radius or y > img.shape[1] - radius:
        return

    # Find first guess of direction by scanning in a circle
    steps = int(2 * 3.15 * radius) # slightly higher to ensure coverage
    for i in range(steps):
        angle = 2.0 * math.pi * i / steps
        dx = int(radius * math.cos(angle))
        dy = int(radius * math.sin(angle))

        if isBlack(gray, x + dx, y + dy):
            #print("[" + str(x) + ", " + str(y) + "] Found guess at " + str(x + dx) + ", " + str(y + dy))
            if dx == 0:
                cv2.line(img, (0, x), (img.shape[1], x), (255, 0, 0), 2)
                continue
            m = float(dy) / dx

            #guessTheta = math.atan2(dy, dx)

            # Using point-slope form, the equation is
            # y - y1 = m(x - x1)
            # y = mx - mx1 + y1
            leftY = int((-1.0 * m * x) + y)
            rightY = int((m * img.shape[0]) - (m * x) + y)
            
            #cv2.line(img, (y, x), (y + dy, x + dx), (255, 0, 0), 2)
            cv2.line(img, (leftY, 0), (rightY, img.shape[0]), (255, 0, 0), 2)

def isBlack(img, x, y):
    return img[x, y] < 128

if __name__ == "__main__":
    path = '/Users/aleksandrovich/Desktop/circuit2.png'
    img = cv2.imread(path, cv2.IMREAD_COLOR)
    dispImg = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)

    edges = cv2.Canny(gray,50,150,apertureSize = 3)

    """
    surf = cv2.xfeatures2d.SURF_create()
    surf.setHessianThreshold(1000)
    kp, des = surf.detectAndCompute(img, None)

    img2 = cv2.drawKeypoints(img,kp,None,(255,0,0),4)

    plt.imshow(img2), plt.show()
    """

    #plt.imshow(gray, cmap='gray'), plt.show()

    """
    corners = cv2.goodFeaturesToTrack(gray,25,0.01,10)
    corners = np.int0(corners)

    print(len(corners))

    for i in corners:
        x,y = i.ravel()
        cv2.circle(gray,(x,y),5,255,-1)

    plt.imshow(gray),plt.show()
    """

    for i in range(4000):
        customLineDetect(dispImg, gray, int(random.random() * gray.shape[0]), int(random.random() * gray.shape[1]))

    plt.imshow(dispImg), plt.show()

# Is this pixel in a grayscale image black?


