import 'dotenv/config'
import axios from 'axios';
import readlineSync from 'readline-sync';
import fs from 'fs';
import { OpenAI } from 'openai';
import * as cheerio from 'cheerio';

function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('Error: OPENAI_API_KEY not found in environment variables.');
    console.log('Please create a .env file with your OpenAI API key:');
    return;
  }

  const openai = new OpenAI();

  let url = readlineSync.question('Enter the website URL to clone: ');
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  if (!isValidUrl(url)) {
    console.error('Error: Invalid URL format. Please enter a valid website URL.');
    return;
  }

  try {
    console.log(`🌐 Fetching HTML from ${url}...`);
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const rawHTML = response.data;

    const $ = cheerio.load(rawHTML);

    $('script, noscript, iframe').remove();
    
    $('[onclick], [onload], [onmouseover], [onerror], [onchange]').each(function () {
      for (const attr of Object.keys(this.attribs)) {
        if (attr.startsWith('on')) {
          $(this).removeAttr(attr);
        }
      }
    });

         $('link[rel="stylesheet"]').remove();
     
     $('img').each(function() {
       const $img = $(this);
       const alt = $img.attr('alt') || 'Image';
       const width = $img.attr('width') || '300';
       const height = $img.attr('height') || '200';
       
       const placeholderUrl = `https://via.placeholder.com/${width}x${height}/cccccc/666666?text=${encodeURIComponent(alt)}`;
       $img.attr('src', placeholderUrl);
       
       if (!$img.attr('alt')) {
         $img.attr('alt', 'Placeholder image');
       }
     });
     
     $('[style*="background-image"]').each(function() {
       const $el = $(this);
       let style = $el.attr('style') || '';
       
       style = style.replace(/background-image:\s*url\([^)]+\)/gi, 
         'background-image: linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
       
       $el.attr('style', style);
     });
     
     const cleanedHTML = $.html();

    const systemPrompt = `
You are an expert web developer who specializes in creating clean, modern website clones.
You will receive HTML content from a website and need to recreate a visually similar UI.

Guidelines:
- Create a complete HTML document with embedded CSS
- Focus on layout, typography, colors, and visual hierarchy
- Use modern CSS techniques (flexbox, grid, etc.)
- Make it responsive and mobile-friendly
- ALL images should use placeholder.com URLs or CSS gradients
- Ensure all image sources work and load properly
- For missing images, use CSS background gradients or placeholder.com
- Keep the design clean and professional
- Don't include any JavaScript functionality
- Use semantic HTML elements
- Ensure proper image dimensions and aspect ratios
- Return ONLY the complete HTML code with embedded CSS
`;

    const userPrompt = `
Here is the HTML structure of a website I want to clone:

${cleanedHTML}

Please create a modern, clean UI clone that:
1. Maintains the same visual layout and structure
2. Uses similar colors and typography
3. Is responsive and works on mobile devices
4. Has smooth, professional styling
5. Uses working placeholder images (placeholder.com URLs or CSS gradients)
6. Ensures ALL images load properly without broken links
7. Maintains proper image dimensions and aspect ratios

IMPORTANT: Make sure all images use placeholder.com URLs like:
- https://via.placeholder.com/300x200/cccccc/666666?text=ImageName
- Or use CSS background gradients for decorative images

Return the complete HTML file with embedded CSS styles.
`;

    console.log('🤖 Asking AI to create the UI clone...');
    console.log('⏳ This may take a few moments...');

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 4000,
      temperature: 0.4
    });

    const clonedHTML = completion.choices[0].message.content;

    let cleanedResponse = clonedHTML.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Additional image fixing in the final HTML
    cleanedResponse = cleanedResponse.replace(
      /<img([^>]*?)src=["']([^"']*?)["']/gi, 
      (match, attrs, src) => {
        // If src doesn't start with http or placeholder.com, replace it
        if (!src.startsWith('http') || (!src.includes('placeholder.com') && !src.includes('via.placeholder'))) {
          const width = attrs.match(/width=["'](\d+)["']/)?.[1] || '300';
          const height = attrs.match(/height=["'](\d+)["']/)?.[1] || '200';
          const alt = attrs.match(/alt=["']([^"']*)["']/)?.[1] || 'Image';
          return `<img${attrs}src="https://via.placeholder.com/${width}x${height}/cccccc/666666?text=${encodeURIComponent(alt)}"`;
        }
        return match;
      }
    );

    fs.writeFileSync('cloned-ui.html', cleanedResponse);

    console.log('');
    console.log('Cloned UI saved to cloned-ui.html');
  } catch (error) {
    console.error('');
    console.error('Error occurred:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      console.error('💡 The request timed out. Try a different website or check your internet connection.');
    } else if (error.response?.status === 403 || error.response?.status === 404) {
      console.error('URL might not exist.');
    } else if (error.message.includes('API key')) {
      console.error('Check your OpenAI API key in the .env file.');
    } else {
      console.error('Try again with a different website URL.');
    }
  }
}

main();
