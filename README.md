# Website Cloner
[YT Link](https://www.youtube.com/watch?v=OrAG4HnJtRk) 


A simples tool that creates clean HTML/CSS clones of any website using AI.

## Features

- Clone any website by URL
- AI-powered HTML/CSS generation
- Simple one-command usage

## Prerequisites

- Node.js
- OpenAI API key

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   Create a `.env` file in the project root:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

## Usage

Run the cloner using any of these commands:

```bash
npm start
# or
npm run clone
# or
node main.js
```

1. Enter the website URL when prompted
2. Wait for the AI to generate the clone
3. Open `cloned-ui.html` in your browser

## Example

```
$ npm start
Enter the website URL to clone: example.com
🌐 Fetching HTML from https://example.com...
🤖 Asking AI to create the UI clone...
⏳ This may take a few moments...

Cloned UI saved to cloned-ui.html
```

## How It Works

1. **Fetches** the original website's HTML
2. **Cleans** the HTML (removes scripts, fixes images)
3. **Generates** a modern clone using OpenAI's GPT-4
4. **Outputs** a complete HTML file with embedded CSS
