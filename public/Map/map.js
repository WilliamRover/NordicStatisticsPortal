import {loadFile} from "../Components/shared.js";
import {showNotif} from "../Components/shared.js"
import { translateData } from "../lang.js";
// Load navbar
loadFile("../Components/Navbar/navbar.html", "navbar");
// Load footer
loadFile("../Components/Footer/footer.html", "footer");



// Populate years
function populateDropdown(elem, startYear, endYear, value) {
    elem.innerHTML = ""
    for (let i = startYear; i <= endYear; i++) {
        let option = document.createElement("option")
        option.value = i
        option.textContent = i

        if (i === value) {
            option.selected = true
        }
        elem.appendChild(option)
    }
}

var availableOptions = {
    "ALL": ["DK", "FO", "GL", "FI", "AX", "IS", "NO", "SE"],
    "Denmark": "DK",
    "Faroe Islands": "FO",
    "Greenland": "GL",
    "Finland": "FI",
    "Åland": "AX", 
    "Iceland": "IS",
    "Norway": "NO",
    "Sweden": "SE"
}
const codeToName = {}
for (const [name, code] of Object.entries(availableOptions)) {
    if (name !== "ALL") {
        codeToName[code] = name
    }
}

let year = document.getElementById("year")

let minYear = 1990
let maxYear = 2024

var selectedYear = 1990

populateDropdown(year, minYear, maxYear, minYear)

year.addEventListener("change", async (event) => {
    selectedYear = parseInt(event.target.value)
    filterRes = await filterData((await fetchRes(curDataItem, availableOptions["ALL"], [selectedYear]))[0])
    drawMap(await getGeoJson(), await filterRes)
})

// Innit map
let map = null
let geoJson = null
function drawMap(geo, data) {
    if (!map) {
        map = L.map('map', {
            minZoom: 2
        })

    }
    if (geoJson) {
        map.removeLayer(geoJson)
    }
    let total = 0
    Object.values(data).forEach(value => {
        if (value == "No data") return
        total += parseInt(value)
    })
    // console.log(total)
    geoJson = L.geoJson(geo, {
        onEachFeature: (feature, layer) => {
            if (!feature.properties.name) return
            const name = feature.properties.name + ` ${url[curDataItem].label}, ${selectedYear}`
            const value = data[name]
            layer.bindTooltip(name)
            layer.bindPopup(`<h2>${name}: </h2><span>${value}</span>`)
            // console.log(id)
            layer.on({
            mouseover: (e) => {
                const layer = e.target;
                layer.setStyle({
                    weight: 5,
                })
                layer.bringToFront()
            },
            mouseout: (e) => {
                geoJson.resetStyle(e.target);
            },
            click: (e) => {
                drawChart(feature.properties.name)
            }
        })
            },
            style: (feature) => {
                let hslVal = 1
                const name = feature.properties.name + ` ${url[curDataItem].label}, ${selectedYear}`
                const value = data[name]
                if (value == "No data") {
                    return {
                        color: `hsl(0, 0%, 50%)`,
                        weight: 1
                    }
                }
                hslVal = (parseInt(value) / total) * 120
                if (hslVal >= 120) {
                    hslVal = 120
                }
                return {
                    color: `hsl(${hslVal}, 75%, 50%)`,
                    weight: 1
                }
            }
    }).addTo(map)
    
    let osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    
    map.fitBounds(geoJson.getBounds())
}

async function getGeoJson() {
    const url = "./geo.json"
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        
        const result = await response.json();
        // console.log(result);
        return result
    } catch (error) {
        console.error(error.message);
    }
    
}

// Data item
class MapData {
    constructor(id, name, label, idLan, apiEndPoint, query, selected=false) {
        this.id = id
        this.name = name
        this.label = label
        this.idLan = idLan
        this.apiEndPoint = apiEndPoint
        this.query = query
        this.selected = selected

        this.elem = this.createDiv()
    }
    
