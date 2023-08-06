const fs = require('fs-extra');
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const generateScriptForTopic = async (topic, outputPath) => {
  try {
    console.log(`📝 Generating script for topic: ${topic}\n`);

    const gpt3Response = await openai.createChatCompletion({
      // TODO: Use GPT-4 instead?
      model: "gpt-3.5-turbo",
      messages: [
        {
          "role": "system",
          "content": "Reply in Markdown format with only a main heading and paragraphs (that aren't too long)."
        },
        {
          "role": "user",
          "content": `Write an interesting and comprehensive video on the topic of ${topic}.`
        }
      ]
    });

    // Extracting the script content
    const scriptContent = gpt3Response.data.choices[0].message.content.trim();

    // Writing the Markdown file
    await fs.outputFile(outputPath, scriptContent);
    console.log(`✅ Script saved to: ${outputPath}\n`);

    return outputPath;
  } catch (error) {
    console.error(`Failed to generate script for topic: ${error.message}`);
    throw error;
  }
};

module.exports = generateScriptForTopic;
