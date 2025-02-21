# Cyberpunk 2077 Breach Protocol Solver

A Node.js application that helps solve the "Breach Protocol" hacking minigame in Cyberpunk 2077.

## Features

- **Algorithm**: Efficiently finds optimal solutions for the breach protocol minigame
- **CLI Interface**: Solve puzzles from the command line
- **Web Interface**: User-friendly GUI for inputting and visualizing solutions
- **Optimization**: Finds the path that completes the most sequences within the buffer limit

## How the Breach Protocol Minigame Works

In Cyberpunk 2077's Breach Protocol:

1. You have a grid (matrix) of code elements (like "7A", "FF", "BD", etc.)
2. You need to select a sequence of these codes to match specific patterns
3. You must start at the top row, then alternate between column and row selections
4. Previously selected codes cannot be used again
5. You have a limited buffer capacity (typically 7 slots)
6. Successfully completing sequences yields rewards (more/better rewards for more sequences)

## Installation

### Prerequisites

- Node.js (v12 or later)
- npm

### Setup

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/cyberpunk-breach-solver.git
   cd cyberpunk-breach-solver
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Make the CLI executable (Unix/Linux/macOS only):
   ```
   chmod +x cli.js
   ```

## Usage

### Command Line Interface

Run the CLI tool:

```
node cli.js
```

Follow the prompts to:
1. Enter the matrix size
2. Input the code values for each row
3. Define the required sequences
4. Specify the buffer size

The tool will calculate and display the optimal solution path.

### Web Interface

Start the web server:

```
node app.js
```

Then open your browser and navigate to: `http://localhost:3000`

The web interface allows you to:
1. Configure the matrix size, buffer size, and sequence count
2. Enter code values by typing them directly
3. Solve the breach protocol and visualize the solution
4. See the path highlighted on the matrix and listed step-by-step

## Algorithm Explanation

The solver uses a recursive search algorithm that:

1. Tries all possible starting points from the top row
2. Recursively explores all valid paths, alternating between row and column selections
3. Prioritizes moves that progress toward completing sequences
4. Returns the solution that completes the most sequences within the buffer limit

## Future Improvements

- OCR integration to automatically extract matrix values from screenshots
- Mobile app version
- More sophisticated heuristics for even more efficient solving
- Support for additional minigame variations

## License

MIT

## Acknowledgments

- CD Projekt Red for creating Cyberpunk 2077
- The cyberpunk hacking community for inspiration

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.