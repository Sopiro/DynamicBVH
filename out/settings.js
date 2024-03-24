import * as Util from "./util.js";
export var GenerationShape;
(function (GenerationShape) {
    GenerationShape[GenerationShape["Box"] = 0] = "Box";
    GenerationShape[GenerationShape["Circle"] = 1] = "Circle";
    GenerationShape[GenerationShape["Regular"] = 2] = "Regular";
    GenerationShape[GenerationShape["Random"] = 3] = "Random";
})(GenerationShape || (GenerationShape = {}));
export var MouseMode;
(function (MouseMode) {
    MouseMode[MouseMode["Grab"] = 0] = "Grab";
    MouseMode[MouseMode["Force"] = 1] = "Force";
})(MouseMode || (MouseMode = {}));
const boxCountRange = { p1: 1, p2: 1000 };
const genSpeedRange = { p1: 1, p2: 1000 };
const marginRange = { p1: 0.0, p2: 1.0 };
const multiplierRange = { p1: 0.0, p2: 10.0 };
// Settings
export const Settings = {
    width: 1280,
    height: 720,
    clipWidth: 12.8,
    clipHeight: 7.2,
    paused: false,
    boxCount: 15,
    genSpeed: 50,
    colorize: true,
    applyRotation: true,
    // These two options are actually tree member variables..
    aabbMargin: 0.1,
    aabbMultiplier: 4.0,
};
// Remove the default pop-up context menu
let cvs = document.querySelector("#canvas");
cvs.oncontextmenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
};
const boxCount = document.querySelector("#boxCount");
boxCount.value = String(Util.map(Settings.boxCount, boxCountRange.p1, boxCountRange.p2, 0, 100));
const boxCountLabel = document.querySelector("#boxCount_label");
boxCountLabel.innerHTML = String(Settings.boxCount);
boxCount.addEventListener("input", () => {
    let mappedValue = Util.map(Number(boxCount.value), 0, 100, boxCountRange.p1, boxCountRange.p2);
    mappedValue = Math.trunc(mappedValue);
    boxCountLabel.innerHTML = String(mappedValue);
    updateSetting("boxCount", mappedValue);
});
const genSpeed = document.querySelector("#genSpeed");
genSpeed.value = String(Util.map(Settings.genSpeed, genSpeedRange.p1, genSpeedRange.p2, 0, 100));
const genSpeedLabel = document.querySelector("#genSpeed_label");
genSpeedLabel.innerHTML = String(Settings.genSpeed) + "ms";
genSpeed.addEventListener("input", () => {
    let mappedValue = Util.map(Number(genSpeed.value), 0, 100, genSpeedRange.p1, genSpeedRange.p2);
    mappedValue = Math.trunc(mappedValue);
    genSpeedLabel.innerHTML = String(mappedValue) + "ms";
    updateSetting("genSpeed", mappedValue);
});
const margin = document.querySelector("#margin");
margin.value = String(Util.map(Settings.aabbMargin, marginRange.p1, marginRange.p2, 0, 100));
const marginLabel = document.querySelector("#margin_label");
marginLabel.innerHTML = String(Settings.aabbMargin) + "cm";
margin.addEventListener("input", () => {
    let mappedValue = Util.map(Number(margin.value), 0, 100, marginRange.p1, marginRange.p2);
    marginLabel.innerHTML = String(mappedValue) + "cm";
    updateSetting("margin", mappedValue);
});
const multiplier = document.querySelector("#multiplier");
multiplier.value = String(Util.map(Settings.aabbMultiplier, multiplierRange.p1, multiplierRange.p2, 0, 100));
const multiplierLabel = document.querySelector("#multiplier_label");
multiplierLabel.innerHTML = String(Settings.aabbMultiplier);
multiplier.addEventListener("input", () => {
    let mappedValue = Util.map(Number(multiplier.value), 0, 100, multiplierRange.p1, multiplierRange.p2);
    mappedValue = Math.trunc(mappedValue);
    multiplierLabel.innerHTML = String(mappedValue);
    updateSetting("multiplier", mappedValue);
});
const colorize = document.querySelector("#colorize");
colorize.checked = Settings.colorize;
colorize.addEventListener("click", () => { Settings.colorize = colorize.checked; });
const applyRotation = document.querySelector("#applyRotation");
applyRotation.checked = Settings.applyRotation;
applyRotation.addEventListener("click", () => { Settings.applyRotation = applyRotation.checked; });
export function updateSetting(id, content) {
    switch (id) {
        case "pause":
            Settings.paused = !Settings.paused;
            break;
        case "boxCount":
            Settings.boxCount = content;
            break;
        case "genSpeed":
            Settings.genSpeed = content;
            break;
        case "margin":
            Settings.aabbMargin = content;
        case "multiplier":
            Settings.aabbMultiplier = content;
        default:
            break;
    }
}
