
/**
 * Module dependencies.
 */
var express = require('express')
  , echonest = require('./echonest')
  , fs = require('fs')
  , http = require('http')
  , lame = require('lame')
  , os = require('os')
  , path = require('path');


/**
 * Settings
 */
var UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'tmp');


/**
 * Setup and configure express.
 */
var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.multipart({ uploadDir: UPLOAD_DIR }));
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});


/**
 * Forwards a audio file to echonest for analization.
 */
app.post('/analyze/', function(req, res) {
  var track = req.files.track
    , trackBuffer = fs.readFileSync(track.path)
    , filetype = path.extname(track.filename).slice(1);

  echonest.analyze(trackBuffer, filetype, function(err, data) {
    var a = data.analysis;
    res.send({meta: a.meta, sections: a.sections, bars: a.bars});
    fs.unlink(track.path);
  });
});


/**
 * Converts a wav input to a mp3 file.
 */
app.post('/export/', function(req, res) {
  var wavPath = req.files.track.path
    , wavFile = fs.createReadStream(wavPath)
    , mp3Path = wavPath + '.mp3'
    , mp3File = fs.createWriteStream(mp3Path)
    , encoder = new lame.Encoder();

  wavFile.pipe(encoder);
  encoder.pipe(mp3File)

  encoder.on('end', function() {
    res.send("/download/" + path.basename(mp3Path));
    fs.unlink(wavPath);
  });
});


/**
 * Downloads a generated mp3 file.
 */
app.get('/download/:filename', function(req, res) {
  var mp3Path = path.join(UPLOAD_DIR, req.params.filename);
  res.download(mp3Path, 'remix.mp3', function() {
    fs.unlink(mp3Path);
  });
});


/**
 * Start our server.
 */
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
