To use the Cyberpunk 2077 Breach Protocol Solver CLI with OCR functionality, you'll need to:

1. **Install the required dependencies** first:
   ```
   npm install jimp@0.16.3 tesseract.js@4.0.2 express body-parser multer
   ```
   
// Used to be "npm install tesseract.js jimp express body-parser multer" but Claude wants the v4 version of Tesseract

2. **For OCR scanning from screenshots:**
   ```
   node cyberpunk-ocr-cli.js screenshot.png --solve
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

3. **For manual data entry:**
   ```
   node cyberpunk-cli.js
   ```

   This launches an interactive prompt where you can:
    - Enter the matrix size
    - Input each row of the code matrix
    - Define required sequences
    - Specify buffer size

The OCR functionality works best with clear screenshots of the breach protocol screen. For optimal results:
- Take screenshots in good lighting conditions
- Ensure the text is clearly visible
- Crop the image to focus on the breach protocol interface

The first time you run the OCR tool, it may need to download Tesseract language data, which might take a moment. Subsequent runs will be faster.

Would you like specific instructions for any other aspect of using the CLI?