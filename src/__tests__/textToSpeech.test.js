const textToSpeech = require('../textToSpeech');
const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
const fs = require('fs');
jest.mock('@google-cloud/text-to-speech');
jest.mock('fs');

describe('textToSpeech', () => {
    it('calls the TextToSpeechClient with the correct parameters', async () => {
        const mockSynthesizeSpeech = jest.fn().mockResolvedValue([{ audioContent: 'fakeAudioContent' }]);
        TextToSpeechClient.mockImplementation(() => ({
            synthesizeSpeech: mockSynthesizeSpeech,
        }));

        const writeFile = jest.fn();
        fs.promises = { writeFile };

        await textToSpeech('fakeText', 'fakeOutput');

        expect(mockSynthesizeSpeech).toHaveBeenCalledWith({
            input: { text: 'fakeText' },
            voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
            audioConfig: { audioEncoding: 'MP3' },
        });
        expect(writeFile).toHaveBeenCalledWith('fakeOutput', 'fakeAudioContent', 'binary');
    });
});
