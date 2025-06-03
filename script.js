// script.js for 2 Player Tetris

// --- Game Constants ---
// These values define the basic properties of the game grid and pieces.
const BLOCK_SIZE = 30; // Size of each square block in pixels
const COLS = 10;       // Number of columns in the game grid
const ROWS = 20;       // Number of rows in the game grid
const WIDTH = BLOCK_SIZE * COLS;   // Calculated width of the canvas
const HEIGHT = BLOCK_SIZE * ROWS;  // Calculated height of the canvas
const GRAVITY_DELAY = 1000; // Time in milliseconds before a piece automatically moves down

// --- Tetromino Shapes and Colors ---
// Defines the different Tetris pieces (Tetrominoes) and their colors.
const SHAPES = {
  'O': [[1, 1], [1, 1]],
  'I': [[1, 1, 1, 1]],
  'S': [[0, 1, 1], [1, 1, 0]],
  'Z': [[1, 1, 0], [0, 1, 1]],
  'L': [[1, 0, 0], [1, 1, 1]],
  'J': [[0, 0, 1], [1, 1, 1]],
  'T': [[0, 1, 0], [1, 1, 1]]
};

const COLORS = {
  'O': '#FFFF00', // Yellow
  'I': '#00FFFF', // Cyan
  'S': '#00FF00', // Green
  'Z': '#FF0000', // Red
  'L': '#FFA500', // Orange
  'J': '#0000FF', // Blue
  'T': '#A020F0', // Purple
  'X': '#646464'  // Gray (for garbage lines)
};

// --- Player Class ---
// Represents a player in the game. Manages their board, piece, score, and game state.
class Player {
  constructor(canvasId, scoreId, gameOverId, restartId) {
    // DOM Elements
    this.canvas = document.getElementById(canvasId); // The <canvas> element for this player
    this.ctx = this.canvas.getContext('2d');         // The 2D rendering context for the canvas
    this.scoreElement = document.getElementById(scoreId); // Element to display the score
    this.gameOverElement = document.getElementById(gameOverId); // Element for "Game Over" message
    this.restartButton = document.getElementById(restartId); // Restart button for this player

    // Game State
    this.grid = this.createGrid();        // The game board, a 2D array
    this.piece = this.randomPiece();      // The currently falling Tetris piece
    this.score = 0;                       // Player's current score
    this.gameOver = false;                // Flag indicating if the game is over for this player
    this.lastGravityTime = Date.now();    // Timestamp of the last time gravity was applied
    this.opponent = null;                 // Reference to the other player, for sending garbage lines

    // Event Listener for Restart Button
    this.restartButton.addEventListener('click', () => this.restart());
  }

