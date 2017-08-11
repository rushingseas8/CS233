from flask import Flask, current_app, request, jsonify
app = Flask(__name__)

from sklearn.metrics.pairwise import pairwise_distances

import numpy as np
import cv2

import math
import random

from kmedoids import kMedoids

@app.route("/")
def hello():
    return current_app.send_static_file('html/index.html')

def unpack(p):
    return (p["x"], p["y"])

def magnitude(x1, y1, x2, y2):
    dx = x2 - x1
    dy = y2 - y1
    return math.sqrt( (dx * dx) + (dy * dy) )

def dot(x1, y1, x2, y2, x3, y3):
    dx1, dy1 = x2 - x1, y2 - y1
    dx2, dy2 = x3 - x2, y3 - y2

    return (dx1 * dx2) + (dy1 * dy2)

def angleBetween(p1, p2, p3):
    #x1, y1 = p1["x"], p1["y"]
    #x2, y2 = p2["x"], p2["y"]
    #x3, y3 = p3["x"], p3["y"]

    x1, y1 = unpack(p1)
    x2, y2 = unpack(p2)
    x3, y3 = unpack(p3)

    AB = magnitude(x1, y1, x2, y2)
    BC = magnitude(x2, y2, x3, y3)
    DOT = dot(x1, y1, x2, y2, x3, y3)

    if AB == 0 or BC == 0:
        return None

    angle = DOT / (AB * BC)
    if angle < -1.0 or angle > 1.0:
        return None

    theta = math.acos(angle)
    return theta
    

# TODO: take 5 length runs. Do parabolic interpolation for first 3 and last
# 3, then take the normal of both at the middle node. Then measure the
# angle those make. If > 80 degrees, this is a corner node.
#
# Simpler (1D test): 3 nodes. Line between first 2 and last 2; angle between.
# Or possibly just dot product type of deal.
def cornerDetectSimple(path):
    minTheta = math.radians(45)
    #print("MIN THETA: " + str(minTheta))
    possibleCorners = []
    """
    for i in range(len(path) - 2):
        x1, y1 = path[i]["x"], path[i]["y"]
        x2, y2 = path[i+1]["x"], path[i+1]["y"]
        x3, y3 = path[i+2]["x"], path[i+2]["y"]

        print("Points " + str(path[i]) + ", " + str(path[i+1]) + ", " + str(path[i+2]))

        AB = magnitude(x1, y1, x2, y2)
        BC = magnitude(x2, y2, x3, y3)
        DOT = dot(x1, y1, x2, y2, x3, y3)

        if AB == 0 or BC == 0:
            continue

        angle = DOT / (AB * BC)
        if angle < -1.0 or angle > 1.0:
            continue

        theta = math.acos(angle)
        print(theta)
        if theta > minTheta:
            possibleCorners.append((x2, y2))
    """

    for i in range(len(path) - 2):
        angle = angleBetween(path[i], path[i+1], path[i+2])
        if angle > minTheta:
            possibleCorners.append((path[i+1]["x"], path[i+1]["y"]))
    return possibleCorners

def cornerDetectSimpleDist(path, N):
    minTheta = math.radians(45)
    possibleCorners = []

    # If this is a loop, "wrap around" the list to ensure last N points work.
    if path[0] == path[len(path) - 1]:
        for i in range(N, 0, -1):
            path.append(path[i])

    for i in range(len(path) - (2 * N)):
        angle = angleBetween(path[i], path[i + N], path[i + (2 * N)])
        if angle > minTheta:
            possibleCorners.append(unpack(path[i + N]))
    return possibleCorners

