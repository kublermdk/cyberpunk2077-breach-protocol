#!/usr/bin/env node
const readline = require('readline');
const { solveBreachProtocol } = require('./cyberpunk-breach-solver');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * Prompt user for input with a question
 * @param {string} question - The question to ask
 * @returns {Promise<string>} User's response
 */
function prompt(question) {
    return new Promise(resolve => {
        rl.question(question, answer => {
            resolve(answer);
        });
    });
}

/**
 * Main CLI function
 */
async function main() {
    console.log("=== Cyberpunk 2077 Breach Protocol Solver ===");

    // Get matrix size
    const sizeStr = await prompt("Enter matrix size (e.g. 5 for a 5x5 matrix): ");
    const size = parseInt(sizeStr);

    if (isNaN(size) || size < 2) {
        console.error("Invalid size. Please enter a number greater than 1.");
        rl.close();
        return;
    }

    // Get matrix data
    console.log(`\nEnter the ${size}x${size} code matrix, row by row.`);
    console.log("Use space-separated values (e.g. '7A FF 55 BD 1C'):");

    const codeMatrix = [];

    for (let i = 0; i < size; i++) {
        const rowStr = await prompt(`Row ${i + 1}: `);
        const row = rowStr.trim().split(/\s+/);

        if (row.length !== size) {
            console.error(`Expected ${size} values, but got ${row.length}. Please try again.`);
            i--; // Retry this row
            continue;
        }

        codeMatrix.push(row);
    }

    // Get number of required sequences
    const numSequencesStr = await prompt("\nHow many sequences are required? ");
    const numSequences = parseInt(numSequencesStr);

    if (isNaN(numSequences) || numSequences < 1) {
        console.error("Invalid number. Please enter a positive number.");
        rl.close();
        return;
    }

    // Get sequence data
    console.log("\nEnter each required sequence, space-separated (e.g. 'FF 55'):");
    const requiredSequences = [];

    for (let i = 0; i < numSequences; i++) {
        const sequenceStr = await prompt(`Sequence ${i + 1}: `);
        const sequence = sequenceStr.trim().split(/\s+/);

        if (sequence.length < 1) {
            console.error("Sequence cannot be empty. Please try again.");
            i--; // Retry this sequence
            continue;
        }

        requiredSequences.push(sequence);
    }

    // Get buffer size
    const bufferSizeStr = await prompt("\nEnter buffer size (default is 7): ");
    const bufferSize = bufferSizeStr ? parseInt(bufferSizeStr) : 7;

    if (isNaN(bufferSize) || bufferSize < 1) {
        console.error("Invalid buffer size. Using default (7).");
    }

    // Solve the breach protocol
    console.log("\nSolving breach protocol...");

    try {
        const solution = solveBreachProtocol(codeMatrix, requiredSequences, bufferSize);

        console.log("\n=== Solution ===");

        if (solution.path.length === 0) {
            console.log("No solution found that completes any sequence within the buffer limit.");
        } else {
            console.log("Optimal path:");
            solution.path.forEach((pos, index) => {
                console.log(`${index + 1}: ${pos.value} at [Row ${pos.row + 1}, Col ${pos.col + 1}]`);
            });

            console.log(`\nCompleted ${solution.completedSequences.length} of ${requiredSequences.length} sequences`);
            solution.completedSequences.forEach(seqIndex => {
                console.log(`- Sequence ${seqIndex + 1}: ${requiredSequences[seqIndex].join(' ')}`);
            });

            // If not all sequences are completed
            if (solution.completedSequences.length < requiredSequences.length) {
                console.log("\nCould not complete all sequences within the buffer limit.");
            }
        }
    } catch (error) {
        console.error("\nAn error occurred:", error.message);
    }

    rl.close();
}

// Run the CLI
main().catch(error => {
    console.error("Fatal error:", error);
    rl.close();
});