// Cyberpunk 2077 Breach Protocol Solver

class BreachProtocol {
    constructor(codeMatrix, requiredSequences, bufferSize) {
        this.codeMatrix = codeMatrix;
        this.requiredSequences = requiredSequences;
        this.bufferSize = bufferSize;
        this.size = codeMatrix.length; // Assuming square matrix
    }

    /**
     * Find the optimal solution path
     * @returns {Object} Solution containing path and completed sequences
     */
    solve() {
        // Start with each position in the top row
        const solutions = [];

        for (let col = 0; col < this.size; col++) {
            const initialButton = this.codeMatrix[0][col];
            const initialPath = [{
                row: 0,
                col: col,
                value: initialButton
            }];

            const solution = this.explorePath(initialPath, new Set([`0,${col}`]), 'col', new Set());
            if (solution) {
                solutions.push(solution);
            }
        }

        // Find best solution (one that completes the most sequences)
        if (solutions.length === 0) {
            return { path: [], completedSequences: [] };
        }

        solutions.sort((a, b) => b.completedSequences.length - a.completedSequences.length);
        return solutions[0];
    }

    /**
     * Recursively explore possible paths
     * @param {Array} currentPath - Current path of buttons
     * @param {Set} visited - Set of visited positions
     * @param {string} nextDirection - 'row' or 'col' for next selection
     * @param {Set} completedSequences - Indices of completed sequences
     * @returns {Object|null} Best solution found or null if no solution
     */
    explorePath(currentPath, visited, nextDirection, completedSequences) {
        // Check if we've used up the buffer
        if (currentPath.length >= this.bufferSize) {
            return {
                path: currentPath,
                completedSequences: Array.from(completedSequences)
            };
        }

        // Check which sequences we've completed so far
        const pathValues = currentPath.map(pos => pos.value);
        const newCompletedSequences = new Set(completedSequences);

        for (let i = 0; i < this.requiredSequences.length; i++) {
            if (!completedSequences.has(i)) {
                const sequence = this.requiredSequences[i];
                if (this.isSubsequence(pathValues, sequence)) {
                    newCompletedSequences.add(i);
                }
            }
        }

        // If we've completed all sequences, return the solution
        if (newCompletedSequences.size === this.requiredSequences.length) {
            return {
                path: currentPath,
                completedSequences: Array.from(newCompletedSequences)
            };
        }

        // Try all possible next moves
        const lastPos = currentPath[currentPath.length - 1];
        const possibleMoves = [];

        if (nextDirection === 'col') {
            // We're selecting from the current column
            for (let row = 0; row < this.size; row++) {
                const posKey = `${row},${lastPos.col}`;
                if (!visited.has(posKey)) {
                    possibleMoves.push({
                        row,
                        col: lastPos.col,
                        value: this.codeMatrix[row][lastPos.col]
                    });
                }
            }
        } else {
            // We're selecting from the current row
            for (let col = 0; col < this.size; col++) {
                const posKey = `${lastPos.row},${col}`;
                if (!visited.has(posKey)) {
                    possibleMoves.push({
                        row: lastPos.row,
                        col,
                        value: this.codeMatrix[lastPos.row][col]
                    });
                }
            }
        }

        // Sort moves based on potential to complete sequences
        possibleMoves.sort((a, b) => {
            return this.evaluateMove(pathValues, a.value, newCompletedSequences) -
                this.evaluateMove(pathValues, b.value, newCompletedSequences);
        });

        // Try each move
        let bestSolution = null;

        for (const move of possibleMoves) {
            const newPath = [...currentPath, move];
            const newVisited = new Set(visited);
            newVisited.add(`${move.row},${move.col}`);

            const nextDir = nextDirection === 'row' ? 'col' : 'row';
            const solution = this.explorePath(newPath, newVisited, nextDir, newCompletedSequences);

            if (solution) {
                if (!bestSolution ||
                    solution.completedSequences.length > bestSolution.completedSequences.length ||
                    (solution.completedSequences.length === bestSolution.completedSequences.length &&
                        solution.path.length < bestSolution.path.length)) {
                    bestSolution = solution;
                }

                // If we found a solution that completes all sequences, use it
                if (solution.completedSequences.length === this.requiredSequences.length) {
                    return solution;
                }
            }
        }

        return bestSolution;
    }

    /**
     * Check if array contains a subsequence
     * @param {Array} array - Array to check within
     * @param {Array} subsequence - Subsequence to look for
     * @returns {boolean} True if subsequence is found
     */
    isSubsequence(array, subsequence) {
        let subIdx = 0;

        for (let i = 0; i < array.length && subIdx < subsequence.length; i++) {
            if (array[i] === subsequence[subIdx]) {
                subIdx++;
            }
        }

        return subIdx === subsequence.length;
    }

