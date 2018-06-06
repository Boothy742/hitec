let radius = 198;
let originX = 200;
let originY = 200;
let spinningReels = false;
let probabilities = [0,0,0];
let colours = ["darkorange", "green", "darkblue"];
let segNames = ["WIN", "WIN!", "BONUS", "LOSE"];

/** @type {string} */
let spinResult = null;

let images = [  
    "Images/s0_PIP.png",
    "Images/s1_CHERRY.png",
    "Images/s2_MELON.png",
    "Images/s3_BELL.png",
    "Images/s4_SEVEN.png" 
];

let SymEnum = { PIP: 0, CHERRY: 1, MELON: 2, BELL: 3, SEVEN: 4};
Object.freeze(SymEnum);

let turboReels = document.getElementById("turboReels");
let turboWheel = document.getElementById("turboWheel");
//let fastPlayPrizeIndex = 0;
let winFruit = SymEnum.PIP; // lose
let startWinFruit = SymEnum.PIP;

let reelPool = [SymEnum.PIP, SymEnum.CHERRY, SymEnum.MELON, SymEnum.BELL, SymEnum.SEVEN];
let prizes = [100,200,500,1000,2000,5000,10000];
let RTP_Base = 0; 
let stake = 100;
let winFruitChance = [6,3,2,1];
let totalWinFruitChances = 0;
let cycle = 10000;
let winChances = 0; // used generate wins
function calcWinChances(rtp_base = RTP_Base) {
  RTP_Base = rtp_base;
  let avgPrize = 0;
  if (singleFruit === null) {
    let PiXi = 0;
    let chances = 0;
    for (let i = 0; i < winFruitChance.length; ++i) {
      PiXi += winFruitChance[i]*prizes[i];
      chances += winFruitChance[i];
    }
    avgPrize = PiXi/chances;
    totalWinFruitChances = chances;
  }
  else
    avgPrize = prizes[singleFruit-1];

  winChances = stake * RTP_Base * cycle / avgPrize;
  let winPerc = Math.round(100*winChances / cycle);
  console.log("Winning chance: " + winPerc.toString() + "%");
}

let playButton = document.getElementById("playButton");
playButton.onclick = spinReels;

let spinButton = document.getElementById("spinButton");
spinButton.onclick = spinWheel;
let creditButton = document.getElementById("creditButton");
creditButton.onclick = function() { addCredit(10000); };
let creditValue = document.getElementById("creditValue");
let creditValueStore = 0;
function addCredit(add) {
  creditValueStore += add;
  creditValue.innerText = (creditValueStore/100).toFixed(2);
}

let spinResultText = document.getElementById("spinResult");

let prizeDivs = [];
let collectButtons = [];
let prizeContainer = document.getElementById("prizes-container");
let arrowsContainer = document.getElementById("arrows-container");
for (let p = prizes.length-1; p >= 0; --p) {
    let node = document.createElement("span"); 
    node.className = "row2 game-data";      
    let img = document.createElement("img");       
    if (p+1 <= SymEnum.SEVEN) {
        img.src = images[p+1];
        node.onclick = function() {
          if (singleFruit == p+1) {
            singleFruit = null;
            node.style.border = "solid 5px black";
          }
          else if (singleFruit === null) {
            singleFruit = p+1;            
            node.style.border = "solid 5px red";
          }
          calcWinChances();
        };
    }
    else {
        img.src = images[SymEnum.PIP];
        img.style.opacity = 0.02;
    }
    node.appendChild(img);   
    let text = "£"+(prizes[p]/100).toFixed(2);
    let textnode = document.createTextNode(text);
    node.appendChild(textnode);
    prizeContainer.appendChild(node);
    prizeDivs.push(node);

    let node2 = document.createElement("span"); 
    node2.className = "row2 game-data2";
    img = document.createElement("img");
    img.src = "Images/ARROW.png";
    node2.style.opacity = 0;
    node2.appendChild(document.createTextNode("COLLECT"));
    node2.appendChild(img);
    node2.onclick = function() { if (node2.style.opacity > 0.01) collect(); };
    arrowsContainer.appendChild(node2);
    collectButtons.unshift(node2);
}

