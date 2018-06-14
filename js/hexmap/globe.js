
var width = 360,
height = 360,
speed = 0.05,
start = Date.now,
sens = 0.4

var deltaX = 0,
deltaY = 0,
currentZ = 0

var targetX = 0,
targetY = 0,
targetZ = 0

var currentX = 0,
currentY = 0,
dx = 0,
dy = 0
counter = 0;
targetCounter = 0;

var manual = true;
var reticule;

var sphere = {type: "Sphere"};

var projection = d3.geo.orthographic()
.scale(width / 2.1)
.clipAngle(90)
.translate([width / 2, height / 2]);

var graticule = d3.geo.graticule();

reticule = d3.select("canvas").insert("circle")
.attr('r', 50)

var canvas = d3.select("#globecontainer").append("canvas")
.attr("width", width)
.attr("height", height)
.call(d3.behavior.drag()
.origin(function() { var r = projection.rotate(); return {x: r[0] / sens, y: -r[1] / sens}; })
.on("drag", function() {
  var rotate = projection.rotate();
  targetX = deltaX = d3.event.x * sens;
  targetY = deltaY = d3.event.y * sens;
  targetZ = currentZ = rotate[2];
  projection.rotate([deltaX, -deltaY, currentZ]);

  manual = true;

}));


function updateGlobe(lon, lat){

  manual = false;

  var rad = Math.PI / 180.0;
  targetX = -lon;
  targetY = -lat;

  var r = projection.rotate();
  currentX = r[0];
  currentY = r[1];

  dx = (targetX - currentX) * speed;
  dy = (targetY - currentY) * speed;

  counter = 0;
  targetCounter = 1/speed;
  //targetZ = width/2 * Math.cos(lat * rad);
}

var context = canvas.node().getContext("2d");

var path = d3.geo.path()
.projection(projection)
.context(context)


d3.json("data/world-110m.json", function(error, topo) {
  if (error) throw error;

  var land = topojson.feature(topo, topo.objects.land),
  grid = graticule();

  d3.timer(function() {
    // var λ = speed * (Date.now() - start),
    //     φ = -50;
    //     γ = 0;
    context.clearRect(0, 0, width, height);

    context.beginPath();
    path(sphere);
    context.lineWidth = 3;
    context.strokeStyle = "#000";
    context.stroke();
    context.fillStyle = "#fff";
    context.fill();

    context.save();
    context.translate(width / 2, 0);
    context.scale(-1, 1);
    context.translate(-width / 2, 0);
    context.restore();

    if (counter != targetCounter){
      var r = projection.rotate();


      var newRotation = [r[0] + dx, r[1] + dy, targetZ];

      counter++;
      projection.rotate(newRotation);
    }


    // context.beginPath();
    // path(grid);
    // context.lineWidth = .5;
    // context.strokeStyle = "rgba(119,119,119,.5)";
    // context.stroke();

    // context.beginPath();
    // path(land);
    // context.fillStyle = "#737368";
    // context.fill();
    // context.lineWidth = .5;
    // context.strokeStyle = "#000";
    // context.stroke();

    // context.beginPath();
    // path(hexgrid);
    // context.fillStyle = "#732222";
    // context.fill();
    // context.lineWidth = .5;
    // context.strokeStyle = "rgba(0,0,119,.5)";
    // context.stroke();

    grid_odd_r.hexgrid.features.forEach(function(d, i) {
      context.beginPath();
      path(d);
      context.fillStyle = d.properties.color;
      context.fill();
      context.lineWidth = .5;
      context.strokeStyle = "rgba(0,0,119,.5)";
      context.stroke();
    });

    if(!manual){
      context.beginPath();
      context.arc(width/2, width/2, 3, 0, 2 * Math.PI, false);
      context.fillStyle = 'red';
      context.fill();
      context.strokeStyle = '#ff3300';
      context.stroke();
    }


    // if (!manual){
    //   reticule.style("visibility", "visible");
    // }
    // else{
    //   reticule.style("visibility", "visible");
    // }

  }, 300);
});

d3.select(self.frameElement).style("height", height + "px");
