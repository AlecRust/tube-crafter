const {
  parseInputFile,
  calculateAvgColor,
  getAudioDuration,
} = require('./utils')
const fs = require('fs-extra')
const ffmpeg = require('fluent-ffmpeg')

jest.mock('fluent-ffmpeg')
jest.mock('fs-extra')

describe('parseInputFile', () => {
  it('should parse a valid Markdown file', async () => {
    const sampleMarkdown = '# Heading\n\nParagraph'
    fs.readFile.mockResolvedValue(sampleMarkdown)

    const expectedLines = [
      { type: 'heading', content: 'Heading' },
      { type: 'paragraph', content: 'Paragraph' },
    ]

    const lines = await parseInputFile('sample.md')
    expect(lines).toEqual(expectedLines)
  })
})

describe('calculateAvgColor', () => {
  it('should calculate the average color of an image area', () => {
    const textAreaImageData = {
      data: [
        255,
        255,
        255,
        255, // White pixel
        0,
        0,
        0,
        255, // Black pixel
      ],
    }

    const expectedAvgColor = 127.5 // Average of white (255) and black (0)
    const avgColor = calculateAvgColor(textAreaImageData)
    expect(avgColor).toBe(expectedAvgColor)
  })
})

describe('getAudioDuration', () => {
  it('should get the duration of an audio file', async () => {
    const expectedDuration = 10 // in seconds
    ffmpeg.ffprobe.mockImplementation((file, callback) => {
      callback(null, { format: { duration: expectedDuration } })
    })

    const duration = await getAudioDuration('sample.mp3')
    expect(duration).toBe(expectedDuration)
  })
})
