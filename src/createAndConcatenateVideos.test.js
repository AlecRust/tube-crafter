const ffmpeg = require('fluent-ffmpeg')
const fs = require('fs-extra')
const path = require('path')
const utils = require('./utils')
const createAndConcatenateVideos = require('./createAndConcatenateVideos')

jest.mock('fluent-ffmpeg', () => {
  const mockFfmpeg = {
    input: jest.fn().mockReturnThis(),
    outputOptions: jest.fn().mockReturnThis(),
    format: jest.fn().mockReturnThis(),
    saveToFile: jest.fn().mockReturnThis(),
    save: jest.fn().mockReturnThis(),
    on: jest.fn().mockImplementation(function (event, handler) {
      if (event === 'end') handler()
      return this
    }),
  }
  return jest.fn(() => mockFfmpeg)
})

describe('createAndConcatenateVideos', () => {
  const audioDir = 'audio'
  const imageDir = 'images'
  const outputPath = 'output.mp4'

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

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should create and concatenate videos from images and audio files', async () => {
    // Mocking fs.readdir
    jest.spyOn(fs, 'readdir').mockResolvedValue(['file1', 'file2'])
    // Mocking fs.ensureDirSync
    jest.spyOn(fs, 'ensureDirSync').mockImplementation(() => {})
    // Mocking path.join
    jest.spyOn(path, 'join').mockImplementation((a, b) => `${a}/${b}`)
    // Mocking ffprobe call
    ffmpeg.ffprobe = jest.fn((audioFile, callback) => {
      callback(null, { format: { duration: 5 } })
    })
    // Mocking getAudioDuration
    jest
      .spyOn(utils, 'getAudioDuration')
      .mockImplementation(() => Promise.resolve(5))

    await createAndConcatenateVideos(audioDir, imageDir, outputPath)

    const mockFfmpegInstance = ffmpeg()
    expect(fs.readdir).toHaveBeenCalledWith(audioDir)
    expect(fs.readdir).toHaveBeenCalledWith(imageDir)
    expect(fs.ensureDirSync).toHaveBeenCalled()
    expect(mockFfmpegInstance.saveToFile).toHaveBeenCalled()
    expect(mockFfmpegInstance.save).toHaveBeenCalled()
  })
})
