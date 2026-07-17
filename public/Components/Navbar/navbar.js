// Lan button
var lanShow = false;
var r = document.querySelector(':root');
var lanbtn = document.getElementById("lanbtnID");

lanbtn.onclick = function() {
    if (lanShow == false) {
        r.style.setProperty('--lan-show', "block");
    } else {
        r.style.setProperty('--lan-show', "none");
    }
    lanShow = !lanShow;
}
document.addEventListener('click', (event => {
    if (!lanbtn.contains(event.target)) {
        lanShow = false;
        r.style.setProperty('--lan-show', "none");
    }
}))

function reloadCss() {
    var links = document.getElementsByTagName("link");
    for (var cl in links)
    {
        var link = links[cl];
        if (link.rel === "stylesheet")
            link.href += "";
    }
}

// Lan switching
// Lan button
var lan1Btn = document.getElementById("lanButtonTop")
var lan2Btn = document.getElementById("lanButtonBottom")
// var lanArr = ["../lang/en.json", "../lang/fi.json", "../lang/vn.json"]
var curLan = localStorage.getItem('selectedLanguage') || 'en';
switchLanBtn(curLan)

import {translateData} from "../../lang.js";
translateData(curLan)


lan1Btn.onclick = function() {
    console.log("Top is clicked")
    checkSwitchPos(curLan, 1)
}
lan2Btn.onclick = function() {
    console.log("Bot is clicked")
    checkSwitchPos(curLan, 2)
}

async function switchLanBtn(key) {
    try {
        // console.log(key)
        const response = await fetch(`${window.location.origin}/data/lang/${key}.json`);
        const file = await response.json();
        let lanPos = file["navbar"]["lan"]
        console.log(key)
        // Lan img
        var lanImgArr = document.getElementsByClassName("flagImg")
        // Lan span
        var lanSpanArr = document.getElementsByClassName("lanSpan")
        for (let i = 0; i < lanImgArr.length; i++) {
            lanImgArr[i].src = lanPos[i]["innerImg"]
            lanSpanArr[i].innerHTML = lanPos[i]["innerSpan"]
        }
        r.style.setProperty('--cur-lan', lanPos[0]["lang"]);
        curLan = window.getComputedStyle(document.body).getPropertyValue('--cur-lan');
        localStorage.setItem('selectedLanguage', curLan);
        if (light) {
            switchLanLight(curLan, 0)
        } else {
            switchLanLight(curLan, 1)
        }
        console.log(curLan)
        translateData(curLan)
    } catch (error) {
        console.error("Language loading failed:", error);
    }
}

function checkSwitchPos(key, pos) {
    fetch(`${window.location.origin}/data/lang/${key}.json`).then(response => {
        return response.json();
    }).then(file => {
        var lang = file["navbar"]["lan"]
        switchLanBtn(lang[pos]["lang"])
    });
}

    
// theme button 
var lida = document.getElementById("LDbtn");
var ldStatus = document.getElementById("ldStatus");

function switchLanLight(key, statusIndex) {
    fetch(`${window.location.origin}/data/lang/${key}.json`).then(response => {
        return response.json();
    }).then(file => {
        let lightStat = file["navbar"]["theme"][statusIndex]
        ldStatus.innerHTML = lightStat
    })
}
function switchTheme(bgColor, prim1, prim2, prim3, prim4, lanShadow, ldFloat, ldColor, lanHover, statusIndex) {
    r.style.setProperty('--bg-color', bgColor);
    r.style.setProperty('--prim-color-1', prim1);
    r.style.setProperty('--prim-color-2', prim2);
    r.style.setProperty('--prim-color-3', prim3);
    r.style.setProperty('--prim-color-4', prim4);
    r.style.setProperty('--lan-shadow', lanShadow);
    r.style.setProperty('--float-ld', ldFloat);
    r.style.setProperty('--ld-color', ldColor);
    r.style.setProperty('--lan-hover', lanHover);
    // ldStatus.innerHTML = status;
    switchLanLight(curLan, statusIndex)
}
function themeBool(l = true) {
    if (l) {
        switchTheme("#EDF2FF", "#556690", "#7B91C5", "#2B2F37", "#B7CAF6","#13223526", "right", "#F7C215", "#c5ccd5", 0);
        // location.href='#light';
    } else {
        switchTheme("#2B2F37", "#7B91C5", "#556690", "#EDF2FF", "#3D4E76","#E9F2FF26", "left", "#EDF2FF", "#1f3046ff", 1);
        // location.href='#dark';
    }
}
var light = localStorage.getItem("light") || true
r.style.setProperty('--light', light);
if (light == "false") {
    light = false
}
r.style.setProperty('--light', light);
// console.log(light)
themeBool(light);
// import {checkTime} from "../../Reuse/shared.js";
// if (checkTime()) {
//     light = true
//     r.style.setProperty('--light', light);
//     themeBool();
// } else if (checkTime() == false) {
//     light = false
//     r.style.setProperty('--light', light);
//     themeBool(false);
// }

lida.onclick = function() {
    light = !light;
    localStorage.setItem("light", light)
    // console.log(light)
    themeBool(light);
    r.style.setProperty('--light', light);
    if (light) {
        console.log("lights on")
    } else {
        console.log("lights off")
    }
}

