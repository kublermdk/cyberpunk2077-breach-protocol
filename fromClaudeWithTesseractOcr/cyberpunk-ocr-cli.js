#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const {processBreachProtocolImage} = require('./BreachProtocolOCRupdatedAgain');
const {solveBreachProtocol} = require('./BreachProtocol');

// Process command line arguments
const args = process.argv.slice(2);

// Display usage information if no arguments are provided
if (args.length === 0) {
    console.log('Cyberpunk 2077 Breach Protocol OCR Tool');
    console.log('--------------------------------------');
    console.log('Usage:');
    console.log('  node cyberpunk-ocr-cli.js <image_path> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --save-json <file>  Save extracted data to a JSON file');
    console.log('  --debug             Save debug images during processing');
    console.log('  --solve             Automatically solve the breach protocol');
    console.log('  --buffer <size>     Override detected buffer size (default: auto-detect)');
    console.log('');
    console.log('Example:');
    console.log('  node cyberpunk-ocr-cli.js screenshot.png --solve');
    process.exit(0);
}

// Parse arguments
const imagePath = args[0];
const saveJsonPath = args.indexOf('--save-json') !== -1
    ? args[args.indexOf('--save-json') + 1]
    : null;
const debug = args.includes('--debug');
const solve = args.includes('--solve');
const bufferSizeIndex = args.indexOf('--buffer');
const manualBufferSize = bufferSizeIndex !== -1
    ? parseInt(args[bufferSizeIndex + 1])
    : null;

// Check if the image file exists
if (!fs.existsSync(imagePath)) {
    console.error(`Error: Image file not found: ${imagePath}`);
    process.exit(1);
}

/**
 * Process the breach protocol image and solve it if requested
 */
async function processAndSolve() {
    console.log(`Processing image: ${imagePath}`);

    try {
        // Process the image with OCR
        let result = await processBreachProtocolImage(imagePath);

        // Override buffer size if provided
        if (manualBufferSize !== null) {
            result.bufferSize = manualBufferSize;
            console.log(`Using manually specified buffer size: ${manualBufferSize}`);
        }


        console.log("-- Code Matrix JSON version (before Cleanup) ---");
        console.log(JSON.stringify(result.codeMatrix));
        // Clean up the matrix (remove incomplete rows, etc.)
        result.codeMatrix = cleanMatrix(result.codeMatrix);

        // Filter out empty or invalid sequences
        result.requiredSequences = result.requiredSequences.filter(seq =>
            seq && seq.length > 0 && !seq.includes('??')
        );

        // Print the extracted data
        console.log('\n=== Extracted Data ===');
        console.log('Code Matrix:');
        result.codeMatrix.forEach(row => console.log(row.join(' ')));


        console.log('\nRequired Sequences:');
        result.requiredSequences.forEach((seq, index) => {
            console.log(`${index + 1}: ${seq.join(' ')}`);
        });

        console.log(`\nBuffer Size: ${result.bufferSize}`);

        // Save to JSON if requested
        if (saveJsonPath) {
            fs.writeFileSync(saveJsonPath, JSON.stringify(result, null, 2));
            console.log(`\nExtracted data saved to: ${saveJsonPath}`);
        }

        // Solve the breach protocol if requested
        if (solve) {
            console.log('\n=== Solving Breach Protocol ===');

            const solution = solveBreachProtocol(
                result.codeMatrix,
                result.requiredSequences,
                result.bufferSize
            );

            // Display the solution
            console.log('\nSolution path:');
            solution.path.forEach((pos, index) => {
                console.log(`${index + 1}: ${result.codeMatrix[pos.row][pos.col]} at [Row ${pos.row + 1}, Col ${pos.col + 1}]`);
            });

            console.log(`\nCompleted ${solution.completedSequences.length} of ${result.requiredSequences.length} sequences`);
            solution.completedSequences.forEach(seqIndex => {
                console.log(`- Sequence ${seqIndex + 1}: ${result.requiredSequences[seqIndex].join(' ')}`);
            });
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

/**
 * Clean up the matrix to ensure it's square and has valid values
 * @param {Array} matrix - The extracted code matrix
 * @returns {Array} Cleaned matrix
 */
function cleanMatrix(matrix) {
    // Filter out rows with unknown values
    const filteredMatrix = matrix.filter(row => !row.includes('??'));

    // Determine the most common row length
    const rowLengths = filteredMatrix.map(row => row.length);
    const mostCommonLength = findMostCommon(rowLengths);

    // Keep only rows with the most common length
    const cleanedMatrix = filteredMatrix.filter(row => row.length === mostCommonLength);

    // Ensure we have a reasonable number of rows
    if (cleanedMatrix.length < 3) {
        console.warn('Warning: Very few valid rows detected in the matrix. OCR might not be accurate.');
    }

    return cleanedMatrix;
}

/**
 * Find the most common value in an array
 * @param {Array} arr - Input array
 * @returns {*} Most common value
 */
function findMostCommon(arr) {
    const counts = {};
    arr.forEach(value => {
        counts[value] = (counts[value] || 0) + 1;
    });

    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        [0][0];
}

// Run the main function
processAndSolve().catch(console.error);