    createDiv() {
        let temp = document.getElementById("template")
        let clone = temp.cloneNode(true)
        
        clone.style.display = "flex"
        clone.id = this.id
        // clone.querySelector(".label").textContent = this.name
        clone.querySelector(".label").setAttribute("idLan", this.idLan)
        if (this.selected) {
            clone.classList.add('chosen')
        }
        clone.addEventListener("click", async (e) => {
            dragItems.forEach(item => {
                if (item !== this) {
                    item.selected = false
                    item.elem.classList.remove('chosen')
                }
            })
            this.selected = !this.selected
            curDataItem = this.id
            // fetchRes(curDataItem, selectedYear)
            filterRes = await filterData((await fetchRes(curDataItem, availableOptions["ALL"], [selectedYear]))[0])
            drawMap(await getGeoJson(), await filterRes)
            // console.log(curDataItem)
            if (this.selected) {
                clone.classList.add('chosen')
            } else {
                return
            }
        })
        return clone
    }

    async queryValues (countries, years) {
        const body = await (await fetch(this.query)).json()
        this._addYears(body, years)

        const fetchPromises = countries.map((country) => {
            let cpyBody = JSON.parse(JSON.stringify(body))
            this._addCountries(cpyBody, [country])
            return POSTquery(this.apiEndPoint, cpyBody)
        })
        const res = await Promise.all(fetchPromises)
        // console.log(res)
        return res
    }

    _addCountries(jsonQuery, countries) {
        // console.log(jsonQuery)
        jsonQuery.query.find((item) => {return item.code == "reporting country"}).selection.values = countries
        return jsonQuery
    }

    _addYears(jsonQuery, years) {
        jsonQuery.query.find((item) => {return item.code == "time"}).selection.values = years
        return jsonQuery
    }
    
}

const url = {
    "marriage": {
        "apiEndPoint": "https://pxweb.nordicstatistics.org:443/api/v1/en/Nordic Statistics/Demography/Family structure/POPU04.px",
        "query": "../Components/query/marriages.json",
        "label": "Marriages",
        "idLan": "chart.dragItem.dataItem.marriages"
    },
    "divorces": {
        "apiEndPoint": "https://pxweb.nordicstatistics.org:443/api/v1/en/Nordic Statistics/Demography/Family structure/POPU04.px",
        "query": "../Components/query/divorces.json",
        "label": "Divorces",
        "idLan": "chart.dragItem.dataItem.divorces"
    },
    "population": {
        "apiEndPoint": "https://pxweb.nordicstatistics.org:443/api/v1/en/Nordic Statistics/Demography/Population size/POPU01.px",
        "query": "../Components/query/population.json",
        "label": "Population",
        "idLan": "chart.dragItem.dataItem.population"
    },
    "death": {
        "apiEndPoint": "https://pxweb.nordicstatistics.org:443/api/v1/en/Nordic Statistics/Demography/Population change/DEAT01.px",
        "query": "../Components/query/death.json",
        "label": "Deaths",
        "idLan": "chart.dragItem.dataItem.deaths"
    },
    "liveBirth": {
        "apiEndPoint": "https://pxweb.nordicstatistics.org:443/api/v1/en/Nordic Statistics/Demography/Fertility/CHIL01.px",
        "query": "../Components/query/liveBirth.json",
        "label": "Live Births",
        "idLan": "chart.dragItem.dataItem.liveBirths"
    }
}
var curDataItem = "marriage"

let datas = [
    ["marriage", "MARRIAGES"],
    ["divorces", "DIVORCES"],
    ["population", "POPULATION"],
    ["death", "DEATHS"],
    ["liveBirth", "LIVE BIRTHS"]
]

let dragItems = datas.map((data, i) => {
    let id = data[0]
    let name = data[1]
    if (i == 0) {
        return new MapData(id, name, url[id]["label"],url[id]["idLan"], url[id]["apiEndPoint"], url[id]["query"], true)
    }
    return new MapData(id, name, url[id]["label"],url[id]["idLan"], url[id]["apiEndPoint"], url[id]["query"])
})

var dataContainer = document.getElementById('dataContainer')

dragItems.forEach((item) => [
    dataContainer.appendChild(item.elem)
])

