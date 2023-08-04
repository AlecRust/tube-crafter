#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const fs = require('fs-extra');
const path = require('path');
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

async function processParagraphs(paragraphs) {
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];
      await Promise.all([
          textToSpeech(paragraph, `./output/audio/${i}.mp3`),
          imageGenerator(paragraph, `./output/images/${i}.jpg`),
      ]);
    }

    await videoComposer(
      './output/audio',
      './output/images',
      `./output/video-${new Date().toISOString()}.mp4`,
    );
}

async function main() {
    if (!fs.existsSync(scriptPath)) {
        console.error(`The script file ${scriptPath} does not exist`);
        process.exit(1);
    }

    try {
        const script = await fs.readFile(scriptPath, 'utf8');
        const paragraphs = script.split(/\n\s*\n/);
        console.log(`🏁 Found ${paragraphs.length} paragraphs to process`);
        await processParagraphs(paragraphs);
    } catch (error) {
        console.error(`An error occurred while processing the script: ${error.message}`);
        process.exit(1);
    }
}

main();
