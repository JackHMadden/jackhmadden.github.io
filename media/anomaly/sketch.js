//\\ jackhmadden.github.io //\\ @astro_madden //\\ 
//     \                                      |       
//    _ \    __ \    _ \   __ `__ \    _` |   |  |   | 
//   ___ \   |   |  (   |  |   |   |  (   |   |  |   | 
// _/    _\ _|  _|  \___/ _|  _|  _|  \__,_| _|  \_, | 
//   inspired by https://climatereanalyzer.org   ____/  
// 
// The ERA5 data available at climatereanalyzer.org/clim/t2_daily is given in absolute temperature. To get the anomaly from 1850-1900, I use the ERA5 data from 1950 to the end of 1979 to get an average offset for each day of the year. I then can calibrate the offset using the annual anomalies from the global time series data at berkeleyearth.org. This gave an extra baseline offset of +0.3°C to calibrate a 1950-1979 anomaly to a 1850-1900 anomaly. When added to the ERA5 data the yearly averages match the BerkeleyEarth values. For example, the 2023 offset BerkeleyEarth calculated is +1.54 which is what my process calculates. See the disclaimer at climatereanalyzer.org to understand how to use this information.

var xcoord1,ycoord1,xcoord2,ycoord2,rangey,ticksy,R1,G1,B1,R2,G2,B2,xpos,xposdecadal,xpos2023,xpos2024,img,backswitch,marker,last24,months,days,average2023,textopacity,anomaly2023=[],anomaly2024=[],anomalydecadal=[],decades=[],baselineyears=[],yearlys,offsets=[],index2023,index2024,decadelist,backgroundcolor,bloffset,windowwidth,textscale

function preload(){
  yearlys = loadJSON("https://climatereanalyzer.org/clim/t2_daily/json/era5_world_t2_day.json");
}

//////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////