function randomiseProbabilities_temp() {
    let r0 = Math.random();
    let r1 = Math.random();
    let p0 = Math.min(r0,r1);
    let p1 = Math.max(r0,r1) - p0;
    probabilities = [p0,p1,1-p0-p1];
}

// Pie chart
let chart = document.getElementById("pie-chart");
let context = chart.getContext("2d");
let syms = [];
for (let i = 0; i < 9; ++i)
    syms.push(document.getElementById("sym"+i.toString()));

function drawOuterCircle() {
  context.beginPath();
  context.lineWidth = 4;
  context.arc(originX, originY, radius, 0, 2 * Math.PI);
  context.stroke();
}

function drawSector(startAngle, endAngle, colour) {
  // Convert to radians
  var startRadians = (startAngle - 90) / (180 / Math.PI);
  var endRadians = (endAngle - 90) / (180 / Math.PI);
  context.beginPath();
  context.arc(originX, originY, radius, startRadians, endRadians)
  context.lineTo(originX, originY);
  context.fillStyle = colour;
  context.fill();
}

function drawText(startAngle, endAngle, text) {
  var startRadians = (startAngle - 90) / (180 / Math.PI);
  var endRadians = (endAngle - 90) / (180 / Math.PI);
  context.fillStyle = "white";
  context.font = '32px arial';
  let avgRads = (startRadians+endRadians)/2;
  let offset = context.measureText(text).width/2;
  context.fillText(text, originX - offset + radius*Math.cos(avgRads)*0.6, originY + radius*Math.sin(avgRads)*0.6,radius/2);
}

function updatePie() {
  // Angle drawing
  let angle = 0.0;
  for (let p = 0; p < probabilities.length; p++) {
    let angleAddition = probabilities[p] * 360;
    drawSector(angle, angle + angleAddition, colours[p]);
    angle += angleAddition;
  }

  angle = 0.0;
  for (let p = 0; p < probabilities.length; p++) {
    let angleAddition = probabilities[p] * 360;
    if (angleAddition > 1)
        drawText(angle, angle + angleAddition, segNames[p]);
    angle += angleAddition;
  }
}

var pieSegs = 0;
var spinN = 0;
var finalAngle = 0;
var spinDuration = 1200;
var t0 = 0;

function isSpinningWheel() {
  return !winFruit || winFruit == SymEnum.PIP || spinResultText.innerText.length > 1; // != invisibleChar // spinning or showing result  
}
let invisibleChar = "\u200C";
function spinWheel() {
  if (winFruit == prizes.length || isSpinningWheel())
    return;
  spinResultText.innerText = "...";
  let rand = Math.random();
  let q = 0;
  for (let p in probabilities) {
    q += probabilities[p];
    if (q + rand > 1) {
      console.log("Colour: " + colours[p]);
      spinResult = segNames[p];
      break;
    }
  }
  spinN = Math.floor(rand * 100);
  finalAngle = 1080 + (2*spinN+1)*180/100;

  if (turboWheel.checked)
    showWheelResult(0);
  else {
    t0 = Date.now();
    animate();
  }
}

function animate() {
  var t = Date.now() - t0;
  var a = 0;

  if (t <= spinDuration / 2) {
    a = finalAngle / 2 * Math.pow(2 * t / spinDuration, 2);
  }
  else if (t <= spinDuration) {
    t = spinDuration - t;
    a = finalAngle - (finalAngle / 2 * Math.pow(2 * t / spinDuration, 2));
  }
  else {
    showWheelResult(800);
    return;
  }

  setAngle(a);
  setTimeout(animate, 16);
}

function showWheelResult(time) {
  setAngle(finalAngle);
  spinResultText.innerText = spinResult;
  if (time > 0)
    setTimeout(resolveWheelOutcome, time);
  else
    resolveWheelOutcome();
}

