
window.Loader = Loader =
  files: {}
  progress: ko.observable()

  loadSoundFromUrl: (url, cb1, cb2) ->
    xhr = new XMLHttpRequest()
    xhr.open('GET', url, true)
    xhr.responseType = 'arraybuffer'
    xhr.onprogress = (ev) -> Loader.progress(ev.loaded / ev.total)
    xhr.onload = =>
      WebAudio.context.decodeAudioData xhr.response, cb1
      @analyze(url, xhr.response, cb2)

    xhr.send()

  loadSoundFromFile: (file, cb1, cb2) ->
    reader = new FileReader()
    reader.onprogress = (ev) -> Loader.progress(ev.loaded / ev.total)
    reader.onload = =>
      WebAudio.context.decodeAudioData reader.result, cb1
      @analyze(file.name, reader.result, cb2)

    reader.readAsArrayBuffer(file)

  analyze: (name, data, cb) ->

    formData = new FormData()
    formData.append('track', new Blob([data]), name)

    xhr = new XMLHttpRequest()
    xhr.open('POST', '/analyze/', true)
    xhr.onprogress = (ev) -> Loader.progress(ev.loaded / ev.total)
    xhr.onload = => cb(JSON.parse(xhr.response))
    xhr.send(formData)

  convertToMp3: (buffer, cb) ->
    wav = @_convertToWav(buffer)
    formData = new FormData()
    formData.append('track', new Blob([wav]))

    xhr = new XMLHttpRequest()
    xhr.open('POST', '/export/', true)
    xhr.onprogress = (ev) -> Loader.progress(ev.loaded / ev.total)
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

