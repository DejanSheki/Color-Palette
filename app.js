const colorDivs = document.querySelectorAll('.color');
const generateButton = document.querySelector('.generate');
const sliders = document.querySelectorAll('input[type="range"]');
const currentHexes = document.querySelectorAll('.color h2');
const popup = document.querySelector('.copy-container');
const adjustButton = document.querySelectorAll('.adjust');
const closeAdjustments = document.querySelectorAll('.close-adjustment');
const sliderContainers = document.querySelectorAll('.sliders');
const lockButton = document.querySelectorAll('.lock');
let initialColors;

// This is for local storage
let savedPalettes = [];

// Event listeners
generateButton.addEventListener('click', randomColors);

currentHexes.forEach(hex => {
    hex.addEventListener('click', () => {
        copyToClipboard(hex);
    });
});
sliders.forEach(slider => {
    slider.addEventListener('input', hslControls);
});
colorDivs.forEach((div, index) => {
    div.addEventListener('change', () => {
        updateTextUI(index);
    });
});
popup.addEventListener('transitionend', () => {
    const popupBox = popup.children[0];
    popup.classList.remove('active');
    popupBox.classList.remove('active');
});
adjustButton.forEach((button, index) => {
    button.addEventListener('click', () => {
        openAdjustmentPanel(index);
    });
});
closeAdjustments.forEach((button, index) => {
    button.addEventListener('click', () => {
        closeAdjustmentPanel(index);
    });
});
lockButton.forEach((button, index) => {
    button.addEventListener('click', e => {
        lockLayer(e, index);
    });
});

