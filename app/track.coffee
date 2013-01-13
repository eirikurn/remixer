
class Track
  duration: 0

  constructor: ->
    @cursor = ko.observable()

  play: -> throw "Not implemented"

window.Track = Track