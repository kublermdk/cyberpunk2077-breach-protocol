// Cyberpunk 2077 Breach Protocol OCR Module
const fs = require('fs');
const path = require('path');
const { createWorker } = require('tesseract.js');
// Import Jimp correctly
// const Jimp = require('jimp/package.json').version ? require('jimp') : require('jimp').default;
const { Jimp } = require("jimp");

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
        } catch (error) {
            console.error('Error during image processing:', error);
            throw error;
        }
    }

    /**
     * Preprocess the image for better OCR results
     * @param {string} imagePath - Path to the image
     * @returns {Jimp} Processed image
     */
    async preprocessImage(imagePath) {
        console.log(`Loading image from: ${imagePath}`);
        try {
            if (!fs.existsSync(imagePath)) {
                throw new Error(`Image file does not exist: ${imagePath}`);
            }

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
        } catch (error) {
            console.error('Error preprocessing image:', error);
            throw error;
        }
    }

    /**
     * Identify and extract regions of interest from the image
     * @param {Jimp} image - The preprocessed image
     * @returns {Object} Extracted regions as Jimp objects
     */
    async identifyRegions(image) {
        // These values are based on the typical layout of the breach protocol screen
        console.log('Identifying regions in image...');

        // Clone the image for different regions
        const width = image.bitmap.width;
        const height = image.bitmap.height;

        console.log(`Image dimensions: ${width}x${height}`);

        // Calculate regions based on relative positions in the screenshots
        // These values may need adjustment based on different screen resolutions
        const matrixRegion = image.clone().crop(
            Math.floor(width * 0.15),     // x position (15% from left)
            Math.floor(height * 0.25),    // y position (25% from top)
            Math.floor(width * 0.35),     // width (35% of image width)
            Math.floor(height * 0.45)     // height (45% of image height)
        );

        const sequencesRegion = image.clone().crop(
            Math.floor(width * 0.6),      // x position (60% from left)
            Math.floor(height * 0.25),    // y position (25% from top)
            Math.floor(width * 0.35),     // width (35% of image width)
            Math.floor(height * 0.45)     // height (45% of image height)
        );

        // Extract buffer size from the top section
        // This is a rough estimate and might need refinement
        const bufferRegion = image.clone().crop(
            Math.floor(width * 0.7),      // x position (70% from left)
            Math.floor(height * 0.15),    // y position (15% from top)
            Math.floor(width * 0.1),      // width (10% of image width)
            Math.floor(height * 0.05)     // height (5% of image height)
        );

        // Create debug directory if it doesn't exist
        const debugDir = path.join(__dirname, 'debug');
        if (!fs.existsSync(debugDir)) {
            fs.mkdirSync(debugDir);
        }

        // Save the regions for debugging
        const debugMatrixPath = path.join(debugDir, 'debug_matrix_region.png');
        const debugSequencesPath = path.join(debugDir, 'debug_sequences_region.png');
        const debugBufferPath = path.join(debugDir, 'debug_buffer_region.png');

        await matrixRegion.writeAsync(debugMatrixPath);
        await sequencesRegion.writeAsync(debugSequencesPath);
        await bufferRegion.writeAsync(debugBufferPath);

        console.log(`Debug images saved to ${debugDir}`);

        // Extract buffer size using OCR
        const bufferBuffer = await bufferRegion.getBufferAsync(Jimp.MIME_PNG);
        let bufferSize = 7; // Default value

        try {
            const bufferResult = await this.worker.recognize(bufferBuffer);
            const bufferText = bufferResult.data.text.trim();

            // Parse buffer size - extract digits from the text
            const bufferSizeMatch = bufferText.match(/\d+/);
            if (bufferSizeMatch) {
                bufferSize = parseInt(bufferSizeMatch[0]);
            }
        } catch (error) {
            console.warn('Error detecting buffer size, using default (7):', error.message);
        }

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
        console.log('Extracting code matrix...');

        // Further enhance the matrix region for better OCR
        matrixRegion.contrast(0.3);

        // Perform OCR on the matrix region
        const matrixBuffer = await matrixRegion.getBufferAsync(Jimp.MIME_PNG);
        const result = await this.worker.recognize(matrixBuffer);
        const text = result.data.text;

        // Save raw OCR text for debugging
        fs.writeFileSync('debug/matrix_raw_text.txt', text);

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
            const codeValues = [];
            const matches = line.match(/[A-F0-9]{2}/g);

            if (matches && matches.length > 0) {
                codeValues.push(...matches);
            }

            if (codeValues.length > 0) {
                codeMatrix.push(codeValues);
            }
        }

        // Ensure it's a square matrix by finding the most common row length
        const rowLengths = codeMatrix.map(row => row.length);
        let mostCommonLength = 5; // Default fallback

        if (rowLengths.length > 0) {
            const lengthCounts = {};
            rowLengths.forEach(length => {
                lengthCounts[length] = (lengthCounts[length] || 0) + 1;
            });

            let maxCount = 0;
            Object.entries(lengthCounts).forEach(([length, count]) => {
                if (count > maxCount) {
                    maxCount = count;
                    mostCommonLength = parseInt(length);
                }
            });
        }

        // Normalize the matrix: keep rows with the most common length
        // and pad shorter rows or trim longer ones
        const normalizedMatrix = codeMatrix
            .filter(row => row.length > 0) // Remove empty rows
            .map(row => {
                if (row.length < mostCommonLength) {
                    // Pad shorter rows with placeholder values
                    return [...row, ...Array(mostCommonLength - row.length).fill('??')];
                } else if (row.length > mostCommonLength) {
                    // Trim longer rows
                    return row.slice(0, mostCommonLength);
                }
                return row;
            });

        console.log('Extracted code matrix:');
        normalizedMatrix.forEach(row => console.log(row.join(' ')));

        return normalizedMatrix;
    }

    /**
     * Extract required sequences from the sequences region
     * @param {Jimp} sequencesRegion - The image region containing the required sequences
     * @returns {Array} Array of sequences, each sequence being an array of code values
     */
    async extractRequiredSequences(sequencesRegion) {
        console.log('Extracting required sequences...');

        // Enhance the sequences region for better OCR
        sequencesRegion.contrast(0.3);

        // Perform OCR on the sequences region
        const sequencesBuffer = await sequencesRegion.getBufferAsync(Jimp.MIME_PNG);
        const result = await this.worker.recognize(sequencesBuffer);
        const text = result.data.text;

        // Save raw OCR text for debugging
        fs.writeFileSync('debug/sequences_raw_text.txt', text);

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
                requiredSequences.push(matches);
            }
        }

        // Strategy 2: If no sequences found, try a different approach
        if (requiredSequences.length === 0) {
            // Look for lines with sequence-like patterns (2+ hex codes)
            const lines = text.split('\n').map(line => line.trim());

            for (const line of lines) {
                const matches = line.match(/[A-F0-9]{2}/g);
                if (matches && matches.length >= 2) {
                    requiredSequences.push(matches);
                }
            }
        }

        // Strategy 3: If still no sequences, try extracting all hex codes and guess sequences
        if (requiredSequences.length === 0) {
            const allMatches = text.match(/[A-F0-9]{2}/g) || [];
            // Group into sequences of 2-3 codes
            for (let i = 0; i < allMatches.length; i += 2) {
                const seq = allMatches.slice(i, i + Math.min(3, allMatches.length - i));
                if (seq.length >= 2) {
                    requiredSequences.push(seq);
                }
            }
        }

        // Limit to a reasonable number of sequences (usually 2-3 in the game)
        if (requiredSequences.length > 3) {
            requiredSequences = requiredSequences.slice(0, 3);
        }

        // If we still have no sequences, provide some fallback default sequences
        if (requiredSequences.length === 0) {
            console.warn('No sequences detected, using default fallback sequences');
            requiredSequences = [
                ['55', '55'],
                ['FF', '1C'],
                ['BD', '7A']
            ];
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