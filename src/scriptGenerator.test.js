const scriptGenerator = require('./scriptGenerator')
const fs = require('fs-extra')

// Mocking dependencies
jest.mock('fs-extra')

describe('scriptGenerator', () => {
  let openai

  // Mock console.log to suppress the log messages in the test output
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterAll(() => {
    console.log.mockRestore() // Restore the original console.log function
  })

  beforeEach(() => {
    // Create a mock OpenAI instance with createChatCompletion method
    openai = { createChatCompletion: jest.fn() }
  })

  it('should generate a script based on a given topic', async () => {
    const topic = 'Space Exploration'
    const outputPath = 'output.md'

    // Simulating the OpenAI API response
    openai.createChatCompletion.mockResolvedValue({
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

    // Call the scriptGenerator function with the topic and mock OpenAI instance
    await scriptGenerator(topic, outputPath, openai)

    // Retrieve the actual content written to the file
    const actualContent = fs.outputFile.mock.calls[0][1]

    // Check if the content starts with the expected title
    expect(actualContent.startsWith(`# ${topic}`)).toBe(true)

    // Check if the content includes the expected snippet
    expect(actualContent.includes('Content about space exploration...')).toBe(
      true,
    )
  })

  it('should handle OpenAI API errors gracefully', async () => {
    // Define the topic and output path for this specific test
    const topic = 'Space Exploration'
    const outputPath = 'output.md'

    // Save the original console.error function
    const originalConsoleError = console.error

    // Temporarily override console.error with a no-op function
    console.error = jest.fn()

    // Simulating an OpenAI API error
    openai.createChatCompletion.mockRejectedValue(new Error('API Error'))

    // Call the scriptGenerator function with the topic and mock OpenAI instance and expect an error
    await expect(scriptGenerator(topic, outputPath, openai)).rejects.toThrow(
      'API Error',
    )

    // Restore the original console.error function
    console.error = originalConsoleError
  })
})
