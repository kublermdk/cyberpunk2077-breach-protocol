To use the Cyberpunk 2077 Breach Protocol Solver CLI with OCR functionality, you'll need to:

1. **Install the required dependencies** first:
   ```
   npm install jimp@0.16.3 tesseract.js@4.0.2 express body-parser multer
   ```
   
// Used to be "npm install tesseract.js jimp express body-parser multer" but Claude wants the v4 version of Tesseract

2. **For OCR scanning from screenshots:**
   ```
   cd fromClaudeWithTesseractOcr
   node cyberpunk-ocr-cli.js example.jpg --solve
   ```

   This will:
    - Process the screenshot using OCR to extract the code matrix and sequences
    - Automatically solve the breach protocol
    - Display the solution steps in the terminal

   **Additional options:**
   ```
   node cyberpunk-ocr-cli.js screenshot.png --save-json data.json --debug --buffer 8
   ```
    - `--save-json data.json`: Saves the extracted data to a JSON file
    - `--debug`: Saves intermediate image processing steps for debugging
    - `--buffer 8`: Manually specifies buffer size (if auto-detection fails)

The OCR functionality works best with clear screenshots of the breach protocol screen. For optimal results:
- Take screenshots in good lighting conditions
- Ensure the text is clearly visible
- Crop the image to focus on the breach protocol interface

The first time you run the OCR tool, it may need to download Tesseract language data, which might take a moment. Subsequent runs will be faster.
