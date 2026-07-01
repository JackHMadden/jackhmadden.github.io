// scripts/anomaly.js
// ─────────────────────────────────────────────────────────────────────────────
// Anomaly — live global temperature anomaly chart.
// Called by the sketch registry in portfolio.html as: sketchAnomaly(container)
// Returns the p5 instance so the caller can remove() it on navigation.
//
// On your project page section, use:
//   { p5: true, sketch: 'anomaly', height: 620, caption: "..." }
//
// Inspired by https://climatereanalyzer.org — see original comments for
// methodology. Data fetched live from climatereanalyzer.org on each load.
// ─────────────────────────────────────────────────────────────────────────────
//
// CHANGES FROM THE STANDALONE VERSION:
//
// 1. INSTANCE MODE WRAPPER
//    The entire sketch is wrapped in function sketchAnomaly(container) which
//    returns a p5 instance. This scopes it to its container div rather than
//    taking over the whole page, and allows the portfolio to cleanly call
//    .remove() when navigating away.
//
// 2. p. PREFIX ON ALL P5 CALLS
//    In instance mode, p5's built-in functions are accessed through the sketch
//    argument (here named `p`) rather than being global. Every p5 function,
//    constant, and property gains a `p.` prefix:
//      setup() → p.setup = function()
//      draw()  → p.draw  = function()
//      width   → p.width,  height → p.height
//      stroke(), fill(), map(), nf(), get() … all become p.stroke() etc.
//      PI, ROUND, LEFT, CENTER, BOLD … become p.PI, p.ROUND, p.LEFT etc.
//    Note: JavaScript's native Array methods (.reduce, .filter, .push) and
//    Math functions (new Date, etc.) are unchanged — only p5's own API changes.
//
// 3. CONTAINER SIZING
//    document.getElementById('sketch-container').offsetWidth
//    → container.offsetWidth
//    The container element is passed in as a function argument, so no ID lookup
//    is needed. canvas.parent('sketch-container') is also removed — p5 handles
//    parenting automatically when a container is passed to new p5(sketch, container).
//
// 4. VARIABLES AND HELPERS MOVED INSIDE THE SKETCH FUNCTION
//    The original's top-level var declarations and helper functions are all
//    moved inside the sketch function. This prevents them from polluting the
//    global scope, which matters when multiple sketches coexist on one page.
//
// 5. ARRAY INITIALISATION FIX
//    new Array(length).fill(0) → new Array(365).fill(0)
//    `length` was an undefined variable in the original (a latent bug that
//    worked accidentally since JS silently creates an empty array from
//    new Array(undefined) and dynamic assignment still works). Fixed to 365.
// ─────────────────────────────────────────────────────────────────────────────

