console.log("Javascript file loaded.");

var mousedown = false;
var paths = [];
var currentPath = [];

var commandHeldDown = false;

function point(x, y) {
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
  this.paths = pathArr;
  this.getStart = function() {
    return this.paths[0];
  }
  this.getEnd = function() {
    return this.paths[this.paths.length - 1];
  }
}

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
      ctx.beginPath();
      ctx.moveTo(currentPath[currentPath.length - 1].x, currentPath[currentPath.length - 1].y);
      ctx.lineTo(currentPath[0].x, currentPath[0].y);
      ctx.stroke();

      currentPath[currentPath.length - 1] = currentPath[0];
    }

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
