import "https://unpkg.com/gif.js@0.2.0/dist/gif.js"

const workerBlob = await (await fetch("https://unpkg.com/gif.js@0.2.0/dist/gif.worker.js")).blob();
console.log("got worker!")

/** @type {HTMLCanvasElement} */
const inputCanvas = document.getElementById('input')
const inputCtx = inputCanvas.getContext('2d')
/** @type {HTMLCanvasElement} */
const intemediateCanvas = document.getElementById('intermediate')
const interCtx = intemediateCanvas.getContext('2d')
/** @type {HTMLCanvasElement} */
const previewCanvas = document.getElementById('preview')
const previewCtx = previewCanvas.getContext('2d')


const Mode = Object.freeze({
    Image: 'IMAGE',
    Text: 'TEXT',
});

let currentMode = Mode.Text;
let renderBorder = true;

document.querySelector('#border').addEventListener("input", (e) => {
    renderBorder = e.target.checked;
    console.log(renderBorder)

    // TODO: event based?
    drawInput();
})
document.querySelector('form').reset()
document.querySelector('form #mode').addEventListener("input", (e) => {
    const formData = new FormData(e.currentTarget.form);
    currentMode = formData.get('mode');

    document.getElementById('image-settings').style.display = currentMode === Mode.Image ? 'block' : 'none';
    document.getElementById('text-settings').style.display = currentMode === Mode.Text ? 'block' : 'none';
    console.log(document.getElementById('image-settings').style.display)

    document.dispatchEvent(new Event("value_changed"))
})

async function drawInput() {
    if (renderBorder) {
        const img = new Image();
        img.src = './ga402-diagonal.png'
        const { promise, resolve } = Promise.withResolvers()
        img.onload = resolve;
        await promise;
        inputCtx.drawImage(img, 0, 0)
    } else {
        inputCtx.fillRect(0, 0, inputCanvas.width, inputCanvas.height)
    }

    document.dispatchEvent(new Event("draw_input"))
}

function calculateTextWidth() {
    const c = document.createElement('canvas');
    c.width = 1000
    c.height = 1000
    const ctxX = c.getContext('2d')
    const txt = document.getElementById("text-input").value
    ctxX.font = "44px Pilowlava"
    ctxX.fillStyle = "white";
    const textMetrics = ctxX.measureText(txt);
    return textMetrics.width;
}

async function drawIntermediate(step = 0) {
    interCtx.clearRect(0, 0, intemediateCanvas.width, intemediateCanvas.height);
    interCtx.drawImage(inputCtx.canvas, 0, 0)
    interCtx.save()

    if (currentMode == Mode.Text) {
        const txt = document.getElementById("text-input").value
        interCtx.font = "44px Pilowlava"
        interCtx.fillStyle = "white"
        interCtx.translate(42 / Math.sqrt(2) - step, 55 + step)
        interCtx.rotate(-Math.PI * 0.25)
        interCtx.fillText(txt, 0, 0)
    } else if (currentMode == Mode.Image) {
        /** @type {HTMLInputElement} */
        const scale = Number(document.getElementById("scale").value);
        const invert = document.getElementById("invert").checked;
        const imageInput = document.getElementById("imageInput")
        const xoff_ui = Number(document.getElementById("xoff").value);
        const yoff_ui = Number(document.getElementById("yoff").value);
        const rotate = Number(document.getElementById("rotate").value);
        if (imageInput.files[0]) {
            const file = imageInput.files[0]
            const img = new Image();
            img.src = URL.createObjectURL(file)
            const { promise, resolve } = Promise.withResolvers()
            img.onload = resolve;
            await promise;

            const ratio = img.width / img.height;

            let [xoff, yoff] = calculateRectangle(ratio);
            console.log(xoff, yoff)
            xoff = xoff * scale
            console.log(yoff)
            yoff = yoff * scale
            console.log(yoff)

            interCtx.translate(0, 33.5)
            interCtx.rotate(-Math.PI * 0.25)
            interCtx.translate((48 - xoff), 0)

            if (invert) {
                interCtx.filter = 'invert(1)'
            }
            interCtx.rotate(rotate)
            interCtx.drawImage(img, 0 + xoff_ui, 0 + yoff_ui, xoff, yoff)
        }
    }

    interCtx.restore()

    document.dispatchEvent(new Event("draw_intermediate"))
}

