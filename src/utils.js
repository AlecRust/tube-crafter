const fs = require('fs-extra');
const MarkdownIt = require('markdown-it');
const ffmpeg = require('fluent-ffmpeg');

const tokensToLines = tokens => tokens.reduce((result, token, i) => {
  if ((token.type === 'heading_open' || token.type === 'paragraph_open') && tokens[i + 1].type === 'inline') {
    const type = token.type === 'heading_open' ? 'heading' : 'paragraph';
    result.push({ type, content: tokens[i + 1].content });
  }
  return result;
}, []);

const parseInputFile = async (inputFilePath) => {
  const input = await fs.readFile(inputFilePath, 'utf8');
  const md = new MarkdownIt();
  const tokens = md.parse(input, {});
  const lines = tokensToLines(tokens);
  // console.log(`📄 Lines:`)
  // console.log(lines);
  return lines;
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
