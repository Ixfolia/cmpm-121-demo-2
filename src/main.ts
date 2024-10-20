import "./style.css";

const APP_NAME = "drawer";
const app = document.querySelector<HTMLDivElement>("#app")!;

// Set the document title
document.title = APP_NAME;

// Add an h1 element with the app title
const title = document.createElement("h1");
title.textContent = APP_NAME;
app.appendChild(title);

// Add a canvas element
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "myCanvas";
app.appendChild(canvas);

// Get the 2D context of the canvas
const ctx = canvas.getContext("2d")!;

// Variables to keep track of the mouse position and drawing state
let drawing = false;
let currentLine: ReturnType<typeof createMarkerLine | typeof createSticker> | null = null;

// Arrays to store the lines and redo stack
let lines: ReturnType<typeof createMarkerLine | typeof createSticker>[] = [];
let redoStack: ReturnType<typeof createMarkerLine | typeof createSticker>[] = [];

// Add buttons for marker tools
const thinButton = document.createElement("button");
thinButton.textContent = "Thin";
app.appendChild(thinButton);

const thickButton = document.createElement("button");
thickButton.textContent = "Thick";
app.appendChild(thickButton);

// Add buttons for stickers
const stickers = ["😀", "🎉", "🌟"];
stickers.forEach((sticker) => {
  const button = document.createElement("button");
  button.textContent = sticker;
  app.appendChild(button);
  button.addEventListener("click", () => setSticker(sticker, button));
});

// Variable to store the current line thickness
let currentThickness = 1; // Default to thin
let currentSticker: string | null = null;

// Function to set the current tool
function setTool(thickness: number, button: HTMLButtonElement) {
  currentThickness = thickness;
  currentSticker = null;
  thinButton.classList.remove("selectedTool");
  thickButton.classList.remove("selectedTool");
  document.querySelectorAll("button").forEach((btn) => btn.classList.remove("selectedTool"));
  button.classList.add("selectedTool");
}

// Function to set the current sticker
function setSticker(sticker: string, button: HTMLButtonElement) {
  currentSticker = sticker;
  thinButton.classList.remove("selectedTool");
  thickButton.classList.remove("selectedTool");
  document.querySelectorAll("button").forEach((btn) => btn.classList.remove("selectedTool"));
  button.classList.add("selectedTool");
  toolPreview = null; // Reset tool preview
  canvas.dispatchEvent(new Event("tool-moved"));
}

// Set initial tool
setTool(1, thinButton);

// Event listeners for tool buttons
thinButton.addEventListener("click", () => setTool(1, thinButton));
thickButton.addEventListener("click", () => setTool(5, thickButton));

// Function to start drawing
canvas.addEventListener("mousedown", (e) => {
  drawing = true;
  if (currentSticker) {
    currentLine = createSticker(e.offsetX, e.offsetY, currentSticker);
  } else {
    currentLine = createMarkerLine(e.offsetX, e.offsetY, currentThickness);
  }
  toolPreview = null; // Hide tool preview while drawing
});

// Function to draw on the canvas
canvas.addEventListener("mousemove", (e) => {
  if (!drawing) {
    if (currentSticker) {
      if (!toolPreview) {
        toolPreview = createStickerPreview(e.offsetX, e.offsetY, currentSticker);
      } else {
        toolPreview.updatePosition(e.offsetX, e.offsetY);
      }
    } else {
      if (!toolPreview) {
        toolPreview = createToolPreview(e.offsetX, e.offsetY, currentThickness);
      } else {
        toolPreview.updatePosition(e.offsetX, e.offsetY);
        toolPreview.updateThickness(currentThickness);
      }
    }
    canvas.dispatchEvent(new Event("tool-moved"));
  } else if (currentLine) {
    currentLine.drag(e.offsetX, e.offsetY);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

// Function to stop drawing
canvas.addEventListener("mouseup", () => {
  if (currentLine) {
    lines.push(currentLine);
    currentLine = null;
  }
  drawing = false;
  canvas.dispatchEvent(new Event("drawing-changed"));
});

// Function to redraw the lines
canvas.addEventListener("drawing-changed", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  lines.concat(currentLine ? [currentLine] : []).forEach((line) => line.display(ctx));
  if (toolPreview && !drawing) {
    toolPreview.draw(ctx);
  }
});

// Add a clear button
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
app.appendChild(clearButton);

// Function to clear the canvas
clearButton.addEventListener("click", () => {
  lines = [];
  currentLine = null;
  redoStack = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Add an undo button
const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
app.appendChild(undoButton);

// Function to undo the last line
undoButton.addEventListener("click", () => {
  if (lines.length > 0) {
    redoStack.push(lines.pop()!);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

// Add a redo button
const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
app.appendChild(redoButton);

// Function to redo the last line
redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    lines.push(redoStack.pop()!);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

// Function to create a marker line
function createMarkerLine(
  initialX: number,
  initialY: number,
  thickness: number
) {
  const points = [{ x: initialX, y: initialY }];

  return {
    drag(x: number, y: number) {
      points.push({ x, y });
    },
    display(ctx: CanvasRenderingContext2D) {
      if (points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.lineWidth = thickness;
      ctx.stroke();
    },
    getPoints() {
      return points;
    },
  };
}

// Function to create a tool preview
function createToolPreview(x: number, y: number, thickness: number) {
  return {
    draw(ctx: CanvasRenderingContext2D) {
      ctx.beginPath();
      ctx.arc(x, y, thickness / 2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fill();
    },
    updatePosition(newX: number, newY: number) {
      x = newX;
      y = newY;
    },
    updateThickness(newThickness: number) {
      thickness = newThickness;
    }
  };
}

// Function to create a sticker preview
function createStickerPreview(x: number, y: number, sticker: string) {
  return {
    draw(ctx: CanvasRenderingContext2D) {
      ctx.font = "30px Arial";
      ctx.fillText(sticker, x, y);
    },
    updatePosition(newX: number, newY: number) {
      x = newX;
      y = newY;
    }
  };
}

// Function to create a sticker
function createSticker(x: number, y: number, sticker: string) {
  return {
    drag(newX: number, newY: number) {
      x = newX;
      y = newY;
    },
    display(ctx: CanvasRenderingContext2D) {
      ctx.font = "30px Arial";
      ctx.fillText(sticker, x, y);
    }
  };
}

// Global variable to hold the tool preview object
let toolPreview: ReturnType<typeof createToolPreview | typeof createStickerPreview> | null = null;

// Event listener for tool-moved event
canvas.addEventListener("tool-moved", () => {
  canvas.dispatchEvent(new Event("drawing-changed"));
});