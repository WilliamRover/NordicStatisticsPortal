import {translateData} from "../lang.js";
// Load file
export function loadFile(file, id) {
    // gonna be honest chatGPT write this line
    fetch(file).then(response => response.text()).then(html => {
            // 1. Insert the HTML
            document.getElementById(id).innerHTML = html;

            // 2. THEN load and run the JS
            const script = document.createElement("script");
            script.src = file.replace("html", "js");
            script.type = "module";

            document.body.appendChild(script);

            return true;
        });
}

function getNested(obj, path) {
    return path.split('.').reduce((o, k) => o?.[k], obj);
}


export function showNotif(idLan) {
    var notificationTimer
    var curLan = localStorage.getItem('selectedLanguage') || 'en'

    var overlay = document.getElementById('overlay')
    var overlayTxt = overlay.querySelector('span')
    overlayTxt.setAttribute('idLan', idLan)
    translateData(curLan)
    overlay.classList.add("show")
    clearTimeout(notificationTimer)
    notificationTimer = setTimeout(() => {overlay.classList.remove("show")}, 3000)
}