const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs-extra');

const convertTextToSpeech = async (text, outputPath) => {
    try {
        const client = new textToSpeech.TextToSpeechClient();

        const request = {
            input: { text: text },
            voice: { languageCode: 'en-GB', name: 'en-GB-Neural2-D' },
            audioConfig: {
                effectsProfileId: ['small-bluetooth-speaker-class-device'], // Apply audio effects
                pitch: 0, // Set pitch to 0
                speakingRate: 1, // Set speaking rate to 1
                audioEncoding: 'MP3', // Use MP3 encoding
            },
        };

        console.log(`🔉 Creating MP3 of text:`);
        console.log(`${text}\n`);

        // Make the Text-to-Speech request
        const [response] = await client.synthesizeSpeech(request);

        // Write the audio data to the output file
        await fs.outputFile(outputPath, response.audioContent, 'binary');
        console.log(`✅ MP3 saved to: ${outputPath}\n`);
    } catch (error) {
        console.error(`Failed to synthesize speech`, error);
        throw error;
    }
};

module.exports = convertTextToSpeech;
