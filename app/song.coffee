
class Song extends Track
  constructor: (@id, @buffer, @waveform) ->
    @duration = buffer.duration
    @json = ko.observable({})
    @beats = ko.computed => @json().bars or []
    @sections = ko.computed => @json().sections or []
    @name = ko.computed =>
      if @json()?.meta then @json().meta.title + ' by ' + @json().meta.artist else "Unknown artist"

    @json.subscribe (newValue) =>
      newValue.bars.unshift
        confidence: 1.00
        duration: newValue.bars[0].start
        start: 0
      last = newValue.bars[newValue.bars.length - 1]
      newValue.bars.push
        confidence: 1.00
        duration: buffer.length - last.start - last.duration
        start: last.start + last.duration

    # selection
    @isSelecting = ko.observable(false)
    @selection =
      start: ko.observable(0)
      left: ko.observable()
      right: ko.observable()
      width: $('.timeline').innerWidth()
      padding: $('.timeline').offset().left

    super

  getEvent: (event) ->
    x = event.clientX - @selection.padding
    return {
    x: x
    minutes: x / window.pxMinRatio()
    }

  nextBeat: (minutes, larger) ->
    result = _.sortedIndex _.pluck(@beats(), 'start'), minutes
    item = @beats()[if result > 0 then result - 1 else result]

    if not item then return minutes * pxMinRatio()
    if larger
      num = item.start + item.duration
    else
      num = item.start

    return num * window.pxMinRatio()

  mousedown: (data, event) ->
    return true if event.target.className == "selector"
    event = @getEvent event

    @isSelecting(true)
    x = @nextBeat event.minutes
    @selection.start(x + 0)
    @selection.left(x + 0)
    @selection.right(@selection.width - x)

  mouseup: (data, event) ->
    @isSelecting(false)
    sel = @getSelection()
    if Math.floor(sel.start) == Math.floor(sel.end)
      Player.setCursor @, sel.start
    else
      Player.setCursor @, sel.start, sel.duration

  mousemove: (data, event) ->
    event = @getEvent event
    if @isSelecting()
      current = @nextBeat event.minutes
      if current < @selection.start()
        @selection.left(current)
        @selection.right(@selection.width - @selection.start())
      else
        current = @nextBeat event.minutes, true
        @selection.left(@selection.start())
        @selection.right(@selection.width - current)
    return

  dragstart: (data, event) ->
    dt = event.originalEvent.dataTransfer
    dt.effectAllowed = 'copy'
    sel = @getSelection()
    dt.setData 'text/plain', data.id + '-' + sel.start + '-' + sel.duration
    elem = $('<div>Place this in your mix!</div>').appendTo('body')
    dt.setDragImage elem[0], 50, 50
    setTimeout ->
      elem.remove()
    , 0
    return true

  dblclick: (data, event) ->
    event = @getEvent event
    result = _.sortedIndex _.pluck(@sections(), 'start'), event.minutes
    item = @sections()[if result > 0 then result - 1 else result]

    @selection.start(item.start * window.pxMinRatio())
    @selection.left(item.start * window.pxMinRatio())
    @selection.right(@selection.width - ((item.start + item.duration) * window.pxMinRatio()))
    Player.setCursor @, item.start

  getSelection: ->
    start = @selection.left() / window.pxMinRatio()
    end = (@selection.width - @selection.right()) / window.pxMinRatio()
    if (start > end)
      temp = end
      end = start
      start = temp
    return {
    start: start
    end: end
    duration: end - start
    }

  play: (start=0, duration=null) ->
    source = WebAudio.playSound(@buffer, start, duration)
    return [source]

  showSection: (elem) ->
    if (elem.nodeType == 1)
      $(elem).hide().fadeIn('slow')

  colors: [
    '#2f243f',
    '#3c2c55',
    '#4a3768',
    '#565270',
    '#6b6b7c',
    '#72957f',
    '#86ad6e',
    '#a1bc5e',
    '#b8d954',
    '#d3e04e',
    '#ccad2a',
    '#cc8412',
    '#c1521d',
    '#ad3821',
    '#8a1010',
    '#681717',
    '#531e1e',
    '#3d1818',
    '#320a1b'
  ]


window.Song = Song