  // Creates an empty game grid (2D array filled with empty strings).
  createGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(''));
  }

  // Selects a random Tetromino shape and initializes its starting position.
  randomPiece() {
    const types = Object.keys(SHAPES); // Get all available shape types (O, I, S, Z, L, J, T)
    const type = types[Math.floor(Math.random() * types.length)]; // Pick one randomly
    return {
      type: type,
      shape: JSON.parse(JSON.stringify(SHAPES[type])), // Deep copy of the shape array
      x: Math.floor(COLS / 2) - 1, // Initial horizontal position (centered)
      y: 0                         // Initial vertical position (top of the grid)
    };
  }

  // Draws the game state (grid and current piece) on the canvas.
  draw() {
    // Clear the canvas before drawing
    this.ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Draw the grid (locked pieces)
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const cell = this.grid[y][x];
        // If a cell has a piece type, use its color, otherwise use a background color for empty cells
        this.ctx.fillStyle = cell ? COLORS[cell] : 'rgba(30, 30, 30, 0.8)';
        this.ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        // Draw a border around each cell for better visibility
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    }

    // Draw the currently falling piece (if the game is not over)
    if (!this.gameOver) {
      for (let y = 0; y < this.piece.shape.length; y++) {
        for (let x = 0; x < this.piece.shape[y].length; x++) {
          if (this.piece.shape[y][x]) { // If this part of the shape is solid
            const px = (this.piece.x + x) * BLOCK_SIZE; // Calculate pixel x-coordinate
            const py = (this.piece.y + y) * BLOCK_SIZE; // Calculate pixel y-coordinate
            this.ctx.fillStyle = COLORS[this.piece.type]; // Use the piece's color
            this.ctx.fillRect(px, py, BLOCK_SIZE, BLOCK_SIZE);
            this.ctx.strokeStyle = 'black'; // Border for the falling piece
            this.ctx.strokeRect(px, py, BLOCK_SIZE, BLOCK_SIZE);
          }
        }
      }
    }
  }

  // Checks if the current piece (or a given piece) collides with grid boundaries or locked pieces.
  checkCollision(piece = this.piece) {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) { // If this part of the shape is solid
          const px = piece.x + x; // Projected x-coordinate on the grid
          const py = piece.y + y; // Projected y-coordinate on the grid

          // Check for collisions:
          // 1. Left boundary (px < 0)
          // 2. Right boundary (px >= COLS)
          // 3. Bottom boundary (py >= ROWS)
          // 4. Collision with an existing piece in the grid (this.grid[py][px])
          if (px < 0 || px >= COLS || py >= ROWS ||
              (py >= 0 && this.grid[py] && this.grid[py][px])) { // Ensure py is a valid row index
            return true; // Collision detected
          }
        }
      }
    }
    return false; // No collision
  }

  // Rotates the current piece clockwise.
  rotate() {
    if (this.gameOver) return; // Cannot rotate if game is over

    const oldShape = JSON.parse(JSON.stringify(this.piece.shape)); // Save current shape

    // Perform rotation (transpose and reverse rows)
    const rotated = [];
    for (let i = 0; i < oldShape[0].length; i++) {
      rotated.push([]);
      for (let j = oldShape.length - 1; j >= 0; j--) {
        rotated[i].push(oldShape[j][i]);
      }
    }

    const oldX = this.piece.x; // Save current x position
    this.piece.shape = rotated;

    // Wall kick logic: If rotation causes collision, try to shift the piece.
    if (this.checkCollision()) {
      // Try moving left
      this.piece.x -= 1;
      if (this.checkCollision()) {
        // Try moving right from original position
        this.piece.x = oldX + 1;
        if (this.checkCollision()) {
          // If still colliding, revert rotation and position
          this.piece.x = oldX;
          this.piece.shape = oldShape;
        }
      }
    }
  }

  // Moves the current piece one step to the left.
  moveLeft() {
    if (this.gameOver) return;
    this.piece.x -= 1;
    if (this.checkCollision()) {
      this.piece.x += 1; // Revert move if collision occurs
    }
  }

  // Moves the current piece one step to the right.
  moveRight() {
    if (this.gameOver) return;
    this.piece.x += 1;
    if (this.checkCollision()) {
      this.piece.x -= 1; // Revert move if collision occurs
    }
  }

  // Moves the current piece one step down.
  // Returns false if the piece is locked, true otherwise.
  moveDown() {
    if (this.gameOver) return false;
    this.piece.y += 1;
    if (this.checkCollision()) {
      this.piece.y -= 1; // Revert move
      this.lockPiece();   // Lock the piece in place
      return false;       // Piece was locked
    }
    this.lastGravityTime = Date.now(); // Reset gravity timer on manual move down
    return true;          // Piece moved successfully
  }

  // Drops the piece to the lowest possible position instantly.
  hardDrop() {
    if (this.gameOver) return;
    while (this.moveDown()) {
      // Keep moving down until it locks
    }
  }

  // Locks the current piece onto the grid.
  lockPiece() {
    for (let y = 0; y < this.piece.shape.length; y++) {
      for (let x = 0; x < this.piece.shape[y].length; x++) {
        if (this.piece.shape[y][x]) {
          const py = this.piece.y + y;
          const px = this.piece.x + x;
          // Only lock parts of the piece that are within the grid boundaries
          if (py >= 0 && py < ROWS && px >= 0 && px < COLS) {
            this.grid[py][px] = this.piece.type; // Assign piece type (color) to grid cell
          }
        }
      }
    }

    const linesCleared = this.clearLines(); // Check for and clear completed lines
    this.updateScore(linesCleared);         // Update score based on lines cleared

    this.piece = this.randomPiece(); // Get a new random piece

    // Check if the new piece immediately collides (game over condition)
    if (this.checkCollision()) {
      this.gameOver = true;
      this.gameOverElement.classList.remove('hidden'); // Show game over message
    }
  }

  // Checks for and clears any completed lines from the grid.
  // Returns the number of lines cleared.
  clearLines() {
    let linesCleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) { // Iterate from bottom to top
      // Check if every cell in the current row is filled
      if (this.grid[y].every(cell => cell !== '')) {
        this.grid.splice(y, 1); // Remove the full line
        this.grid.unshift(Array(COLS).fill('')); // Add a new empty line at the top
        linesCleared++;
        y++; // Re-check the current row index as lines have shifted down
      }
    }
    return linesCleared;
  }

  // Updates the player's score based on the number of lines cleared.
  // Sends garbage lines to the opponent if applicable.
  updateScore(linesCleared) {
    if (linesCleared > 0) {
      // Standard Tetris scoring for lines cleared
      const points = [0, 100, 300, 500, 800][linesCleared] || 0; // 1 line, 2 lines, etc.
      this.score += points;
      this.scoreElement.textContent = this.score; // Update score display

      // Send garbage lines to opponent if 2 or more lines are cleared
      if (linesCleared >= 2 && this.opponent && !this.opponent.gameOver) {
        // Number of garbage lines to send (usually linesCleared - 1, but can be customized)
        const garbageToSend = linesCleared === 4 ? 4 : linesCleared -1; // Tetris (4 lines) sends 4, otherwise (linesCleared-1)
        this.opponent.addGarbageLines(garbageToSend);
      }
    }
  }

  // Adds garbage lines to the bottom of the player's grid.
  addGarbageLines(count) {
    if (this.gameOver) return; // Don't add garbage if game over

    for (let i = 0; i < count; i++) {
      if (this.grid.length >= ROWS) { // Prevent adding too many lines if already near top
         this.grid.shift(); // Remove the top-most line to make space
      }
      const hole = Math.floor(Math.random() * COLS); // Random position for the hole
      const garbageLine = Array(COLS).fill('X'); // 'X' represents a garbage block
      garbageLine[hole] = ''; // Create one empty space (hole) in the garbage line
      this.grid.push(garbageLine); // Add the garbage line to the bottom
    }
    // After adding garbage, the current piece might now be in a collision state.
    // A simple way to handle this is to push the current piece up if it's now overlapping.
    // More complex handling might be needed for perfect competitive play.
    while(this.checkCollision() && this.piece.y > 0) {
        this.piece.y--;
    }
    // If still colliding at the top, it's game over (or could trigger piece lock)
     if (this.checkCollision()) {
        this.gameOver = true;
        this.gameOverElement.classList.remove('hidden');
     }
  }


  // Main update function for the player, called in the game loop.
  // Handles gravity for the falling piece.
  update() {
    if (this.gameOver) return; // Do nothing if game is over

    const now = Date.now();
    // Check if enough time has passed for gravity to take effect
    if (now - this.lastGravityTime > GRAVITY_DELAY) {
      this.moveDown(); // Move the piece down automatically
      this.lastGravityTime = now; // Reset the gravity timer
    }
  }

  // Resets the player's game state to start a new game.
  restart() {
    this.grid = this.createGrid();
    this.piece = this.randomPiece();
    this.score = 0;
    this.gameOver = false;
    this.lastGravityTime = Date.now();
    this.scoreElement.textContent = '0';
    this.gameOverElement.classList.add('hidden'); // Hide game over message
  }
}

