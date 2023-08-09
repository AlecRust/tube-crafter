const axios = require('axios')
const fs = require('fs-extra')
const generateImageFromText = require('./imageGenerator')
const { createCanvas } = require('canvas')
const { OpenAIApi, Configuration } = require('openai')

jest.mock('axios')
jest.mock('fs-extra')
jest.mock('openai')

describe('imageGenerator', () => {
  let openaiInstance

  // Suppress console.log
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  // Restore console.log
  afterAll(() => {
    console.log.mockRestore()
  })

  beforeEach(() => {
    // Reset all mocks
    axios.get.mockReset()
    fs.outputFile.mockReset()

    // Create a mock OpenAI instance
    openaiInstance = new OpenAIApi(new Configuration({}))
    openaiInstance.createChatCompletion = jest.fn().mockResolvedValue({
      data: {
        choices: [
          { message: { content: 'a landscape with mountains and lake' } },
        ],
      },
    })
    openaiInstance.createImage = jest.fn().mockResolvedValue({
      data: {
        data: [{ url: 'https://example.com/image.png' }],
      },
    })
  })

  it('should generate an image based on given text content', async () => {
    const line = { content: 'A beautiful landscape', type: 'heading' }
    const outputPath = 'output.png'
    const canvas = createCanvas(1024, 1024)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'blue'
    ctx.fillRect(0, 0, 1024, 1024)
    const testImageBuffer = canvas.toBuffer('image/png')

    // Mock axios response for image download
    axios.get.mockResolvedValue({ data: testImageBuffer })

    // Call generateImageFromText with mock OpenAI instance
    await generateImageFromText(line, outputPath, openaiInstance)

    // Check the first argument of the call to fs.outputFile
    const outputFileCall = fs.outputFile.mock.calls[0]
    const outputFileArg = outputFileCall[1]

    // Expect the image to be saved with the correct path
    expect(outputFileCall[0]).toEqual(outputPath)
    expect(Buffer.isBuffer(outputFileArg)).toBe(true)
  })
})