function sketchAnomaly(container) {
  const sketch = function(p) {

    // ── All sketch-scope variables (were global in the original) ─────────────
    let xcoord1, ycoord1, xcoord2, ycoord2, rangey, ticksy;
    let R1, G1, B1, R2, G2, B2;
    let xpos, xposdecadal, xposlasty, xposcurry;
    let img, backswitch, marker, nowindex;
    let months, days, textopacity;
    let anomalylasty = [], anomalycurry = [], anomalydecadal = [];
    let decades = [], baselineyears = [];
    let yearlys, offsets = [];
    let indexlasty, indexcurry, decadelist;
    let backgroundcolor, bloffset, windowwidth, textscale;
    let namecurry, namelasty;
    let avgcurry, avglasty;

    // ── preload ───────────────────────────────────────────────────────────────
    p.preload = function() {
      yearlys = p.loadJSON(
        "https://climatereanalyzer.org/clim/t2_daily/json/era5_world_t2_day.json"
      );
    };

    // ── setup ─────────────────────────────────────────────────────────────────
    p.setup = function() {
      windowwidth = container.offsetWidth;                   // ← was getElementById().offsetWidth
      textscale = (windowwidth < 1000)
        ? p.map(windowwidth, 100, 1000, 0.4, 1)
        : 1;

      p.createCanvas(windowwidth, 600);                      // ← canvas.parent() removed; p5 handles it
      backgroundcolor = 255;
      p.background(backgroundcolor);
      p.textFont('Avenir Next');
      p.strokeJoin(p.ROUND);                                 // ← ROUND → p.ROUND

      xcoord1 = p.width  * 0.1;
      ycoord1 = p.height * 0.9;
      xcoord2 = p.width  * 0.9;
      ycoord2 = p.height * 0.1;

      R1 = 153; G1 = 229; B1 = 242;
      R2 = 204; G2 = 71;  B2 = 15;

      indexcurry = p.year() - 1940;                         // ← year() → p.year()
      indexlasty = indexcurry - 1;
      namecurry  = indexcurry + 1940;
      namelasty  = indexlasty + 1940;

      xpos        = 2;
      xposdecadal = 1;
      xposlasty   = 1;
      xposcurry   = 1;
      backswitch  = 0;
      marker      = 0;

      days   = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
      months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      decadelist = ["1940s","1950s","1960s","1970s","1980s","1990s","2000s","2010s","2020s"];
      textopacity = 0;
      bloffset    = 0.3;

      // Remove null values from yearly data
      for (let i = 0; i <= indexcurry; i++) {
        yearlys[i].data = yearlys[i].data.filter(value => value !== null);
      }

      // Generate 1950–1979 baseline offsets
      for (let j = 10; j <= 39; j++) { baselineyears.push(j); }
      offsets = averageArraysInJSON(yearlys, baselineyears);

      // Calculate anomalies and averages
      nowindex = yearlys[indexcurry].data.length - 1;
      for (let i = 0; i < yearlys[indexcurry].data.length; i++) {
        anomalycurry.push(yearlys[indexcurry].data[i] - offsets[i] + bloffset);
      }
      for (let i = 0; i < yearlys[indexlasty].data.length - 1; i++) {
        anomalylasty.push(yearlys[indexlasty].data[i] - offsets[i] + bloffset);
      }
      avgcurry = arrayavg(anomalycurry);
      avglasty = arrayavg(anomalylasty);

      // Generate decade average arrays
      for (let i = 0; i <= 79; i += 10) {
        const sub = [];
        for (let j = i; j < i + 10; j++) { sub.push(j); }
        decades.push(sub);
      }
      const lastsub = [];
      for (let i = 80; i <= indexlasty; i++) { lastsub.push(i); }
      decades.push(lastsub);

      for (let i = 0; i < decades.length; i++) {
        anomalydecadal.push(averageArraysInJSON(yearlys, decades[i]));
      }

      // ── Static chart elements ─────────────────────────────────────────────
      rangey = 2.4;
      ticksy = p.floor(rangey / 0.2) + 1;                   // ← floor() → p.floor()

      p.stroke(100); p.strokeWeight(1);
      p.line(xcoord1, ycoord1, xcoord2, ycoord1);
      p.line(xcoord1, ycoord1, xcoord1, ycoord2);

      for (let i = 0; i < 12; i++) {
        p.line(mapx(days[i]), ycoord1 - (0.007 * p.height),
               mapx(days[i]), ycoord1 + (0.027 * p.height));
      }
      for (let i = 0; i < ticksy; i++) {
        p.line(xcoord1 - (0.004 * p.width), mapy(i * 0.2),
               xcoord1 + (0.004 * p.width), mapy(i * 0.2));
      }

      p.textSize(14 * textscale); p.textAlign(p.LEFT, p.CENTER);
      p.stroke(100); p.fill(100);
      for (let i = 0; i < 12; i++) {
        p.text(months[i], mapx(days[i]) + (0.004 * p.width), ycoord1 + (0.025 * p.height));
      }

      p.textAlign(p.RIGHT, p.CENTER);
      for (let i = 0; i < ticksy; i++) {
        p.text("+" + p.nf(0.2 * i, 1, 1), xcoord1 - (0.008 * p.width), mapy(i * 0.2));
      }

      p.rotate(-p.PI / 2);                                  // ← PI → p.PI, rotate() → p.rotate()
      p.textAlign(p.CENTER, p.BOTTOM);
      p.textSize(20 * textscale);
      p.stroke(100); p.fill(100);
      p.text("Temperature anomaly (°C)", -p.height / 2, xcoord1 - (0.055 * p.width));
      p.rotate(p.PI / 2);

      p.textAlign(p.LEFT, p.CENTER);
      p.textSize(23 * textscale);
      p.stroke(0); p.fill(0);
      p.text(
        "1940–" + namecurry + " Daily Global Surface Air Temperature Anomaly",
        xcoord1, ycoord2 - (0.05 * p.height)
      );
      p.textSize(12 * textscale);
      p.fill(100); p.stroke(100);
      p.text(
        "from the 1850–1900 baseline — Data: climatereanalyzer.org",
        xcoord1 + (0.004 * p.width), ycoord2 - (0.02 * p.height)
      );
    };

    // ── draw ──────────────────────────────────────────────────────────────────
    p.draw = function() {

      // Yearly lines
      p.noFill();
      if (xpos <= indexlasty - 1) {
        for (let j = xpos - 2; j <= xpos; j++) {
          p.stroke(p.lerpColor(                             // ← lerpColor() → p.lerpColor()
            p.color(R1, G1, B1, 32),                        // ← color() → p.color()
            p.color(R2, G2, B2, 32),
            p.map(j, 0, indexlasty - 1, 0, 1)
          ));
          p.strokeWeight(0.8);
          p.beginShape();
          for (let i = 0; i < 365; i++) {
            p.vertex(mapx(i), mapy(yearlys[j].data[i] - offsets[i] + bloffset));
          }
          p.endShape();
        }
      }

      // Decadal lines
      p.noFill();
      if (xposdecadal <= 365 && xpos > indexlasty - 1) {
        for (let j = 0; j < anomalydecadal.length; j++) {
          p.stroke(p.lerpColor(
            p.color(R1, G1, B1, 255),
            p.color(R2, G2, B2, 255),
            p.map(j, -1, 8, 0, 1)
          ));
          p.strokeWeight(1.8);
          p.beginShape();
          for (let i = xposdecadal - 8; i < xposdecadal; i++) {
            p.vertex(mapx(i), mapy(anomalydecadal[j][i] - offsets[i] + bloffset));
          }
          p.endShape();
        }
      }

      // Last year line
      if (xposlasty <= 365 && xpos > indexlasty - 1) {
        p.stroke(100, 100, 100, 90);
        p.strokeWeight(1.2);
        p.beginShape();
        for (let i = xposlasty - 8; i <= xposlasty; i++) {
          p.vertex(mapx(i), mapy(anomalylasty[i]));
        }
        p.endShape();
      }

      // Current year line
      if (xposcurry <= nowindex && xposlasty > 365) {
        p.stroke(208, 0, 0);
        p.strokeWeight(2.2);
        p.beginShape();
        for (let i = xposcurry - 2; i <= xposcurry; i++) {
          p.vertex(mapx(i), mapy(anomalycurry[i]));
        }
        p.endShape();
      }

      // Animation speed controls
      if (xpos <= indexlasty - 1)                          { xpos = xpos + 2; }
      if (xpos > indexlasty - 1 && xposdecadal <= 365)    { xposdecadal = xposdecadal + 7; }
      if (xpos > indexlasty - 1 && xposlasty <= 365)      { xposlasty = xposlasty + 7; }
      if (xposlasty > 365 && xposcurry <= nowindex)       { xposcurry = xposcurry + 1; }

      // Snapshot canvas once all lines are drawn, then use it as the new background
      if (backswitch === 0 && xposcurry >= nowindex) {
        img = p.get();                                       // ← get() → p.get()
        backswitch = 1;
      }

      // Post-plotting interactive overlay
      if (xposcurry > nowindex) {
        p.background(img);                                   // ← background(img) → p.background(img)

        // Horizontal crosshair on mouse hover
        if (p.mouseX > xcoord1 && p.mouseX < xcoord2 &&   // ← mouseX/mouseY → p.mouseX/p.mouseY
            p.mouseY > ycoord2 && p.mouseY < ycoord1) {
          p.stroke(100, 100, 100, 100); p.strokeWeight(1);
          p.line(xcoord1, p.mouseY, xcoord2, p.mouseY);
          p.line(p.mouseX, ycoord1, p.mouseX, p.mouseY);
          p.fill(backgroundcolor); p.noStroke();
          p.rect(xcoord1 - (0.05 * p.width), p.mouseY - (0.015 * p.height),
                 (0.045 * p.width), (0.03 * p.height));
          p.textSize(14 * textscale);
          p.stroke(100); p.fill(100);
          p.text(
            "+" + p.nf(p.map(p.mouseY, ycoord1, ycoord2, 0, rangey), 1, 2),
            xcoord1 - (0.048 * p.width), p.mouseY
          );
        }

        // Radiating indicator on latest data point
        if (marker < 18) { marker += 0.2; } else { marker = 0; }
        p.noFill(); p.strokeWeight(1.5);
        p.stroke(255, 0, 0, nlmap(marker, 0, 18, 255, 0));
        p.ellipse(mapx(nowindex), mapy(anomalycurry[nowindex]), marker);

        // Latest data point dot
        p.stroke(208, 0, 0); p.strokeWeight(2);
        p.line(mapx(nowindex - 1), mapy(anomalycurry[nowindex - 1]),
               mapx(nowindex),     mapy(anomalycurry[nowindex]));
        p.strokeWeight(5);
        p.point(mapx(nowindex), mapy(anomalycurry[nowindex]));

        // Fade-in labels
        if (textopacity <= 255) { textopacity += 5; }

        // Decadal labels
        for (let i = 0; i < anomalydecadal.length; i++) {
          p.textSize(16 * textscale);
          const dc = p.lerpColor(
            p.color(R1, G1, B1, textopacity),
            p.color(R2, G2, B2, textopacity),
            p.map(i, -1, decades.length - 1, 0, 1)
          );
          p.stroke(dc); p.strokeWeight(1); p.fill(dc);
          p.textAlign(p.LEFT, p.CENTER);
          let offset = (i === 0) ? (0.033 * p.height) : 0;
          p.text(decadelist[i], xcoord2,
                 mapy(anomalydecadal[i][364] - offsets[364] + bloffset) + offset);
        }

        // Current year label
        p.textSize(18 * textscale);
        p.stroke(255, 255, 255, textopacity); p.strokeWeight(1.5);
        p.fill(208, 0, 0, textopacity);
        p.textAlign(p.LEFT, p.BOTTOM);
        p.textStyle(p.BOLD);                                 // ← BOLD → p.BOLD
        p.text(
          dayofyear(nowindex + 1) + " " + namecurry + "\n+" + p.nf(anomalycurry[nowindex], 1, 2) + "°C",
          mapx(nowindex) + (0.015 * p.width),
          mapy(anomalycurry[nowindex])
        );

        // Last year label
        p.textSize(16 * textscale);
        p.stroke(100, 100, 100, textopacity); p.strokeWeight(1);
        p.fill(100, 100, 100, textopacity);
        p.textAlign(p.LEFT, p.BOTTOM);
        p.textStyle(p.NORMAL);                               // ← NORMAL → p.NORMAL
        p.text(
          namelasty + "\n+" + p.nf(avglasty, 1, 2) + "°C",
          mapx(365) + (0.005 * p.width),
          mapy(avglasty) - (0.005 * p.height)
        );

        // Signature
        p.textSize(12 * textscale);
        p.stroke(200, 200, 200, textopacity); p.strokeWeight(1);
        p.fill(200, 200, 200, textopacity);
        p.textAlign(p.LEFT, p.CENTER);
        p.text("@Astro_Madden", mapx(0) + (0.005 * p.width), mapy(0) - (0.017 * p.height));
      }
    };

    // ── Helper functions ──────────────────────────────────────────────────────
    // (were global in the original; moved inside sketch to avoid polluting
    //  the global scope and to give them access to p and sketch variables)

    function averageArraysInJSON(jsonData, keysToConsider) {
      const averages = new Array(365).fill(0);              // ← fixed: was new Array(length) (undefined)
      for (let i = 0; i < 365; i++) {
        // .reduce() is a native Array method — no p. prefix needed
        const sum = keysToConsider.reduce((acc, key) => acc + jsonData[key].data[i], 0);
        averages[i] = sum / keysToConsider.length;
      }
      return averages;
    }

    function mapy(val) {
      return p.map(val, 0, rangey, ycoord1, ycoord2);       // ← map() → p.map()
    }

    function mapx(val) {
      return p.map(val, 0, 365, xcoord1, xcoord2);
    }

    function arrayavg(arr) {
      if (arr.length === 0) return 0;
      return arr.reduce((acc, val) => acc + val, 0) / arr.length;  // native .reduce, unchanged
    }

    function nlmap(value, inputMin, inputMax, outputMin, outputMax) {
      let norm = (value - inputMin) / (inputMax - inputMin);
      let fx   = norm ** 3;
      return outputMin + fx * (outputMax - outputMin);      // pure math, no p5 involved
    }

    function dayofyear(dayOfYear) {
      const date = new Date(new Date().getFullYear(), 0);   // native JS Date, unchanged
      date.setDate(dayOfYear);
      return months[date.getMonth()] + " " + p.nf(date.getDate());  // ← nf() → p.nf()
    }

  }; // end sketch function

  return new p5(sketch, container);
}
