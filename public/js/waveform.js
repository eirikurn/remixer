'use strict';
// This file is borrowed from https://github.com/katspaugh/wavesurfer.js
// Thanks.

window.WaveSurfer = {};

WaveSurfer.Drawer = {
  init: function (params) {
    this.canvas = params.canvas;

    this.cc = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    if (params.color) {
      this.cc.fillStyle = params.color;
    }
  },

  drawBuffer: function (buffer) {
    // Frames per pixel
    var k = buffer.getChannelData(0).length / this.width;
    var slice = Array.prototype.slice;
    var numChannels = buffer.numberOfChannels;
    var channelData = [];

    for (var c = 0; c < numChannels; c++) {
      channelData[c] = buffer.getChannelData(c);
    }

    for (var i = 0; i < this.width; i++) {
      var sum = 0;
      for (var c = 0; c < numChannels; c++) {
        var chan = channelData[c];

        var max = Math.max.apply(
          Math, slice.call(chan, i * k, (i + 1) * k)
        );
        sum += max;
      }
      this.drawFrame(sum / numChannels, i);
    }
  },

  drawFrame: function (value, index) {
    var w = 1;
    var h = Math.round((this.height - (value * this.height)) / 2);

    var x = index;

    var y = 0;
    this.cc.fillRect(x, y, w, h);

    y = this.height - h;
    this.cc.fillRect(x, y, w, h);
  }
};