// --- Game Initialization ---
// Create instances of the Player class for Player 1 and Player 2.
const player1 = new Player('player1', 'score1', 'gameOver1', 'restart1');
const player2 = new Player('player2', 'score2', 'gameOver2', 'restart2');

// Set opponents for garbage line mechanics
player1.opponent = player2;
player2.opponent = player1;

// --- Keyboard Controls ---
// Listen for keydown events to control the Tetris pieces.
document.addEventListener('keydown', (e) => {
  // Player 1 controls (WASD + Space)
  if (!player1.gameOver) {
    switch (e.key.toLowerCase()) { // Use toLowerCase for case-insensitivity
      case 'a': player1.moveLeft(); break;
      case 'd': player1.moveRight(); break;
      case 'w': player1.rotate(); break;
      case 's': player1.moveDown(); break;
      case ' ': // Space bar for hard drop
        // Prevent page scroll if space is pressed and body is focused
        if (e.target === document.body) e.preventDefault();
        player1.hardDrop();
        break;
    }
  }

  // Player 2 controls (Arrow keys + Enter)
  if (!player2.gameOver) {
    switch (e.key) {
      case 'ArrowLeft': player2.moveLeft(); break;
      case 'ArrowRight': player2.moveRight(); break;
      case 'ArrowUp': player2.rotate(); break;
      case 'ArrowDown': player2.moveDown(); break;
      case 'Enter': // Enter key for hard drop
        player2.hardDrop();
        break;
    }
  }
});

// --- Game Loop ---
// The main loop that updates and redraws the game continuously.
function gameLoop() {
  // Update game state for both players
  player1.update();
  player2.update();

  // Draw the game for both players
  player1.draw();
  player2.draw();

  // Request the next frame to continue the loop
  // This creates a smooth animation by syncing with the browser's refresh rate.
  requestAnimationFrame(gameLoop);
}

// Start the game loop when the script is loaded.
gameLoop();
