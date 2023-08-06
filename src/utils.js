const fs = require('fs-extra');
const MarkdownIt = require('markdown-it');
const ffmpeg = require('fluent-ffmpeg');

const parseInputFile = async (inputFilePath) => {
  const input = await fs.readFile(inputFilePath, 'utf8');
  const md = new MarkdownIt();
  return md.parse(input, {});
};

const getAudioDuration = async (audioFile) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioFile, function(err, metadata) {
      if (err) {
        reject(err);
      }
      resolve(metadata.format.duration);
    });
  });
}

module.exports = { parseInputFile, getAudioDuration };
