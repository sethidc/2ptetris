# 2 Player Tetris - HTML/CSS/JS Refactor

This is a 2-player Tetris game implemented in HTML, CSS, and JavaScript. It allows two players to play Tetris side-by-side on the same screen, with mechanics for sending garbage lines to the opponent.

This project is a refactoring of an initial single-file HTML application and is **based on the Python code for a 2-player Tetris game by James Abela**, which can be found here: [jamesabela/2playertetris](https://github.com/jamesabela/2playertetris/tree/main).

## Features

* Two independent Tetris boards for two players.
* Classic Tetromino shapes and movement (move, rotate, drop).
* Scoring based on lines cleared.
* Garbage line mechanism: clearing multiple lines sends garbage lines to the opponent.
* Game Over detection.
* Restart functionality for each player.

## File Structure

The project is organized into three main files:

* `index.html`: Contains the HTML structure of the game, including the canvas elements for the Tetris boards and UI elements for scores and controls.
* `style.css`: Contains all the CSS rules for styling the game, including the layout, colors, and appearance of game elements.
* `script.js`: Contains all the JavaScript logic for the game, including piece movement, collision detection, scoring, and rendering.

## How to Play

1.  Clone or download this repository.
2.  Open the `index.html` file in a web browser.

### Controls:

**Player 1:**
* **A**: Move Left
* **D**: Move Right
* **W**: Rotate Piece
* **S**: Move Down
* **Space**: Hard Drop (drop piece instantly)

**Player 2:**
* **ArrowLeft (←)**: Move Left
* **ArrowRight (→)**: Move Right
* **ArrowUp (↑)**: Rotate Piece
* **ArrowDown (↓)**: Move Down
* **Enter**: Hard Drop (drop piece instantly)

The goal is to clear lines by forming complete horizontal rows of blocks. Clearing multiple lines at once (2 or more) will send "garbage lines" to your opponent, making their game harder. The game ends for a player when their blocks stack up to the top of the board.

## Technologies Used

* HTML5
* CSS3
* JavaScript (ES6+)

## Refactoring Notes

The original single HTML file was refactored to:
1.  Separate concerns: HTML for structure, CSS for presentation, and JavaScript for behavior.
2.  Improve code organization and maintainability.
3.  Remove the Tailwind CSS CDN and translate its utility classes into plain CSS within `style.css` for a dependency-free frontend (besides the core web technologies).
4.  Add comments to the JavaScript code to make it more understandable, especially for beginners.

## Acknowledgements

* This project is heavily inspired by and based on the logic from the Python 2-player Tetris game by **James Abela**. Thank you for sharing your work!
