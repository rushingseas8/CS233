from flask import Flask, current_app, request
app = Flask(__name__)

import cv2

@app.route("/")
def hello():
    return current_app.send_static_file('html/index.html')

# TODO: take 5 length runs. Do parabolic interpolation for first 3 and last
# 3, then take the normal of both at the middle node. Then measure the
# angle those make. If > 80 degrees, this is a corner node.
#
# Simpler (1D test): 3 nodes. Line between first 2 and last 2; angle between.
# Or possibly just dot product type of deal.
def cornerDetect(path):
    return None

@app.route("/processPaths", methods=['POST'])
def acceptPaths():
    path = request.get_json()["path"]
    for p in path:
        x = p["x"]
        y = p["y"]
        print(x, y)
    #print(path)
    return "test"

if __name__ == "__main__":
    app.run(debug=True,host='0.0.0.0',port=5000)
