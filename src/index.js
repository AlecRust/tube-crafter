#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const fs = require('fs-extra');
const path = require('path');
const scriptGenerator = require('./scriptGenerator');
const imageGenerator = require('./imageGenerator');
const audioGenerator = require('./audioGenerator');
const videoGenerator = require('./videoGenerator');
const { parseInputFile } = require('./utils');

async function processTextLines(lines, outputDir) {
    console.log(`Found ${lines.length} text lines to process`);

    const processingPromises = lines.map((line, i) => {
        const audioPath = path.join(outputDir, 'audio', `${i}.mp3`);
        const imagePath = path.join(outputDir, 'images', `${i}.jpg`);
        return Promise.all([
            imageGenerator(line, imagePath),
            audioGenerator(line, audioPath),
        ]);
    });

    await Promise.all(processingPromises);
    console.log(`✅ Image and MP3 created for ${lines.length} text lines\n`);
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

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = path.resolve(`./output/${timestamp}`);
    let lines;

    try {
        if (argv.script) {
            const inputFile = path.resolve(argv.script);
            if (!await fs.pathExists(inputFile)) {
                throw new Error(`The input file ${inputFile} does not exist`);
            }
            lines = await parseInputFile(inputFile);
        } else {
            const generatedScriptPath = await scriptGenerator(
              argv.topic,
              path.join(outputDir, 'script.md')
            );
            if (!await fs.pathExists(generatedScriptPath)) {
                throw new Error(`Failed to generate script for topic: ${argv.topic}`);
            }
            lines = await parseInputFile(generatedScriptPath);
        }

        // Create audio and image files for each text line
        await processTextLines(lines, outputDir);

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
