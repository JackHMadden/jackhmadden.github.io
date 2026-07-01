// scripts/starfield.js
// ─────────────────────────────────────────────────────────────────────────────
// Starfield — warp-speed particle simulation.
// Called by the sketch registry in portfolio.html as: sketchStarfield(container)
// Returns the p5 instance so the caller can remove() it on navigation.
// ─────────────────────────────────────────────────────────────────────────────

function sketchStarfield(container) {
  const sketch = function(p) {
    let stars = [];
    const NUM   = 900;
    const SPEED = 5;

    class Star {
      constructor(init) {
        this.x  = p.random(-p.width / 2,  p.width / 2);
        this.y  = p.random(-p.height / 2, p.height / 2);
        this.z  = init ? p.random(p.width) : p.width;
        this.pz = this.z;
      }

      update() {
        this.z -= SPEED;
        if (this.z < 1) {
          this.x  = p.random(-p.width / 2,  p.width / 2);
          this.y  = p.random(-p.height / 2, p.height / 2);
          this.z  = p.width;
          this.pz = this.z;
        }
      }

      show() {
        const sx = p.map(this.x / this.z,  0, 1, 0, p.width);
        const sy = p.map(this.y / this.z,  0, 1, 0, p.height);
        const r  = p.map(this.z, 0, p.width, 5, 0);

        p.fill(255); p.noStroke();
        p.square(sx, sy, r);

        const px = p.map(this.x / this.pz, 0, 1, 0, p.width);
        const py = p.map(this.y / this.pz, 0, 1, 0, p.height);
        p.stroke(255); p.strokeWeight(r * 0.8);
        p.line(px + r / 2, py + r / 2, sx + r / 2, sy + r / 2);

        this.pz = this.z;
      }
    }

    p.setup = function() {
      p.createCanvas(container.offsetWidth, container.offsetHeight);
      p.background(0);
      for (let i = 0; i < NUM; i++) stars.push(new Star(true));
    };

    p.draw = function() {
      p.background(0);
      p.translate(p.width / 2, p.height / 2);
      for (const s of stars) { s.update(); s.show(); }
    };

    p.windowResized = function() {
      p.resizeCanvas(container.offsetWidth, container.offsetHeight);
      stars = [];
      for (let i = 0; i < NUM; i++) stars.push(new Star(true));
    };
  };

  return new p5(sketch, container);
}
