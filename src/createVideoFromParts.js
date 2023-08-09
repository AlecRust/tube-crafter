const ffmpeg = require('fluent-ffmpeg')
const { getAudioDuration } = require('./utils')

const createVideoFromParts = async (imageFile, audioFile, videoOutput) => {
  console.log(`🎥 Creating video from ${imageFile} and ${audioFile}...`)
  const audioDuration = await getAudioDuration(audioFile)
  const additionalSeconds = 0

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
        `[0:v]loop=loop=${
          Math.ceil(audioDuration + additionalSeconds) * 25
        }:size=1:start=0[v];[v][1:a]concat=n=1:v=1:a=1`,
      ])
      .format('mp4')
      .saveToFile(videoOutput)
      .on('end', resolve)
      .on('error', reject)
  })
}

module.exports = createVideoFromParts
