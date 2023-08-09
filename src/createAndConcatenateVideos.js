const ffmpeg = require('fluent-ffmpeg')
const fs = require('fs-extra')
const path = require('path')
const naturalSort = require('natural-sort')
const createVideoFromParts = require('./createVideoFromParts')

const concatenateVideos = async (videoFiles, outputPath) => {
  console.log(`Concatenating videos to ${outputPath}...`)
  return new Promise((resolve, reject) => {
    let command = ffmpeg()
    // Add each video file as a separate input
    for (let file of videoFiles) {
      command = command.input(file)
    }
    command
      .outputOptions([
        '-filter_complex',
        `concat=n=${videoFiles.length}:v=1:a=1[outv][outa]`,
        '-map',
        '[outv]',
        '-map',
        '[outa]',
        '-c:v libx264',
        '-profile:v baseline',
        '-level 3.0',
        '-pix_fmt yuv420p',
        '-c:a aac',
        '-movflags faststart',
      ])
      .on('error', reject)
      .on('end', resolve)
      .save(outputPath)
  })
}

const createAndConcatenateVideos = async (audioDir, imageDir, outputPath) => {
  console.log('outputPath', outputPath)
  const audioFiles = (await fs.readdir(audioDir))
    .sort(naturalSort())
    .map((file) => path.join(audioDir, file))
  const imageFiles = (await fs.readdir(imageDir))
    .sort(naturalSort())
    .map((file) => path.join(imageDir, file))

  console.log(`🎥 Creating ${audioFiles.length} videos...`)

  const videoOutputDirectory = path.join(path.dirname(outputPath), 'video')
  fs.ensureDirSync(videoOutputDirectory)

  const videoFiles = await Promise.all(
    audioFiles.map(async (audioFile, i) => {
      const videoOutput = path.join(videoOutputDirectory, `${i}.mp4`)
      await createVideoFromParts(imageFiles[i], audioFile, videoOutput)
      return videoOutput
    }),
  )
  console.log(`✅ Created ${videoFiles.length} videos`)

  await concatenateVideos(videoFiles, outputPath)
  console.log(`💫 Final video saved to: ${outputPath}`)
}

module.exports = createAndConcatenateVideos
