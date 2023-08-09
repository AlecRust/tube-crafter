const { createCanvas, loadImage } = require('canvas')

const cropAndScaleImage = async (imageBuffer, targetWidth, targetHeight) => {
  const canvas = createCanvas(targetWidth, targetHeight)
  const ctx = canvas.getContext('2d')
  const image = await loadImage(imageBuffer)

  const originalWidth = 1024 // Original width of the image
  const originalHeight = 1024 // Original height of the image

  // Calculate the scaling factor to retain aspect ratio
  const scaleFactor = Math.max(
    targetWidth / originalWidth,
    targetHeight / originalHeight,
  )

  // Calculate new width and height based on the scaling factor
  const newWidth = originalWidth * scaleFactor
  const newHeight = originalHeight * scaleFactor

  // Calculate the position to center the image on the canvas
  const x = (targetWidth - newWidth) / 2
  const y = (targetHeight - newHeight) / 2

  // Draw the image on the canvas, scaling it and positioning it to fit the target dimensions
  ctx.drawImage(image, x, y, newWidth, newHeight)

  return canvas.toBuffer('image/png')
}

module.exports = cropAndScaleImage
