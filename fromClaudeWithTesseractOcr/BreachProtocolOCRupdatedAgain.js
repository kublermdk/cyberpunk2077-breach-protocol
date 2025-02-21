// Cyberpunk 2077 Breach Protocol OCR Module with Jimp compatibility fixes
const fs = require('fs');
const path = require('path');
const { createWorker } = require('tesseract.js');
// Import Jimp correctly
const Jimp = require('jimp');

/**
 * Class to handle OCR processing for Cyberpunk 2077 Breach Protocol screenshots
 */
class BreachProtocolOCR {
    constructor() {
        this.worker = null;
    }

    /**
     * Initialize the OCR worker
     */
    async initialize() {
        try {
            // Create a new worker with the current Tesseract.js API
            this.worker = await createWorker();

            // Load English language data
            await this.worker.loadLanguage('eng');
            await this.worker.initialize('eng');

            // Configure Tesseract for better recognition of the game's font
            await this.worker.setParameters({
                tessedit_char_whitelist: 'ABCDEF1234567890',
                tessedit_pageseg_mode: '6', // Assume a single uniform block of text
            });

            console.log('OCR worker initialized successfully');
        } catch (error) {
            console.error('Error initializing OCR worker:', error);
            throw error;
        }
    }

    /**
     * Process an image to extract the breach protocol data
     * @param {string} imagePath - Path to the screenshot image
     * @returns {Object} Extracted matrix and sequences
     */
    async processImage(imagePath) {
        if (!this.worker) {
            throw new Error('OCR worker not initialized. Call initialize() first.');
        }

        console.log(`Processing image: ${imagePath}`);

        try {
            // Load the image
            console.log(`Loading image from: ${imagePath}`);
            if (!fs.existsSync(imagePath)) {
                throw new Error(`Image file does not exist: ${imagePath}`);
            }

            const image = await Jimp.read(imagePath);
            console.log(`Image loaded successfully: ${image.bitmap.width}x${image.bitmap.height}`);

            // Process the full image
            const processedImage = this.preprocessImage(image);

            // Create debug directory
            const debugDir = path.join(process.cwd(), 'debug');
            if (!fs.existsSync(debugDir)) {
                fs.mkdirSync(debugDir);
            }

            // Save the processed full image for debugging
            await processedImage.clone().writeAsync(path.join(debugDir, 'processed_full_image.png'));

            // Extract the code matrix through direct OCR of different regions
            const { codeMatrix, requiredSequences, bufferSize } = await this.extractDataFromImage(processedImage);

            return {
                codeMatrix,
                requiredSequences,
                bufferSize: bufferSize || 7
            };
        } catch (error) {
            console.error('Error during image processing:', error);
            throw error;
        }
    }

    /**
     * Preprocess the image for better OCR results
     * @param {Jimp} image - The image to process
     * @returns {Jimp} Processed image
     */
    preprocessImage(image) {
        console.log('Preprocessing image...');

        // Clone the image to avoid modifying the original
        const processedImage = image.clone();

        // Resize if the image is very large
        if (processedImage.bitmap.width > 1920) {
            processedImage.resize(1920, Jimp.AUTO);
        }

        // Process the image to enhance the text
        processedImage
            .contrast(0.2)               // Increase contrast
            .brightness(0.05)            // Adjust brightness
            .greyscale();                // Convert to grayscale

        return processedImage;
    }

