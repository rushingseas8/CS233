console.log("Javascript file loaded.");

var mousedown = false;
var paths = [];
var currentPath = [];

var commandHeldDown = false;

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

    testPath = new path(currentPath);
    console.log(testPath);
    console.log(testPath.getStart());
    console.log(testPath.getEnd());

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
