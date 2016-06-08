'use strict'

function parse(input) {
  if (typeof input === 'string' || input instanceof String || input instanceof Buffer) {
    input = (input instanceof Buffer) ? input.toString() : input;
  } else {
    throw new Error('Input is no Buffer or String');
  }

  let filtered_lines = input.split('\n').filter((element) => {
    return /^(?:#.+STREAM-INF|http).*$/.test(element);
  });

  let output = [];
  filtered_lines.forEach((line, index, arr) => {
    if (index % 2 === 0) {
      let info = /RESOLUTION.+"(\d+x\d+).+VIDEO="(\w+)"/i.exec(line);
      output.push({ name: info[2], resolution: info[1], source: arr[index + 1] });
    }
  });
  return output;
};

module.exports.parse = parse;