// 扫雷游戏逻辑 - 烟花版

let gameState = {
    difficulty: 'beginner',
    rows: 9,
    cols: 9,
    mines: 10,
    board: [],
    revealed: [],
    flagged: [],
    gameOver: false,
    gameWon: false,
    timer: 0,
    timerInterval: null,
    startTime: null,
    remainingMines: 10
};

// 难度设置
const difficulties = {
    beginner: { rows: 9, cols: 9, mines: 10 },
    intermediate: { rows: 16, cols: 16, mines: 40 },
    expert: { rows: 16, cols: 30, mines: 99 }
};

// DOM元素
const gameBoard = document.getElementById('gameBoard');
const mineCounter = document.getElementById('mineCounter');
const timerDisplay = document.getElementById('timer');
const resetBtn = document.getElementById('resetBtn');
const gameMessage = document.getElementById('gameMessage');
const difficultyButtons = {
    beginner: document.getElementById('beginner'),
    intermediate: document.getElementById('intermediate'),
    expert: document.getElementById('expert')
};

// 初始化游戏
function initGame(difficulty = 'beginner') {
    // 清除之前的定时器
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    
    // 设置游戏状态
    gameState.difficulty = difficulty;
    gameState.rows = difficulties[difficulty].rows;
    gameState.cols = difficulties[difficulty].cols;
    gameState.mines = difficulties[difficulty].mines;
    gameState.remainingMines = difficulties[difficulty].mines;
    gameState.gameOver = false;
    gameState.gameWon = false;
    gameState.timer = 0;
    gameState.startTime = null;
    
    // 初始化游戏板
    gameState.board = Array(gameState.rows).fill().map(() => Array(gameState.cols).fill(0));
    gameState.revealed = Array(gameState.rows).fill().map(() => Array(gameState.cols).fill(false));
    gameState.flagged = Array(gameState.rows).fill().map(() => Array(gameState.cols).fill(false));
    
    // 更新显示
    mineCounter.textContent = formatNumber(gameState.remainingMines);
    timerDisplay.textContent = formatNumber(gameState.timer);
    resetBtn.textContent = '😊';
    gameMessage.textContent = '';
    
    // 生成游戏板
    generateBoard();
    
    // 放置烟花
    placeMines();
    
    // 计算周围烟花数量
    calculateNumbers();
}

// 触摸事件处理
let touchTimer = null;
const LONG_PRESS_DELAY = 500;

function addTouchEvents(cell, row, col) {
    cell.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchTimer = setTimeout(() => {
            cell.classList.add('long-press');
            handleRightClick(row, col);
        }, LONG_PRESS_DELAY);
    }, { passive: false });
    
    cell.addEventListener('touchmove', (e) => {
        e.preventDefault();
        clearTimeout(touchTimer);
        cell.classList.remove('long-press');
    }, { passive: false });
    
    cell.addEventListener('touchend', (e) => {
        e.preventDefault();
        clearTimeout(touchTimer);
        cell.classList.remove('long-press');
        if (!cell.classList.contains('revealed') && !cell.classList.contains('flagged')) {
            handleCellClick(row, col);
        }
    }, { passive: false });
}

// 生成游戏板UI
function generateBoard() {
    gameBoard.innerHTML = '';
    gameBoard.style.gridTemplateRows = `repeat(${gameState.rows}, 1fr)`;
    gameBoard.style.gridTemplateColumns = `repeat(${gameState.cols}, 1fr)`;
    
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            // 添加点击事件（桌面端）
            cell.addEventListener('click', () => handleCellClick(row, col));
            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                handleRightClick(row, col);
            });
            
            // 添加触摸事件（移动端）
            addTouchEvents(cell, row, col);
            
            gameBoard.appendChild(cell);
        }
    }
}

// 随机放置烟花
function placeMines() {
    let minesPlaced = 0;
    
    while (minesPlaced < gameState.mines) {
        const row = Math.floor(Math.random() * gameState.rows);
        const col = Math.floor(Math.random() * gameState.cols);
        
        if (gameState.board[row][col] !== -1) {
            gameState.board[row][col] = -1; // -1 表示烟花
            minesPlaced++;
        }
    }
}

// 计算每个格子周围的烟花数量
function calculateNumbers() {
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            if (gameState.board[row][col] === -1) continue;
            
            let count = 0;
            // 检查周围8个格子
            for (let r = -1; r <= 1; r++) {
                for (let c = -1; c <= 1; c++) {
                    if (r === 0 && c === 0) continue;
                    
                    const newRow = row + r;
                    const newCol = col + c;
                    
                    if (newRow >= 0 && newRow < gameState.rows && newCol >= 0 && newCol < gameState.cols) {
                        if (gameState.board[newRow][newCol] === -1) {
                            count++;
                        }
                    }
                }
            }
            
            gameState.board[row][col] = count;
        }
    }
}

// 处理左键点击
function handleCellClick(row, col) {
    // 如果游戏结束或已经揭示或已经标记，则返回
    if (gameState.gameOver || gameState.gameWon || gameState.revealed[row][col] || gameState.flagged[row][col]) {
        return;
    }
    
    // 开始计时
    if (!gameState.startTime) {
        startTimer();
    }
    
    // 揭示格子
    revealCell(row, col);
    
    // 检查游戏状态
    checkGameState();
}

