import "https://unpkg.com/gif.js@0.2.0/dist/gif.js"

const workerBlob = await (await fetch("https://unpkg.com/gif.js@0.2.0/dist/gif.worker.js")).blob();
console.log("got worker!")

async function drawInput() {
    const img = new Image();
    img.src = './ga402-diagonal.png'
    const cv = document.getElementById('input')
    const inputCtx = cv.getContext('2d')
    const { promise, resolve } = Promise.withResolvers()
    img.onload = resolve;
    await promise;
    inputCtx.drawImage(img, 0, 0)

    return inputCtx;
}

async function drawPreview(n) {
    /** @type {HTMLCanvasElement} */ const cv = document.getElementById('preview')
    const previewCtx = cv.getContext('2d')
    previewCtx.clearRect(0, 0, cv.width, cv.height);
    previewCtx.save()

    previewCtx.fillStyle = 'black';
    previewCtx.fillRect(0, 0, cv.width, cv.height);

    previewCtx.restore()

    previewCtx.save()
    previewCtx.scale(1, 0.8)
    previewCtx.translate(300, -200)
    previewCtx.rotate(Math.PI * 0.25)
    for (let x = 0; x < 74; x++) {
        for (let y = 0; y < 39; y++) {
            for (let offset_x = -1; offset_x < 2; offset_x++) {
                for (let offset_y = -1; offset_y < 2; offset_y++) {
                    const pixelData = n.getImageData(x, y, 1, 1).data
                    if (pixelData[0]) {
                        previewCtx.beginPath();
                        previewCtx.strokeStyle = `white`
                        previewCtx.strokeStyle = `hsl(0 0% ${(pixelData[0] / 255) * 100}%)`
                        previewCtx.arc(10 * x + 5 + offset_x * 3.3, 10 * y + 5 + offset_y * 3.3, 0.5, 0, 2 * Math.PI)
                        previewCtx.stroke()
                    }
                }
            }
        }
    }
    previewCtx.restore()

}

async function drawIntermediate(n, offset) {
    /** @type {HTMLCanvasElement} */ const cv = document.getElementById('intermediate')
    const interCtx = cv.getContext('2d')
    interCtx.save()
    interCtx.clearRect(0, 0, cv.width, cv.height);
    interCtx.drawImage(n.canvas, 0, 0)

    const txt = "I love Mims!"
    interCtx.font = "44px Pilowlava"
    const wdh = interCtx.measureText(txt).width / Math.sqrt(2)
    interCtx.fillStyle = "white"
    interCtx.translate(42 / Math.sqrt(2) - offset, 55 + offset)
    interCtx.rotate(-Math.PI * 0.25)
    interCtx.fillText(txt, 0, 0)
    interCtx.restore()

    return interCtx;
}

async function sleep() {
    const { promise, resolve } = Promise.withResolvers();

    setTimeout(resolve, 0);

    return promise;
}

    const inp = await drawInput();
    const gif = new GIF({workerScript: URL.createObjectURL(workerBlob)});


    for (let i = -20; i < 220; i++) {
        console.log("frame", i)
        const inter = await drawIntermediate(inp, i);
        gif.addFrame(inter.canvas, {delay: 3, copy: true})
        //await sleep()
    // await drawPreview(inter);
    }

    gif.on('finished', function (blob) {
        window.open(URL.createObjectURL(blob));
    });

    gif.render();

