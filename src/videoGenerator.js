const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs-extra');
const path = require('path');
const naturalSort = require('natural-sort');
const { getAudioDuration } = require('./utils');

const createVideo = async (imageFile, audioFile, videoOutput) => {
  console.log(`🎥 Creating video from ${imageFile} and ${audioFile}...`);
  const audioDuration = await getAudioDuration(audioFile);
  const additionalSeconds = 0;

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(imageFile)
      .input(audioFile)
      .outputOptions([
        '-c:v libx264',
        '-profile:v baseline',
        '-level 3.0',
        '-pix_fmt yuv420p',
        '-c:a aac',
        '-movflags faststart',
        '-filter_complex',
        `[0:v]loop=loop=${Math.ceil(audioDuration + additionalSeconds)*25}:size=1:start=0[v];[v][1:a]concat=n=1:v=1:a=1`
      ])
      .format('mp4')
      .saveToFile(videoOutput)
      .on('end', resolve)
      .on('error', reject);
  });
}

const concatenateVideos = async (videoFiles, outputPath) => {
  console.log(`Concatenating videos to ${outputPath}...`);
  return new Promise((resolve, reject) => {
    let command = ffmpeg();
    // Add each video file as a separate input
    for (let file of videoFiles) {
      command = command.input(file);
    }
    command
      .outputOptions([
        '-filter_complex', `concat=n=${videoFiles.length}:v=1:a=1[outv][outa]`,
        '-map', '[outv]',
        '-map', '[outa]',
        '-c:v libx264',
        '-profile:v baseline',
        '-level 3.0',
        '-pix_fmt yuv420p',
        '-c:a aac',
        '-movflags faststart'
      ])
      .on('error', reject)
      .on('end', resolve)
      .save(outputPath);
  });
}

const createAndConcatenateVideos = async (audioDir, imageDir, outputPath) => {
  console.log('outputPath', outputPath);
  const audioFiles = (await fs.readdir(audioDir)).sort(naturalSort()).map(file => path.join(audioDir, file));
  const imageFiles = (await fs.readdir(imageDir)).sort(naturalSort()).map(file => path.join(imageDir, file));

  console.log(`🎥 Creating ${audioFiles.length} videos...`);

  const videoOutputDirectory = path.join(path.dirname(outputPath), 'video');
  fs.ensureDirSync(videoOutputDirectory);

  const videoFiles = await Promise.all(audioFiles.map(async (audioFile, i) => {
    const videoOutput = path.join(videoOutputDirectory, `${i}.mp4`);
    await createVideo(imageFiles[i], audioFile, videoOutput);
    return videoOutput;
  }));
  console.log(`✅ Created ${videoFiles.length} videos`);

  await concatenateVideos(videoFiles, outputPath);
  console.log(`💫 Final video saved to: ${outputPath}`);
};

module.exports = createAndConcatenateVideos;
