const fs = require('fs')
const zlib = require('zlib')
const path = require('path')

function createIconPNG(size) {
  const scale = size / 192
  const pixels = new Uint8Array(size * size * 3)

  // Background #0f172a
  for (let i = 0; i < pixels.length; i += 3) {
    pixels[i] = 15; pixels[i + 1] = 23; pixels[i + 2] = 42
  }

  // Rounded corners (radius 40)
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
        pixels[idx] = 0; pixels[idx+1] = 0; pixels[idx+2] = 0
      }
    }
  }

  function setPixel(x, y, r, g, b) {
    x = Math.round(x); y = Math.round(y)
    if (x < 0 || x >= size || y < 0 || y >= size) return
    const i = (y * size + x) * 3
    pixels[i] = r; pixels[i+1] = g; pixels[i+2] = b
  }

  // Fill a polygon using scan-line algorithm
  // pts: array of {x, y} already scaled
  function fillPolygon(pts, r, g, b) {
    const n = pts.length
    let minY = Infinity, maxY = -Infinity
    for (const p of pts) { minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y) }
    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      const intersections = []
      for (let i = 0; i < n; i++) {
        const a = pts[i], b2 = pts[(i+1) % n]
        if ((a.y <= y && b2.y > y) || (b2.y <= y && a.y > y)) {
          const x = a.x + (y - a.y) * (b2.x - a.x) / (b2.y - a.y)
          intersections.push(x)
        }
      }
      intersections.sort((a, b2) => a - b2)
      for (let i = 0; i < intersections.length - 1; i += 2) {
        for (let x = Math.floor(intersections[i]); x <= Math.ceil(intersections[i+1]); x++) {
          setPixel(x, y, r, g, b)
        }
      }
    }
  }

  // Lightning bolt — 8 point polygon (designed for 192x192, then scaled)
  // Classic bolt shape: two offset parallelograms sharing a step at middle
  const s = scale
  const bolt = [
    { x: 82*s,  y: 18*s  },  // top left
    { x: 138*s, y: 18*s  },  // top right
    { x: 115*s, y: 98*s  },  // upper-right → step
    { x: 145*s, y: 98*s  },  // step right notch
    { x: 110*s, y: 174*s },  // bottom right
    { x: 52*s,  y: 174*s },  // bottom left
    { x: 78*s,  y: 98*s  },  // step left notch
    { x: 48*s,  y: 98*s  },  // upper-left → step
  ]

  // Fill with indigo #818cf8
  fillPolygon(bolt, 129, 140, 248)

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
fs.writeFileSync(path.join(outDir, 'icon-192.png'), createIconPNG(192))
fs.writeFileSync(path.join(outDir, 'icon-512.png'), createIconPNG(512))
console.log('Icons generated.')