function setup() {
  //windowwidth = 1000;
  windowwidth = document.getElementById('sketch-container').offsetWidth;
  if (windowwidth<1000){textscale=map(windowwidth,100,1000,0.4,1);} else {textscale=1}
  let canvas = createCanvas(windowwidth, 600);
  //console.log(windowwidth,textscale)
  canvas.parent('sketch-container');
  backgroundcolor=255;
  background(backgroundcolor);
  textFont('Avenir Next');
  strokeJoin(ROUND);
  xcoord1=width*0.1;                //x-axis start
  ycoord1=height*0.9;               //y-axis start
  xcoord2=width*0.9;                //x-axis width
  ycoord2=height*0.1;               //y-axis height
  R1=153;G1=229;B1=242;             //lerp color start
  R2=204;G2=71;B2=15;               //lerp color end
  index2023 = 83;                   //Index of 2023 in yearly data
  index2024 = 84;                   //Index of 2024 in yearly data
  xpos = 2;                         //Initialize yearly animation
  xposdecadal =1;                   //Initialize decadal animation
  xpos2023 = 1;                     //Initialize 2023 animation
  xpos2024 = 1;                     //Initialize 2024 animation
  backswitch = 0;                   //Switch for static background
  marker = 0;                       //Indicator diameter start
  days = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]; // Yearday of month start
  months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  decadelist = ["1940s", "1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s"];
  textopacity=0;                    //Initialize animation text opacity
  bloffset=0.3; // Baseline offset between 1950-2000 and 1850-1900 in °C
  ///////////////\\\\\\\\\\\\\\\
  //////// Calculations \\\\\\\\\
  // Remove null values from yearly data
  for (let i = 0; i <= index2024; i++) {yearlys[i].data = yearlys[i].data.filter(value => value !== null);} 
  
  //Generate 1950-1979inc baseline offsets array 
  for (let j = 10; j <=39; j++) {baselineyears.push(j)}
  offsets = averageArraysInJSON(yearlys, baselineyears);
  
  //Perform calculations on 2024 and 2023 to get averages
  last24 = yearlys[index2024].data.length-1; // last index position in 2024 data
  for (let i=0; i<yearlys[index2023].data.length;i++){anomaly2023.push(yearlys[index2023].data[i]-offsets[i]+bloffset)} //calculate anomaly for 2023
  for (let i=0; i<yearlys[index2024].data.length;i++){anomaly2024.push(yearlys[index2024].data[i]-offsets[i]+bloffset)} //calculate anomaly for 2024 
  avg2023 = arrayavg(anomaly2023); //get 2023 average anomaly
  avg2024 = arrayavg(anomaly2024); //get 2024 average anomaly
  
  //Generate decade averages arrays 
  //generates the decades array of 10 year indexes
  for (let i = 0; i <= 79; i += 10) { 
    const subarray = [];
    for (let j = i; j < i + 10; j++) {subarray.push(j)}
    decades.push(subarray)
  }
  //averages the decades and makes a new array for them
  for (let i=0; i<decades.length; i++){
    const result = averageArraysInJSON(yearlys, decades[i]);
    anomalydecadal.push(result)
  }
  
  
  ////////////////\\\\\\\\\\\\\\\\
  //////// plot graphics \\\\\\\\\
  rangey=max(anomaly2024)+0.3;      //Max y-axis value
  ticksy = floor(rangey/0.2)+1;     //number of y-axis ticks
  // axis lines
  stroke(100);
  strokeWeight(1);
  line(xcoord1, ycoord1, xcoord2, ycoord1);
  line(xcoord1, ycoord1, xcoord1, ycoord2);
  
  // x-axis ticks
  for (let i = 0; i < 12; i++) {
  line(mapx(days[i]), ycoord1-(0.007*height), mapx(days[i]), ycoord1+(0.027*height));} 
  // y-axis ticks
  for (let i = 0; i < ticksy; i++) {
  line(xcoord1-(0.004*width), mapy(i*0.2), xcoord1+(0.004*width),mapy(i*0.2));} 
  
  
  // x-axis tick labels
  textSize(14*textscale);
  textAlign(LEFT, CENTER);
  stroke(100);
  fill(100);
  for (let i = 0; i < 12; i++) {
  text(months[i],mapx(days[i])+(0.004*width), ycoord1+(0.025*height));} 
  // y-axis tick labels
  textAlign(RIGHT, CENTER); //LEFT 0.045
  for (let i = 0; i < ticksy; i++) {
  text("+"+nf(0.2*i,1,1),xcoord1-(0.008*width), mapy(i*0.2));}
  
  //Plot labels
  rotate(-PI/2);
  textAlign(CENTER, BOTTOM);
  textSize(20*textscale);
  stroke(100);
  fill(100);
  text("Temperature anomaly (°C)",-height/2,xcoord1-(0.055*width)) // y-axis label
  rotate(PI/2);
  textAlign(LEFT, CENTER);
  textSize(24*textscale);
  stroke(0);
  fill(0);
  text("1940-2024 Daily Global Temperature Anomaly",xcoord1,ycoord2-(0.05*height)) // Title
  textSize(12*textscale);
  fill(100);
  stroke(100);
  text("from the 1850-1900 baseline - Data Source: climatereanalyzer.org",xcoord1+(0.004*width),ycoord2-(0.02*height)) // Subtitle

  
}