// Request
const POSTquery = async (URL, body) => {
    try {
        const res = await fetch(URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        })

        if (!res.ok) {
            throw new Error(res.status)
        }
        return await res.json();

    } catch (error) {
        console.log(error)
        return body.query.find((item) => {return item.code == "reporting country"}).selection.values[0]
    }
}

const GETquery = async (URL) => {
    const res = await fetch(URL, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    }).catch((error) => {
        console.log(error)
    })
    return await res.json();
}
async function fetchRes(id, countries, years) {
    const promiseRes = dragItems
        .filter(item => item.id == id)
        .map(item => item.queryValues(countries, years));
    let rawRes = await Promise.all(promiseRes)
    console.log(rawRes)
    return rawRes
}
function filterData(rawRes) {
    const filter = rawRes.reduce((dict, item) => {
        try {
            const countryCode = item.data[0].key.find(val => codeToName[val] !== undefined)
            const countryName = codeToName[countryCode]
            if (item.data[0].values[0] == "..") {
                dict[`${countryName} ${url[curDataItem].label}, ${selectedYear}`] = "No data"
                return dict
            }
            dict[`${countryName} ${url[curDataItem].label}, ${selectedYear}`] = item.data[0].values[0]
            return dict
        } catch (error) {
            const countryCode = item
            const countryName = codeToName[countryCode]
            dict[`${countryName} ${url[curDataItem].label}, ${selectedYear}`] = "No data"
            return dict
        }
    }, {})

    console.log(filter)
    return filter
}

// Initialise
var filterRes
(async () => {
    filterRes = await filterData((await fetchRes(curDataItem, availableOptions["ALL"], [selectedYear]))[0])
    drawMap(await getGeoJson(), await filterRes)
}) ()

// Download png
var pngBtn = document.getElementById("pngBtn")
var mapDraw = document.getElementById("map")
pngBtn.onclick = (event) => {
    event.preventDefault()
    domtoimage.toPng(mapDraw, {
        width: mapDraw.clientWidth,
        height: mapDraw.clientHeight,
        filter: (node) => {
            return !node.classList || !node.classList.contains('leaflet-control-container');
        }
    })
    .then(function (dataUrl) {
        const link = document.createElement('a')
        link.download = 'daMap.png'
        link.href = dataUrl
        link.click()
    })
    showNotif("map.overlay.downloadMap")
}

// Chart

async function drawChart(selectedArea) {
    let chartArea = document.getElementById("chartArea")
    let dropTxt = chartArea.querySelector(".chartTxt")
    let chartDraw = document.getElementById("chartDraw")

    chartDraw.innerHTML = ""
    chartDraw.style.display = "none"
    chartDraw.style.flex = ""
    chartDraw.style.width = "0"
    chartDraw.style.height = "0"
    dropTxt.style.display = ""

    var years = []
    for (let i = 1990; i <= 2024; i++) {
        years.push(i)
    }
    const newData = (await fetchRes(curDataItem, [availableOptions[selectedArea]], years))[0][0].data
    let values = []
    try {
        newData.forEach(item => values.push(item.values[0]))
    } catch (error) {
        dropTxt.setAttribute("idLan", "map.chart.noData")
        translateData(localStorage.getItem('selectedLanguage') || 'en')
        return
    }
    chartDraw.innerHTML = ""
    chartDraw.style.display = "flex"
    chartDraw.style.flex = "1"
    chartDraw.style.width = "100%"
    chartDraw.style.height = "100%"
    console.log(selectedArea)
    dropTxt.style.display = "none"
    const data = {
        labels: years,
        datasets: [
            {
                name: `${selectedArea} ${curDataItem}`, type: "line",
                values: values
            }
        ]
    }
    let height = chartArea.clientHeight
    if (height < 150) {
        height = window.innerHeight * 0.5 
    }
    const randColor = data.datasets.map(() => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'))
    const chart = new frappe.Chart("#chartDraw" , {
        title: `${selectedArea} ${curDataItem} throughout the year`,
        data: data,
        height: height,
        type: "axis-mixed",
        colors: randColor,
        barOptions: {
            stacked: true,
            spaceRatio: 0.5
        }
    })
    showNotif("map.overlay.chartGenerate")
}