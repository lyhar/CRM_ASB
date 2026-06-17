// Generates the CRM Trajectoire copper/dark app icon for Electron.
// Usage: node scripts/generate-icon.js
const { existsSync, mkdirSync, writeFileSync } = require('fs')
const { execSync } = require('child_process')

if (!existsSync('node_modules/jimp')) {
  console.log('Installing jimp and png-to-ico...')
  execSync('npm install --save-dev jimp png-to-ico', { stdio: 'inherit' })
}

const Jimp = require('jimp')
const pngToIcoMod = require('png-to-ico')
const pngToIco = pngToIcoMod.default || pngToIcoMod

const rgba = (r, g, b, a = 255) => Jimp.rgbaToInt(r, g, b, a)

const lerp = (a, b, t) => Math.round(a + (b - a) * t)
const mix = (from, to, t) => [
  lerp(from[0], to[0], t),
  lerp(from[1], to[1], t),
  lerp(from[2], to[2], t),
]

function insideRoundedRect(x, y, w, h, r) {
  const cx = x < r ? r : x >= w - r ? w - r - 1 : x
  const cy = y < r ? r : y >= h - r ? h - r - 1 : y
  const dx = x - cx
  const dy = y - cy
  return dx * dx + dy * dy <= r * r
}

function fillRoundedGradient(img, x0, y0, w, h, r, c1, c2) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const lx = x - x0
      const ly = y - y0
      if (!insideRoundedRect(lx, ly, w, h, r)) continue
      const t = Math.min(1, Math.max(0, (lx + ly) / (w + h)))
      const [rr, gg, bb] = mix(c1, c2, t)
      img.setPixelColor(rgba(rr, gg, bb), x, y)
    }
  }
}

function strokeRoundedRect(img, x0, y0, w, h, r, thickness, color) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const lx = x - x0
      const ly = y - y0
      const outer = insideRoundedRect(lx, ly, w, h, r)
      const inner = insideRoundedRect(lx - thickness, ly - thickness, w - thickness * 2, h - thickness * 2, Math.max(0, r - thickness))
      if (outer && !inner) img.setPixelColor(color, x, y)
    }
  }
}

function fillRoundedRect(img, x0, y0, w, h, r, color) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      if (insideRoundedRect(x - x0, y - y0, w, h, r)) img.setPixelColor(color, x, y)
    }
  }
}

function fillGradientRoundedRect(img, x0, y0, w, h, r, c1, c2) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      if (!insideRoundedRect(x - x0, y - y0, w, h, r)) continue
      const t = Math.min(1, Math.max(0, ((x - x0) + (y - y0)) / (w + h)))
      const [rr, gg, bb] = mix(c1, c2, t)
      img.setPixelColor(rgba(rr, gg, bb), x, y)
    }
  }
}

function drawLine(img, x1, y1, x2, y2, width, color) {
  const minX = Math.floor(Math.min(x1, x2) - width)
  const maxX = Math.ceil(Math.max(x1, x2) + width)
  const minY = Math.floor(Math.min(y1, y2) - width)
  const maxY = Math.ceil(Math.max(y1, y2) + width)
  const dx = x2 - x1
  const dy = y2 - y1
  const lenSq = dx * dx + dy * dy
  const radius = width / 2

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lenSq))
      const px = x1 + t * dx
      const py = y1 + t * dy
      const dist = Math.hypot(x - px, y - py)
      if (dist <= radius && x >= 0 && y >= 0 && x < img.bitmap.width && y < img.bitmap.height) {
        img.setPixelColor(color, x, y)
      }
    }
  }
}

async function main() {
  const SIZE = 1024
  const EXPORT_SIZE = 256
  const img = new Jimp(SIZE, SIZE, 0x00000000)

  const bgDark = [19, 18, 22]
  const bgWarm = [34, 28, 20]
  const copperLight = [235, 181, 122]
  const copper = [201, 132, 58]
  const copperDeep = [137, 79, 24]
  const border = rgba(211, 146, 74, 110)

  fillRoundedGradient(img, 40, 40, 944, 944, 220, bgWarm, bgDark)
  strokeRoundedRect(img, 40, 40, 944, 944, 220, 18, border)

  // Subtle inner copper glow for taskbar contrast.
  strokeRoundedRect(img, 84, 84, 856, 856, 176, 7, rgba(201, 132, 58, 52))

  // Monogram T, inspired by the in-app sidebar mark.
  fillGradientRoundedRect(img, 196, 250, 632, 102, 50, copperLight, copper)
  fillGradientRoundedRect(img, 428, 340, 168, 370, 42, copperLight, copperDeep)

  // Road perspective under the T.
  drawLine(img, 330, 792, 512, 618, 34, rgba(201, 132, 58, 150))
  drawLine(img, 694, 792, 512, 618, 34, rgba(201, 132, 58, 110))
  drawLine(img, 512, 688, 512, 820, 16, rgba(232, 176, 122, 135))

  mkdirSync('build/icons', { recursive: true })

  const png = img.clone().resize(EXPORT_SIZE, EXPORT_SIZE, Jimp.RESIZE_BICUBIC)
  await png.writeAsync('build/icons/icon.png')
  console.log('✓ build/icons/icon.png')

  const sizes = [16, 24, 32, 48, 64, 128, 256]
  const buffers = []
  for (const s of sizes) {
    const resized = img.clone().resize(s, s, Jimp.RESIZE_BICUBIC)
    buffers.push(await resized.getBufferAsync(Jimp.MIME_PNG))
  }
  const ico = await pngToIco(buffers)
  writeFileSync('build/icons/icon.ico', ico)
  console.log('✓ build/icons/icon.ico')
  console.log('Copper/dark app icons generated successfully.')
}

main().catch(err => { console.error(err); process.exit(1) })
