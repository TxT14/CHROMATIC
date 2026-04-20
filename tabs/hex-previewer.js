/**
 * Corel color picker based on Corel Color Picker by Preet Shihn
 * https://github.com/pshihn/every-color-picker
 * MIT License - Copyright (c) 2020 Preet Shihn
 */

class HexPreviewer {
  constructor(initialColor = '#FF0000') {
    this.currentColor = initialColor;
    this.hue = 0;
    this.saturation = 50;
    this.lightness = 50;
    
    this.isDraggingHue = false;
    this.isDraggingTriangle = false;
    
    this.parseColor(initialColor);
  }

  getHTML() {
    return `
      <div id="hex-previewer">
        <div class="hp-picker-container">
          <canvas id="hp-hue-ring" width="340" height="340"></canvas>
          <div id="hp-triangle-container">
            <canvas id="hp-triangle" width="240" height="240"></canvas>
          </div>
          <div id="hp-hue-cursor" class="hp-cursor"></div>
          <div id="hp-tri-cursor" class="hp-cursor"></div>
        </div>
        <div class="hp-hex-container">
          <div class="hp-hex-input-wrapper">
            <span class="hp-hash">#</span>
            <input type="text" id="hp-hex-input" maxlength="6" value="${this.currentColor.substring(1)}">
          </div>
          <button id="hp-copy-btn" title="Copy to clipboard">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" stroke-width="1.5"/>
              <path d="M3 10V3C3 2.44772 3.44772 2 4 2H10" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  init() {
    this.hueRing = document.getElementById('hp-hue-ring');
    this.triangle = document.getElementById('hp-triangle');
    this.hueCursor = document.getElementById('hp-hue-cursor');
    this.triCursor = document.getElementById('hp-tri-cursor');
    this.hexInput = document.getElementById('hp-hex-input');
    this.copyBtn = document.getElementById('hp-copy-btn');
    
    this.hueCtx = this.hueRing.getContext('2d');
    this.triCtx = this.triangle.getContext('2d');
    
    this.drawHueRing();
    this.drawTriangle();
    this.updateCursors();
    
    this.attachEvents();
  }

  attachEvents() {
    this.hueRing.addEventListener('mousedown', (e) => this.onHueMouseDown(e));
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    document.addEventListener('mouseup', () => this.onMouseUp());
    
    this.triangle.addEventListener('mousedown', (e) => this.onTriangleMouseDown(e));
    
    this.hexInput.addEventListener('input', (e) => this.onHexInput(e));
    this.hexInput.addEventListener('paste', (e) => this.onHexPaste(e));
    this.hexInput.addEventListener('focus', (e) => this.onHexFocus(e));
    this.hexInput.addEventListener('mousedown', () => this.onHexMouseDown());
    
    this.copyBtn.addEventListener('click', () => this.copyToClipboard());
  }

  drawHueRing() {
    const size = 340;
    const center = size / 2;
    const outerRadius = center;
    const innerRadius = outerRadius - 30;
    
    this.hueCtx.clearRect(0, 0, size, size);
    
    this.hueCtx.save();
    
    this.hueCtx.beginPath();
    this.hueCtx.arc(center, center, outerRadius, 0, Math.PI * 2);
    this.hueCtx.closePath();
    
    const gradient = this.hueCtx.createConicGradient(0, center, center);
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(1/6, '#ffff00');
    gradient.addColorStop(2/6, '#00ff00');
    gradient.addColorStop(3/6, '#00ffff');
    gradient.addColorStop(4/6, '#0000ff');
    gradient.addColorStop(5/6, '#ff00ff');
    gradient.addColorStop(1, '#ff0000');
    
    this.hueCtx.fillStyle = gradient;
    this.hueCtx.fill();
    
    this.hueCtx.globalCompositeOperation = 'destination-out';
    this.hueCtx.beginPath();
    this.hueCtx.arc(center, center, innerRadius, 0, Math.PI * 2);
    this.hueCtx.fill();
    this.hueCtx.globalCompositeOperation = 'source-over';
    
    this.hueCtx.restore();
  }

  onHueMouseDown(e) {
    const rect = this.hueRing.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (this.isOnHueRing(x, y, 340)) {
      this.isDraggingHue = true;
      this.updateHueFromPosition(x, y, 340);
    }
  }

  isOnHueRing(x, y, size) {
    const center = size / 2;
    const dx = x - center;
    const dy = y - center;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const outerRadius = center;
    const innerRadius = outerRadius - 30;
    
    return distance >= innerRadius && distance <= outerRadius;
  }

  updateHueFromPosition(x, y, size) {
    const center = size / 2;
    const dx = x - center;
    const dy = y - center;
    
    let angle = Math.atan2(dy, dx) * 180 / Math.PI;
    if (angle < 0) angle += 360;
    
    const oldHue = this.hue;
    const deltaHue = angle - oldHue;
    
    this.hue = angle;
    
    if (this.trianglePos) {
      const triCenter = 240 / 2;
      const dx = this.trianglePos.x - triCenter;
      const dy = this.trianglePos.y - triCenter;
      
      const deltaRad = deltaHue * Math.PI / 180;
      const cos = Math.cos(deltaRad);
      const sin = Math.sin(deltaRad);
      
      const newX = dx * cos - dy * sin + triCenter;
      const newY = dx * sin + dy * cos + triCenter;
      
      this.trianglePos = { x: newX, y: newY };
    }
    
    this.drawTriangle();
    this.updateColor();
    this.updateCursors();
  }

  drawTriangle() {
    const size = 240;
    const center = size / 2;
    const radius = center - 15;
    
    this.triCtx.clearRect(0, 0, size, size);
    
    const baseAngle = (this.hue * Math.PI / 180);
    
    const p1 = { // Color corner
      x: center + radius * Math.cos(baseAngle),
      y: center + radius * Math.sin(baseAngle)
    };
    const p2 = { // White corner
      x: center + radius * Math.cos(baseAngle + (120 * Math.PI / 180)),
      y: center + radius * Math.sin(baseAngle + (120 * Math.PI / 180))
    };
    const p3 = { // Black corner
      x: center + radius * Math.cos(baseAngle + (240 * Math.PI / 180)),
      y: center + radius * Math.sin(baseAngle + (240 * Math.PI / 180))
    };
    
    this.trianglePoints = [p1, p2, p3];
    this.triangleCenter = { x: center, y: center };
    
    const colorGradient = this.triCtx.createLinearGradient(p2.x, p2.y, p1.x, p1.y);
    colorGradient.addColorStop(0, '#ffffff');
    colorGradient.addColorStop(1, this.hslToRgbString(this.hue, 100, 50));
    
    this.triCtx.save();
    this.triCtx.beginPath();
    this.triCtx.moveTo(p1.x, p1.y);
    this.triCtx.lineTo(p2.x, p2.y);
    this.triCtx.lineTo(p3.x, p3.y);
    this.triCtx.closePath();
    this.triCtx.fillStyle = colorGradient;
    this.triCtx.fill();
    this.triCtx.restore();
    
    const blackGradient = this.triCtx.createLinearGradient(p3.x, p3.y, 
      (p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
    blackGradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    blackGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    this.triCtx.save();
    this.triCtx.globalCompositeOperation = 'multiply';
    this.triCtx.beginPath();
    this.triCtx.moveTo(p1.x, p1.y);
    this.triCtx.lineTo(p2.x, p2.y);
    this.triCtx.lineTo(p3.x, p3.y);
    this.triCtx.closePath();
    this.triCtx.fillStyle = blackGradient;
    this.triCtx.fill();
    this.triCtx.restore();
    
    this.triCtx.globalCompositeOperation = 'source-over';
  }

  onTriangleMouseDown(e) {
    const rect = this.triangle.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (this.isInTriangle(x, y)) {
      this.isDraggingTriangle = true;
      this.updateColorFromTriangle(x, y);
    }
  }

  isInTriangle(x, y) {
    if (!this.trianglePoints) return false;
    
    const [p1, p2, p3] = this.trianglePoints;
    
    const d1 = this.sign(x, y, p1.x, p1.y, p2.x, p2.y);
    const d2 = this.sign(x, y, p2.x, p2.y, p3.x, p3.y);
    const d3 = this.sign(x, y, p3.x, p3.y, p1.x, p1.y);
    
    const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
    
    return !(hasNeg && hasPos);
  }

  sign(x1, y1, x2, y2, x3, y3) {
    return (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3);
  }

  updateColorFromTriangle(x, y) {
    const pixelData = this.triCtx.getImageData(x, y, 1, 1).data;
    const r = pixelData[0];
    const g = pixelData[1];
    const b = pixelData[2];
    
    const hsl = this.rgbToHsl(r, g, b);
    
    this.saturation = hsl.s;
    this.lightness = hsl.l;
    
    this.trianglePos = { x, y };
    
    this.updateColor();
    this.updateCursors();
  }

  onMouseMove(e) {
    if (this.isDraggingHue) {
      const rect = this.hueRing.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.updateHueFromPosition(x, y, 280);
    }
    
    if (this.isDraggingTriangle) {
      const rect = this.triangle.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (this.isInTriangle(x, y)) {
        this.updateColorFromTriangle(x, y);
      }
    }
  }

  onMouseUp() {
    this.isDraggingHue = false;
    this.isDraggingTriangle = false;
  }

  updateColor() {
    const rgb = this.hslToRgb(this.hue, this.saturation, this.lightness);
    const hex = this.rgbToHex(rgb.r, rgb.g, rgb.b);
    
    this.currentColor = hex;
    
    if (this.hexInput) {
      this.hexInput.value = hex.substring(1);
    }
    
    if (typeof window.updateColorDisplay === 'function') {
      window.updateColorDisplay(hex);
    }
  }

  onHexInput(e) {
    const cursorPos = e.target.selectionStart;
    let value = e.target.value.toUpperCase();
    
    value = value.replace(/#/g, '');
    
    value = value.replace(/[^0-9A-F]/g, '');
    
    value = value.substring(0, 6);
    
    e.target.value = value;
    
    e.target.setSelectionRange(cursorPos, cursorPos);
    
    if (value.length === 6) {
      const hex = '#' + value;
      this.parseColor(hex);
      this.drawTriangle();
      this.updateCursors();
      
      if (typeof window.updateColorDisplay === 'function') {
        window.updateColorDisplay(hex);
      }
    }
  }

  onHexPaste(e) {
    e.preventDefault();
    
    let paste = (e.clipboardData || window.clipboardData).getData('text');
    
    paste = paste.replace(/#/g, '').toUpperCase().replace(/[^0-9A-F]/g, '');
    
    paste = paste.substring(0, 6);
    
    this.hexInput.value = paste;
    
    if (paste.length === 6) {
      const hex = '#' + paste;
      this.parseColor(hex);
      this.drawTriangle();
      this.updateCursors();
      
      if (typeof window.updateColorDisplay === 'function') {
        window.updateColorDisplay(hex);
      }
    }
  }

  onHexFocus(e) {
    if (e.target === document.activeElement && !this.clickedToFocus) {
      e.target.select();
    }
    this.clickedToFocus = false;
  }

  onHexMouseDown() {
    this.clickedToFocus = true;
  }

  async copyToClipboard() {
    try {
      await navigator.clipboard.writeText(this.currentColor);
      
      const btn = this.copyBtn;
      const originalHTML = btn.innerHTML;
      btn.innerHTML = '✓';
      btn.style.color = '#4ade80';
      
      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.style.color = '';
      }, 1000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  updateCursors() {
    const hueSize = 340;
    const hueCenter = hueSize / 2;
    const hueRadius = hueCenter - 15;
    const hueAngle = this.hue * Math.PI / 180;
    
    const hueX = hueCenter + hueRadius * Math.cos(hueAngle);
    const hueY = hueCenter + hueRadius * Math.sin(hueAngle);
    
    this.hueCursor.style.left = `${hueX}px`;
    this.hueCursor.style.top = `${hueY}px`;
    
    if (this.trianglePos) {
      this.triCursor.style.left = `${this.trianglePos.x}px`;
      this.triCursor.style.top = `${this.trianglePos.y}px`;
    } else {
      const triSize = 240;
      const triCenter = triSize / 2;
      this.triCursor.style.left = `${triCenter}px`;
      this.triCursor.style.top = `${triCenter}px`;
    }
  }

  parseColor(hex) {
    const rgb = this.hexToRgb(hex);
    if (rgb) {
      const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
      this.hue = hsl.h;
      this.saturation = hsl.s;
      this.lightness = hsl.l;
      this.currentColor = hex;
    }
  }

  hslToRgb(h, s, l) {
    h = h % 360;
    s = s / 100;
    l = l / 100;
    
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    
    let r = 0, g = 0, b = 0;
    
    if (h < 60) {
      [r, g, b] = [c, x, 0];
    } else if (h < 120) {
      [r, g, b] = [x, c, 0];
    } else if (h < 180) {
      [r, g, b] = [0, c, x];
    } else if (h < 240) {
      [r, g, b] = [0, x, c];
    } else if (h < 300) {
      [r, g, b] = [x, 0, c];
    } else {
      [r, g, b] = [c, 0, x];
    }
    
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  }

  hslToRgbString(h, s, l) {
    const rgb = this.hslToRgb(h, s, l);
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  }

  rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    
    if (delta !== 0) {
      s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
      
      if (max === r) {
        h = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
      } else if (max === g) {
        h = ((b - r) / delta + 2) * 60;
      } else {
        h = ((r - g) / delta + 4) * 60;
      }
    }
    
    return {
      h: Math.round(h),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  rgbToHex(r, g, b) {
    return '#' + [r, g, b]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  destroy() {
    this.isDraggingHue = false;
    this.isDraggingTriangle = false;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = HexPreviewer;
}