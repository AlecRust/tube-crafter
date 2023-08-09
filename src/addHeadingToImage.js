const { createCanvas, loadImage } = require('canvas')
const { calculateAvgColor } = require('./utils')

const addHeadingToImage = async (
  imageBuffer,
  text,
  targetWidth,
  targetHeight,
) => {
  const canvas = createCanvas(targetWidth, targetHeight)
  const ctx = canvas.getContext('2d')
  const image = await loadImage(imageBuffer)
  ctx.drawImage(image, 0, 0, targetWidth, targetHeight)

  const avgColor = calculateAvgColor(
    ctx.getImageData(
      targetWidth / 4,
      (targetHeight * 9) / 32,
      targetWidth / 2,
      (targetHeight * 9) / 16,
    ),
  )
  ctx.fillStyle = avgColor > 128 ? '#000000' : '#FFFFFF'
  ctx.font = 'bold 48px sans-serif'
  ctx.textAlign = 'center'

  const words = text.split(' ')
  let line = '',
    y = targetHeight / 2
  for (const word of words) {
    const testLine = line + word + ' '
    if (ctx.measureText(testLine).width > targetWidth * 0.9) {
      ctx.fillText(line, targetWidth / 2, y)
      line = word + ' '
      y += 50
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, targetWidth / 2, y)

  return canvas.toBuffer('image/png')
}

module.exports = addHeadingToImage