//////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////
function draw() {
  
  //Plot the yearly lines
  noFill();
  if (xpos<=82) {
  for (let j = xpos-2; j <= xpos; j++) {
  stroke(lerpColor(color(R1,G1,B1,20),color(R2,G2,B2,20),map(j,0,82,0,1)));
  strokeWeight(1);
  beginShape();
    for (let i = 0; i < 365; i++) {
      vertex(mapx(i),mapy(yearlys[j].data[i]-offsets[i]+bloffset));
    }
  endShape();
  }}
  
  //Plot the decadal lines
  noFill();
  if (xposdecadal<=365 && xpos>82) {
  for (let j=0; j<anomalydecadal.length; j++) {
  stroke(lerpColor(color(R1,G1,B1,255),color(R2,G2,B2,255),map(j,-1,7,0,1)));
  strokeWeight(1.8);
  beginShape();
    for (let i = xposdecadal-8; i < xposdecadal; i++) {
      vertex(mapx(i),mapy(anomalydecadal[j][i]-offsets[i]+bloffset));
    }
  endShape();
  }}
  
  //Plot the 2023 line
  if (xpos2023<=365 && xposdecadal>365) {
  stroke(100,100,100,200);
  strokeWeight(1.8);
  beginShape();
    for (let i = xpos2023-7; i < xpos2023; i++) {
      vertex(mapx(i),mapy(anomaly2023[i]));
    }
  endShape();
    //Draw average line
    stroke(230);
    strokeWeight(1);
    let dashing=[5,5];
    //drawDashedLine(mapx(0),mapy(avg2023),mapx(xpos2023+5),mapy(avg2023),dashing);
  }
  
  //Plot the 2024 line
  if (xpos2024<=last24 && xpos2023>365) {
  stroke(208,0,0); 
  strokeWeight(2.2);
  beginShape();
    for (let i = xpos2024-2; i <= xpos2024; i++) {vertex(mapx(i),mapy(anomaly2024[i]));}
  endShape();
    //Draw average line
    stroke(240,120,120);
    strokeWeight(1);
    let dashing=[5,5];
    //drawDashedLine(mapx(0),mapy(avg2024),mapx(xpos2024+5),mapy(avg2024),dashing);
  }
  
  // Animation controls
  if (xpos<=82){xpos=xpos+2}
  if (xpos>82 && xposdecadal<=365){xposdecadal=xposdecadal+7}
  if (xposdecadal>365 && xpos2023<=365){xpos2023=xpos2023+6}
  if (xpos2023>365 && xpos2024<=last24){xpos2024=xpos2024+1}

 
/////////////////////////////
  //Switch to static background 
  if (backswitch==0&&xpos2024>=last24){img = get();backswitch=1} //saves chart after plotting to make it the new background
  
  //Runs after last line is drawn
  if(xpos2024>last24){
    background(img);
    
    //Horizontal Gridline
    if (mouseX>xcoord1&&mouseX<xcoord2&&mouseY>ycoord2&&mouseY<ycoord1){
      stroke(100,100,100,100);
      strokeWeight(1)
      line(xcoord1,mouseY, xcoord2, mouseY);
      line(mouseX,ycoord1, mouseX, mouseY);
      fill(backgroundcolor);
      noStroke();
      rect(xcoord1-(0.05*width),mouseY-(0.015*height),(0.045*width),(0.03*height))
      textSize(14*textscale);
      stroke(100);
      fill(100);
      text("+"+nf(map(mouseY,ycoord1,ycoord2,0,rangey),1,2),xcoord1-(0.048*width),mouseY)
    }
    
    //Radiating Indicator
    if (marker < 18) {
    marker += 0.2;} 
    else { 
    marker = 0;}
    noFill();
    strokeWeight(1.5);
    stroke(255,0,0,nlmap(marker,0,18,255,0));
    ellipse(mapx(last24),
            mapy(anomaly2024[last24]),
            marker);
    
    //Last 2024 point
    stroke(208,0,0);
    strokeWeight(2);
    line(mapx(last24-1),mapy(anomaly2024[last24-1]),mapx(last24),mapy(anomaly2024[last24]))
    strokeWeight(5);
    point(mapx(last24),mapy(anomaly2024[last24]));
    
    
    // Plot line labels 
    if(textopacity<=255){textopacity=textopacity+5} //changes opacity of text to create fade-in
    
    // Decadal text
    for (let i=0; i<anomalydecadal.length; i++) { 
    textSize(16*textscale);
    stroke(lerpColor(color(R1,G1,B1,textopacity),color(R2,G2,B2,textopacity),map(i,-1,7,0,1)));
    strokeWeight(1);
    fill(lerpColor(color(R1,G1,B1,textopacity),color(R2,G2,B2,textopacity),map(i,-1,7,0,1)))
    textAlign(LEFT,CENTER);
      let fourties=0
     if(i==0){fourties=(0.033*height)}
    text(decadelist[i],xcoord2,mapy(anomalydecadal[i][364]-offsets[364]+bloffset)+fourties)
    }
    
    // 2024 text
    textSize(18*textscale);
    stroke(255,255,255,textopacity);
    strokeWeight(1.5)
    fill(208,0,0,textopacity)
    textAlign(LEFT,BOTTOM)
    textStyle(BOLD);
    text(dayofyear(last24+1)+" 2024\n+"+nf(anomaly2024[last24],1,2)+"°C",mapx(last24)+(0.015*width),mapy(anomaly2024[last24]))
    //text("+"+nf(avg2024,1,2)+"°C",mapx(last24)+5,mapy(avg2024))
    
    // 2023 text
    textSize(16*textscale);
    stroke(100,100,100,textopacity);
    strokeWeight(1)
    fill(100,100,100,textopacity)
    textAlign(LEFT,BOTTOM)
    text("2023\naverage\n"+"+"+nf(avg2023,1,2)+"°C",mapx(365)+(0.005*width),mapy(avg2023))
    
    // Signature
    textSize(12*textscale);
    stroke(200,200,200,textopacity);
    strokeWeight(1)
    fill(200,200,200,textopacity)
    textAlign(LEFT,CENTER)
    text("@Astro_Madden",mapx(0)+(0.005*width),mapy(0)-(0.017*height))
      
  } // End of post-plotting animation
  
  
} // End of draw loop


