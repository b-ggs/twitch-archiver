# twitch-archiver for node.js

##External dependencies
see [fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg#prerequisites)

##Installation

1. install `node.js` and `npm`

2. download application
  ```sh
  $ git clone https://github.com/mibbio/twitch-archiver.git
  ```
  or download https://github.com/mibbio/twitch-archiver/archive/master.zip
  
3. run
  ```
  $ npm install
  ```
  inside root directory of the application

## Usage
1. edit settings.json

2. run
  ```sh
  $ npm start
  ```

## settings.json
> maximum used threads: parallelDownloads x ffmpegThreads

* __channel__ - name of channel to check for VODs _(mandatory)_,
* __parallelDownloads__ - number if VODs to download in parallel _(default: 1)_,
* __ffmpegThreads__ - threads used per ffmpeg process _(default: 4)_,
* __outputPath__ - path where videos are saved _(default: './')_,
* __interval__ - interval in hours between checks for new VODs _(default: 4)_

> server feature is experimental

> enables web frontend for status display
* __server.enabled__ - enable/disable server feature _(default: false)_
* __server.port__ - port the server listens at _(default: 8080)_