// Fuctions
function generateHex() {
    const hexColor = chroma.random();
    return hexColor;

    // const letters = '0123456789ABCDEF';
    // let hash = '#';
    // for (let i = 0; i < 6; i++) {
    //     hash += letters[Math.floor(Math.random() * 16)];
    // }
    // return hash;
}
function randomColors() {
    initialColors = [];
    colorDivs.forEach((div, index) => {
        const hexText = div.children[0];
        const randomColor = generateHex();
        // Add it to the array
        if (div.classList.contains('locked')) {
            initialColors.push(hexText.innerText);
            return;
        } else {
            initialColors.push(chroma(randomColor).hex());
        }

        // Add color to the BG
        div.style.backgroundColor = randomColor;
        hexText.innerText = randomColor;
        // Check for contrast
        checkTextContrast(randomColor, hexText);
        // Initial colorize sliders
        const color = chroma(randomColor);
        const sliders = div.querySelectorAll('.sliders input');
        const hue = sliders[0];
        const brightness = sliders[1];
        const saturation = sliders[2];

        colorizeSliders(color, hue, brightness, saturation);
    });
    // Reset inputs
    resetInputs();

    // Check for button contrast
    adjustButton.forEach((button, index) => {
        checkTextContrast(initialColors[index], button);
        checkTextContrast(initialColors[index], lockButton[index]);
    });
}
function checkTextContrast(color, text) {
    const luminance = chroma(color).luminance();
    if (luminance > 0.5) {
        text.style.color = 'black';
    } else {
        text.style.color = 'white';
    }
}
function colorizeSliders(color, hue, brightness, saturation) {
    // Scale saturation
    const noSaturation = color.set('hsl.s', 0);
    const fullSaturation = color.set('hsl.s', 1);
    const scaleSaturation = chroma.scale([noSaturation, color, fullSaturation]);

    // Scale Brightness
    const midBright = color.set('hsl.l', 0.5);
    const scaleBright = chroma.scale(["black", midBright, "white"]);

    // Update input colors
    saturation.style.backgroundImage = `linear-gradient(to right, ${scaleSaturation(0)}, ${scaleSaturation(1)})`;
    brightness.style.backgroundImage = `linear-gradient(to right, ${scaleBright(0)}, ${scaleBright(0.5)}, ${scaleBright(1)})`;
    hue.style.backgroundImage = `linear-gradient(to right, rgb(204, 75, 75), rgb(204, 204, 75), rgb(75, 204, 75), rgb(75, 204, 204), rgb(75, 75, 204), rgb(204, 75, 204), rgb(204, 75, 75))`;
}
function hslControls(event) {
    const index =
        event.target.getAttribute('data-bright') ||
        event.target.getAttribute('data-sat') ||
        event.target.getAttribute('data-hue');

    let sliders = event.target.parentElement.querySelectorAll('input[type="range"]');
    const hue = sliders[0];
    const brightness = sliders[1];
    const saturation = sliders[2];

    const bgColor = initialColors[index];

    let color = chroma(bgColor)
        .set('hsl.s', saturation.value)
        .set('hsl.l', brightness.value)
        .set('hsl.h', hue.value);

    colorDivs[index].style.backgroundColor = color;

    // Colorize inputs
    colorizeSliders(color, hue, brightness, saturation);
}
function updateTextUI(index) {
    const activeDiv = colorDivs[index];
    const color = chroma(activeDiv.style.backgroundColor);
    const textHex = activeDiv.querySelector('h2');
    const icons = activeDiv.querySelectorAll('.controls button');
    textHex.innerText = color.hex();

    // Check contrast
    checkTextContrast(color, textHex);

    for (icon of icons) {
        checkTextContrast(color, icon);
    }
}
function resetInputs() {
    const sliders = document.querySelectorAll('.sliders input');
    sliders.forEach(slider => {
        if (slider.name === 'hue') {
            const hueColor = initialColors[slider.getAttribute('data-hue')];
            const hueValue = chroma(hueColor).hsl()[0];
            slider.value = Math.floor(hueValue);
        }
        if (slider.name === 'brightness') {
            const brightColor = initialColors[slider.getAttribute('data-bright')];
            const brightValue = chroma(brightColor).hsl()[2];
            slider.value = Math.floor(brightValue * 100) / 100;
        }
        if (slider.name === 'saturation') {
            const saturationColor = initialColors[slider.getAttribute('data-sat')];
            const saturationValue = chroma(saturationColor).hsl()[1];
            slider.value = Math.floor(saturationValue * 100) / 100;
        }
    });
}
function copyToClipboard(hex) {
    const el = document.createElement('textarea');
    el.value = hex.innerText;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);

    // Popup animation
    const popupBox = popup.children[0];
    popupBox.classList.add('active');
    popup.classList.add('active');
}
function openAdjustmentPanel(index) {
    sliderContainers[index].classList.toggle('active');
}
function closeAdjustmentPanel(index) {
    sliderContainers[index].classList.remove('active');
}
function lockLayer(e, index) {
    const lockSVG = e.target.children[0];
    const activeBg = colorDivs[index];
    activeBg.classList.toggle("locked");

    if (lockSVG.classList.contains("fa-lock-open")) {
        e.target.innerHTML = '<i class="fas fa-lock"></i>';
    } else {
        e.target.innerHTML = '<i class="fas fa-lock-open"></i>';
    }
}


// Implement save to palette and local storage stuff
const saveButton = document.querySelector('.save');
const submitSave = document.querySelector('.submit-save');
const closeSave = document.querySelector('.close-save');
const saveContainer = document.querySelector('.save-container');
const saveInput = document.querySelector('.save-container input');
const libraryContainer = document.querySelector('.library-container');
const libraryButton = document.querySelector('.library');
const closeLibraryButton = document.querySelector('.close-library');

// Event listeners
saveButton.addEventListener('click', openPalette);
closeSave.addEventListener('click', closePalette);
submitSave.addEventListener('click', savePalette);
libraryButton.addEventListener('click', openLibrary);
closeLibraryButton.addEventListener('click', closeLibrary);