async function drawPreview() {
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    previewCtx.save()

    previewCtx.fillStyle = 'black';
    previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

    previewCtx.restore()

    previewCtx.save()
    previewCtx.scale(1, 0.8)
    previewCtx.translate(300, -200)
    previewCtx.rotate(Math.PI * 0.25)
    const pixelData = interCtx.getImageData(0, 0, interCtx.canvas.width, interCtx.canvas.height).data

    for (let x = 0; x < 74; x++) {
        for (let y = 0; y < 39; y++) {
            for (let offset_x = -1; offset_x < 2; offset_x++) {
                for (let offset_y = -1; offset_y < 2; offset_y++) {
                    const brightValue = (pixelData[(y * interCtx.canvas.width + x) * 4] + pixelData[(y * interCtx.canvas.width + x) * 4 + 1] + + pixelData[(y * interCtx.canvas.width + x) * 4 + 2]) / 3
                    if (brightValue) {
                        previewCtx.beginPath();
                        previewCtx.strokeStyle = `white`
                        previewCtx.strokeStyle = `hsl(0 0% ${(brightValue / 255) * 100}%)`
                        previewCtx.arc(10 * x + 5 + offset_x * 3.3, 10 * y + 5 + offset_y * 3.3, 0.5, 0, 2 * Math.PI)
                        previewCtx.stroke()
                    }
                }
            }
        }
    }
    previewCtx.restore()

    document.dispatchEvent(new Event("preview"))
}


document.addEventListener("draw_input", () => {
    drawIntermediate()
})

document.addEventListener("value_changed", () => {
    const progress = calculateTextWidth() * Number(document.getElementById("progress").value)

    drawIntermediate(progress)
})

document.addEventListener("draw_intermediate", () => {
    drawPreview()
})


async function sleep() {
    const { promise, resolve } = Promise.withResolvers();
    setTimeout(resolve, 0);
    return promise;
}

const inp = await drawInput();

async function render() {
    if (currentMode == Mode.Text) {
        const loops = calculateTextWidth()
        console.log(loops)
        const gif = new GIF({ workerScript: URL.createObjectURL(workerBlob) });
        for (let i = -40; i < loops; i++) {
            console.log("frame", i)
            await drawIntermediate(i);
            gif.addFrame(interCtx.canvas, { delay: 33, copy: true })
            await sleep()
        }
        gif.on('finished', function (blob) {
            window.open(URL.createObjectURL(blob));
        });

        gif.render();
    } else {
        window.open(interCtx.canvas.toDataURL())
    }
}

document.getElementById("image-settings").addEventListener("input", async () => {
    document.getElementById("scale-out").innerText = document.getElementById("scale").value
    document.getElementById("xoff-out").innerText = document.getElementById("xoff").value
    document.getElementById("yoff-out").innerText = document.getElementById("yoff").value
    document.getElementById("rotate-out").innerText = document.getElementById("rotate").value
    document.dispatchEvent(new Event("value_changed"))
})
document.getElementById("text-settings").addEventListener("input", async () => {
    document.getElementById("progress-out").innerText = Number(document.getElementById("progress").value) * 100
    document.dispatchEvent(new Event("value_changed"))
})

document.getElementById("download").addEventListener("click", async () => {
    render();
})


function calculateRectangle(ratio) {
    const x1 = (55 * 55 * ratio) / (55 * ratio + 55);
    const y1 = x1 / ratio;

    return [x1, y1];
}
