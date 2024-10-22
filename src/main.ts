import "./style.css";

const APP_NAME = "drawer";
const app = document.querySelector<HTMLDivElement>("#app")!;

// Set the document title
document.title = APP_NAME;

// Add an h1 element with the app title
const title = document.createElement("h1");
title.textContent = APP_NAME;
title.style.color = "black"; // Set the text color to black
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
let currentLine: ReturnType<typeof createBrushLine | typeof createEmoji> | null = null;

// Arrays to store the lines and redo stack
let lines: ReturnType<typeof createBrushLine | typeof createEmoji>[] = [];
let redoStack: ReturnType<typeof createBrushLine | typeof createEmoji>[] = [];

// Add buttons for brush tools
const thinButton = document.createElement("button");
thinButton.textContent = "Thin Brush";
app.appendChild(thinButton);

const thickButton = document.createElement("button");
thickButton.textContent = "Thick Brush";
app.appendChild(thickButton);

// Add buttons for emojis
const emojis = ["🐱", "🚀", "🌈"];
emojis.forEach((emoji) => {
  const button = document.createElement("button");
  button.textContent = emoji;
  app.appendChild(button);
  button.addEventListener("click", () => setEmoji(emoji, button));
});

// Adjusted thickness values
const THIN_LINE_THICKNESS = 2;
const THICK_LINE_THICKNESS = 8;

let currentThickness = THIN_LINE_THICKNESS; // Default to thin
let currentEmoji: string | null = null;

// Function to set the current tool
function setTool(thickness: number, button: HTMLButtonElement) {
  currentThickness = thickness;
  currentEmoji = null;
  thinButton.classList.remove("selectedTool");
  thickButton.classList.remove("selectedTool");
  document.querySelectorAll("button").forEach((btn) => btn.classList.remove("selectedTool"));
  button.classList.add("selectedTool");
}

// Function to set the current emoji
function setEmoji(emoji: string, button: HTMLButtonElement) {
  currentEmoji = emoji;
  thinButton.classList.remove("selectedTool");
  thickButton.classList.remove("selectedTool");
  document.querySelectorAll("button").forEach((btn) => btn.classList.remove("selectedTool"));
  button.classList.add("selectedTool");
  toolPreview = null; // Reset tool preview
  canvas.dispatchEvent(new Event("tool-moved"));
}

// Set initial tool
setTool(THIN_LINE_THICKNESS, thinButton);

// Event listeners for tool buttons
thinButton.addEventListener("click", () => setTool(THIN_LINE_THICKNESS, thinButton));
thickButton.addEventListener("click", () => setTool(THICK_LINE_THICKNESS, thickButton));

// Function to start drawing
canvas.addEventListener("mousedown", (e) => {
  drawing = true;
  if (currentEmoji) {
    currentLine = createEmoji(e.offsetX, e.offsetY, currentEmoji);
  } else {
    currentLine = createBrushLine(e.offsetX, e.offsetY, currentThickness);
  }
  toolPreview = null; // Hide tool preview while drawing
});

// Function to draw on the canvas
canvas.addEventListener("mousemove", (e) => {
  if (!drawing) {
    if (currentEmoji) {
      if (!toolPreview) {
        toolPreview = createEmojiPreview(e.offsetX, e.offsetY, currentEmoji);
      } else {
        toolPreview.updatePosition(e.offsetX, e.offsetY);
      }
    } else {
      if (!toolPreview) {
        toolPreview = createBrushPreview(e.offsetX, e.offsetY, currentThickness);
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

// Add an export button
const exportButton = document.createElement("button");
exportButton.textContent = "Export";
app.appendChild(exportButton);

// Function to export the canvas as a PNG file
exportButton.addEventListener("click", () => {
  // Create a new canvas of size 1024x1024
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  const exportCtx = exportCanvas.getContext("2d")!;

  // Scale the context to 4x
  exportCtx.scale(4, 4);

  // Execute all items on the display list against the new context
  lines.forEach((line) => line.display(exportCtx));

  // Trigger a file download with the contents of the canvas as a PNG file
  exportCanvas.toBlob((blob) => {
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "drawing.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  });
});

// Function to create a brush line
function createBrushLine(
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

// Function to create a brush preview
function createBrushPreview(x: number, y: number, thickness: number) {
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

// Function to create an emoji preview
function createEmojiPreview(x: number, y: number, emoji: string) {
  return {
    draw(ctx: CanvasRenderingContext2D) {
      ctx.font = "40px Arial"; // Adjusted size
      ctx.fillText(emoji, x, y);
    },
    updatePosition(newX: number, newY: number) {
      x = newX;
      y = newY;
    }
  };
}

// Function to create an emoji
function createEmoji(x: number, y: number, emoji: string) {
  return {
    drag(newX: number, newY: number) {
      x = newX;
      y = newY;
    },
    display(ctx: CanvasRenderingContext2D) {
      ctx.font = "40px Arial"; // Adjusted size
      ctx.fillText(emoji, x, y);
    }
  };
}

// Global variable to hold the tool preview object
let toolPreview: ReturnType<typeof createBrushPreview | typeof createEmojiPreview> | null = null;

// Event listener for tool-moved event
canvas.addEventListener("tool-moved", () => {
  canvas.dispatchEvent(new Event("drawing-changed"));
});