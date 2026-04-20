const HexPreviewer = require('./tabs/hex-previewer.js');

const TABS = [
  {id: 'hex',       name: 'Hex previewer',      color: '#E8A87C',   icon: '-' },
  {id: 'library',   name: 'Color library',      color: '#85C1E9',   icon: '-' },
  {id: 'pipet',     name: 'Pipet tool',         color: '#82E0AA',   icon: '-' },
  {id: 'tint',      name: 'Tint generator',     color: '#F1948A',   icon: '-' },
  {id: 'harmony',   name: 'Kleur harmony',      color: '#BB8FCE',   icon: '-' },
  {id: 'gradient',  name: 'Gradient builder',   color: '#F7DC6F',   icon: '-' },
]

const SETTINGS = { id: 'settings', name: 'Settings', color: '#A0A8C0', icon: '-' }
const DISPLAY = { id: 'display', name: '', color: '#FF0000', icon: '-' }

let activeIndex = 0
let currentTab = null
let tabCache = {}

const ring = document.getElementById('ring')

const cx = 250
const cy = 250
const outerR = 245
const innerR = 170

const NUM_TABS = TABS.length;
const SETTINGS_ANGLE = 40;
const DISPLAY_ANGLE = 40;
const GAP_ANGLE = 0;
const availableAngleForTabs = 360 - SETTINGS_ANGLE - DISPLAY_ANGLE;
const tabAngle = availableAngleForTabs / NUM_TABS;
const segments = [];

let currentAngle = 270 - (DISPLAY_ANGLE / 2);

const colorDisplayStart = currentAngle;
const colorDisplayEnd = currentAngle + DISPLAY_ANGLE;
segments.push({ start: colorDisplayStart, end: colorDisplayEnd, type: 'display' });
currentAngle = colorDisplayEnd;

for (let i = 0; i < 3; i++) {
    const startAngle = currentAngle;
    const endAngle = currentAngle + tabAngle;
    segments.push({ start: startAngle, end: endAngle, type: 'tab', index: i });
    currentAngle = endAngle;
}

const settingsStart = currentAngle;
const settingsEnd = currentAngle + SETTINGS_ANGLE;
segments.push({ start: settingsStart, end: settingsEnd, type: 'settings' });
currentAngle = settingsEnd;

for (let i = 3; i < 6; i++) {
    const startAngle = currentAngle;
    const endAngle = currentAngle + tabAngle;
    segments.push({ start: startAngle, end: endAngle, type: 'tab', index: i });
    currentAngle = endAngle;
}

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
    let resetColor = '#1a1a2e'
    if (s.type === 'settings') resetColor = '#2a2a3e'
    if (s.type === 'display') resetColor = DISPLAY.color
    el.setAttribute('fill', resetColor)
  })
  const activeColor = seg.type === 'settings' ? '#0ff507' : '#8d92e4'
  const segmentEl = document.getElementById(`segment-${index}`)
  segmentEl.setAttribute('fill', activeColor)
}

function updateContent(index) {
  const seg = segments[index]
  const content = document.getElementById('content')
  
  if (currentTab && currentTab.destroy) {
    currentTab.destroy()
    currentTab = null
  }
  
  if (seg.type === 'settings') {
    content.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 20px;">${SETTINGS.name}</div>`
    content.style.backgroundColor = SETTINGS.color
  } else if (seg.type === 'display') {
    return
  } else if (seg.type === 'tab') {
    const tabData = TABS[seg.index]
    if (tabData.id === 'hex') {
      if (!tabCache['hex']) {
        tabCache['hex'] = new HexPreviewer(DISPLAY.color)
        currentTab = tabCache['hex']
        content.innerHTML = currentTab.getHTML()
        content.style.backgroundColor = '#1a1a2e'
        setTimeout(() => currentTab.init(), 0)
      } else {
        currentTab = tabCache['hex']
        content.innerHTML = currentTab.getHTML()
        content.style.backgroundColor = '#1a1a2e'
        setTimeout(() => currentTab.init(), 0)
      }
    } else {
      content.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 20px;">${tabData.name}</div>`
      content.style.backgroundColor = tabData.color
    }
  }
}

function activateTab(index) {
  updateRing(index)
  updateContent(index)
  activeIndex = index
}

segments.forEach((seg, index) => {
  let color = '#1a1a2e';
  if (seg.type === 'settings') color = '#2a2a3e';
  if (seg.type === 'display') color = DISPLAY.color;
  const path = makeSegment(seg.start, seg.end, color, index);
  ring.appendChild(path);
});

segments.forEach((seg, index) => {
  const segmentEl = document.getElementById(`segment-${index}`);
  segmentEl.addEventListener('click', () => {
    if (seg.type !== 'display') {
      activateTab(index)
    }
  });
});

window.addEventListener('wheel', (e) => {
  if (e.ctrlKey && Math.abs(e.deltaY) > 0) {
    e.preventDefault();
    let newIndex = activeIndex
    if (e.deltaY > 0) {
      do {
        newIndex = (newIndex + 1) % segments.length
      } while (segments[newIndex].type === 'display')
    } else {
      do {
        newIndex = (newIndex - 1 + segments.length) % segments.length
      } while (segments[newIndex].type === 'display')
    }
    activeIndex = newIndex
    updateRing(activeIndex)
    updateContent(activeIndex)
  }
});

function updateColorDisplay(color) {
  DISPLAY.color = color
  segments.forEach((seg, i) => {
    if (seg.type === 'display') {
      const el = document.getElementById(`segment-${i}`)
      el.setAttribute('fill', color)
    }
  })
}

window.updateColorDisplay = updateColorDisplay;