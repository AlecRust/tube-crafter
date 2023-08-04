#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const fs = require('fs-extra');
const path = require('path');
const MarkdownIt = require('markdown-it');
const audioGenerator = require('./audioGenerator');
const imageGenerator = require('./imageGenerator');
const videoGenerator = require('./videoGenerator');

async function parseInputFile(inputFilePath) {
    try {
        const input = await fs.readFile(inputFilePath, 'utf8');
        const md = new MarkdownIt();
        const tokens = md.parse(input, {});
        const paragraphTokens = tokens.reduce((paragraphs, token, i) => {
            if (token.type === 'paragraph_open') {
                paragraphs.push(tokens[i + 1].content);
            }
            return paragraphs;
        }, []);
        console.log(`📝 Found ${paragraphTokens.length} paragraphs to process`);
        return paragraphTokens;

    } catch (error) {
        throw new Error(`Failed to process input file: ${error.message}`);
    }
}

async function processParagraphs(paragraphs, outputDir) {
    try {
        const processingPromises = paragraphs.map((paragraph, i) => {
            const audioPath = path.join(outputDir, 'audio', `${i}.mp3`);
            const imagePath = path.join(outputDir, 'images', `${i}.jpg`);
            return Promise.all([
                audioGenerator(paragraph, audioPath),
                imageGenerator(paragraph, imagePath),
            ]);
        });
        await Promise.all(processingPromises);
    } catch (error) {
        throw new Error(`Failed to process paragraphs: ${error.message}`);
    }
}

async function main() {
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

    try {
        if (!await fs.pathExists(inputFile)) {
            throw new Error(`The input file ${inputFile} does not exist`);
        }

        const paragraphs = await parseInputFile(inputFile);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const outputDir = `./output/${timestamp}`;

        // Create audio and image files for each paragraph
        await processParagraphs(paragraphs, outputDir);

        // Create a video from the audio and image files
        await videoGenerator(
          path.join(outputDir, 'audio'),
          path.join(outputDir, 'images'),
          outputDir,
        );
    } catch (error) {
        console.error(`An error occurred: ${error.message}`);
        process.exit(1);
    }
}

main();
