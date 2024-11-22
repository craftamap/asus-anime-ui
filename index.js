import { SVG, Point } from 'https://unpkg.com/@svgdotjs/svg.js@3.2.4/dist/svg.esm.js'

const img = new Image();
img.src = './ga402-diagonal.png'
const cv = document.querySelector('canvas')
const ctx = cv.getContext('2d')
const { promise, resolve } = Promise.withResolvers()
img.onload = resolve;
await promise;
ctx.drawImage(img, 0, 0)

const draw = SVG().addTo("body").width(500, 500).viewbox(-60, -170, 800, 800)
draw.rect('100%', '100%').fill('black')
const g = draw.group()
const center = new Point(460, 400)

for (let x = 0; x < 74; x++) {
    for (let y = 0; y < 39; y++) {
        for (let offset_x = -1; offset_x < 2; offset_x++) {
            for (let offset_y = -1; offset_y < 2; offset_y++) {
                const pixelData = ctx.getImageData(x, y, 1, 1).data
                const px = g.circle(2).move(x * 10 + 5 + offset_x * 3.3, y * 10 + 5 + offset_y * 3.3).fill('transparent').data({ x: x, y: y });
                if (pixelData[0]) {
                    px.fill(`hsl(0 0% ${(pixelData[0] / 255) * 100}%)`);
                }
            }
        }
    }
}

g.rotate(45, center.x, center.y).scale(1.5, 1)
