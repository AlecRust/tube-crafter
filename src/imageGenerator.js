const axios = require('axios');
const fs = require('fs-extra');
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const generateImageFromText = async (text, outputPath) => {
  try {
    const gpt3Response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        // {
        //   "role": "system",
        //   "content": "Respond with only the information asked, no e.g. prefix or suffix."
        // },
        {
          "role": "user",
          // "content": `Respond with short 'alt text' for an image that best represents this paragraph:\n\n${text}`
          // "content": `Give me a short description of an image that would be a suitable backdrop when narrating this paragraph:\n\n${text}`
          // "content": `Give me a short (less than a dozen words) description of an image that best describes this paragraph:\n\n${text}`
          // "content": `Describe in less than a dozen words a simple image that represents this text:\n\n${text}`
          // "content": `Give me a short and simple description of an image that represents this text:\n\n${text}`
          "content": `Respond with a short (less than a dozen words) "alt text" of an image that represents this text:\n\n${text}`
        }
      ]
    });

    const paragraphImagePrompt = gpt3Response.data.choices[0].message.content.trim();
    console.log('🖼️ Image prompt describing paragraph:');
    console.log(`${paragraphImagePrompt}\n`);

    const createImageResponse = await openai.createImage({
      prompt: paragraphImagePrompt,
      n: 1,
      size: "1024x1024",
    });

    const imageUrl = createImageResponse.data.data[0].url;
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });

    await fs.outputFile(outputPath, Buffer.from(imageResponse.data, 'binary'));
    console.log(`✅ Image saved to: ${outputPath}\n`);
  } catch (error) {
    console.error(`Failed to generate image from text: ${error.message}`);
    throw error;
  }
};

module.exports = generateImageFromText;
