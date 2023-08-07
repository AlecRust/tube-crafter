const convertTextToSpeech = require('./audioGenerator')
const textToSpeech = require('@google-cloud/text-to-speech')
const fs = require('fs-extra')

describe('audioGenerator', () => {
  // Mock console.error and console.log to suppress the error message in the test output
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterAll(() => {
    console.error.mockRestore() // Restore the original console.error function
    console.log.mockRestore() // Restore the original console.log function
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should convert text to speech and save as MP3', async () => {
    // Mocking the TextToSpeechClient and fs.outputFile
    jest.spyOn(textToSpeech, 'TextToSpeechClient').mockImplementation(() => ({
      synthesizeSpeech: jest
        .fn()
        .mockResolvedValue([{ audioContent: 'fake_audio_content' }]),
    }))
    jest.spyOn(fs, 'outputFile').mockResolvedValue()

    const line = { content: 'Hello, world!' }
    const outputPath = 'output.mp3'

    await convertTextToSpeech(line, outputPath)

    expect(fs.outputFile).toHaveBeenCalledWith(
      outputPath,
      'fake_audio_content',
      'binary',
    )
  })

  it('should handle errors during speech synthesis', async () => {
    // Mocking an error scenario
    jest.spyOn(textToSpeech, 'TextToSpeechClient').mockImplementation(() => ({
      synthesizeSpeech: jest
        .fn()
        .mockRejectedValue(new Error('synthesis error')),
    }))

    const line = { content: 'Hello, world!' }
    const outputPath = 'output.mp3'

    await expect(convertTextToSpeech(line, outputPath)).rejects.toThrow(
      'synthesis error',
    )
  })
})
