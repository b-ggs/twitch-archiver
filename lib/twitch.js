'use strict'

const http = require('http');
const https = require('https');
const m3u8 = require('./m3u8');

const clientID = '59nz2v3hrybu8ozpd790mkgf4c8vr68';

const api_opts = function (channel, offset) {
  return {
    host: 'api.twitch.tv',
    path: '/kraken/channels/' + channel + '/videos?limit=100&broadcasts=true' + ((offset) ? '&offset=' + offset : ''),
    headers: {
      'Client-ID': clientID,
      'accept': 'application/vnd.twitchtv.v3+json',
      'content-type': 'application/json'
    }
  };
};

const usher_opts = function (id, auth) {
  return {
    host: 'usher.twitch.tv',
    path: '/vod/' + id + '?nauthsig=' + auth.sig + '&nauth=' + auth.token,
    headers: {
      'accept': 'application/vnd.twitchtv.v3+json',
      'content-type': 'application/json'
    }
  };
};

function _requestAccessToken(vid) {
  return new Promise((resolve, reject) => {
    let req = https.request('https://api.twitch.tv/api/vods/' + vid + '/access_token', (response) => {
      let chunks = [];
      response.on('data', (chunk) => {
        chunks.push(chunk);
      });
      response.on('end', () => {
        let json = JSON.parse(Buffer.concat(chunks));
        let auth = { sig: json.sig, token: json.token };
        resolve(auth);
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

function getPlaylist(vid, priority) {
  return new Promise((resolve, reject) => {
    console.log('fetch playlist for:', vid);
    let promise_token = _requestAccessToken(vid);

    promise_token.then((auth) => {
      let playlist_request = http.request(usher_opts(vid, auth), (response) => {
        let chunks = [];
        response.on('data', (chunk) => {
          chunks.push(chunk);
        });
        response.on('end', () => {
          let parsed = m3u8.parse(Buffer.concat(chunks));
          parsed.sort((a, b) => {
            let ra = /(\d+)x(\d+)/.exec(a.resolution);
            let rb = /(\d+)x(\d+)/.exec(b.resolution);
            if ((ra && rb) && (ra.length >= 2 && rb.length >= 2)) {
              return (rb[1] * rb[2]) - (ra[1] * ra[2]);
            }
            return 0;
          });
          resolve(parsed[0]);
        });
      });

      playlist_request.on('error', (err) => {
        reject(err);
      });

      playlist_request.end();
    });
    promise_token.catch((err) => {
      reject(err);
    });
  });
};

function _getBroadcasts(channel, offset, broadcast_list, callback) {
  let request = https.request(api_opts(channel, offset), (response) => {
    let chunks = [];

    response.on('data', (chunk) => {
      chunks.push(chunk);
    });

    response.on('end', () => {
      broadcast_list = broadcast_list || [];
      let json = JSON.parse(Buffer.concat(chunks));

      if (json.videos.length > 0) {
        json.videos.forEach((video) => {
          if (video.status === 'recorded') {
            broadcast_list.push({ id: video._id });
          }
        });
        let next_offset = /offset=(\d+)/i.exec(json._links.next);
        _getBroadcasts(channel, next_offset[1], broadcast_list, callback);
      } else {
        callback(broadcast_list);
      }
    });

  }).end();
};

function getBroadcasts(channel) {
  return new Promise((resolve, reject) => {
    console.log('Getting list of new broadcasts for \'%s\'...', channel);
    _getBroadcasts(channel, null, null, (data) => {
      resolve(data);
    });
  });
}

module.exports.getPlaylist = getPlaylist;
module.exports.getBroadcasts = getBroadcasts;


