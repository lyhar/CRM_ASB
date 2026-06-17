// Génère l'icône Trajectoire (T blanc sur fond bleu) pour Electron
// Usage: node scripts/generate-icon.js
const { execSync } = require('child_process')
const { existsSync } = require('fs')

if (!existsSync('node_modules/jimp')) {
  console.log('Installation de jimp et png-to-ico...')
  execSync('npm install --save-dev jimp png-to-ico', { stdio: 'inherit' })
}

const Jimp = require('jimp')
const pngToIcoMod = require('png-to-ico')
const pngToIco = pngToIcoMod.default || pngToIcoMod
const { writeFileSync, mkdirSync } = require('fs')

async function main() {
  const SIZE = 256
  const BG = 0x1d4ed8ff  // blue-700
  const FG = 0xffffffff  // blanc

  const img = new Jimp(SIZE, SIZE, BG)

  // Barre horizontale du T (haut)
  const padH = Math.round(SIZE * 0.17)
  const barH = Math.round(SIZE * 0.18)
  const padV = Math.round(SIZE * 0.16)
  for (let y = padV; y < padV + barH; y++)
    for (let x = padH; x < SIZE - padH; x++)
      img.setPixelColor(FG, x, y)

  // Tige verticale du T
  const stemW = Math.round(SIZE * 0.18)
  const stemX = Math.round((SIZE - stemW) / 2)
  for (let y = padV + barH; y < SIZE - padV; y++)
    for (let x = stemX; x < stemX + stemW; x++)
      img.setPixelColor(FG, x, y)

  mkdirSync('build/icons', { recursive: true })

  // PNG 256px
  await img.writeAsync('build/icons/icon.png')
  console.log('✓ build/icons/icon.png')

  // ICO multi-tailles
  const sizes = [16, 32, 48, 64, 128, 256]
  const buffers = []
  for (const s of sizes) {
    const resized = img.clone().resize(s, s, Jimp.RESIZE_BICUBIC)
    buffers.push(await resized.getBufferAsync(Jimp.MIME_PNG))
  }
  const ico = await pngToIco(buffers)
  writeFileSync('build/icons/icon.ico', ico)
  console.log('✓ build/icons/icon.ico')
  console.log('Icons générés avec succès.')
}

main().catch(err => { console.error(err); process.exit(1) })
