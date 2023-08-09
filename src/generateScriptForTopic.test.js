const generateScriptForTopic = require('./generateScriptForTopic')
const fs = require('fs-extra')

jest.mock('fs-extra')

describe('generateScriptForTopic', () => {
  let openaiInstance

  // Suppress console.log and console.error
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  // Restore console.log and console.error
  afterAll(() => {
    console.log.mockRestore()
    console.error.mockRestore()
  })

  beforeEach(() => {
    // Create a mock OpenAI instance with createChatCompletion method
    openaiInstance = { createChatCompletion: jest.fn() }
  })

  it('should generate a script based on a given topic', async () => {
    const topic = 'Space Exploration'
    const outputPath = 'output.md'

    // Simulate the OpenAI API response
    openaiInstance.createChatCompletion.mockResolvedValue({
      data: {
        choices: [
          {
            message: {
              content: `# ${topic}\n\nContent about space exploration...`,
            },
          },
        ],
      },
    })

    // Call the generateScriptForTopic function with the topic and mock dependencies
    await generateScriptForTopic(
      topic,
      outputPath,
      openaiInstance,
      fs.outputFile,
    )

    // Check if the content starts with the expected title
    expect(fs.outputFile).toHaveBeenCalledWith(
      outputPath,
      expect.stringMatching(`# ${topic}`),
    )

    // Check if the content includes the expected snippet
    expect(fs.outputFile).toHaveBeenCalledWith(
      outputPath,
      expect.stringContaining('Content about space exploration...'),
    )

    // Check if the logger logged the success message
    expect(console.log).toHaveBeenCalledWith(
      expect.stringMatching(`✅ Script saved to: ${outputPath}`),
    )
  })

  it('should handle OpenAI API errors gracefully', async () => {
    // Define the topic and output path for this specific test
    const topic = 'Space Exploration'
    const outputPath = 'output.md'

    // Simulate an OpenAI API error
    openaiInstance.createChatCompletion.mockRejectedValue(
      new Error('API Error'),
    )

    // Call the generateScriptForTopic function with the topic and mock dependencies and expect an error
    await expect(
      generateScriptForTopic(topic, outputPath, openaiInstance, fs.outputFile),
    ).rejects.toThrow('API Error')
  })
})
