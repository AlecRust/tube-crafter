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

const calculateAvgColor = (textAreaImageData) => {
  let avgColor = 0;
  for (let i = 0; i < textAreaImageData.data.length; i += 4) {
    avgColor += textAreaImageData.data[i] + textAreaImageData.data[i + 1] + textAreaImageData.data[i + 2];
  }
  return avgColor / (3 * textAreaImageData.data.length / 4);
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

module.exports = { parseInputFile, calculateAvgColor, getAudioDuration };
