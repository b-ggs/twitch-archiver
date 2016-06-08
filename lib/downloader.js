'use strict'

const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
// https://github.com/fonsleenaars/twitch-hls-vods
// .addOption('-bsf:a', 'aac_adtstoasc')
// command: ffmpeg -threads 4 -i "sourcefile.m3u8" -bsf:a aac_adtstoasc -c copy output.mp4

const lowdb = require('lowdb');
const db = lowdb('broadcasts.json', { storage: require('lowdb/lib/file-async') });
db.defaults({ broadcasts: [] }).value();
const broadcasts = db.get('broadcasts');

const settings = JSON.parse(
  fs.readFileSync(
    require('path').join(__dirname, '..', 'settings.json'), 'utf8'
  )
);

module.exports.download = function (task, callback) {
  let threads = settings.ffmpegThreads || 1;
  let outputPath = settings.outputPath || './';
  // add trailing slash if needed
  outputPath = (outputPath.endsWith('/')) ? outputPath : outputPath + '/';

  let filename = require('util').format('%s%s_%s.mp4', outputPath, task.id, task.playlist.resolution);
  let ffmpegCommand = ffmpeg();
  ffmpegCommand.input(task.playlist.source)
    .addOption('-bsf:a', 'aac_adtstoasc')
    .addOption('-threads', threads)
    .addOption('-c', 'copy')
    .on('start', (cmdLine) => {
      console.log('Running ffmpeg with [%s]', cmdLine);
    })
    .on('progress', (info) => { })
    .on('end', () => {
      broadcasts.find({ id: task.id }).assign({ status: 'done' }).value();
      console.log('%s done.', vid);
      callback();
    })
    .on('error', (err) => {
      fs.unlink(filename);
      callback(err);
    })
    .save(filename);
}