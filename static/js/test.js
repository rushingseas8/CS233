console.log("Javascript file loaded.");

var mousedown = false;
var paths = [];
var currentPath = [];

var commandHeldDown = false;

function point(x, y) {
  this.type = "point";
  this.x = x;
  this.y = y;

  // TODO add better error checking here
  this.distanceTo = function(otherPoint) {
    return Math.sqrt(Math.pow(otherPoint.x - this.x, 2) + Math.pow(otherPoint.y - this.y, 2));
  }
}

function distanceBetween(point1, point2) {
  return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
}

function path(pathArr) {
  this.type = "path";

  if (pathArr.length > 0 && pathArr[0].type == "path") {
    this.pathArr = pathArr;
  } else {
    console.log("Failed to create path: pathArr contains non-point objects");
    this.pathArr = null;
  }

  this.getStart = function() {
    return this.paths[0];
  }
  this.getEnd = function() {
    return this.paths[this.paths.length - 1];
  }

  this.mergeWith = function(other) {
    if (this.getEnd().distanceTo(other.getStart()) < 25.0) {
      this.pathArr = this.pathArr.concat(other.pathArr);
      other.pathArr = null;
    }
  }
}

/*
function attemptAllMerges() {
  var allStarts = [];
  var allEnds = [];
  for (var i = 0; i < paths.length; i++) {
    allStarts.append(paths[i][0]);
    allEnds.append(paths[i][paths[i].length - 1]);
  }

  // go through all start/ends
  for (var i = 0; i < paths.length; i++) {
    // make a list of all distances, sort by < mergeThreshold, sort low->high
    //var distStarts = [];
    var distEnds = []
    for (int j = 0; j < paths.length; j++) {
      if (i != j) {
        distEnds.append(allStarts[i] - allEnds[j]);
      }
    }

    distEnds = distEnds
      .filter(function(dist) { return dist < 25.0 })
      .sortby(function(a, b) { return a < b; });

    if (distEnds.length > 0) {

    }
  }
}
*/

/*
  Some todos:
    - add a toolbar
    - add some buttons (namely, a "process" button)
    - automatically determine if we can "merge" two paths together once the
        "process" button is pressed. this is based on distance of start/end
        points, and if they're not already path of some logic gate
    - try to find a solution to determining what paths are logic gates
       (neural nets? machine learning? brute force?)
    - try to find a way to recognize characters drawn on screen
 */

$(document).ready(function() {
  var canvas = document.getElementById("drawingCanvas");
  var ctx = canvas.getContext("2d");

  // TODO: avoid magic numbers; see https://www.html5rocks.com/en/tutorials/canvas/hidpi/
  canvas.width = window.innerWidth * 2;
  canvas.height = window.innerHeight * 2;
  ctx.scale(2, 2);

  // TODO: add in canvas resizing functionality

  $("#drawingCanvas").mousedown(function(event) {
    mousedown = true;
  });

  $("#drawingCanvas").mouseup(function(event) {
    mousedown = false;
    //console.log("Path generated: " + JSON.stringify(currentPath));
    //ctx.closePath();

    currentPathObj = new path(currentPath);

    // TODO: remove the magic number (should be some function of path size, bounds
    // of the whole path, canvas size, etc.)
    if (distanceBetween(currentPath[0], currentPath[currentPath.length - 1]) < 25.0) {
      // TODO: better merge algorithm. Try to "curve" the points in a way that
      // approximates moving the whole line.
      //
      // Better 1: last 10 points should be averaged between current position and
      // the start of the path
      //
      // Better 2: Find out where the approximate line is (take at least 3 points
      // and keep adding more while they improve the line of best fit; stop when
      // the accuracy diminishes); adjust all those points to point to start node
      // rather than end node.
      //
      // Also try: Use the last 3 points in the path as an input to the interpolation
      // line between the last and first point.
      ctx.beginPath();
      ctx.moveTo(currentPath[currentPath.length - 1].x, currentPath[currentPath.length - 1].y);
      ctx.lineTo(currentPath[0].x, currentPath[0].y);
      ctx.stroke();

      currentPath[currentPath.length - 1] = currentPath[0];
    }

    /*
    var curStart = currentPath[0];
    var curEnd = currentPath[currentPath.length - 1];
    var merged = false;
    for (var i = 0; i < paths.length; i++) {
      var pathStart = paths[i][0];
      var pathEnd = paths[i][paths[i].length - 1];

      if (distanceBetween(curEnd, pathStart) < 25.0) {
        console.log("End of current close to start. Merging.");
      }

      if (distanceBetween(curStart, pathEnd) < 25.0) {
        console.log("Start of current close to end. Merging.");
      }

      if (distanceBetween(curStart, pathStart) < 25.0) {
        console.log("Starts close. Reverse merging.");
      }

      if (distanceBetween(curEnd, pathEnd) < 25.0) {
        console.log("Ends close. Reverse merging.");
      }
    }
    */

    /*
    for (var i = 0; i < currentPath.length; i++) {
      ctx.beginPath();
      ctx.arc(currentPath[i].x, currentPath[i].y, 2, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'blue';
      ctx.fill();
      ctx.stroke();
    }
    */

    $.ajax({
      type: 'POST',
      url: '/processPaths',
      data: JSON.stringify({ path: currentPath }),
      success: function(data) {
        console.log(JSON.stringify(data));

        var corners = data.corners;
        var centers = data.centers;

        for (var i = 0; i < corners.length; i++) {
          dataElement = corners[i];
          coord = dataElement[0];
          power = dataElement[1];

          ctx.beginPath();
          ctx.arc(coord[0], coord[1], power, 0, 2 * Math.PI, false);
          ctx.fillStyle = 'red';
          ctx.fill();
          ctx.stroke();
        }

       for (var i = 0; i < centers.length; i++) {
         ctx.beginPath();
         ctx.arc(centers[i][0], centers[i][1], 5, 0, 2 * Math.PI, false);
         ctx.fillStyle = 'blue';
         ctx.fill();
         ctx.stroke();
       }
      },
      contentType: "application/json",
      dataType: 'json'
    });

    if (currentPath.length > 0) {
      paths.push(currentPath);
    }
    currentPath = [];
    //console.log("All paths thus far: " + JSON.stringify(paths));
  });

  $("#drawingCanvas").mousemove(function(event) {
    if(mousedown) {
      var currentPoint = { x: event.pageX, y: event.pageY };
      if (currentPath.length > 0) {
        lastPoint = currentPath[currentPath.length - 1];

        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.stroke();
      }
      currentPath.push(currentPoint);
    }
  });

  $(document).keydown(function(event) {
    var kc = event.keyCode;
    if(kc == 91 || kc == 93 || kc == 17 || kc == 224) {
      commandHeldDown = true;
    }
    if (event.key == "z" && commandHeldDown) {
      paths.pop();
      clearScreen(canvas);
      drawPaths(canvas);
    }
  });

  $(document).keyup(function(event) {
    var kc = event.keyCode;
    if(kc == 91 || kc == 93 || kc == 17 || kc == 224) {
      commandHeldDown = false;
    }
  });
});

// Clears the screen
function clearScreen(canvas) {
  var ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Draws every path in "paths"
function drawPaths(canvas) {
  var ctx = canvas.getContext("2d");
  for (var i = 0; i < paths.length; i++) {
    if (paths[i].length <= 1) { continue; }

    var last, cur;
    for (var j = 0; j < paths[i].length - 1; j++) {
      last = paths[i][j];
      cur = paths[i][j + 1];

      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(cur.x, cur.y);
      ctx.stroke();
    }
  }
}
