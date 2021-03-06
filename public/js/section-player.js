// Generated by CoffeeScript 1.3.3
(function() {
  var BlobBuilder, Clip, Loader, Mix, Player, Song, TestViewModel, Track, WebAudio, audioContext, exports, requestAnimationFrame,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  exports = window;

  audioContext = window.audioContext || window.webkitAudioContext;

  requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || mozRequestAnimationFrame;

  BlobBuilder = window.BlobBuilder || window.WebkitBlobBuilder || window.MozBlobBuilder;

  Loader = {
    files: {},
    loadSoundFromUrl: function(url, cb1, cb2) {
      var xhr,
        _this = this;
      xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function() {
        WebAudio.context.decodeAudioData(xhr.response, cb1);
        return _this.analyze(url, xhr.response, cb2);
      };
      return xhr.send();
    },
    loadSoundFromFile: function(file, cb1, cb2) {
      var reader,
        _this = this;
      reader = new FileReader();
      reader.onload = function() {
        WebAudio.context.decodeAudioData(reader.result, cb1);
        return _this.analyze(file.name, reader.result, cb2);
      };
      return reader.readAsArrayBuffer(file);
    },
    analyze: function(name, data, cb) {
      var formData, xhr,
        _this = this;
      formData = new FormData();
      formData.append('track', new Blob([data]), name);
      xhr = new XMLHttpRequest();
      xhr.open('POST', '/analyze/', true);
      xhr.onload = function() {
        return cb(JSON.parse(xhr.response));
      };
      return xhr.send(formData);
    },
    convertToMp3: function(buffer, cb) {
      var formData, wav, xhr,
        _this = this;
      wav = this._convertToWav(buffer);
      formData = new FormData();
      formData.append('track', new Blob([wav]));
      xhr = new XMLHttpRequest();
      xhr.open('POST', '/export/', true);
      xhr.onload = function() {
        return cb(xhr.response);
      };
      return xhr.send(formData);
    },
    _convertToWav: (function() {
      var writeAudioBuffer, writeInt16, writeInt32, writeString;
      writeString = function(s, a, offset) {
        var c, i, _i, _len, _results;
        _results = [];
        for (i = _i = 0, _len = s.length; _i < _len; i = ++_i) {
          c = s[i];
          _results.push(a[offset + i] = c.charCodeAt(0));
        }
        return _results;
      };
      writeInt16 = function(n, a, offset) {
        n = n | 0;
        a[offset + 0] = n & 255;
        return a[offset + 1] = (n >> 8) & 255;
      };
      writeInt32 = function(n, a, offset) {
        n = n | 0;
        a[offset + 0] = n & 255;
        a[offset + 1] = (n >> 8) & 255;
        a[offset + 2] = (n >> 16) & 255;
        return a[offset + 3] = (n >> 24) & 255;
      };
      writeAudioBuffer = function(buffer, a, offset) {
        var bufferL, bufferR, i, n, sampleL, sampleR;
        i = 0;
        n = buffer.length;
        bufferL = buffer.getChannelData(0);
        bufferR = buffer.getChannelData(1);
        while (i++ < n) {
          sampleL = bufferL[i] * 32768.0;
          sampleR = bufferR[i] * 32768.0;
          if (sampleL < -32768) {
            sampleL = -32768;
          }
          if (sampleL > 32767) {
            sampleL = 32767;
          }
          if (sampleR < -32768) {
            sampleR = -32768;
          }
          if (sampleR > 32767) {
            sampleR = 32767;
          }
          writeInt16(sampleL, a, offset);
          writeInt16(sampleR, a, offset + 2);
          offset += 4;
        }
      };
      return function(buffer) {
        var bitsPerSample, blockAlign, byteRate, chunkSize, frameLength, headerLength, numChannels, sampleRate, subChunk1Size, subChunk2Size, totalLength, wavDataLength, waveFileData;
        frameLength = buffer.length;
        numChannels = buffer.numberOfChannels;
        sampleRate = buffer.sampleRate;
        bitsPerSample = 16;
        byteRate = sampleRate * numChannels * bitsPerSample / 8;
        blockAlign = numChannels * bitsPerSample / 8;
        wavDataLength = frameLength * numChannels * 2;
        headerLength = 44;
        totalLength = headerLength + wavDataLength;
        waveFileData = new Uint8Array(totalLength);
        subChunk1Size = 16;
        subChunk2Size = wavDataLength;
        chunkSize = 4 + (8 + subChunk1Size) + (8 + subChunk2Size);
        writeString('RIFF', waveFileData, 0);
        writeInt32(chunkSize, waveFileData, 4);
        writeString('WAVE', waveFileData, 8);
        writeString('fmt ', waveFileData, 12);
        writeInt32(subChunk1Size, waveFileData, 16);
        writeInt16(1, waveFileData, 20);
        writeInt16(numChannels, waveFileData, 22);
        writeInt32(sampleRate, waveFileData, 24);
        writeInt32(byteRate, waveFileData, 28);
        writeInt16(blockAlign, waveFileData, 32);
        writeInt32(bitsPerSample, waveFileData, 34);
        writeString('data', waveFileData, 36);
        writeInt32(subChunk2Size, waveFileData, 40);
        writeAudioBuffer(buffer, waveFileData, 44);
        return waveFileData;
      };
    })()
  };

  exports.WebAudio = WebAudio = {
    context: new audioContext(),
    playSound: function(buffer, start, duration, delay) {
      var source;
      if (duration == null) {
        duration = null;
      }
      if (delay == null) {
        delay = 0;
      }
      source = this.context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.context.destination);
      if (!duration) {
        duration = buffer.duration - start;
      }
      source.noteGrainOn(this.context.currentTime + delay, start, duration);
      return source;
    },
    stopSound: function(source, delay) {
      if (delay == null) {
        delay = 0;
      }
      return source.noteOff(this.context.currentTime + delay);
    },
    record: function(duration, action, cb) {
      var _this = this;
      this.context = new audioContext(2, duration * 44100, 44100);
      this.context.oncomplete = function(e) {
        _this.context = new audioContext();
        return cb(e.renderedBuffer);
      };
      action();
      return this.context.startRendering();
    }
  };

  exports.Player = Player = {
    playlist: [],
    cursor: {
      track: null,
      start: 0,
      current: ko.observable(0),
      duration: null
    },
    playing: false,
    setCursor: function(track, start, duration) {
      if (start == null) {
        start = 0;
      }
      if (duration == null) {
        duration = null;
      }
      if (this.cursor.track) {
        this.cursor.track.cursor = null;
      }
      this.cursor.track = track;
      this.cursor.start = start;
      this.cursor.current(start);
      this.cursor.duration = duration;
      track.cursor = this.cursor;
      if (this.playing) {
        return this.stop();
      }
    },
    stop: function() {
      this.playlist.forEach(function(s) {
        return WebAudio.stopSound(s);
      });
      this.playlist = [];
      this.cursor.current(this.cursor.start);
      return this.playing = false;
    },
    play: function() {
      if (this.cursor.track) {
        this.playlist = this.cursor.track.play(this.cursor.start, this.cursor.duration);
        this.initialTime = WebAudio.context.currentTime;
        this.endTime = this.initialTime + (this.cursor.duration || this.cursor.track.duration - this.cursor.start);
        this.playing = true;
        return this.updateCursor();
      }
    },
    updateCursor: function() {
      var currentTime;
      if (WebAudio.context.currentTime > this.endTime) {
        return this.stop();
      } else if (this.playing) {
        currentTime = WebAudio.context.currentTime - this.initialTime;
        this.cursor.current(this.cursor.start + currentTime);
        return requestAnimationFrame(this.updateCursor.bind(this));
      }
    }
  };

  Track = (function() {

    function Track() {}

    Track.prototype.duration = 0;

    Track.prototype.cursor = null;

    Track.prototype.play = function() {
      throw "Not implemented";
    };

    return Track;

  })();

  exports.Track = Track;

  Song = (function(_super) {

    __extends(Song, _super);

    function Song(buffer, waveform) {
      this.buffer = buffer;
      this.waveform = waveform;
      this.json = ko.observable({});
      this.duration = buffer.duration;
    }

    Song.prototype.play = function(start, duration) {
      var source;
      if (start == null) {
        start = 0;
      }
      if (duration == null) {
        duration = null;
      }
      source = WebAudio.playSound(this.buffer, start, duration);
      return [source];
    };

    return Song;

  })(Track);

  exports.Song = Song;

  Clip = (function() {

    function Clip(song, start, duration) {
      this.song = song;
      this.start = start;
      this.duration = duration;
    }

    return Clip;

  })();

  exports.Clip = Clip;

  Mix = (function(_super) {

    __extends(Mix, _super);

    function Mix() {
      this.clips = [];
      this.duration = 0;
    }

    Mix.prototype.addClip = function(clip) {
      this.clips.push(clip);
      return this.duration += clip.duration;
    };

    Mix.prototype.play = function(start, duration) {
      var allowedDuration, end, foundEnd, foundStart, sources, totalDuration;
      if (start == null) {
        start = 0;
      }
      if (duration == null) {
        duration = null;
      }
      end = duration ? start + duration : this.duration;
      allowedDuration = duration || this.duration - start;
      foundStart = false;
      foundEnd = false;
      totalDuration = 0;
      sources = [];
      this.clips.forEach(function(clip) {
        var clipDuration, clipStart, offset, source;
        if (foundEnd) {
          return;
        }
        clipStart = clip.start;
        clipDuration = clip.duration;
        if (!foundStart && totalDuration + clip.duration > start) {
          foundStart = true;
          offset = start - totalDuration;
          clipStart += offset;
          clipDuration -= offset;
        }
        if (!foundEnd && totalDuration + clip.duration >= end) {
          foundEnd = true;
          clipDuration -= totalDuration + clip.duration - end;
        }
        if (foundStart) {
          source = WebAudio.playSound(clip.song.buffer, clipStart, clipDuration, totalDuration - start);
          sources.push(source);
        }
        return totalDuration += clip.duration;
      });
      return sources;
    };

    return Mix;

  })(Track);

  exports.Mix = Mix;

  TestViewModel = (function() {

    function TestViewModel() {
      this.fileHover = __bind(this.fileHover, this);

      this.loadedAnalysis = __bind(this.loadedAnalysis, this);

      this.loadedBuffer = __bind(this.loadedBuffer, this);

      this.fileSelect = __bind(this.fileSelect, this);
      this.sections = ko.observableArray();
      this.loadingStatus = ko.observable("");
      this.chosenSong = ko.observable(false);
      this.song = ko.observable();
      this.mix = new Mix();
      $('#fileinput').on('change', this.fileSelect);
      $('#filedrag').on('dragover', this.fileHover);
      $('#filedrag').on('dragleave', this.fileHover);
      $('#filedrag').on('drop', this.fileSelect);
    }

    TestViewModel.prototype.fileSelect = function(e) {
      var file;
      this.fileHover(e);
      this.chosenSong(true);
      file = (e.target.files || e.originalEvent.dataTransfer.files)[0];
      Loader.loadSoundFromFile(file, this.loadedBuffer, this.loadedAnalysis);
      return this.loadingStatus("Loading track");
    };

    TestViewModel.prototype.loadAdele = function() {
      this.chosenSong(true);
      Loader.loadSoundFromUrl('/mp3/adele.m4a', this.loadedBuffer, this.loadedAnalysis);
      return this.loadingStatus("Downloading track");
    };

    TestViewModel.prototype.loadedBuffer = function(buffer) {
      var waveform;
      waveform = this.generateWaveform(buffer);
      window.song = this.song(new Song(buffer, waveform));
      Player.setCursor(this.song());
      return this.loadingStatus("Analysing track");
    };

    TestViewModel.prototype.exportMp3 = function() {
      var _this = this;
      return WebAudio.record(this.mix.duration, function() {
        return _this.mix.play();
      }, function(buffer) {
        return Loader.convertToMp3(buffer, function(url) {
          return location.href = url;
        });
      });
    };

    TestViewModel.prototype.generateWaveform = function(buffer) {
      var canvas;
      canvas = $('<canvas width="1800" height="280">')[0];
      WaveSurfer.Drawer.init({
        canvas: canvas,
        color: '#efefef'
      });
      WaveSurfer.Drawer.drawBuffer(buffer);
      return canvas.toDataURL('image/png');
    };

    TestViewModel.prototype.loadedAnalysis = function(analysis) {
      this.song().json(analysis);
      return this.loadingStatus("");
    };

    TestViewModel.prototype.fileHover = function(e) {
      e.stopPropagation();
      e.preventDefault();
      return $(e.target).toggleClass('hover', e.type === 'dragover');
    };

    TestViewModel.prototype.playSection = function(section) {
      Player.setCursor(this.song(), section.start, section.duration);
      return Player.play();
    };

    TestViewModel.prototype.addToMix = function(section) {
      return this.mix.addClip(new Clip(this.song(), section.start, section.duration));
    };

    return TestViewModel;

  })();

  exports.TestViewModel = TestViewModel;

}).call(this);