    /**
     * Evaluate how promising a move is
     * @param {Array} currentPath - Current path values
     * @param {string} nextValue - Next potential value
     * @param {Set} completedSequences - Already completed sequences
     * @returns {number} Lower is better
     */
    evaluateMove(currentPath, nextValue, completedSequences) {
        let score = 0;

        for (let i = 0; i < this.requiredSequences.length; i++) {
            if (!completedSequences.has(i)) {
                const sequence = this.requiredSequences[i];

                // Check how many items we'd match in the sequence with this move
                const testPath = [...currentPath, nextValue];
                let matchCount = 0;
                let pathIdx = 0;

                for (let seqIdx = 0; seqIdx < sequence.length && pathIdx < testPath.length; pathIdx++) {
                    if (testPath[pathIdx] === sequence[seqIdx]) {
                        seqIdx++;
                        matchCount++;
                    }
                }

                // If this move would complete a sequence, that's great
                if (matchCount === sequence.length) {
                    score -= 1000;
                } else {
                    // Otherwise, value moves that progress toward completing sequences
                    score -= matchCount * 10;
                }
            }
        }

        return score;
    }
}

/**
 * Main function to solve the breach protocol
 * @param {Array} codeMatrix - 2D array of code buttons
 * @param {Array} requiredSequences - Array of arrays, each containing a sequence
 * @param {number} bufferSize - Maximum number of buffer entries
 * @returns {Object} Solution object with path and completed sequences
 */
function solveBreachProtocol(codeMatrix, requiredSequences, bufferSize = 7) {
    const solver = new BreachProtocol(codeMatrix, requiredSequences, bufferSize);
    return solver.solve();
}

// Example usage
function main() {
    // Example data based on the provided images

    // // -- Original provided by Claude
    // const codeMatrix = [
    //     ["7A", "FF", "7A", "55", "FF", "1C", "7A"],
    //     ["E9", "1C", "FF", "1C", "1C", "7A", "1C"],
    //     ["55", "55", "55", "55", "FF", "BD", "7A"],
    //     ["1C", "E9", "7A", "BD", "FF", "1C", "FF"],
    //     ["FF", "E9", "FF", "7A", "FF", "1C", "BD"],
    //     ["BD", "BD", "1C", "BD", "E9", "FF", "55"],
    //     ["1C", "E9", "55", "E9", "55", "7A", "55"]
    // ];
    const codeMatrix = [
        ["7A", "BD", "E9", "7A", "7A", "E9", "BD"],
        ["7A", "55", "BD", "55", "1C", "1C", "7A"],
        ["FF", "BD", "7A", "FF", "7A", "1C", "BD"],
        ["E9", "1C", "55", "55", "1C", "1C", "55"],
        ["7A", "E9", "E9", "55", "1C", "55", "55"],
        ["E9", "55", "7A", "E9", "55", "55", "55"],
        ["BD", "1C", "1C", "FF", "1C", "FF", "BD"]
    ];

    const requiredSequences = [
        ["55", "1C"],            // Basic datamine
        ["7A", "E9"],            // Advanced datamine
    ];

    const bufferSize = 8;
    const solution = solveBreachProtocol(codeMatrix, requiredSequences, bufferSize);

    // Example solution: {
    //   path: [
    //     { row: 0, col: 0, value: '7A' },
    //     { row: 3, col: 0, value: 'E9' },
    //     { row: 3, col: 2, value: '55' },
    //     { row: 6, col: 2, value: '1C' }
    //   ],
    //   completedSequences: [ 1, 0 ]
    // }


    // -- Output the Matrix
    console.log("Matrix: ");

    codeMatrix.forEach((row, i) => {
        if (i === 0) {
            let rowIndexContent = '  | ';
            for (let index = 0; index < row.length; index++) {
                rowIndexContent +=` ${index} | `;
            }
            console.log(rowIndexContent);
        }
        let rowContent = `${i} | `; // Double space
        codeMatrix[i].forEach((codeEntry, codeEntryIndex) => {
            rowContent += `${codeEntry} | `;
        });
        console.log(rowContent);
    })
    console.log(""); // New line

    console.log("Solution path:");
    solution.path.forEach((pos, index) => {
        console.log(`${index + 1}: ${pos.value} at [${pos.row},${pos.col}]`);
    });

    console.log(`\nCompleted ${solution.completedSequences.length} of ${requiredSequences.length} sequences`);
    solution.completedSequences.forEach(seqIndex => {
        console.log(`- Sequence ${seqIndex + 1}: ${requiredSequences[seqIndex].join(' ')}`);
    });

    console.log("\n\nFULL Solution: ", solution);
}

module.exports = { solveBreachProtocol };

// Uncomment to run directly
main();