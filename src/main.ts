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
let x = 0;
let y = 0;

// Arrays to store the points and redo stack
let points: { x: number; y: number }[][] = [];
let redoStack: { x: number; y: number }[][] = [];
let currentLine: { x: number; y: number }[] = [];

// Function to start drawing
canvas.addEventListener("mousedown", (e) => {
  x = e.offsetX;
  y = e.offsetY;
  drawing = true;
  currentLine = [{ x, y }];
});

// Function to draw on the canvas
canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;
  x = e.offsetX;
  y = e.offsetY;
  currentLine.push({ x, y });
  canvas.dispatchEvent(new Event("drawing-changed"));
});

// Function to stop drawing
canvas.addEventListener("mouseup", () => {
  drawing = false;
  points.push(currentLine);
  currentLine = [];
  canvas.dispatchEvent(new Event("drawing-changed")); // Moved this line here
});

// Function to redraw the lines
canvas.addEventListener("drawing-changed", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  points.concat([currentLine]).forEach((line) => {
    for (let i = 0; i < line.length - 1; i++) {
      ctx.beginPath();
      ctx.moveTo(line[i].x, line[i].y);
      ctx.lineTo(line[i + 1].x, line[i + 1].y);
      ctx.stroke();
    }
  });
});

// Add a clear button
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
app.appendChild(clearButton);

// Function to clear the canvas
clearButton.addEventListener("click", () => {
  points = [];
  currentLine = [];
  redoStack = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Add an undo button
const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
app.appendChild(undoButton);

// Function to undo the last line
undoButton.addEventListener("click", () => {
  if (points.length > 0) {
    redoStack.push(points.pop()!);
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
    points.push(redoStack.pop()!);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});
