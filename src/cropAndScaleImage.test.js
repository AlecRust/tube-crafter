const cropAndScaleImage = require('./cropAndScaleImage')
const { createCanvas, loadImage } = require('canvas')

jest.mock('canvas', () => {
  const actualCanvas = jest.requireActual('canvas')
  return {
    createCanvas: actualCanvas.createCanvas,
    loadImage: jest.fn((imageBuffer) => {
      const img = new actualCanvas.Image()
      img.src = imageBuffer
      return img
    }),
  }
})

describe('cropAndScaleImage', () => {
  const originalWidth = 1024
  const originalHeight = 1024
  let imageBuffer

  beforeEach(() => {
    // Create a canvas with the original dimensions and fill it with a solid color
    const canvas = createCanvas(originalWidth, originalHeight)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'red'
    ctx.fillRect(0, 0, originalWidth, originalHeight)
    imageBuffer = canvas.toBuffer()
  })

  it('should crop and scale the image to target dimensions', async () => {
    const targetWidth = 800
    const targetHeight = 600

    const resultBuffer = await cropAndScaleImage(
      imageBuffer,
      targetWidth,
      targetHeight,
    )

    // Load the result image into a canvas to check its properties
    const resultImage = await loadImage(resultBuffer)
    const resultCanvas = createCanvas(targetWidth, targetHeight)
    const ctx = resultCanvas.getContext('2d')
    ctx.drawImage(resultImage, 0, 0, targetWidth, targetHeight)

    // Check that the resulting image has the target dimensions
    expect(resultCanvas.width).toBe(targetWidth)
    expect(resultCanvas.height).toBe(targetHeight)
  })
})
