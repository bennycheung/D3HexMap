// hexglobe.js - convenience funciton to create a Hex Globe
// require: hexlib.js hexlib_ui.js
//

function makeHexOddR(svg, hexsize, width, height) {
  var hex_width = hexsize * 2 * Math.sin(Math.PI / 3);
  var hex_height = hexsize * 1.5;

  var grid_odd_r =  makeGridDiagram(d3.select(svg),
                      Grid.trapezoidalShape(0, (width/hex_width)-1, 0, height/hex_height, Grid.oddRToCube))
                        .addHexCoordinates(Grid.cubeToOddR, true, false)
                        .update(hexsize*2, true);
  grid_odd_r.width = width;
  grid_odd_r.height = height;
  return grid_odd_r;
}

function makeHexBinMap(grid_odd_r, hexbin_id, hexsize, image_url, width, height) {
  var hexbin = d3.hexbin()
      .size([width, height])
      .radius(hexsize);

  var color = d3.scale.linear()
      .domain([14, 15, 35, 132])
      .range(["#333", "#d7191c", "#ffffbf", "#2c7bb6"])
      .interpolate(d3.interpolateHcl);

  var canvas = d3.select(hexbin_id).append("canvas")
      .attr("width", width)
      .attr("height", height);

  var context = canvas.node().getContext("2d");
  var points = [];

  getHexGlobeImage(image_url, function(image) {
    context.drawImage(image, 0, 0, width, height);
    image = context.getImageData(0, 0, width, height);

    // Rescale the colors.
    for (var c, i = 0, n = width * height * 4, d = image.data; i < n; i += 4) {
      points.push([i/4%width, Math.floor(i/4/width), d[i]]);
    }

    var mapper = {};
    hexagons = hexbin(points);
    hexagons.forEach(function(d) {
      d.mean = d3.mean(d, function(p) { return p[2]; });
      d.x = d3.mean(d, function(p) { return p[0]; });
      d.y = d3.mean(d, function(p) { return p[1]; });

      var s = new ScreenCoordinate(d.x, d.y);
      s.scale(grid_odd_r.grid.scale / 2);
      d.cube = FractionalCube.cubeRound(grid_odd_r.grid.cartesianToHex(s));
      mapper[d.cube.toString()] = d.mean;
    });

    grid_odd_r.tiles
      .each(function(d) {
        d.center = grid_odd_r.grid.hexToCenter(d.cube);
        d.color = color(mapper[d.key]);
        d.node.select("polygon")
          .style("fill", d.color);
      });

    grid_odd_r.hexgrid = hexWorldGrid(grid_odd_r);
  });

  return grid_odd_r;
}

function getHexGlobeImage(path, callback) {
  var image = new Image();
  image.onload = function() {
    callback(image);
  };
  image.src = path;
}

function screenToLonLat(grid_odd_r, screenPoint) {
  var lon_intp = d3.interpolate(-180.0, 180.0);
  var lat_intp = d3.interpolate(-90.0, 90.0);
  var lon = lon_intp(screenPoint[0] / grid_odd_r.width);
  var lat = lat_intp(screenPoint[1] / grid_odd_r.height);
  // since screen coordinate is starting at the top-left corner
  // we need to invert the Y-axis, i.e. lat
  return [lon, -lat];
}

function hexToLonLatHex(grid_odd_r, hex) {
  var hexvertices = grid_odd_r.grid.polygonVertices();
  var center = grid_odd_r.grid.hexToCenter(hex);
  var hexpoints = [];
  hexvertices.forEach(function(v,i) {
      var sx = center.x + v.x;
      var sy = center.y + v.y;
      var lonlat = screenToLonLat(grid_odd_r, [sx, sy]);
      hexpoints.push(lonlat);
  });
  hexpoints.push(hexpoints[0]); // close the polygon
  hexpoints.reverse(); // polygon needs to arrange in counter-clockwise

  return hexpoints;
}

function hexWorldGrid(grid_odd_r) {
  var hgrid = [];

  grid_odd_r.tiles
    .each(function(d) {
      if (d.center !== undefined) {
        hexpoints = hexToLonLatHex(grid_odd_r, d.cube);
        var feature = {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: hexpoints
          },
          properties: {
            "color": d.color
          }
        };
        hgrid.push(feature);
      }

    });

  console.log("HexGrid size is " + hgrid.length);
  return {
    type: "FeatureCollection",
    features: hgrid
  };

}
