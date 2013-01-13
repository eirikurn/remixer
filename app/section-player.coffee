exports = window


audioContext = window.audioContext or window.webkitAudioContext
requestAnimationFrame = window.requestAnimationFrame or window.webkitRequestAnimationFrame or mozRequestAnimationFrame
BlobBuilder = window.BlobBuilder or window.WebkitBlobBuilder or window.MozBlobBuilder

Loader =
  files: {}

  loadSoundFromUrl: (url, cb1, cb2) ->
    xhr = new XMLHttpRequest()
    xhr.open('GET', url, true)
    xhr.responseType = 'arraybuffer'
    #xhr.onprogress = (ev) -> (ev.loaded / ev.total) * 100
    xhr.onload = =>
      WebAudio.context.decodeAudioData xhr.response, cb1
      @analyze(url, xhr.response, cb2)

    xhr.send()

  loadSoundFromFile: (file, cb1, cb2) ->
    reader = new FileReader()
    #reader.onprogress = (ev) -> (ev.loaded / ev.total) * 100
    reader.onload = =>
      WebAudio.context.decodeAudioData reader.result, cb1
      @analyze(file.name, reader.result, cb2)

    reader.readAsArrayBuffer(file)

  analyze: (name, data, cb) ->

    formData = new FormData()
    formData.append('track', new Blob([data]), name)

    xhr = new XMLHttpRequest()
    xhr.open('POST', '/analyze/', true)
    #xhr.onprogress = (ev) -> (ev.loaded / ev.total) * 100
    xhr.onload = => cb(JSON.parse(xhr.response))
    xhr.send(formData)

  convertToMp3: (buffer, cb) ->
    wav = @_convertToWav(buffer)
    formData = new FormData()
    formData.append('track', new Blob([wav]))

    xhr = new XMLHttpRequest()
    xhr.open('POST', '/export/', true)
    #xhr.onprogress = (ev) -> (ev.loaded / ev.total) * 100
    xhr.onload = => cb(xhr.response)
    xhr.send(formData)

  _convertToWav: do ->
    writeString = (s, a, offset) ->
      for c, i in s
        a[offset + i] = c.charCodeAt(0)

    writeInt16 = (n, a, offset) ->
      n = n | 0
      a[offset + 0] = n & 255
      a[offset + 1] = (n >> 8) & 255

    writeInt32 = (n, a, offset) ->
      n = n | 0
      a[offset + 0] = n & 255
      a[offset + 1] = (n >> 8) & 255
      a[offset + 2] = (n >> 16) & 255
      a[offset + 3] = (n >> 24) & 255

    writeAudioBuffer = (buffer, a, offset) ->
      i = 0
      n = buffer.length
      bufferL = buffer.getChannelData(0)
      bufferR = buffer.getChannelData(1)

      while i++ < n
        sampleL = bufferL[i] * 32768.0
        sampleR = bufferR[i] * 32768.0

        if sampleL < -32768 then sampleL = -32768
        if sampleL >  32767 then sampleL =  32767
        if sampleR < -32768 then sampleR = -32768
        if sampleR >  32767 then sampleR =  32767

        writeInt16 sampleL, a, offset
        writeInt16 sampleR, a, offset + 2
        offset += 4
      return

    (buffer) ->
      frameLength = buffer.length
      numChannels = buffer.numberOfChannels
      sampleRate = buffer.sampleRate
      bitsPerSample = 16
      byteRate = sampleRate * numChannels * bitsPerSample / 8
      blockAlign = numChannels * bitsPerSample / 8
      wavDataLength = frameLength * numChannels * 2 # 16-bit audio
      headerLength = 44
      totalLength = headerLength + wavDataLength
      waveFileData = new Uint8Array(totalLength)
      subChunk1Size = 16 # for linear PCM
      subChunk2Size = wavDataLength
      chunkSize = 4 + (8 + subChunk1Size) + (8 + subChunk2Size)

      writeString 'RIFF', waveFileData, 0
      writeInt32  chunkSize, waveFileData, 4
      writeString 'WAVE', waveFileData, 8
      writeString 'fmt ', waveFileData, 12

      writeInt32 subChunk1Size, waveFileData, 16
      writeInt16 1, waveFileData, 20
      writeInt16 numChannels, waveFileData, 22
      writeInt32 sampleRate, waveFileData, 24
      writeInt32 byteRate, waveFileData, 28
      writeInt16 blockAlign, waveFileData, 32
      writeInt32 bitsPerSample, waveFileData, 34

      writeString 'data', waveFileData, 36
      writeInt32 subChunk2Size, waveFileData, 40

      writeAudioBuffer(buffer, waveFileData, 44)

      return waveFileData



