const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs-extra');

const convertTextToSpeech = async (text, output) => {
    try {
        const client = new textToSpeech.TextToSpeechClient();

        // Prepare the SSML text with the desired rate and pitch
        const ssmlText = `<speak><prosody rate="medium" pitch="low">${text}</prosody></speak>`;

        const request = {
            input: { ssml: ssmlText },
            // Specify the desired accent and gender of the voice
            // 'en-GB-Standard-B' is a male voice
            voice: { languageCode: 'en-GB', name: 'en-GB-Standard-D', ssmlGender: 'MALE' },
            audioConfig: { audioEncoding: 'MP3' },
        };

        console.log(`🔉 Creating MP3 of paragraph:`);
        console.log(`${text}\n`);

        // Make the Text-to-Speech request
        const [response] = await client.synthesizeSpeech(request);

        // Write the audio data to the output file
        await fs.outputFile(output, response.audioContent, 'binary');
        console.log(`✅ MP3 saved to: ${output}\n`);
    } catch (error) {
        console.error(`Failed to synthesize speech`, error);
        throw error; // Propagate the error to the caller
    }
};

module.exports = convertTextToSpeech;
