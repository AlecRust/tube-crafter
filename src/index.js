#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const fs = require('fs-extra');
const path = require('path');
const MarkdownIt = require('markdown-it');
const textToSpeech = require('./textToSpeech');
const imageGenerator = require('./imageGenerator');
const videoComposer = require('./videoComposer');

const argv = yargs(hideBin(process.argv))
    .command('$0 <script>', 'Process the script', (yargs) => {
        yargs.positional('script', {
            describe: 'Path to the script file',
            type: 'string',
        });
    })
    .demandCommand(1, 'You need to provide a script file')
    .help()
    .argv;

const scriptPath = path.resolve(argv.script);

async function processParagraphs(paragraphs, outputDir) {
  const processingPromises = paragraphs.map((paragraph, i) => {
      const audioPath = path.join(outputDir, 'audio', `${i}.mp3`);
      const imagePath = path.join(outputDir, 'images', `${i}.jpg`);
      return Promise.all([
          textToSpeech(paragraph, audioPath),
          imageGenerator(paragraph, imagePath),
      ]);
  });
  return Promise.all(processingPromises);
}

async function main() {
    if (!fs.existsSync(scriptPath)) {
        console.error(`The script file ${scriptPath} does not exist`);
        process.exit(1);
    }

    try {
        const script = await fs.readFile(scriptPath, 'utf8');

        const md = new MarkdownIt();
        const tokens = md.parse(script, {});

        // console.log('Tokens:', tokens);

        const paragraphs = [];
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            if (token.type === 'paragraph_open') {
                const content = tokens[i + 1].content;
                paragraphs.push(content);
            }
        }

        console.log(`🏁 Found ${paragraphs.length} paragraphs to process`);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const outputDir = `./output/${timestamp}`;

        // Create audio and image files for each paragraph
        await processParagraphs(paragraphs, outputDir);

        // Create a video from the audio and image files
        await videoComposer(
          path.join(outputDir, 'audio'),
          path.join(outputDir, 'images'),
          outputDir,
        );
    } catch (error) {
        console.error(`An error occurred while processing the script: ${error.message}`);
        process.exit(1);
    }
}

main();