//////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// 

// Create and average array from several arrays 
function averageArraysInJSON(jsonData, keysToConsider) {
  const averages = new Array(length).fill(0); // Initialize array
  // Iterate over each index
  for (let i = 0; i < 365; i++) {
    const sum = keysToConsider.reduce((acc, key) => acc + jsonData[key].data[i], 0);// Calculate the sum of values at the same index in all arrays
    averages[i] = sum / keysToConsider.length; // average current index
  }
  return averages;
}

// Map onto y-axis
function mapy(arr) {
  let mapping = map(arr,0,rangey,ycoord1,ycoord2);
  return mapping;
}

// Map onto x-axis
function mapx(arr) {
  let mapping = map(arr,0,365,xcoord1,xcoord2);
  return mapping;
}

// Gets the average of an array
function arrayavg(arr) {
  if (arr.length === 0) {return 0;} // Check if the array is empty
  let sum = arr.reduce((acc, val) => acc + val, 0);// Sum elements
  let average = sum / arr.length; // Calculate the average
  return average;
}

// A nonlinear map function. This one is x^3 
function nlmap(value, inputMin, inputMax, outputMin, outputMax) {
  let norm = (value - inputMin) / (inputMax - inputMin); // Normalize the input value
  let fx = norm ** 3; // Apply the non-linear transformation
  let newval = outputMin + fx * (outputMax - outputMin); // Map the transformed value back to the output range
  return newval;
}

// Gets month day format from yearday
function dayofyear(dayOfYear) {
  const date = new Date(new Date().getFullYear(), 0); // Initialize with current year
  date.setDate(dayOfYear); // Set the day of the year
  const month = date.getMonth(); 
  const day = date.getDate();
  return months[month]+" "+nf(day);
}

//Creates a dashed line from x1,y1 to x2,y2 with pattern as [dash length, gap length]
function drawDashedLine(x1, y1, x2, y2, pattern) {
  let dx = x2 - x1;
  let dy = y2 - y1;
  let distance = sqrt(dx * dx + dy * dy); // Length of the line
  let segments = floor(distance / (pattern[0] + pattern[1])); // Number of complete dashes and gaps along the line
  let currentX = x1;
  let currentY = y1;
  let segmentIndex = 0;

  for (let i = 0; i < segments; i++) {
    let x1 = currentX;
    let y1 = currentY;
    let x2 = x1 + (dx / distance) * pattern[0];
    let y2 = y1 + (dy / distance) * pattern[0];
    line(x1, y1, x2, y2);
    currentX = x2 + (dx / distance) * pattern[1];
    currentY = y2 + (dy / distance) * pattern[1];
    segmentIndex = (segmentIndex + 1) % pattern.length;
  }
}
