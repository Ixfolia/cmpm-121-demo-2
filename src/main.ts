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
let currentLine: ReturnType<typeof createMarkerLine> | null = null;

// Arrays to store the lines and redo stack
let lines: ReturnType<typeof createMarkerLine>[] = [];
let redoStack: ReturnType<typeof createMarkerLine>[] = [];

// Function to start drawing
canvas.addEventListener("mousedown", (e) => {
  drawing = true;
  currentLine = createMarkerLine(e.offsetX, e.offsetY);
});

// Function to draw on the canvas
canvas.addEventListener("mousemove", (e) => {
  if (!drawing || !currentLine) return;
  currentLine.drag(e.offsetX, e.offsetY);
  canvas.dispatchEvent(new Event("drawing-changed"));
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
function createMarkerLine(initialX: number, initialY: number) {
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
      ctx.stroke();
    },
    getPoints() {
      return points;
    }
  };
}