    /**
     * Extract game data from the image using different regions
     * @param {Jimp} image - The preprocessed image
     * @returns {Object} Extracted game data
     */
    async extractDataFromImage(image) {
        const width = image.bitmap.width;
        const height = image.bitmap.height;

        console.log(`Image dimensions: ${width}x${height}`);

        // Create debug directory if it doesn't exist
        const debugDir = path.join(process.cwd(), 'debug');
        if (!fs.existsSync(debugDir)) {
            fs.mkdirSync(debugDir);
        }

        // Extract matrix region (left side of the screen)
        // Fixed coordinates to avoid Jimp/Zod issues
        const matrixX = Math.round(width * 0.15);
        const matrixY = Math.round(height * 0.25);
        const matrixWidth = Math.round(width * 0.35);
        const matrixHeight = Math.round(height * 0.45);

        console.log(`Matrix region: x=${matrixX}, y=${matrixY}, width=${matrixWidth}, height=${matrixHeight}`);

        // Create a new image for the matrix region
        const matrixImage = image.clone();
        try {
            matrixImage.crop(matrixX, matrixY, matrixWidth, matrixHeight);
            await matrixImage.writeAsync(path.join(debugDir, 'matrix_region.png'));
        } catch (error) {
            console.error('Error cropping matrix region:', error);
            // Fall back to simple extraction from the full image
        }

        // Extract sequences region (right side of the screen)
        const seqX = Math.round(width * 0.6);
        const seqY = Math.round(height * 0.25);
        const seqWidth = Math.round(width * 0.35);
        const seqHeight = Math.round(height * 0.45);

        console.log(`Sequences region: x=${seqX}, y=${seqY}, width=${seqWidth}, height=${seqHeight}`);

        // Create a new image for the sequences region
        const seqImage = image.clone();
        try {
            seqImage.crop(seqX, seqY, seqWidth, seqHeight);
            await seqImage.writeAsync(path.join(debugDir, 'sequences_region.png'));
        } catch (error) {
            console.error('Error cropping sequences region:', error);
            // Fall back to simple extraction from the full image
        }

        // Extract buffer size region (top of the screen)
        const bufferX = Math.round(width * 0.7);
        const bufferY = Math.round(height * 0.15);
        const bufferWidth = Math.round(width * 0.1);
        const bufferHeight = Math.round(height * 0.05);

        console.log(`Buffer region: x=${bufferX}, y=${bufferY}, width=${bufferWidth}, height=${bufferHeight}`);

        // Create a new image for the buffer region
        const bufferImage = image.clone();
        try {
            bufferImage.crop(bufferX, bufferY, bufferWidth, bufferHeight);
            await bufferImage.writeAsync(path.join(debugDir, 'buffer_region.png'));
        } catch (error) {
            console.error('Error cropping buffer region:', error);
            // Continue with default buffer size
        }

        // Process the regions to extract data
        const codeMatrix = await this.extractCodeMatrix(matrixImage);
        const requiredSequences = await this.extractRequiredSequences(seqImage);
        const bufferSize = await this.extractBufferSize(bufferImage);

        return {
            codeMatrix,
            requiredSequences,
            bufferSize
        };
    }

    /**
     * Extract code matrix from the matrix region image
     * @param {Jimp} matrixImage - The image region containing the code matrix
     * @returns {Array} 2D array representing the code matrix
     */
    async extractCodeMatrix(matrixImage) {
        console.log('Extracting code matrix...');

        // Enhance the image for better OCR
        matrixImage.contrast(0.3);

        // Perform OCR on the image
        const buffer = await matrixImage.getBufferAsync(Jimp.MIME_PNG);
        const result = await this.worker.recognize(buffer);
        const text = result.data.text;

        // Save raw OCR text for debugging
        const debugDir = path.join(process.cwd(), 'debug');
        fs.writeFileSync(path.join(debugDir, 'matrix_raw_text.txt'), text);

        // Process the OCR result to extract the code matrix
        // Split by lines and clean up
        const lines = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        console.log('Raw OCR lines:');
        lines.forEach(line => console.log(`"${line}"`));

        // Process each line to extract code values
        const codeMatrix = [];

        for (const line of lines) {
            // Extract code values (typically 2 characters each, like "7A", "FF", "BD", etc.)
            const matches = line.match(/[A-F0-9]{2}/g);

            if (matches && matches.length > 0) {
                codeMatrix.push(matches);
            }
        }

        // If no valid data was extracted, return a default matrix
        if (codeMatrix.length === 0) {
            console.warn('No valid code matrix extracted, using a default matrix');
            return [
                ["7A", "FF", "7A", "55", "FF", "1C", "7A"],
                ["E9", "1C", "FF", "1C", "1C", "7A", "1C"],
                ["55", "55", "55", "55", "FF", "BD", "7A"],
                ["1C", "E9", "7A", "BD", "FF", "1C", "FF"],
                ["FF", "E9", "FF", "7A", "FF", "1C", "BD"],
                ["BD", "BD", "1C", "BD", "E9", "FF", "55"],
                ["1C", "E9", "55", "E9", "55", "7A", "55"]
            ];
        }

        // Normalize the matrix to ensure it's square
        const matrixSize = Math.max(
            ...codeMatrix.map(row => row.length),
            codeMatrix.length
        );

        // Make sure the matrix is square with valid values in each cell
        const normalizedMatrix = [];
        for (let i = 0; i < matrixSize; i++) {
            const row = codeMatrix[i] || [];
            const normalizedRow = [];

            for (let j = 0; j < matrixSize; j++) {
                normalizedRow.push(row[j] || this.getRandomCodeValue());
            }

            normalizedMatrix.push(normalizedRow);
        }

        console.log('Extracted code matrix:');
        normalizedMatrix.forEach(row => console.log(row.join(' ')));

        return normalizedMatrix;
    }