// 处理右键点击（标记/取消标记）
function handleRightClick(row, col) {
    // 如果游戏结束或已经揭示，则返回
    if (gameState.gameOver || gameState.gameWon || gameState.revealed[row][col]) {
        return;
    }
    
    // 开始计时
    if (!gameState.startTime) {
        startTimer();
    }
    
    // 切换标记状态
    gameState.flagged[row][col] = !gameState.flagged[row][col];
    
    // 更新剩余烟花数量
    if (gameState.flagged[row][col]) {
        gameState.remainingMines--;
    } else {
        gameState.remainingMines++;
    }
    
    mineCounter.textContent = formatNumber(gameState.remainingMines);
    
    // 更新UI
    updateCellUI(row, col);
    
    // 检查游戏状态
    checkGameState();
}

// 揭示格子
function revealCell(row, col) {
    // 边界检查
    if (row < 0 || row >= gameState.rows || col < 0 || col >= gameState.cols) {
        return;
    }
    
    // 如果已经揭示或标记，则返回
    if (gameState.revealed[row][col] || gameState.flagged[row][col]) {
        return;
    }
    
    // 标记为已揭示
    gameState.revealed[row][col] = true;
    
    // 更新UI
    updateCellUI(row, col);
    
    // 如果是烟花，游戏结束
    if (gameState.board[row][col] === -1) {
        gameOver(false);
        return;
    }
    
    // 如果是空白格子（周围没有烟花），递归揭示周围格子
    if (gameState.board[row][col] === 0) {
        for (let r = -1; r <= 1; r++) {
            for (let c = -1; c <= 1; c++) {
                if (r === 0 && c === 0) continue;
                revealCell(row + r, col + c);
            }
        }
    }
}

// 更新格子UI
function updateCellUI(row, col) {
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    if (!cell) return;
    
    // 清除所有类
    cell.className = 'cell';
    
    if (gameState.revealed[row][col]) {
        cell.classList.add('revealed');
        
        if (gameState.board[row][col] === -1) {
            // 烟花
            cell.classList.add('mine');
            cell.classList.add('fireworks');
        } else if (gameState.board[row][col] > 0) {
            // 数字
            cell.textContent = gameState.board[row][col];
            cell.dataset.number = gameState.board[row][col];
        }
    } else if (gameState.flagged[row][col]) {
        // 标记
        cell.classList.add('flagged');
        cell.textContent = '🎁';
    }
}

// 开始计时器
function startTimer() {
    gameState.startTime = Date.now();
    gameState.timerInterval = setInterval(() => {
        gameState.timer = Math.floor((Date.now() - gameState.startTime) / 1000);
        timerDisplay.textContent = formatNumber(gameState.timer);
    }, 1000);
}

// 停止计时器
function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

// 格式化数字（确保三位数）
function formatNumber(num) {
    return num.toString().padStart(3, '0');
}

// 检查游戏状态
function checkGameState() {
    // 检查是否所有非烟花格子都已揭示
    let revealedCount = 0;
    let totalSafeCells = (gameState.rows * gameState.cols) - gameState.mines;
    
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            if (gameState.revealed[row][col] && gameState.board[row][col] !== -1) {
                revealedCount++;
            }
        }
    }
    
    if (revealedCount === totalSafeCells) {
        gameOver(true);
    }
}

// 游戏结束
function gameOver(won) {
    gameState.gameOver = true;
    gameState.gameWon = won;
    
    // 停止计时器
    stopTimer();
    
    // 更新表情按钮
    if (won) {
        resetBtn.textContent = '😎';
        gameMessage.textContent = '恭喜你赢了！';
        // 揭示所有烟花
        revealAllMines(true);
    } else {
        resetBtn.textContent = '😵';
        gameMessage.textContent = '游戏结束！';
        // 揭示所有烟花
        revealAllMines(false);
    }
}

// 揭示所有烟花
function revealAllMines(won) {
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            if (gameState.board[row][col] === -1) {
                if (won) {
                    // 胜利时，标记所有烟花
                    gameState.flagged[row][col] = true;
                    gameState.remainingMines--;
                } else {
                    // 失败时，揭示所有烟花
                    gameState.revealed[row][col] = true;
                }
                updateCellUI(row, col);
            }
        }
    }
    
    if (won) {
        mineCounter.textContent = formatNumber(0);
    }
}

// 重置游戏
function resetGame() {
    initGame(gameState.difficulty);
    resetBtn.textContent = '😊';
    gameMessage.textContent = '';
}

// 设置难度
function setDifficulty(difficulty) {
    initGame(difficulty);
    // 更新难度按钮样式
    Object.keys(difficultyButtons).forEach(key => {
        if (key === difficulty) {
            difficultyButtons[key].style.backgroundColor = '#a0a0a0';
        } else {
            difficultyButtons[key].style.backgroundColor = '#c0c0c0';
        }
    });
}

// 事件监听器
resetBtn.addEventListener('click', resetGame);

difficultyButtons.beginner.addEventListener('click', () => setDifficulty('beginner'));
difficultyButtons.intermediate.addEventListener('click', () => setDifficulty('intermediate'));
difficultyButtons.expert.addEventListener('click', () => setDifficulty('expert'));

// 初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    initGame();
    // 设置初始难度按钮样式
    difficultyButtons.beginner.style.backgroundColor = '#a0a0a0';
});

// 防止右键菜单弹出
document.addEventListener('contextmenu', (e) => {
    if (e.target.classList.contains('cell')) {
        e.preventDefault();
    }
});

// 键盘事件（可选：空格键重置游戏）
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        resetGame();
    }
});