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
// Settings
export const Settings = {
    width: 1280,
    height: 720,
    clipWidth: 12.8,
    clipHeight: 7.2,
    paused: false,
};
// Remove the default pop-up context menu
let cvs = document.querySelector("#canvas");
cvs.oncontextmenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
};
export function updateSetting(id, content) {
    switch (id) {
        case "pause":
            Settings.paused = !Settings.paused;
            break;
        default:
            break;
    }
}
