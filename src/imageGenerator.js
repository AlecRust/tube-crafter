const axios = require('axios');
const fs = require('fs-extra');
const { Configuration, OpenAIApi } = require("openai");
const { createCanvas, loadImage } = require('canvas');
const { calculateAvgColor } = require('./utils');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const generatePrompt = async (content) => {
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        "role": "system",
        "content": "You are ChatGPT, and your task is to distill the user's text into a brief and concise image prompt suitable for DALL-E, a model that generates images from textual descriptions. Summarize the essence of the user's text in less than a dozen words, in a way that would guide the creation of an image."
      },
      {
        "role": "user",
        "content": content
      }
    ]
  });
  return response.data.choices[0].message.content.trim();
};

const addHeadingToImage = async (imageBuffer, text) => {
  const canvas = createCanvas(1024, 1024);
  const ctx = canvas.getContext('2d');
  const image = await loadImage(imageBuffer);
  ctx.drawImage(image, 0, 0, 1024, 1024);

  // Set text color based on the average color
  const avgColor = calculateAvgColor(ctx.getImageData(256, 456, 512, 104));
  ctx.fillStyle = avgColor > 128 ? '#000000' : '#FFFFFF';

  // Set font and alignment
  ctx.font = 'bold 48px sans-serif'; // Added "bold" to make the text bold
  ctx.textAlign = 'center';

  // Split and draw text
  const words = text.split(' ');
  let line = '', y = 512;
  for (const word of words) {
    const testLine = line + word + ' ';
    if (ctx.measureText(testLine).width > 900) {
      ctx.fillText(line, 512, y);
      line = word + ' ';
      y += 50; // Line height
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 512, y); // Draw remaining line

  return canvas.toBuffer('image/png');
};


const generateImageFromText = async (line, outputPath) => {
  try {
    const imagePrompt = await generatePrompt(line.content);

    console.log('🖼️ Image prompt:');
    console.log(`${imagePrompt}\n`);

    const createImageResponse = await openai.createImage({
      prompt: imagePrompt,
      n: 1,
      size: "1024x1024",
    });

    const imageUrl = createImageResponse.data.data[0].url;
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });

    let finalImageBuffer = imageResponse.data;

    if (line.type === 'heading') {
      finalImageBuffer = await addHeadingToImage(imageResponse.data, line.content);
    }

    await fs.outputFile(outputPath, Buffer.from(finalImageBuffer, 'binary'));
    console.log(`✅ Image saved to: ${outputPath}\n`);
  } catch (error) {
    console.error(`Failed to generate image from text: ${error.message}`);
    throw error;
  }
};

module.exports = generateImageFromText;