function openPalette(e) {
    const popup = saveContainer.children[0];
    saveContainer.classList.add('active');
    popup.classList.add('active');
}
function closePalette(e) {
    const popup = saveContainer.children[0];
    saveContainer.classList.remove('active');
    popup.classList.remove('active');
}
function savePalette(e) {
    saveContainer.classList.remove('active');
    popup.classList.remove('active');
    const name = saveInput.value;
    const colors = [];
    currentHexes.forEach(hex => {
        colors.push(hex.innerText);
    });

    // Generate Object
    let paletteNumber;
    const paletteObjects = JSON.parse(localStorage.getItem('palettes'));
    if (paletteObjects) {
        paletteNumber = paletteObjects.length;
    } else {
        paletteNumber = savedPalettes.length;
    }

    const paletteObject = { name, colors, number: paletteNumber };
    savedPalettes.push(paletteObject);

    // Save to local storege
    savetoLocal(paletteObject);
    saveInput.value = '';

    // Generate the palette for library
    const palette = document.createElement('div');
    palette.classList.add('custom-palette');
    const title = document.createElement('h4');
    title.innerText = paletteObject.name;
    const preview = document.createElement('div');
    preview.classList.add('small-preview');
    paletteObject.colors.forEach(smallColor => {
        const smallDiv = document.createElement('div');
        smallDiv.style.backgroundColor = smallColor;
        preview.appendChild(smallDiv);
    });
    const paletteButton = document.createElement('button');
    paletteButton.classList.add('pick-paleette-button');
    paletteButton.classList.add(paletteObject.number);
    paletteButton.innerText = 'select';

    // Attach event to the button
    paletteButton.addEventListener('click', e => {
        closeLibrary();
        const paletteIndex = e.target.classList[1];
        initialColors = [];
        savedPalettes[paletteIndex].colors.forEach((color, index) => {
            initialColors.push(color);
            colorDivs[index].style.backgroundColor = color;
            const text = colorDivs[index].children[0];
            checkTextContrast(color, text);
            updateTextUI(index);
        });
        resetInputs();
    });

    // Append to library
    palette.appendChild(title);
    palette.appendChild(preview);
    palette.appendChild(paletteButton);
    libraryContainer.children[0].appendChild(palette);
}
function savetoLocal(paletteObject) {
    let localPalettes;
    if (localStorage.getItem('palettes') === null) {
        localPalettes = [];
    } else {
        localPalettes = JSON.parse(localStorage.getItem("palettes"));
    }
    localPalettes.push(paletteObject);
    localStorage.setItem('palettes', JSON.stringify(localPalettes));
}
function openLibrary() {
    const popup = libraryContainer.children[0];
    libraryContainer.classList.add('active');
    popup.classList.add('active');
}
function closeLibrary() {
    const popup = libraryContainer.children[0];
    libraryContainer.classList.remove('active');
    popup.classList.remove('active');
}
function getLocal() {
    if (localStorage.getItem('palettes') === null) {
        localPalettes = [];
    } else {
        const paletteObjects = JSON.parse(localStorage.getItem('palettes'));

        savedPalettes = [...paletteObjects];

        paletteObjects.forEach(paletteObject => {
            // Generate the palette for library
            const palette = document.createElement('div');
            palette.classList.add('custom-palette');
            const title = document.createElement('h4');
            title.innerText = paletteObject.name;
            const preview = document.createElement('div');
            preview.classList.add('small-preview');
            paletteObject.colors.forEach(smallColor => {
                const smallDiv = document.createElement('div');
                smallDiv.style.backgroundColor = smallColor;
                preview.appendChild(smallDiv);
            });
            const paletteButton = document.createElement('button');
            paletteButton.classList.add('pick-paleette-button');
            paletteButton.classList.add(paletteObject.number);
            paletteButton.innerText = 'select';

            // Attach event to the button
            paletteButton.addEventListener('click', e => {
                closeLibrary();
                const paletteIndex = e.target.classList[1];
                initialColors = [];
                paletteObjects[paletteIndex].colors.forEach((color, index) => {
                    initialColors.push(color);
                    colorDivs[index].style.backgroundColor = color;
                    const text = colorDivs[index].children[0];
                    checkTextContrast(color, text);
                    updateTextUI(index);
                });
                resetInputs();
            });
            // Append to library
            palette.appendChild(title);
            palette.appendChild(preview);
            palette.appendChild(paletteButton);
            libraryContainer.children[0].appendChild(palette);
        });
    }
}

getLocal();
randomColors();
