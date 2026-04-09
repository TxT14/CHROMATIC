const svg = document.getElementById('nav-ring')

const cx = 250
const cy = 250
const outerR = 245
const innerR = 170

const NUM_TOOLS = 6;
const SETTINGS_ANGLE = 40;
const GAP_ANGLE = 0;
const totalGapAngle = (NUM_TOOLS + 1) * GAP_ANGLE;
const availableAngleForTools = 360 - SETTINGS_ANGLE - totalGapAngle;
const toolAngle = availableAngleForTools / NUM_TOOLS;
const segments = [];
let currentAngle = 90 + (SETTINGS_ANGLE / 2);
for (let i = 0; i < NUM_TOOLS; i++) {
    const startAngle = currentAngle;
    const endAngle = currentAngle + toolAngle;
    segments.push({ start: startAngle, end: endAngle, type: 'tool' });
    currentAngle = endAngle + GAP_ANGLE;
}
const settingsStart = currentAngle;
const settingsEnd = currentAngle + SETTINGS_ANGLE;
segments.push({ start: settingsStart, end: settingsEnd, type: 'settings' });

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function circlePoint(angle, radius) {
  return {
    x: cx + radius * Math.cos(toRad(angle)),
    y: cy + radius * Math.sin(toRad(angle))
  };
}

function makeSegment(startDeg, endDeg, color, index) {
  const p1 = circlePoint(startDeg, outerR);
  const p2 = circlePoint(endDeg, outerR);
  const p3 = circlePoint(endDeg, innerR);
  const p4 = circlePoint(startDeg, innerR);

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', `
    M ${p1.x} ${p1.y}
    A ${outerR} ${outerR} 0 0 1 ${p2.x} ${p2.y}
    L ${p3.x} ${p3.y}
    A ${innerR} ${innerR} 0 0 0 ${p4.x} ${p4.y}
    Z
  `);
  path.setAttribute('fill', color);
  path.setAttribute('stroke', '#2a2a3e');
  path.setAttribute('stroke-width', '1');
  path.setAttribute('id', `segment-${index}`);
  return path;
}

segments.forEach((seg, index) => {
  const color = seg.type === 'settings' ? '#2a2a3e' : '#1a1a2e';
  const path = makeSegment(seg.start, seg.end, color, index);
  svg.appendChild(path);
});

segments.forEach((seg, index) => {
  const segmentElement = document.getElementById(`segment-${index}`);
  segmentElement.addEventListener('click', () => {
    console.log(`Er is geklikt op segment ${index}`);
    const innerCircle = document.getElementById('inner-circle');
    innerCircle.textContent = `Scherm ${index}`;
    innerCircle.style.textAlign = 'center';
    innerCircle.style.lineHeight = '340px';
    innerCircle.style.color = 'white';
  });
});