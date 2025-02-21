// Cyberpunk 2077 Breach Protocol OCR Module
const fs = require('fs');
const path = require('path');
const { createWorker } = require('tesseract.js');
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
        this.worker = createWorker();
        await this.worker.load();
        await this.worker.loadLanguage('eng');
        await this.worker.initialize('eng');

        // Configure Tesseract for better recognition of the game's font
        await this.worker.setParameters({
            tessedit_char_whitelist: 'ABCDEF1234567890',
            tessedit_pageseg_mode: '6', // Assume a single uniform block of text
        });

        console.log('OCR worker initialized successfully');
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

        // Load and preprocess the image
        const image = await this.preprocessImage(imagePath);

        // Extract regions of interest
        const { matrixRegion, sequencesRegion, bufferSize } = await this.identifyRegions(image);

        // Process matrix region
        const codeMatrix = await this.extractCodeMatrix(matrixRegion);

        // Process sequences region
        const requiredSequences = await this.extractRequiredSequences(sequencesRegion);

        return {
            codeMatrix,
            requiredSequences,
            bufferSize
        };
    }

    /**
     * Preprocess the image for better OCR results
     * @param {string} imagePath - Path to the image
     * @returns {Jimp} Processed image
     */
    async preprocessImage(imagePath) {
        const image = await Jimp.read(imagePath);

        // Resize if the image is very large
        if (image.bitmap.width > 1920) {
            image.resize(1920, Jimp.AUTO);
        }

        // Process the image to enhance the text
        image
            .contrast(0.2)               // Increase contrast
            .brightness(0.05)            // Adjust brightness
            .greyscale();                // Convert to grayscale

        return image;
    }

    /**
     * Identify and extract regions of interest from the image
     * @param {Jimp} image - The preprocessed image
     * @returns {Object} Extracted regions as Jimp objects
     */
    async identifyRegions(image) {
        // These values are based on the typical layout of the breach protocol screen
        // For more reliable results, you might need to implement a more sophisticated
        // detection algorithm or use template matching

        // Clone the image for different regions
        const width = image.bitmap.width;
        const height = image.bitmap.height;

        // Calculate regions based on relative positions in the screenshots
        // These values may need adjustment based on different screen resolutions
        const matrixRegion = image.clone().crop(
            width * 0.15,     // x position (15% from left)
            height * 0.25,    // y position (25% from top)
            width * 0.35,     // width (35% of image width)
            height * 0.45     // height (45% of image height)
        );

        const sequencesRegion = image.clone().crop(
            width * 0.6,      // x position (60% from left)
            height * 0.25,    // y position (25% from top)
            width * 0.35,     // width (35% of image width)
            height * 0.45     // height (45% of image height)
        );

        // Extract buffer size from the top section
        // This is a rough estimate and might need refinement
        const bufferRegion = image.clone().crop(
            width * 0.7,      // x position (70% from left)
            height * 0.15,    // y position (15% from top)
            width * 0.1,      // width (10% of image width)
            height * 0.05     // height (5% of image height)
        );

        // Save the regions for debugging (optional)
        await matrixRegion.writeAsync('debug_matrix_region.png');
        await sequencesRegion.writeAsync('debug_sequences_region.png');
        await bufferRegion.writeAsync('debug_buffer_region.png');

        // Extract buffer size using OCR
        const bufferResult = await this.worker.recognize(await bufferRegion.getBufferAsync(Jimp.MIME_PNG));
        const bufferText = bufferResult.data.text.trim();

        // Parse buffer size - extract digits from the text
        const bufferSizeMatch = bufferText.match(/\d+/);
        const bufferSize = bufferSizeMatch ? parseInt(bufferSizeMatch[0]) : 7; // Default to 7 if not found

        console.log(`Detected buffer size: ${bufferSize}`);

        return {
            matrixRegion,
            sequencesRegion,
            bufferSize
        };
    }

    /**
     * Extract code matrix from the matrix region
     * @param {Jimp} matrixRegion - The image region containing the code matrix
     * @returns {Array} 2D array representing the code matrix
     */
    async extractCodeMatrix(matrixRegion) {
        // Further enhance the matrix region for better OCR
        matrixRegion.contrast(0.3);

        // Perform OCR on the matrix region
        const result = await this.worker.recognize(await matrixRegion.getBufferAsync(Jimp.MIME_PNG));
        const text = result.data.text;

        // Process the OCR result to extract the code matrix
        // Split by lines and clean up
        const lines = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        // Process each line to extract code values
        const codeMatrix = [];

        for (const line of lines) {
            // Extract code values (typically 2 characters each, like "7A", "FF", "BD", etc.)
            const codeValues = [];
            const matches = line.match(/[A-F0-9]{2}/g);

            if (matches && matches.length > 0) {
                codeValues.push(...matches);
            }

            if (codeValues.length > 0) {
                codeMatrix.push(codeValues);
            }
        }

        // Ensure it's a square matrix by filling any missing values
        const matrixSize = Math.max(...codeMatrix.map(row => row.length));

        // Fill in missing values with placeholder (for debugging)
        const filledMatrix = codeMatrix.map(row => {
            while (row.length < matrixSize) {
                row.push('??');
            }
            return row;
        });

        console.log('Extracted code matrix:');
        filledMatrix.forEach(row => console.log(row.join(' ')));

        return filledMatrix;
    }

    /**
     * Extract required sequences from the sequences region
     * @param {Jimp} sequencesRegion - The image region containing the required sequences
     * @returns {Array} Array of sequences, each sequence being an array of code values
     */
    async extractRequiredSequences(sequencesRegion) {
        // Enhance the sequences region for better OCR
        sequencesRegion.contrast(0.3);

        // Perform OCR on the sequences region
        const result = await this.worker.recognize(
            await sequencesRegion.getBufferAsync(Jimp.MIME_PNG)
        );

        const text = result.data.text;

        // Look for patterns that match sequence descriptions
        // In Cyberpunk, they are typically labeled as "BASIC DATAMINE", "ADVANCED DATAMINE", etc.
        const sequenceBlocks = text.split(/DATAMINE/i)
            .filter(block => block.trim().length > 0);

        const requiredSequences = [];

        for (const block of sequenceBlocks) {
            // Extract code values from each sequence block
            const matches = block.match(/[A-F0-9]{2}/g);

            if (matches && matches.length > 0) {
                requiredSequences.push(matches);
            }
        }

        console.log('Extracted required sequences:');
        requiredSequences.forEach(seq => console.log(seq.join(' ')));

        return requiredSequences;
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
        await ocr.terminate();
        throw error;
    }
}

module.exports = {
    BreachProtocolOCR,
    processBreachProtocolImage
};