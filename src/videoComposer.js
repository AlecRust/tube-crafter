const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs-extra');
const path = require('path');
const naturalSort = require('natural-sort');

const getAudioDurationInSeconds = async (audioFile) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioFile, function(err, metadata) {
      if (err) {
        reject(err);
      }
      resolve(metadata.format.duration);
    });
  });
}

const createVideo = async (imageFile, audioFile, videoOutput) => {
  console.log(`🎥 Creating video from ${imageFile} and ${audioFile}...`);
  const audioDuration = await getAudioDurationInSeconds(audioFile);
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

const concatenateVideos = async (videoFiles, output) => {
  console.log(`Concatenating videos to ${output}...`);
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
      .save(output);
  });
}

const createAndConcatenateVideos = async (audioDir, imageDir, output) => {
  const audioFiles = (await fs.readdir(audioDir)).sort(naturalSort()).map(file => path.join(audioDir, file));
  const imageFiles = (await fs.readdir(imageDir)).sort(naturalSort()).map(file => path.join(imageDir, file));

  console.log(`🎥 Creating ${audioFiles.length} videos...`);

  const videoFiles = await Promise.all(audioFiles.map(async (audioFile, i) => {
    const videoOutputDirectory = './output/video';
    const videoOutput = path.join(videoOutputDirectory, `${i}.mp4`);
    await fs.ensureDir(videoOutputDirectory);
    await createVideo(imageFiles[i], audioFile, videoOutput);
    console.log(`✅ Video ${i} saved to: ${videoOutput}`);
    return videoOutput;
  }));

  await concatenateVideos(videoFiles, output);
  console.log(`💫 Final video saved to: ${output}`);
};

module.exports = createAndConcatenateVideos;
