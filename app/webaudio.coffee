
audioContext = window.audioContext or window.webkitAudioContext

window.WebAudio = WebAudio =
  context: new audioContext()

  playSound: (buffer, start, duration=null, delay=0) ->
    source = @context.createBufferSource()
    source.buffer = buffer
    source.connect(@context.destination)

    duration = buffer.duration - start unless duration
    source.noteGrainOn(@context.currentTime + delay, start, duration)

    return source

  stopSound: (source, delay=0) ->
    source.noteOff(@context.currentTime + delay)

  record: (duration, action, cb) ->
    @context = new audioContext(2, duration*44100, 44100);
    @context.oncomplete = (e) =>
      @context = new audioContext()
      cb(e.renderedBuffer)
    action()
    @context.startRendering()

