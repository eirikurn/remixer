// Generated by CoffeeScript 1.3.3
(function() {
  var Loader;

  window.Loader = Loader = {
    files: {},
    progress: ko.observable(),
    loadSoundFromUrl: function(url, cb1, cb2) {
      var xhr,
        _this = this;
      xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'arraybuffer';
      xhr.onprogress = function(ev) {
        return Loader.progress(ev.loaded / ev.total);
      };
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
      reader.onprogress = function(ev) {
        return Loader.progress(ev.loaded / ev.total);
      };
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
      xhr.onprogress = function(ev) {
        return Loader.progress(ev.loaded / ev.total);
      };
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
      xhr.onprogress = function(ev) {
        return Loader.progress(ev.loaded / ev.total);
      };
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

}).call(this);