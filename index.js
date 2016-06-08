'use strict'

const https = require('https');
const async = require('async');
const lowdb = require('lowdb');
const db = lowdb('broadcasts.json', { storage: require('lowdb/lib/file-async') });

db.defaults({ broadcasts: [] }).value();
const broadcasts = db.get('broadcasts');

const twitch = require('./lib/twitch');
const downloader = require('./lib/downloader');

process.on('SIGINT', () => {
  cleanExit();
});

process.on('SIGHUP', () => {
  if (process.platform === 'win32') {
    cleanExit();
  }
})

const settings = JSON.parse(require('fs').readFileSync('./settings.json'));
const intervalHours = settings.interval || 4;
const channel = settings.channel;
const concurrency = settings.parallelDownloads || 1;

if (!channel) {
  process.stderr.write('Error: no channel defined in settings.json\n');
  process.exit(-1);
}

let download_queue = async.queue(downloader.download, concurrency);
download_queue.pause();

let pending = broadcasts.filter({ status: 'pending' }).value();
pending.forEach((video) => {
  download_queue.push(video, (err) => {
    if (err) { console.log('error:', err); }
  })
});
console.log('Added %d tasks to queue.', pending.length);
download_queue.resume();

let mainInterval = setInterval(() => {
  let p_broadcasts = twitch.getBroadcasts(channel, broadcasts.map('id').value());
  p_broadcasts.then((data) => {
    data.forEach((video) => {
      if (!broadcasts.find({ id: video.id }).value()) {
        video['status'] = 'pending';
        let promise_playlist = twitch.getPlaylist(
          video.id.slice(1),
          ['source', 'high', 'medium', 'low', 'mobile']
        );
        promise_playlist.then((playlist) => {
          video['playlist'] = playlist;
          broadcasts.push(video).value();
          download_queue.push(video, (err) => {
            if (err) { console.log('error:', err); }
          });
        });
      }
    });
  });
}, intervalHours * 3600000);

function cleanExit() {
  console.log('Waiting for cleanup and shutting down...');
  clearInterval(mainInterval);
  download_queue.kill();
  let checkQueue = setInterval(() => {
    if (download_queue.idle()) {
      clearInterval(checkQueue);
      console.log('Shutting down.');
      process.exit();
    }
  }, 500);
}