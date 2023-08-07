const axios = require('axios')
const fs = require('fs-extra')
const generateImageFromText = require('./imageGenerator')
const { createCanvas } = require('canvas')

// Mock the entire openai module
jest.mock('openai', () => ({
  OpenAIApi: jest.fn().mockImplementation(() => ({
    createChatCompletion: jest.fn().mockResolvedValue({
      data: {
        choices: [
          { message: { content: 'a landscape with mountains and lake' } },
        ],
      },
    }),
    createImage: jest.fn().mockResolvedValue({
      data: {
        data: [{ url: 'https://example.com/image.png' }],
      },
    }),
  })),
  Configuration: jest.fn(),
}))

jest.mock('axios')
jest.mock('fs-extra')

describe('imageGenerator', () => {
  // Mock console.log to suppress the log messages in the test output
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterAll(() => {
    console.log.mockRestore() // Restore the original console.log function
  })

  beforeEach(() => {
    // Reset all mocks
    axios.get.mockReset()
    fs.outputFile.mockReset()
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

    // Call generateImageFromText
    await generateImageFromText(line, outputPath)

    // Check the first argument of the call to fs.outputFile
    const outputFileCall = fs.outputFile.mock.calls[0]
    const outputFileArg = outputFileCall[1]

    // Expect the image to be saved with the correct path
    expect(outputFileCall[0]).toEqual(outputPath)
    expect(Buffer.isBuffer(outputFileArg)).toBe(true)
  })

  // TODO: Add more tests for error scenarios and edge cases
})
