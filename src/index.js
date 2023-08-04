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
    .command('$0 <inputFile>', 'Process the input file', (yargs) => {
        yargs.positional('inputFile', {
            describe: 'Path to the input file',
            type: 'string',
        });
    })
    .demandCommand(1, 'You need to provide an input file')
    .help()
    .argv;

const inputFile = path.resolve(argv.inputFile);

async function processParagraph(paragraph, outputDir, i) {
  try {
      const audioPath = path.join(outputDir, 'audio', `${i}.mp3`);
      const imagePath = path.join(outputDir, 'images', `${i}.jpg`);

      await Promise.all([
          textToSpeech(paragraph, audioPath),
          imageGenerator(paragraph, imagePath),
      ]);
  } catch (error) {
      console.error(`An error occurred while processing paragraph ${i}: ${error.message}`);
      process.exit(1);
  }
}

async function processParagraphs(paragraphs, outputDir) {
  const processingPromises = paragraphs.map((paragraph, i) => processParagraph(paragraph, outputDir, i));
  await Promise.all(processingPromises);
}

function getParagraphsFromTokens(tokens) {
    return tokens.reduce((paragraphs, token, i) => {
        if (token.type === 'paragraph_open') {
            paragraphs.push(tokens[i + 1].content);
        }
        return paragraphs;
    }, []);
}

async function main() {
    if (!fs.existsSync(inputFile)) {
        console.error(`The input file ${inputFile} does not exist`);
        process.exit(1);
    }

    try {
        const input = await fs.readFile(inputFile, 'utf8');

        const md = new MarkdownIt();
        let tokens;
        try {
            tokens = md.parse(input, {});
        } catch (error) {
            console.error(`Failed to parse input file as Markdown: ${error.message}`);
            process.exit(1);
        }

        const paragraphs = getParagraphsFromTokens(tokens);

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
        console.error(`An error occurred while processing the input file: ${error.message}`);
        process.exit(1);
    }
}

main();
