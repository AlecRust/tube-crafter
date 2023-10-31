const addHeadingToImage = require('./addHeadingToImage')
const { loadImage } = require('canvas')
const { calculateAvgColor } = require('./utils')

jest.mock('canvas', () => ({
  createCanvas: () => ({
    getContext: () => ({
      drawImage: jest.fn(),
      getImageData: jest.fn(),
      fillText: jest.fn(),
      measureText: jest.fn(() => ({ width: 100 })),
      font: '',
      textAlign: '',
      fillStyle: '',
    }),
    toBuffer: jest.fn(),
  }),
  loadImage: jest.fn(() => Promise.resolve({})),
}))

jest.mock('./utils', () => ({
  calculateAvgColor: jest.fn(),
}))

describe('addHeadingToImage', () => {
  const targetWidth = 1024
  const targetHeight = 1024
  const imageBuffer = Buffer.from('fake_image_buffer')

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should add heading to the image', async () => {
    calculateAvgColor.mockReturnValue(255) // Simulate a light color to test dark text

    const text = 'This is a test heading'
    await addHeadingToImage(imageBuffer, text, targetWidth, targetHeight)

    // Verify that the loadImage function was called with the correct buffer
    expect(loadImage).toHaveBeenCalledWith(imageBuffer)

    // Additional checks could be performed on the canvas context methods
    // like drawImage, fillText, etc., to verify the correct behavior.
  })
})
