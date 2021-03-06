// Generated by CoffeeScript 1.3.3
(function() {
  var Player, requestAnimationFrame;

  requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || mozRequestAnimationFrame;

  window.Player = Player = {
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
        this.cursor.track.cursor(null);
      }
      this.cursor.track = track;
      this.cursor.start = start;
      this.cursor.current(start);
      this.cursor.duration = duration;
      track.cursor(this.cursor);
      if (this.playing) {
        this.stop();
        return this.play();
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
    },
    toggle: function() {
      if (this.playing) {
        return this.stop();
      } else {
        return this.play();
      }
    }
  };

}).call(this);
