const TABS = [
  {id: 'hex',       name: 'Hex previewer',      color: '#E8A87C',   icon: '-' },
  {id: 'library',   name: 'Color library',      color: '#85C1E9',   icon: '-' },
  {id: 'pipet',     name: 'Pipet tool',         color: '#82E0AA',   icon: '-' },
  {id: 'tint',      name: 'Tint generator',     color: '#F1948A',   icon: '-' },
  {id: 'harmony',   name: 'Kleur harmony',      color: '#BB8FCE',   icon: '-' },
  {id: 'gradient',  name: 'Gradient builder',   color: '#F7DC6F',   icon: '-' },
]

const SETTINGS = { id: 'settings', name: 'Settings', color: '#A0A8C0', icon: '-' }

let activeIndex = 0

const ring = document.getElementById('ring')

const cx = 250
const cy = 250
const outerR = 245
const innerR = 170

const NUM_TABS = TABS.length;
const SETTINGS_ANGLE = 40;
const GAP_ANGLE = 0;
const totalGapAngle = (NUM_TABS + 1) * GAP_ANGLE;
const availableAngleForTabs = 360 - SETTINGS_ANGLE - totalGapAngle;
const tabAngle = availableAngleForTabs / NUM_TABS;
const segments = [];
let currentAngle = 90 + (SETTINGS_ANGLE / 2);
for (let i = 0; i < NUM_TABS; i++) {
    const startAngle = currentAngle;
    const endAngle = currentAngle + tabAngle;
    segments.push({ start: startAngle, end: endAngle, type: 'tab' });
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

function updateRing(index) {
  const seg = segments[index]
  segments.forEach((s, i) => {
    const el = document.getElementById(`segment-${i}`)
    const resetColor = s.type === 'settings' ? '#2a2a3e' : '#1a1a2e'
    el.setAttribute('fill', resetColor)
  })
  const activeColor = seg.type === 'settings' ? '#0ff507' : '#8d92e4'
  const segmentEl = document.getElementById(`segment-${index}`)
  segmentEl.setAttribute('fill', activeColor)
}

function updateContent(index) {
  const seg = segments[index]
  const content = document.getElementById('content')
  const tab = seg.type === 'settings' ? SETTINGS : TABS[index]
  content.textContent = tab.name
  content.style.backgroundColor = tab.color
}

function activateTab(index) {
  updateRing(index)
  updateContent(index)
  activeIndex = index
}

segments.forEach((seg, index) => {
  const color = seg.type === 'settings' ? '#2a2a3e' : '#1a1a2e';
  const path = makeSegment(seg.start, seg.end, color, index);
  ring.appendChild(path);
});

segments.forEach((seg, index) => {
  const segmentEl = document.getElementById(`segment-${index}`);
  segmentEl.addEventListener('click', () => {
    activateTab(index)
  });
});

window.addEventListener('wheel', (e) => {
  if (e.ctrlKey) {
    if (e.deltaY > 0) {
      activeIndex = (activeIndex + 1) % segments.length
    } else {
      activeIndex = (activeIndex - 1 + segments.length) % segments.length
    }
    updateRing(activeIndex)
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'Control') {
    updateContent(activeIndex)
  }
});