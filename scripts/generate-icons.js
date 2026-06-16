const fs = require('fs')
const zlib = require('zlib')
const path = require('path')

function createRunnerPNG(size) {
  const scale = size / 192
  const pixels = new Uint8Array(size * size * 3)

  // Background #1e293b
  for (let i = 0; i < pixels.length; i += 3) {
    pixels[i] = 30; pixels[i + 1] = 41; pixels[i + 2] = 59
  }

  // Rounded corners — clear to #0f172a
  const cr = Math.round(40 * scale)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let outside = false
      if (x < cr && y < cr && (cr-x)**2+(cr-y)**2 > cr**2) outside = true
      if (x >= size-cr && y < cr && (x-(size-cr))**2+(cr-y)**2 > cr**2) outside = true
      if (x < cr && y >= size-cr && (cr-x)**2+(y-(size-cr))**2 > cr**2) outside = true
      if (x >= size-cr && y >= size-cr && (x-(size-cr))**2+(y-(size-cr))**2 > cr**2) outside = true
      if (outside) {
        const idx = (y * size + x) * 3
        pixels[idx] = 15; pixels[idx+1] = 23; pixels[idx+2] = 42
      }
    }
  }

  function setPixel(x, y, r, g, b) {
    x = Math.round(x); y = Math.round(y)
    if (x < 0 || x >= size || y < 0 || y >= size) return
    const i = (y * size + x) * 3
    pixels[i] = r; pixels[i+1] = g; pixels[i+2] = b
  }

  function circle(cx, cy, rad, r, g, b) {
    cx *= scale; cy *= scale; rad *= scale
    for (let dy = -Math.ceil(rad); dy <= Math.ceil(rad); dy++) {
      for (let dx = -Math.ceil(rad); dx <= Math.ceil(rad); dx++) {
        if (dx*dx + dy*dy <= rad*rad) setPixel(cx+dx, cy+dy, r, g, b)
      }
    }
  }

  function thickLine(x0, y0, x1, y1, t, r, g, b) {
    x0 *= scale; y0 *= scale; x1 *= scale; y1 *= scale; t *= scale
    const dx = x1-x0, dy = y1-y0
    const len = Math.hypot(dx, dy)
    if (!len) return
    const steps = Math.ceil(len * 2)
    const half = t / 2
    for (let i = 0; i <= steps; i++) {
      const px = x0 + dx * i / steps
      const py = y0 + dy * i / steps
      for (let qy = -Math.ceil(half); qy <= Math.ceil(half); qy++) {
        for (let qx = -Math.ceil(half); qx <= Math.ceil(half); qx++) {
          if (qx*qx + qy*qy <= half*half) setPixel(px+qx, py+qy, r, g, b)
        }
      }
    }
  }

  const W = [241, 245, 249]  // #f1f5f9 - figure
  const A = [129, 140, 248]  // #818cf8 - indigo accent

  // Indigo accent circle ring
  const ringR = 82, cx = 96, cy = 96
  for (let angle = 0; angle < 360; angle += 0.5) {
    const rad = angle * Math.PI / 180
    const rx = cx + ringR * Math.cos(rad)
    const ry = cy + ringR * Math.sin(rad)
    for (let dr = -1.5; dr <= 1.5; dr += 0.5) {
      const rx2 = cx + (ringR+dr) * Math.cos(rad)
      const ry2 = cy + (ringR+dr) * Math.sin(rad)
      setPixel(rx2 * scale, ry2 * scale, A[0], A[1], A[2])
    }
  }

  // Running figure (designed for 192x192 viewport)
  circle(118, 44, 14, ...W)          // head
  thickLine(115, 58, 96, 102, 8, ...W)  // body (leaning)
  thickLine(108, 73, 140, 56, 6, ...W)  // right arm forward
  thickLine(104, 71, 78, 92, 6, ...W)   // left arm back
  thickLine(96, 102, 114, 138, 8, ...W) // right leg upper
  thickLine(114, 138, 98, 162, 8, ...W) // right leg lower (back)
  thickLine(96, 102, 68, 128, 8, ...W)  // left leg upper
  thickLine(68, 128, 84, 154, 8, ...W)  // left leg lower (forward)

  return toPNG(pixels, size)
}

function toPNG(pixels, size) {
  const sig = Buffer.from([137,80,78,71,13,10,26,10])

  function crc32(buf) {
    const table = []
    for (let i = 0; i < 256; i++) {
      let c = i
      for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
      table[i] = c
    }
    let crc = 0xFFFFFFFF
    for (const byte of buf) crc = table[(crc ^ byte) & 0xFF] ^ (crc >>> 8)
    return (crc ^ 0xFFFFFFFF) >>> 0
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
    const typeB = Buffer.from(type)
    const crcBuf = Buffer.alloc(4)
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeB, data])))
    return Buffer.concat([len, typeB, data, crcBuf])
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2

  const rows = []
  for (let y = 0; y < size; y++) {
    rows.push(Buffer.from([0, ...pixels.slice(y * size * 3, (y+1) * size * 3)]))
  }
  const compressed = zlib.deflateSync(Buffer.concat(rows))

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))])
}

const outDir = path.join(__dirname, '..', 'public', 'icons')
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'icon-192.png'), createRunnerPNG(192))
fs.writeFileSync(path.join(outDir, 'icon-512.png'), createRunnerPNG(512))
console.log('Icons generated.')