function resolveWheelOutcome() {
  spinResultText.innerText = invisibleChar;
  if (spinResult == "WIN" || spinResult == "WIN!") {        
    winFruit++;
    for (let c of collectButtons) {
      c.style.opacity = 0;
    } 
    collectButtons[winFruit-1].style.opacity = 1;
    populateWheel();
    if (winFruit == prizes.length)
      spinButton.style.border = "solid 5px black";
  }
  else if (spinResult == "BONUS") {
    spinWheel();
  }
  else { // LOSE 
    closeWheel();
  }
}

function clearPie() {
  setAngle(0);
  context.clearRect(0, 0, chart.width, chart.height);
  drawOuterCircle();
}

var contextAngle = 0;
function setAngle(angle) {
  context.translate(chart.width / 2, chart.height / 2);
  context.rotate((angle - contextAngle) * Math.PI / 180);
  context.translate(-chart.width / 2, -chart.height / 2);
  contextAngle = angle;
  updatePie();
}

let singleFruit = null;
function populateReels() {
  console.log(spinningReels.toString());
  for (let i = 0; i < 9; ++i) {
    if (Math.random() > (singleFruit !== null ? 0.35:0.55)) {    // 35% chance if only single
      syms[i].src = images[SymEnum.PIP];
    }
    else if (singleFruit !== null) {
      syms[i].src = images[singleFruit];
    }
    else {
      syms[i].src = images[Math.ceil(Math.random()*(SymEnum.SEVEN))];  // returns 1 to 4 = cherry to seven.
    }    
    
  }
}

function finaliseReels() {
  spinningReels = false;
  populateReels();

  if (Math.random()*cycle <= winChances) {
    winFruit = singleFruit;
    if (winFruit === null) {
      let pick = Math.random()*totalWinFruitChances;
      let running = 0;
      for (let i = 0; i < winFruitChance.length; ++i) {
        running += winFruitChance[i];
        if (pick < running) {
          winFruit = i+1;
          break;
        }
      }
      if (winFruit === null)
        alert("Prob error");
    }
    for (let i = 1; i < 9; i+=3) 
      syms[i].src = images[winFruit];
    
    for (let c of collectButtons) {
        c.style.opacity = 0;
    }
    collectButtons[winFruit-1].style.opacity = 1;
    startWinFruit = winFruit;
    populateWheel();      
    spinButton.style.border = "solid 5px green";
    playButton.style.border = "solid 5px black";
  }
  else {
    syms[4].src = images[SymEnum.PIP];
  }
}

function spinReels() {
  if (!spinningReels && creditValueStore >= stake && (winFruit === null || winFruit === SymEnum.PIP)) {
    spinningReels = true;
    addCredit(-stake);
    if (turboReels.checked)
      finaliseReels();
    else
    {
      populateReels();
      setTimeout(populateReels, 100);
      setTimeout(populateReels, 200);
      setTimeout(populateReels, 300);
      setTimeout(finaliseReels, 400);
    }
  }
}

function collect() {
  if (isSpinningWheel())
    return;
  addCredit(prizes[winFruit-1]);
  closeWheel();
}

function closeWheel() {
  collectButtons[winFruit-1].style.opacity = 0;
  winFruit = SymEnum.PIP;
  clearPie();
  
  spinButton.style.border = "solid 5px black";
  playButton.style.border = "solid 5px green";
}

let probTable = [ [0.600,0.500,0.550,0.550,0.420,0.520],
                  [    0,0.530,0.550,0.550,0.450,0.550],
                  [    0,    0,0.600,0.600,0.500,0.552],
                  [    0,    0,    0,0.650,0.550,0.556]];

let probTableForce = [  [0.999,0.999,0.999,0.999,0.999,0.999],
                        [    0,0.999,0.999,0.999,0.999,0.999],
                        [    0,    0,0.999,0.999,0.999,0.999],
                        [    0,    0,    0,0.999,0.999,0.999]];

function populateWheel() {
  let p = probTable[startWinFruit-1][winFruit-1];
  let trueOdds = prizes[winFruit-1]/prizes[winFruit];
  probabilities = [trueOdds,p-trueOdds,0,1-p];
  setAngle(0);
}

drawOuterCircle();
populateReels(); // e.g. singleFruit: SymEnum.SEVEN
calcWinChances(0.4); // 40% from base game. option to change to 72%
addCredit(10000);