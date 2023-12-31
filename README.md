# tube-crafter [![CI](https://github.com/AlecRust/tube-crafter/actions/workflows/ci.yml/badge.svg)](https://github.com/AlecRust/tube-crafter/actions/workflows/ci.yml) [![npm version](https://img.shields.io/npm/v/tube-crafter.svg)](https://www.npmjs.com/package/tube-crafter)

Generate a video from a topic, or a script you already have.

## Installation

```sh
npm install -g tube-crafter
```

## Prerequisites

- [ffmpeg](https://ffmpeg.org/) must be installed
- `OPENAI_API_KEY` must be set in your environment
- Your machine must be able to access Google Cloud ([instructions](https://github.com/googleapis/google-cloud-node/tree/main/packages/google-cloud-texttospeech#quickstart))

## Usage

```sh
tube-crafter --topic "red squirrels"
tube-crafter --script my-script.md
```

When you run the command it will create an `output` directory in the current directory, and a timestamped directory inside for each run. The final video is located at e.g. `output/2023-08-18T11-33-06-013Z/output.mp4`.

## How it works

1. Creates a video script from the topic provided (or uses provided script)
2. Splits the script into "text lines" (paragraphs and headings)
3. Creates a text-to-speech MP3 for each text line
4. Creates an image for each text line (if heading, text shown in image)
5. Creates a video for each text line (using the MP3 and image)
6. Concatenates all the videos into a single video
