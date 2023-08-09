const ffmpeg = require('fluent-ffmpeg')
const createVideoFromParts = require('./createVideoFromParts')
const utils = require('./utils')

jest.mock('fluent-ffmpeg', () => {
  const mockFfmpeg = {
    input: jest.fn().mockReturnThis(),
    outputOptions: jest.fn().mockReturnThis(),
    format: jest.fn().mockReturnThis(),
    saveToFile: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
  }
  const mockFfprobe = (file, callback) =>
    callback(null, { format: { duration: 5 } })
  const ffmpeg = jest.fn(() => mockFfmpeg)
  ffmpeg.ffprobe = mockFfprobe
  return ffmpeg
})

describe('createVideoFromParts', () => {
  const imageFile = 'image.png'
  const audioFile = 'audio.mp3'
  const videoOutput = 'output.mp4'

  // Suppress console.log
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  // Restore console.log
  afterAll(() => {
    console.log.mockRestore()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create video from image and audio files', async () => {
    const audioDuration = 5
    // Mocking getAudioDuration
    jest
      .spyOn(utils, 'getAudioDuration')
      .mockImplementation(() => Promise.resolve(audioDuration))

    const ffmpegInstance = ffmpeg()
    ffmpegInstance.on.mockImplementation((event, handler) => {
      if (event === 'end') handler()
    })

    await createVideoFromParts(imageFile, audioFile, videoOutput)

    expect(ffmpegInstance.input).toHaveBeenCalledWith(imageFile)
    expect(ffmpegInstance.input).toHaveBeenCalledWith(audioFile)
    expect(ffmpegInstance.outputOptions).toHaveBeenCalledWith([
      '-c:v libx264',
      '-profile:v baseline',
      '-level 3.0',
      '-pix_fmt yuv420p',
      '-c:a aac',
      '-movflags faststart',
      '-filter_complex',
      `[0:v]loop=loop=${
        Math.ceil(audioDuration) * 25
      }:size=1:start=0[v];[v][1:a]concat=n=1:v=1:a=1`,
    ])
    expect(ffmpegInstance.format).toHaveBeenCalledWith('mp4')
    expect(ffmpegInstance.saveToFile).toHaveBeenCalledWith(videoOutput)
  })
})
