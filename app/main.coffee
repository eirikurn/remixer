  exports = window

  exports.pc = (percent) -> Math.round(percent * 100) + '%'

  BlobBuilder = window.BlobBuilder or window.WebkitBlobBuilder or window.MozBlobBuilder

  class MainViewModel
    songCount: 0

    constructor: ->
      @songs = ko.observableArray()
      @mix = new Mix(@songs)
      @duration = 0
      window.pxMinRatio = ko.observable(1)
      Player.setCursor @mix, 0

      @loadingStatus = ko.observable("")

      $('#fileinput').on('change', @fileSelect)
      $('#filedrag').on('dragover', @fileHover)
      $('#filedrag').on('dragleave', @fileHover)
      $('#filedrag').on('drop', @fileSelect)

    fileSelect: (e) =>
      # cancel event and hover styling
      @fileHover(e);

      file = (e.target.files || e.originalEvent.dataTransfer.files)[0];
      Loader.loadSoundFromFile file, @loadedBuffer, @loadedAnalysis

      @loadingStatus "Loading track"

    loadAdele: ->
      Loader.loadSoundFromUrl '/mp3/adele.m4a', @loadedBuffer, @loadedAnalysis

      @loadingStatus "Downloading track"

    loadedBuffer: (buffer) =>
      @duration = buffer.duration
      waveform = @generateWaveform(buffer)

      song = new Song(@songCount++, buffer, waveform)
      @songs.push song
      Player.setCursor song
      @loadingStatus "Analysing track"

      # calulate sizes
      window.pxMinRatio($('.timeline:first').innerWidth() / @duration)
      song.selection.width = $('.timeline').innerWidth()
      song.selection.padding = $('.timeline').offset().left

    generateWaveform: (buffer) ->
      canvas = $('<canvas width="1800" height="280">')[0]
      WaveSurfer.Drawer.init canvas: canvas, color: '#efefef'
      WaveSurfer.Drawer.drawBuffer(buffer)
      return canvas.toDataURL('image/png')

    loadedAnalysis: (analysis) =>
      @songs()[@songs().length - 1].json(analysis)
      @loadingStatus ""

    exportMp3: ->
      WebAudio.record @mix.duration, =>
        @mix.play()
      , (buffer) =>
        Loader.convertToMp3 buffer, (url) =>
          location.href = url

    cheat: (start = 0.28) ->
      bpm = 107.991
      song = @songs()[0]
      start = start
      duration = (1 / (bpm / 60)) * 4
      bars = []
      while start < song.duration
        bars.push(start: start, duration: duration)
        start += duration

      sectionSizes = [{s:4,c:0},{s:16,c:3},{s:7,c:6},{s:8,c:9},{s:8,c:3},{s:7,c:6},{s:16,c:9},{s:16,c:12},{s:8,c:9},{s:16,c:19},{s:3,c:0}]
      cur = 0
      sections = sectionSizes.map ({s:size,c:color}) ->
        section = start: bars[cur].start, duration: size * duration, color: color
        cur += size
        section
      song.json({sections: sections, bars: bars, meta: song.json().meta})

    fileHover: (e) =>
      e.stopPropagation()
      e.preventDefault()
      $(e.target).toggleClass('hover', e.type == 'dragover')

    playSection: (section) ->
      Player.setCursor(@song, section.start, section.duration)
      Player.play()

    keydown: (data, event) ->
      if event.keyCode == 32
        Player.toggle()
        return false
      return true

    setCursor: ->
      Player.setCursor @mix, 0

  exports.vm = new MainViewModel()
  ko.applyBindings(exports.vm, $('body')[0])
