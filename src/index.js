#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const fs = require('fs-extra');
const path = require('path');
const MarkdownIt = require('markdown-it');
const scriptGenerator = require('./scriptGenerator');
const imageGenerator = require('./imageGenerator');
const audioGenerator = require('./audioGenerator');
const videoGenerator = require('./videoGenerator');

async function parseInputFile(inputFilePath) {
    try {
        const input = await fs.readFile(inputFilePath, 'utf8');
        const md = new MarkdownIt();
        const tokens = md.parse(input, {});
        return tokens;
    } catch (error) {
        throw new Error(`Failed to process input file: ${error.message}`);
    }
}

async function processTextTokens(tokens, outputDir) {
    try {
        const textLines = tokens.reduce((lines, token, i) => {
            if (token.type === 'paragraph_open' || token.type === 'heading_open') {
                lines.push(tokens[i + 1].content);
            }
            return lines;
        }, []);

        console.log(`Found ${textLines.length} text lines to process`);

        const processingPromises = textLines.map((line, i) => {
            const audioPath = path.join(outputDir, 'audio', `${i}.mp3`);
            const imagePath = path.join(outputDir, 'images', `${i}.jpg`);
            return Promise.all([
                imageGenerator(line, imagePath),
                audioGenerator(line, audioPath),
            ]);
        });
        await Promise.all(processingPromises);
        console.log(`✅ Image and MP3 created for ${textLines.length} text lines\n`);
    } catch (error) {
        throw new Error(`Failed to process text tokens: ${error.message}`);
    }
}

async function main() {
    const argv = yargs(hideBin(process.argv))
        .command('$0 [topic]', 'Create a video about the topic', (yargs) => {
            yargs.positional('topic', {
                describe: 'The topic to create a video about',
                type: 'string',
            });
        })
        .option('script', {
            alias: 's',
            describe: 'Path to a Markdown file as a script',
            type: 'string',
        })
        .check(argv => {
            if (!argv.topic && !argv.script) {
                throw new Error('You must provide a topic or a script file');
            }
            return true;
        })
        .help()
        .argv;

    let tokens;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = `./output/${timestamp}`;

    try {
        if (argv.script) {
            const inputFile = path.resolve(argv.script);
            if (!await fs.pathExists(inputFile)) {
                throw new Error(`The input file ${inputFile} does not exist`);
            }
            tokens = await parseInputFile(inputFile);
        } else {
            const generatedScriptPath = await scriptGenerator(
              argv.topic,
              path.join(outputDir, 'script.md')
            );
            if (!await fs.pathExists(generatedScriptPath)) {
                throw new Error(`Failed to generate script for topic: ${argv.topic}`);
            }
            tokens = await parseInputFile(generatedScriptPath);
        }

        // Create audio and image files for each text line
        await processTextTokens(tokens, outputDir);

        // Create a video from the audio and image files
        await videoGenerator(
            path.join(outputDir, 'audio'),
            path.join(outputDir, 'images'),
            path.join(outputDir, 'output.mp4')
        );
    } catch (error) {
        console.error(`An error occurred: ${error.message}`);
        process.exit(1);
    }
}

main();
