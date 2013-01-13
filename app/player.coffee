
requestAnimationFrame = window.requestAnimationFrame or window.webkitRequestAnimationFrame or mozRequestAnimationFrame

window.Player = Player =
  playlist: []
  cursor: { track: null, start: 0, current: ko.observable(0), duration: null}
  playing: false

  setCursor: (track, start=0, duration=null) ->
    if @cursor.track
      @cursor.track.cursor(null)

    @cursor.track = track
    @cursor.start = start
    @cursor.current start
    @cursor.duration = duration

    track.cursor(@cursor)

    if @playing
      @stop()
      @play()

  stop: ->
    @playlist.forEach (s) -> WebAudio.stopSound(s)
    @playlist = []
    @cursor.current @cursor.start
    @playing = false

  play: ->
    if @cursor.track
      @playlist = @cursor.track.play(@cursor.start, @cursor.duration)
      @initialTime = WebAudio.context.currentTime
      @endTime = @initialTime + (@cursor.duration or @cursor.track.duration - @cursor.start)
      @playing = true

      @updateCursor()

  updateCursor: ->
    if WebAudio.context.currentTime > @endTime
      @stop()
    else if @playing
      currentTime = WebAudio.context.currentTime - @initialTime
      @cursor.current(@cursor.start + currentTime)

      requestAnimationFrame @updateCursor.bind(this)

  toggle: ->
    if @playing
      @stop()
    else
      @play()