# Attempts to find a triange within the provided path data.
# TODO: the accuracy measurement can do a random simulation of points within
# the actual path triangle, and with the triangle we are guessing. The number
# of points in common over the total number of points in the actual path is
# the accuracy. Come to think of it, we can probably do a convex hull algorithm
# to find the best fitting triangle around the path, and use that to measure if
# this is a triangle or not. Hmm..
def findTriangle(path):
    # Run "cornerDetectSimple" using dist from 1-10. Gather a count
    # of how many times each point appears in each. Ideally, the more
    # likely a point is to be a corner, the more of the algorithms will
    # detect that point.
    countDict = {}
    for i in range(1, 10):
        corners = cornerDetectSimpleDist(path, i)
        for corner in corners:
            if corner in countDict:
                countDict[corner] += 1
            else:
                countDict[corner] = 1
    
    # Convert to np array and run the k-medoid algorithm to cluster the
    # points into groups. We fix the medoid count to 3, since we're looking
    # for the three corners of a triangle.
    data = np.array(countDict.keys())
    M, C = kMedoids(pairwise_distances(data, metric="euclidean"), 3, 10000)
    
    # Generate the centroid of the clusters. This is our guess for the triangle
    # formed by this path.
    centers = []
    for label in C:
        sublist = []
        for point_idx in C[label]:
            sublist.append(data[point_idx])
        centers.append(calculateCenter(sublist))
    
    # Distance from line 1 to a point
    """
    def dist1(x0, y0):
        x1, y1 = centers[0,0], centers[0,1]
        x2, y2 = centers[1,0], centers[1,1]

        return ( abs( ((y2 - y1) * x0) - ((x2 - x1) * y0) + (x2 * y1) - (y2 * x1)) / math.sqrt( ((y2 - y1) ** 2) + ((x2 - x1) ** 2) ) )
    """

    def distFromLineToPoint(p1, p2):
        x1, y1 = p1[0], p1[1]
        x2, y2 = p2[0], p2[1]
        
        def dist(x0, y0):
            return ( abs( ((y2 - y1) * x0) - ((x2 - x1) * y0) + (x2 * y1) - (y2 * x1)) / math.sqrt( ((y2 - y1) ** 2) + ((x2 - x1) ** 2) ) )
        return dist


    # We can now validate how close we are by measuring how many points on
    # the path lie on our guess triangle (within a small delta).
    distLine1 = distFromLineToPoint(centers[0], centers[1])
    distLine2 = distFromLineToPoint(centers[1], centers[2])
    distLine3 = distFromLineToPoint(centers[0], centers[2])

    maxError = 2.0
    onPath = 0
    for point in path:
        x, y = unpack(point)
        minDist = min(min(distLine1(x, y), distLine2(x, y)), distLine3(x, y))
        if minDist < maxError:
            onPath += 1

    # Sort the corners by best, for displaying
    sortedCorners = sorted(countDict.items(), key=lambda x: x[1], reverse=True)
    #print("Found " + str(onPath) + " elements on the path out of " + str(len(path)) + ".")
    return { 
        "corners": sortedCorners,
        "centers": centers,
        "accuracy": float(onPath) / len(path)
    }

# Calculates the rough center of a list of points.
def calculateCenter(points):
    # By means of average
    ax = 0
    ay = 0
    for x, y in points:
        ax += x
        ay += y
    return (ax / len(points), ay / len(points))

@app.route("/processPaths", methods=['POST'])
def acceptPaths():
    path = request.get_json()["path"]
    #for p in path:
    #    x = p["x"]
    #    y = p["y"]
    #    print(x, y)
    
    """
    countDict = {}
    for i in range(1, 10):
        corners = cornerDetectSimpleDist(path, i)
        for corner in corners:
            if corner in countDict:
                countDict[corner] += 1
            else:
                countDict[corner] = 1

    print(countDict.keys())

    #bestCorners = {k:v for k,v in countDict.iteritems() if v > 5}
    #print("Best: " + str(bestCorners))

    cornersAgg = countDict.keys()
    data = np.array(cornersAgg)
    print(data)
    M, C = kMedoids(pairwise_distances(data, metric="euclidean"), 3, 10000)

    print(M)
    print(C)

    #for label in C:
    #    for point_idx in C[label]:
    #        print("label {0}: {1}".format(label, data[point_idx]))


    centers = []
    for label in C:
        sublist = []
        for point_idx in C[label]:
            sublist.append(data[point_idx])
        centers.append(calculateCenter(sublist))
    
    for p in centers:
        print(p)

    sortedThing = sorted(countDict.items(), key=lambda x: x[1], reverse=True)
    """

    res = findTriangle(path)
    print("Accuracy: " + str(res["accuracy"]))

    #print(sortedThing)
    #print(path)
    #return {"corners": corners}
    #return jsonify(cornerDetectSimpleDist(path, 5))
    #return jsonify(sortedThing)
    return jsonify({ "corners": res["corners"], "centers": res["centers"], "accuracy": res["accuracy"]})

if __name__ == "__main__":
    app.run(debug=True,host='0.0.0.0',port=5000)
