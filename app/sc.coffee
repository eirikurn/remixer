#var EN = {};
#EN.prefix = 'http:#developer.echonest.com/api/v4';
#EN.initialize = function(options) {
#  EN.apiKey = options.api_key;
#}
#
#EN.post = function(url, params, callback) {
#  if (!params) {
#    params = {};
#  }
#  params.api_key = EN.apiKey;
#  $.ajax(EN.prefix + url, {
#    data: params,
#    type: 'POST',
#    dataType: 'json',
#    success: callback
#  })
#};
#
#EN.initialize({
#  api_key: "YALEIHQENFC2QXRTD"
#});

SC.initialize({
  client_id: "962475a1583d05e026296bf6633ac1d7",
  redirect_uri: "http://remixer.aranja.is/sc-callback.html"
})

class window.ScViewModel
  constructor: ->
    @searchQuery = ko.observable('anberlin')
    @tracks = ko.observableArray()

  login: ->
    SC.connect connected: ->
      localStorage['access_token'] = SC.options.access_token;
      console.log("Awesome", SC.options.access_token);

  search: ->
    params = {q: @searchQuery(), limit: 10, order: 'hotness'}
    SC.get '/tracks.json', params, (tracks) =>
      @tracks(tracks)

  selectTrack: (track) ->
    console.log(track)