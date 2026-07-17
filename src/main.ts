import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("missing #app root element");
}

const canvas = document.createElement("canvas");
app.appendChild(canvas);

function render(): void {
  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);

  ctx.fillStyle = "#0f2138";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#e8f1fb";
  ctx.font = "600 32px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Bisect — scaffold running", width / 2, height / 2);
}

render();
window.addEventListener("resize", render);
