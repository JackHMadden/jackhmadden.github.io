// scripts/fluid.js
// ─────────────────────────────────────────────────────────────────────────────
// Fluid — placeholder sketch.
// Replace the contents of the sketch function below with your fluid simulation.
// Called by the sketch registry in portfolio.html as: sketchFluid(container)
// Returns the p5 instance so the caller can remove() it on navigation.
//
// To use on a project page, add this to its sections array:
//   { p5: true, sketch: 'fluid', height: 400, caption: "Your caption." }
// ─────────────────────────────────────────────────────────────────────────────

function sketchFluid(container) {
  const sketch = function(p) {

    p.setup = function() {
      p.createCanvas(container.offsetWidth, container.offsetHeight);
    };

    p.draw = function() {
      // Replace this placeholder with your fluid simulation code.
      p.background(10, 10, 30);
      p.fill(80, 120, 200, 60);
      p.noStroke();
      const t = p.millis() / 1000;
      for (let i = 0; i < 6; i++) {
        const x = p.width  * 0.5 + p.cos(t * 0.7 + i * 1.05) * p.width  * 0.28;
        const y = p.height * 0.5 + p.sin(t * 0.5 + i * 1.05) * p.height * 0.28;
        p.ellipse(x, y, 180, 180);
      }
    };

    p.windowResized = function() {
      p.resizeCanvas(container.offsetWidth, container.offsetHeight);
    };

  };

  return new p5(sketch, container);
}
