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

// Function to start drawing
canvas.addEventListener("mousedown", (e) => {
    x = e.offsetX;
    y = e.offsetY;
    drawing = true;
});

// Function to draw on the canvas
canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
    x = e.offsetX;
    y = e.offsetY;
    ctx.lineTo(x, y);
    ctx.stroke();
});

// Function to stop drawing
canvas.addEventListener("mouseup", () => {
    drawing = false;
});

// Add a clear button
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
app.appendChild(clearButton);

// Function to clear the canvas
clearButton.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});