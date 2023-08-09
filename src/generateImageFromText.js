const axios = require('axios')
const fs = require('fs-extra')
const cropAndScaleImage = require('./cropAndScaleImage')
const addHeadingToImage = require('./addHeadingToImage')

const targetWidth = 1920
const targetHeight = 1080

const generatePrompt = async (content, openaiInstance) => {
  const response = await openaiInstance.createChatCompletion({
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

const generateImageFromText = async (line, outputPath, openaiInstance) => {
  try {
    const imagePrompt = await generatePrompt(line.content, openaiInstance)
    console.log('🖼️ Image prompt:', imagePrompt)

    const createImageResponse = await openaiInstance.createImage({
      prompt: `An illustration of ${imagePrompt}`,
      n: 1,
      size: '1024x1024',
    })

    const imageUrl = createImageResponse.data.data[0].url
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
    })

    let finalImageBuffer = await cropAndScaleImage(
      imageResponse.data,
      targetWidth,
      targetHeight,
    )
    if (line.type === 'heading') {
      finalImageBuffer = await addHeadingToImage(
        finalImageBuffer,
        line.content,
        targetWidth,
        targetHeight,
      )
    }

    await fs.outputFile(outputPath, Buffer.from(finalImageBuffer, 'binary'))
    console.log(`✅ Image saved to: ${outputPath}`)
  } catch (error) {
    console.error(`Failed to generate image from text: ${error.message}`)
    throw error
  }
}

module.exports = generateImageFromText
