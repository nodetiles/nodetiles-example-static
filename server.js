/**
 * 
 *
 *
 * EXAMPLE SERVER
 * (this server is unnecessary if you are using the `nodetiles` command line tool)
 *
 * You can run this server using `node server`
 * (be sure you run `npm install` first to install dependencies)
 *
 *
 *
 */

// Basic configuration
var PORT = process.env.PORT || process.argv[2] || 3000;
var DEBUG = true;

var path = require('path'),
    express = require('express'),
    app = module.exports = express(),
    fs = require('fs');

//
// Setup the map
//
var nodetiles = require('nodetiles-core'),
    GeoJsonSource = nodetiles.datasources.GeoJson,
    Projector = nodetiles.projector;

var map = new nodetiles.Map();
map.addData(new GeoJsonSource({ 
  name: "world",
  path: __dirname + '/map/data/countries.geojson', 
  projection: "EPSG:900913"
}));
map.addData(new GeoJsonSource({ 
  name: "example",
  path: __dirname + '/map/data/example.geojson', 
  projection: "EPSG:4326"
}));
map.addStyle(fs.readFileSync('./map/theme/style.mss','utf8'));

//
// Configure Express routes
// 
app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  
  // Backbone routing
  app.use('/assets', express.static(__dirname + '/assets'));  
});

app.configure('production', function(){
  app.use(express.errorHandler());
  io.set('log level', 1); // reduce logging
  
  // Backbone routing: compilation step is included in `npm install` script
  app.use('/app', express.static(__dirname + '/dist/release'));
  app.use(express.static(__dirname + '/public'));
});

// web mercator bounds in lat/lon 
//EXTENT="-180 -85.05112878 180 85.05112878"
//
// 3. Serve the map image, size `size` center at `lon,lat`

app.get('/static/map.png', function img(req, res) {
  getImg([-170, -57.0511], [170, 75.0511], 800, 500, "EPSG:900913", res);
});

app.get('/static/:lonMin/:latMin/:lonMax/:latMax/:width/:height/:proj/map.png', function img(req, res) {
  var proj = "EPSG:"+req.params.proj;
  getImg([req.params.lonMin, req.params.latMin].map(parseFloat),[req.params.lonMax, req.params.latMax].map(parseFloat), parseInt(req.params.width,10), parseInt(req.params.height,10), proj, res);
});

app.get('/static/:lonMin/:latMin/:lonMax/:latMax/:width/:height/map.png', function img(req, res) {
  var proj = "EPSG:900913";
  getImg([req.params.lonMin, req.params.latMin].map(parseFloat),[req.params.lonMax, req.params.latMax].map(parseFloat), parseInt(req.params.width,10), parseInt(req.params.height,10), proj, res);
});

function getImg(min, max, width, height, proj, res) {
  map.projection = proj;
  var pMin = Projector.project.Point("EPSG:4326", proj, min);
  var pMax = Projector.project.Point("EPSG:4326", proj, max);
  // verify arguments
  //if (! || tileCoordinate.length != 3) {
  //  res.send(404, req.url + 'not a coordinate, match =' + tileCoordinate);
  //  return;
 // }
  // set the bounds and render
  map.render(pMin[0],pMin[1], pMax[0], pMax[1], width, height, function(error, canvas) {
    if (error){
      console.error(error);
    }
    var stream = canvas.createPNGStream();
    stream.pipe(res);
  });
}
    
app.listen(PORT);
console.log("Express server listening on port %d in %s mode", PORT, app.settings.env);
