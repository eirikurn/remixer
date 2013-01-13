
class Clip
  constructor: (@song, @start, @duration) ->

class Mix extends Track
  constructor: (@songs) ->
    @duration = 0
    @clips = ko.observableArray([])
    super

  addClip: (clip) ->
    @clips.push(clip)
    @duration += clip.duration

  # Monster function.
  # Figures out which clips fit the cursor, trims first/last clip if needed
  # and queues them up properly.
  play: (start=0, duration=null) ->
    end = if duration then start + duration else @duration

    foundStart = false
    foundEnd = false

    totalDuration = 0
    sources = []

    @clips().forEach (clip) ->
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

  dragover: (data, event) =>
    event.preventDefault()

    event.originalEvent.dataTransfer.dropEffect = 'copy'
    return false

  drop: (data, event) =>
    event.stopPropagation()
    data = event.originalEvent.dataTransfer.getData('text/plain')
    arr = data.split('-')
    @addClip(new Clip(@songs()[data[0]], parseFloat(arr[1]), parseFloat(arr[2])))


window.Mix = Mix
