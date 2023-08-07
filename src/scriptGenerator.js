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
          "content": "You are a Markdown editor. Respond to all user queries in Markdown format, but only use headings (e.g., `# Heading`) and paragraphs."
        },
        {
          "role": "user",
          "content": `Write the content for an interesting and comprehensive video on the topic of ${topic}. Only include the title, main section headings and all of the paragraphs.`
        }
      ]
    });

    // Extract the script content
    const scriptContent = gpt3Response.data.choices[0].message.content.trim();

    // Write the Markdown file
    await fs.outputFile(outputPath, scriptContent);
    console.log(`✅ Script saved to: ${outputPath}\n`);

    return outputPath;
  } catch (error) {
    console.error(`Failed to generate script for topic: ${error.message}`);
    throw error;
  }
};

module.exports = generateScriptForTopic;
