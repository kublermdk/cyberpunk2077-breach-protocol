const express = require('express');
const bodyParser = require('body-parser');
const { solveBreachProtocol } = require('./cyberpunk-breach-solver');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.post('/solve', (req, res) => {
    try {
        const { codeMatrix, requiredSequences, bufferSize } = req.body;

        // Basic validation
        if (!codeMatrix || !Array.isArray(codeMatrix) || codeMatrix.length === 0) {
            return res.status(400).json({ error: 'Invalid code matrix' });
        }

        if (!requiredSequences || !Array.isArray(requiredSequences) || requiredSequences.length === 0) {
            return res.status(400).json({ error: 'Invalid required sequences' });
        }

        const solution = solveBreachProtocol(codeMatrix, requiredSequences, bufferSize || 7);
        res.json(solution);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Create the public folder and HTML file
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cyberpunk 2077 Breach Protocol Solver</title>
  <style>
    body {
      font-family: 'Courier New', monospace;
      background-color: #0f0f1a;
      color: #00ff00;
      margin: 0;
      padding: 20px;
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    
    h1, h2 {
      color: #ffff00;
      text-shadow: 0 0 5px rgba(255, 255, 0, 0.5);
    }
    
    .grid-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;
    }
    
    .matrix-row {
      display: flex;
      gap: 10px;
    }
    
    .cell {
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #181830;
      border: 1px solid #3333aa;
      font-weight: bold;
      position: relative;
    }
    
    .cell.path {
      background-color: #334433;
      border-color: #00ff00;
    }
    
    .path-number {
      position: absolute;
      top: 2px;
      right: 2px;
      font-size: 10px;
      color: #ffff00;
    }
    
    .sequence {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
    }
    
    .sequence-item {
      padding: 10px;
      background-color: #181830;
      border: 1px solid #3333aa;
    }
    
    .sequence.completed .sequence-item {
      background-color: #334433;
      border-color: #00ff00;
    }
    
    .controls {
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    input, button, select {
      background-color: #181830;
      color: #00ff00;
      border: 1px solid #3333aa;
      padding: 8px 12px;
      font-family: 'Courier New', monospace;
    }
    
    button {
      cursor: pointer;
      transition: all 0.2s;
    }
    
    button:hover {
      background-color: #222260;
    }
    
    button:active {
      background-color: #333380;
    }
    
    .flex {
      display: flex;
      gap: 10px;
    }
    
    #matrix-container input {
      width: 40px;
      text-align: center;
    }
    
    .error {
      color: #ff3333;
      margin-bottom: 10px;
    }
    
    .success {
      color: #00ff00;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Cyberpunk 2077 Breach Protocol Solver</h1>
    
    <div id="error-container" class="error"></div>
    <div id="success-container" class="success"></div>
    
    <div class="controls">
      <div class="flex">
        <div>
          <label for="matrix-size">Matrix Size:</label>
          <select id="matrix-size">
            <option value="4">4x4</option>
            <option value="5">5x5</option>
            <option value="6">6x6</option>
            <option value="7" selected>7x7</option>
          </select>
        </div>
        
        <div>
          <label for="buffer-size">Buffer Size:</label>
          <input type="number" id="buffer-size" value="7" min="1" max="10">
        </div>
        
        <div>
          <label for="sequence-count">Sequences:</label>
          <input type="number" id="sequence-count" value="3" min="1" max="5">
        </div>
        
        <button id="update-config">Update Configuration</button>
      </div>
    </div>
    
    <h2>Code Matrix</h2>
    <div id="matrix-container" class="grid-container"></div>
    
    <h2>Required Sequences</h2>
    <div id="sequences-container"></div>
    
    <div class="controls">
      <button id="solve-button">Solve Breach Protocol</button>
    </div>
    
    <h2>Solution</h2>
    <div id="solution-container">
      <p>Click "Solve Breach Protocol" to generate a solution.</p>
    </div>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      // DOM elements
      const matrixSizeSelect = document.getElementById('matrix-size');
      const bufferSizeInput = document.getElementById('buffer-size');
      const sequenceCountInput = document.getElementById('sequence-count');
      const updateConfigButton = document.getElementById('update-config');
      const matrixContainer = document.getElementById('matrix-container');
      const sequencesContainer = document.getElementById('sequences-container');
      const solveButton = document.getElementById('solve-button');
      const solutionContainer = document.getElementById('solution-container');
      const errorContainer = document.getElementById('error-container');
      const successContainer = document.getElementById('success-container');
      
      // Initial configuration
      let matrixSize = parseInt(matrixSizeSelect.value);
      let bufferSize = parseInt(bufferSizeInput.value);
      let sequenceCount = parseInt(sequenceCountInput.value);
      
      // Common code values for the game
      const commonCodeValues = ['1C', '7A', '55', 'FF', 'BD', 'E9'];
      
      // Initialize
      updateMatrix();
      updateSequences();
      
      // Event listeners
      updateConfigButton.addEventListener('click', () => {
        matrixSize = parseInt(matrixSizeSelect.value);
        bufferSize = parseInt(bufferSizeInput.value);
        sequenceCount = parseInt(sequenceCountInput.value);
        
        updateMatrix();
        updateSequences();
        clearSolution();
        clearMessages();
      });
      
      solveButton.addEventListener('click', solveBreach);
      
      // Functions
      function updateMatrix() {
        matrixContainer.innerHTML = '';
        
        for (let i = 0; i < matrixSize; i++) {
          const row = document.createElement('div');
          row.className = 'matrix-row';
          
          for (let j = 0; j < matrixSize; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell input-cell';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.maxLength = 2;
            input.className = 'code-input';
            input.dataset.row = i;
            input.dataset.col = j;
            input.value = getRandomCodeValue();
            
            cell.appendChild(input);
            row.appendChild(cell);
          }
          
          matrixContainer.appendChild(row);
        }
      }
      
      function updateSequences() {
        sequencesContainer.innerHTML = '';
        
        for (let i = 0; i < sequenceCount; i++) {
          const sequenceDiv = document.createElement('div');
          sequenceDiv.className = 'sequence';
          sequenceDiv.id = \`sequence-\${i}\`;
          
          // Determine sequence length (2-4)
          const sequenceLength = Math.floor(Math.random() * 3) + 2; // 2 to 4
          
          for (let j = 0; j < sequenceLength; j++) {
            const sequenceItem = document.createElement('div');
            sequenceItem.className = 'sequence-item';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.maxLength = 2;
            input.className = 'sequence-input';
            input.dataset.sequence = i;
            input.dataset.position = j;
            input.value = getRandomCodeValue();
            
            sequenceItem.appendChild(input);
            sequenceDiv.appendChild(sequenceItem);
          }
          
          sequencesContainer.appendChild(sequenceDiv);
        }
      }
      
      function getRandomCodeValue() {
        return commonCodeValues[Math.floor(Math.random() * commonCodeValues.length)];
      }
      
      function clearSolution() {
        solutionContainer.innerHTML = '<p>Click "Solve Breach Protocol" to generate a solution.</p>';
      }
      
      function clearMessages() {
        errorContainer.textContent = '';
        successContainer.textContent = '';
      }
      
      function solveBreach() {
        clearMessages();
        
        try {
          // Gather matrix data
          const codeMatrix = [];
          for (let i = 0; i < matrixSize; i++) {
            const row = [];
            for (let j = 0; j < matrixSize; j++) {
              const input = document.querySelector(\`.code-input[data-row="\${i}"][data-col="\${j}"]\`);
              const value = input.value.trim().toUpperCase();
              if (!value) {
                throw new Error(\`Empty value at row \${i+1}, column \${j+1}\`);
              }
              row.push(value);
            }
            codeMatrix.push(row);
          }
          
          // Gather sequence data
          const requiredSequences = [];
          for (let i = 0; i < sequenceCount; i++) {
            const sequence = [];
            const inputs = document.querySelectorAll(\`.sequence-input[data-sequence="\${i}"]\`);
            inputs.forEach(input => {
              const value = input.value.trim().toUpperCase();
              if (!value) {
                throw new Error(\`Empty value in sequence \${i+1}\`);
              }
              sequence.push(value);
            });
            requiredSequences.push(sequence);
          }
          
          // Call solver
          fetch('/solve', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              codeMatrix,
              requiredSequences,
              bufferSize
            }),
          })
          .then(response => response.json())
          .then(solution => {
            displaySolution(solution, codeMatrix, requiredSequences);
          })
          .catch(error => {
            errorContainer.textContent = \`Error: \${error.message}\`;
          });
        } catch (error) {
          errorContainer.textContent = \`Error: \${error.message}\`;
        }
      }
      
      function displaySolution(solution, codeMatrix, requiredSequences) {
        // Clear the solution container
        solutionContainer.innerHTML = '';
        
        if (solution.path.length === 0) {
          solutionContainer.innerHTML = '<p>No solution found that completes any sequence within the buffer limit.</p>';
          return;
        }
        
        // Display success message
        successContainer.textContent = \`Found solution that completes \${solution.completedSequences.length} of \${requiredSequences.length} sequences.\`;
        
        // Create a copy of the matrix with solution path
        const matrixDiv = document.createElement('div');
        matrixDiv.className = 'grid-container';
        
        for (let i = 0; i < matrixSize; i++) {
          const row = document.createElement('div');
          row.className = 'matrix-row';
          
          for (let j = 0; j < matrixSize; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.textContent = codeMatrix[i][j];
            
            // Check if this cell is in the path
            const pathIndex = solution.path.findIndex(pos => pos.row === i && pos.col === j);
            if (pathIndex !== -1) {
              cell.classList.add('path');
              
              const pathNumber = document.createElement('span');
              pathNumber.className = 'path-number';
              pathNumber.textContent = pathIndex + 1;
              cell.appendChild(pathNumber);
            }
            
            row.appendChild(cell);
          }
          
          matrixDiv.appendChild(row);
        }
        
        solutionContainer.appendChild(matrixDiv);
        
        // Display the solution steps
        const stepsDiv = document.createElement('div');
        stepsDiv.innerHTML = '<h3>Solution Steps:</h3>';
        
        const stepsList = document.createElement('ol');
        solution.path.forEach(pos => {
          const step = document.createElement('li');
          step.textContent = `Select "${codeMatrix[pos.row][pos.col]}" at Row ${pos.row + 1}, Column ${pos.col + 1}`;
          stepsList.appendChild(step);
        });
        
        stepsDiv.appendChild(stepsList);
        solutionContainer.appendChild(stepsDiv);
        
        // Display completed sequences
        const sequencesDiv = document.createElement('div');
        sequencesDiv.innerHTML = '<h3>Completed Sequences:</h3>';
        
        if (solution.completedSequences.length === 0) {
          sequencesDiv.innerHTML += '<p>No sequences completed.</p>';
        } else {
          const sequencesList = document.createElement('ul');
          
          solution.completedSequences.forEach(seqIndex => {
            const sequenceItem = document.createElement('li');
            sequenceItem.textContent = `Sequence ${seqIndex + 1}: ${requiredSequences[seqIndex].join(' → ')}`;
            sequencesList.appendChild(sequenceItem);
            
            // Also highlight the completed sequences in the UI
            const sequenceDiv = document.getElementById(`sequence-${seqIndex}`);
            if (sequenceDiv) {
              sequenceDiv.classList.add('completed');
            }
          });
          
          sequencesDiv.appendChild(sequencesList);
        }
        
        solutionContainer.appendChild(sequencesDiv);
      }
    });
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(publicDir, 'index.html'), htmlContent);

// If server is run directly
if (require.main === module) {
    console.log(`Server starting at http://localhost:${port}`);
}

module.exports = app;