exports.WebAudio = WebAudio =
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


exports.Player = Player =
  playlist: []
  cursor: { track: null, start: 0, current: ko.observable(0), duration: null}
  playing: false

  setCursor: (track, start=0, duration=null) ->
    if @cursor.track
      @cursor.track.cursor = null

    @cursor.track = track
    @cursor.start = start
    @cursor.current start
    @cursor.duration = duration

    track.cursor = @cursor

    if @playing
      @stop()

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


class Track
  duration: 0
  cursor: null

  play: -> throw "Not implemented"

exports.Track = Track


class Song extends Track
  constructor: (@buffer, @waveform) ->
    @json = ko.observable({})
    @duration = buffer.duration

  play: (start=0, duration=null) ->
    source = WebAudio.playSound(@buffer, start, duration)
    return [source]

exports.Song = Song


class Clip
  constructor: (@song, @start, @duration) ->

exports.Clip = Clip


class Mix extends Track
  constructor: ->
    @clips = []
    @duration = 0

  addClip: (clip) ->
    @clips.push(clip)
    @duration += clip.duration

  # Monster function.
  # Figures out which clips fit the cursor, trims first/last clip if needed
  # and queues them up properly.
  play: (start=0, duration=null) ->
    end = if duration then start + duration else @duration
    allowedDuration = duration or @duration - start

    foundStart = false
    foundEnd = false

    totalDuration = 0
    sources = []

    @clips.forEach (clip) ->
      if foundEnd then return

      clipStart = clip.start
      clipDuration = clip.duration

      if not foundStart and totalDuration + clip.duration > start
        foundStart = true
        offset = start - totalDuration
        clipStart += offset
        clipDuration -= offset

      if not foundEnd and totalDuration + clip.duration >= end
        foundEnd = true
        clipDuration -= totalDuration + clip.duration - end

      if foundStart
        source = WebAudio.playSound(clip.song.buffer, clipStart, clipDuration, totalDuration - start)
        sources.push(source)

      totalDuration += clip.duration

    return sources

exports.Mix = Mix


class TestViewModel
  constructor: ->
    @sections = ko.observableArray()
    @loadingStatus = ko.observable("")
    @chosenSong = ko.observable(false)
    @song = ko.observable()
    @mix = new Mix()

    $('#fileinput').on('change', @fileSelect)
    $('#filedrag').on('dragover', @fileHover)
    $('#filedrag').on('dragleave', @fileHover)
    $('#filedrag').on('drop', @fileSelect)

  fileSelect: (e) =>
    # cancel event and hover styling
    @fileHover(e);

    @chosenSong true
    file = (e.target.files || e.originalEvent.dataTransfer.files)[0];
    Loader.loadSoundFromFile file, @loadedBuffer, @loadedAnalysis

    @loadingStatus "Loading track"

  loadAdele: ->
    @chosenSong true
    Loader.loadSoundFromUrl '/mp3/adele.m4a', @loadedBuffer, @loadedAnalysis

    @loadingStatus "Downloading track"

  loadedBuffer: (buffer) =>
    waveform = @generateWaveform(buffer)

    window.song = @song(new Song(buffer, waveform))
    Player.setCursor(@song())
    @loadingStatus "Analysing track"

  exportMp3: ->
    WebAudio.record @mix.duration, =>
      @mix.play()
    , (buffer) =>
      Loader.convertToMp3 buffer, (url) =>
        location.href = url


  generateWaveform: (buffer) ->
    canvas = $('<canvas width="1800" height="280">')[0]
    WaveSurfer.Drawer.init canvas: canvas, color: '#efefef'
    WaveSurfer.Drawer.drawBuffer(buffer)
    return canvas.toDataURL('image/png')

  loadedAnalysis: (analysis) =>
    @song().json(analysis)
    @loadingStatus ""

  fileHover: (e) =>
    e.stopPropagation()
    e.preventDefault()
    $(e.target).toggleClass('hover', e.type == 'dragover')

  playSection: (section) ->
    Player.setCursor(@song(), section.start, section.duration)
    Player.play()

  addToMix: (section) ->
    @mix.addClip(new Clip(@song(), section.start, section.duration))


exports.TestViewModel = TestViewModel

