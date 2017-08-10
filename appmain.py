from flask import Flask, current_app
app = Flask(__name__)

import cv2

@app.route("/")
def hello():
    return current_app.send_static_file('html/index.html')

if __name__ == "__main__":
    app.run(debug=True,host='0.0.0.0',port=5000)