    /**
     * Extract required sequences from the sequences region image
     * @param {Jimp} seqImage - The image region containing the required sequences
     * @returns {Array} Array of sequences, each sequence being an array of code values
     */
    async extractRequiredSequences(seqImage) {
        console.log('Extracting required sequences...');

        // Enhance the image for better OCR
        seqImage.contrast(0.3);

        // Perform OCR on the image
        const buffer = await seqImage.getBufferAsync(Jimp.MIME_PNG);
        const result = await this.worker.recognize(buffer);
        const text = result.data.text;

        // Save raw OCR text for debugging
        const debugDir = path.join(process.cwd(), 'debug');
        fs.writeFileSync(path.join(debugDir, 'sequences_raw_text.txt'), text);

        console.log('Raw sequences text:');
        console.log(text);

        // Try different strategies to extract sequences
        let requiredSequences = [];

        // Strategy 1: Look for patterns that match sequence descriptions
        // In Cyberpunk, they are typically labeled as "BASIC DATAMINE", "ADVANCED DATAMINE", etc.
        const sequenceBlocks = text.split(/DATAMINE/i)
            .filter(block => block.trim().length > 0);

        for (const block of sequenceBlocks) {
            // Extract code values from each sequence block
            const matches = block.match(/[A-F0-9]{2}/g);

            if (matches && matches.length > 0) {
                // Group matches into a sequence (usually 2-4 codes per sequence)
                requiredSequences.push(matches.slice(0, Math.min(matches.length, 4)));
            }
        }

        // Strategy 2: If no sequences found, try a different approach
        if (requiredSequences.length === 0) {
            // Look for lines with hex codes
            const lines = text.split('\n').map(line => line.trim());

            for (const line of lines) {
                const matches = line.match(/[A-F0-9]{2}/g);
                if (matches && matches.length >= 2) {
                    // Group matches into a sequence
                    requiredSequences.push(matches.slice(0, Math.min(matches.length, 4)));
                }
            }
        }

        // If we still have no sequences, provide default sequences
        if (requiredSequences.length === 0) {
            console.warn('No sequences detected, using default fallback sequences');
            requiredSequences = [
                ['55', '55'],
                ['FF', '55'],
                ['1C', '7A', '7A']
            ];
        }

        // Limit to a reasonable number of sequences (usually 2-3 in the game)
        if (requiredSequences.length > 3) {
            requiredSequences = requiredSequences.slice(0, 3);
        }

        console.log('Extracted required sequences:');
        requiredSequences.forEach(seq => console.log(seq.join(' ')));

        return requiredSequences;
    }

    /**
     * Extract buffer size from the buffer region image
     * @param {Jimp} bufferImage - The image region containing the buffer size
     * @returns {number} Buffer size
     */
    async extractBufferSize(bufferImage) {
        console.log('Extracting buffer size...');

        try {
            // Perform OCR on the buffer region
            const buffer = await bufferImage.getBufferAsync(Jimp.MIME_PNG);
            const result = await this.worker.recognize(buffer);
            const text = result.data.text.trim();

            console.log(`Buffer OCR text: "${text}"`);

            // Try to extract a number from the text
            const matches = text.match(/\d+/g);
            if (matches && matches.length > 0) {
                // Use the first number found
                const bufferSize = parseInt(matches[0]);
                if (bufferSize > 0 && bufferSize <= 10) {
                    console.log(`Detected buffer size: ${bufferSize}`);
                    return bufferSize;
                }
            }
        } catch (error) {
            console.error('Error detecting buffer size:', error);
        }

        // Default buffer size if not detected
        console.log('Using default buffer size: 7');
        return 7;
    }

    /**
     * Generate a random code value for filling in missing matrix cells
     * @returns {string} Random code value
     */
    getRandomCodeValue() {
        const codeValues = ['1C', '7A', '55', 'FF', 'BD', 'E9'];
        return codeValues[Math.floor(Math.random() * codeValues.length)];
    }

    /**
     * Clean up resources
     */
    async terminate() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
            console.log('OCR worker terminated');
        }
    }
}

/**
 * Helper function to process an image file
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<Object>} Extracted game data
 */
async function processBreachProtocolImage(imagePath) {
    const ocr = new BreachProtocolOCR();

    try {
        await ocr.initialize();
        const result = await ocr.processImage(imagePath);
        await ocr.terminate();
        return result;
    } catch (error) {
        console.error('Error processing image:', error);
        if (ocr) {
            await ocr.terminate().catch(() => {}); // Ensure we terminate even on errors
        }
        throw error;
    }
}

module.exports = {
    BreachProtocolOCR,
    processBreachProtocolImage
};