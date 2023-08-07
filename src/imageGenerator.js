const axios = require('axios')
const fs = require('fs-extra')
const { Configuration, OpenAIApi } = require('openai')
const { createCanvas, loadImage } = require('canvas')
const { calculateAvgColor } = require('./utils')

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(configuration)
const targetWidth = 1920
const targetHeight = 1080

const cropAndScaleImage = async (imageBuffer) => {
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

const generatePrompt = async (content) => {
  const response = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content:
          'You are ChatGPT, and your task is to summarize the essence of the user\'s text in less than a dozen words, in a way that would guide the creation of an image e.g. "a teddy bear on a skateboard in Times Square".',
      },
      {
        role: 'user',
        content: content,
      },
    ],
  })
  return response.data.choices[0].message.content.trim()
}

const addHeadingToImage = async (imageBuffer, text) => {
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

const generateImageFromText = async (line, outputPath) => {
  try {
    const imagePrompt = await generatePrompt(line.content)
    console.log('🖼️ Image prompt:', imagePrompt)

    const createImageResponse = await openai.createImage({
      prompt: `An illustration of ${imagePrompt}`,
      n: 1,
      size: '1024x1024',
    })

    const imageUrl = createImageResponse.data.data[0].url
    // console.log('🖼️ Image URL:', imageUrl);
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
    })

    let finalImageBuffer = await cropAndScaleImage(imageResponse.data)
    if (line.type === 'heading') {
      finalImageBuffer = await addHeadingToImage(finalImageBuffer, line.content)
    }

    await fs.outputFile(outputPath, Buffer.from(finalImageBuffer, 'binary'))
    console.log(`✅ Image saved to: ${outputPath}`)
  } catch (error) {
    console.error(`Failed to generate image from text: ${error.message}`)
    throw error
  }
}

module.exports = generateImageFromText
