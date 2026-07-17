import {loadFile} from "../Components/shared.js";
import {showNotif} from "../Components/shared.js"
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


let fromYear = document.getElementById("fromYear")
let toYear = document.getElementById("toYear")

let minYear = 1990
let maxYear = 2024

var selectedFromYear = minYear
var selectedToYear = maxYear

populateDropdown(fromYear, minYear, maxYear, minYear)
populateDropdown(toYear, minYear, maxYear, maxYear)


fromYear.addEventListener("change", (event) => {
    selectedFromYear = parseInt(event.target.value)
    let curToYear = parseInt(toYear.value)
    if (curToYear < selectedFromYear) {
        curToYear = selectedFromYear
    }

    populateDropdown(toYear, selectedFromYear, maxYear, curToYear)
})

toYear.addEventListener("change", (event) => {
    selectedToYear = parseInt(event.target.value)
    let curFromYear = parseInt(fromYear.value)
    if (curFromYear > selectedToYear) {
        curFromYear = selectedToYear
    }

    populateDropdown(fromYear, minYear, selectedToYear, curFromYear)
})

// Select country
let selectCountryBtn = document.getElementById("selectCountry")
let tagContainer = document.getElementById("tagContainer")

var selectedCountries = []
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

const codeToCountryName = {}
Object.entries(availableOptions).forEach(([name, code]) => {
    if (name !== "ALL") {
        codeToCountryName[code] = name;
    }
})

function innitDropDown() {
    Object.keys(availableOptions).forEach((elem) => {
        let option = document.createElement("option")
        option.value = elem
        option.textContent = elem
        selectCountryBtn.appendChild(option)
    })
}

function createTag() {
    tagContainer.innerHTML = ""
    selectedCountries.forEach((elem) => {
        let countryTag = document.createElement("div")
        countryTag.className = "countryTag"
        let txt = document.createElement("span")
        txt.textContent = elem
        let closeBtn = document.createElement("span")
        closeBtn.className = "closeBtn"
        closeBtn.textContent = " x "

        closeBtn.onclick = function () {
            selectedCountries = selectedCountries.filter(country => country !== elem)
            createTag()
            // console.log(selectedCountries)
        }

        countryTag.appendChild(txt)
        countryTag.appendChild(closeBtn)
        tagContainer.appendChild(countryTag)
    })
}


selectCountryBtn.addEventListener("change", (event) => {
    let selectedVal = event.target.value
    if (selectedVal === "ALL") {
        selectedCountries = Object.keys(availableOptions).filter(k => k !== "ALL")
    } else if (!selectedCountries.includes(selectedVal)) {
        selectedCountries.push(selectedVal)
    }
    createTag()
    selectCountryBtn.selectedIndex = 0
    // console.log(selectedCountries)
})

innitDropDown()

// Drag and drop

class DragData {
    constructor(id, name, label, idLan, apiEndPoint, query, chartOpt = 0) {
        this.id = id
        this.name = name
        this.label = label
        this.idLan = idLan
        this.query = query
        this.apiEndPoint = apiEndPoint
        this.chartOpt = chartOpt // 0: Line, 1: Bar

        this.elem = this.createDiv()
    }

    changeChartOpt(opt) {
        this.chartOpt = opt
        this.updateBtn()
    }

    getChartOpt() {
        switch (this.chartOpt) {
            case 0:
                return "line"
                break;
            case 1:
                return "bar"
                break;
            default:
                break;
        }
    }

    createDiv() {
        let temp = document.getElementById("template")
        let clone = temp.cloneNode(true)

        clone.style.display = "flex"
        clone.id = this.id
        // clone.querySelector(".label").textContent = this.name
        clone.querySelector(".label").setAttribute("idLan", this.idLan)

        let chartButtons = clone.querySelector(".chartButtons")
        let buttons = chartButtons.querySelectorAll("button")
        this.lineBtn = buttons[0]
        this.barBtn = buttons[1]
        this.updateBtn()

        this.lineBtn.onclick = () => {this.changeChartOpt(0)}
        this.barBtn.onclick = () => {this.changeChartOpt(1)}

        clone.addEventListener("dragstart", (e) => this.onDragStart(e))
        clone.addEventListener("dragend", (e) => this.onDragEnd(e))

        return clone
    }

    onDragStart(e) {
        e.dataTransfer.setData("text/plain", this.id);
        e.dataTransfer.effectAllowed = "move";
        
        setTimeout(() => this.elem.classList.add("dragging"), 0);
    }

    onDragEnd() {
        this.elem.classList.remove("dragging");
    }

    updateBtn() {
        switch (this.chartOpt) {
            case 0:
                this.lineBtn.classList.add('activeChart')
                this.barBtn.classList.remove('activeChart')
                break
             case 1:
                this.barBtn.classList.add('activeChart')
                this.lineBtn.classList.remove('activeChart')
                break
        
            default:
                break;
        }
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

let dragContainer = document.getElementById("dragContainer")

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

// let dragItems = [
//     new DragData("marriage", "MARRIAGES", url["marriage"]["apiEndPoint"], url["marriage"]["query"], 0),
//     new DragData("divorces", "DIVORCES", url["divorces"]["apiEndPoint"], url["divorces"]["query"], 0),
//     new DragData("population", "POPULATION", url["population"]["apiEndPoint"], url["population"]["query"], 0),
//     new DragData("death", "DEATHS", url["death"]["apiEndPoint"], url["death"]["query"], 0),
// ]
let datas = [
    ["marriage", "MARRIAGES"],
    ["divorces", "DIVORCES"],
    ["population", "POPULATION"],
    ["death", "DEATHS"],
    ["liveBirth", "LIVE BIRTHS"]
]

let dragItems = datas.map((data) => {
    let id = data[0]
    let name = data[1]

    return new DragData(id, name, url[id]["label"],url[id]["idLan"], url[id]["apiEndPoint"], url[id]["query"], 0)
})


dragItems.forEach((item) => {
    item.elem.addEventListener("click", (e) => {
        if (window.matchMedia("(pointer: coarse)").matches) {
            if (item.elem.parentElement.id === 'dragContainer') {
                if (!dropArea.classList.contains('dropDisabled')) {
                    moveToDropArea(item.elem);
                }
            } else if (item.elem.parentElement.id === 'dropArea') {
                if (!dropArea.classList.contains('dropDisabled')) {
                    moveToDragContainer(item.elem)
                }

            }
        }
    })
    dragContainer.appendChild(item.elem)
})

// Drag area

let dragArea = document.getElementById('dropArea')

function moveToDropArea(item) {
    let dropArea = document.getElementById("dropArea")
    let dragContainer = document.getElementById("dragContainer")

    dropArea.appendChild(item)
    item.draggable = false
    let handle = item.querySelector('.dragHandle')
    if (handle) {
        handle.className = "removeBtn"
        handle.innerHTML = " X "
        handle.onclick = (e) => {
            e.stopPropagation()
            moveItemToDragContainer(item)
        };
    }
    
    let txt = dropArea.querySelector(".dropTxt")
    txt.style.display = "none"
}

function moveToDragContainer(item) {
    let dropArea = document.getElementById('dropArea')
    let dragContainer = document.getElementById('dragContainer')

    dragContainer.appendChild(item)
    item.draggable = true
    
    let handle = item.querySelector('.removeBtn')
    if (handle) {
        handle.className = 'dragHandle'
        handle.innerHTML = `
            <span></span><span></span>
            <span></span><span></span>
            <span></span><span></span>
        `;
        handle.onclick = null
    }

    if (dropArea.querySelectorAll(".dataItem").length === 0) {
        let txt = dropArea.querySelector(".dropTxt")
        txt.style.display = ""
    }
}

dragArea.addEventListener("dragover", (event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
})

dragArea.addEventListener("dragenter", (event) => {
    if (dropArea.classList.contains('dropDisabled')) {
        event.dataTransfer.dropEffect = 'none'
        return
    }
    event.preventDefault()
    dragArea.classList.add("dragging")
})

dragArea.addEventListener("dragleave", (event) => {
    // event.preventDefault()
    dragArea.classList.remove("dragging")
})

dragArea.addEventListener("drop", (event) => {
    if (dropArea.classList.contains('dropDisabled')) {
        return
    }
    event.preventDefault()
    dragArea.classList.remove("dragging")
    let dragItemId = event.dataTransfer.getData("text/plain")
    let dragItemElem = document.getElementById(dragItemId)

    moveToDropArea(dragItemElem)
    
})

// Generate data
// Variables: selectedFromYear, selectedToYear, selectedCountries
// Util


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
            throw new Error(res.status); 
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

function drawChart(title, data, hideLegend = true) {
    const chartArea = document.getElementById("chartArea")
    chartArea.style.display = "flex"
    chartArea.style.flexDirection = "column"
    chartArea.innerHTML = ""
    let height = chartArea.clientHeight
    if (height < 150) {
        height = window.innerHeight * 0.5 
    }
    const randColor = data.datasets.map(() => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'))
    const chart = new frappe.Chart("#chartArea" , {
        title: title,
        data: data,
        height: height,
        type: "axis-mixed",
        colors: randColor,
        barOptions: {
            stacked: true,
            spaceRatio: 0.5
        }
    })
    if (hideLegend) {
        const svgLegend = chartArea.querySelector(".chart-legend")
        svgLegend.style.display = "none"
        const customLegend = document.createElement("div")
        customLegend.style.display = "flex"
        customLegend.style.flexWrap = "wrap"
        customLegend.style.justifyContent = "center"
        customLegend.style.gap = "20px"
    
        data.datasets.forEach((dataset, index) => {
            const item = document.createElement("div")
            item.style.display = "flex"
            item.style.alignItems = "center"
            item.style.fontSize = "12px"
            item.style.fontFamily = "sans-serif"
            item.style.color = "#555"
    
            item.innerHTML = `
                <span style="display:inline-block; width:12px; height:12px; border-radius:50%; 
                             background-color:${randColor[index]}; margin-right:8px;"></span>
                ${dataset.name}
            `
            customLegend.appendChild(item);
        })
    
        chartArea.appendChild(customLegend)
    }
    // custom legend cuz the one in frappe sucks

    // console.log(title, data)
    // document.getElementById("dropArea").style.backgroundColor = "#ffffff"
}

// Grab data item
let generateBtn = document.getElementById("generateBtn")
let visualising = false
let selectedYear = []

var tempData = {}
var tempTitle = ""
var tempDatasets = {}

generateBtn.onclick = async (event) => {
    event.preventDefault()
    selectedYear = []
    // Data processing
    let dropArea = document.getElementById('dropArea')
    let dataItems = dropArea.querySelectorAll('.dataItem')
    let chartType = Array.from(dataItems).map(item => {
        let ins = dragItems.find(dragItem => dragItem.id == item.id)
        return ins.getChartOpt()
    })
    let draggedData = Array.from(dataItems).map(item => {
        let ins = dragItems.find(dragItem => dragItem.id == item.id)
        return ins
    })

    let selectedCountryCode = selectedCountries.map((country) => availableOptions[country])
    if (selectedCountries.length == 0 && visualising == false) {
        showNotif("chart.overlay.missingCountry")
        console.log("Please choose desired country")
        return
    }

    if (draggedData.length == 0 && visualising == false) {
        showNotif("chart.overlay.missingData")
        console.log("no data item selected")
        return
    }
    // dataItems.forEach((item) => {
    //     itemIds.push(item.id)
    //     chartType.push(item.querySelector(".activeChart").id)
    // })
    for (let i = selectedFromYear; i <= selectedToYear; i++) {
        selectedYear.push(i)
    }
    
    let selectedLabels = Array.from(dataItems).map(item => {
        return dragItems.find(dragItem => dragItem.id == item.id).label;
    })

    let rawRes = await Promise.all(Array.from(dataItems).map(item => {
        let ins = dragItems.find(dragItem => dragItem.id == item.id)
        return ins.queryValues(selectedCountryCode, selectedYear)
    }))

    // Filtering res

    let filterRes = {}
    selectedLabels.forEach((label, idx) => {
        rawRes[idx].forEach((res, countryIdx) => {
            // console.log(res)
            let country = selectedCountryCode[countryIdx]
            let countryName = codeToCountryName[country]
            let flatkey = `${label} in ${countryName}`
            if (!res || !res.columns || !res.data || res.data.length === 0) {
                filterRes[flatkey] = Array(selectedYear.length).fill(null)
            } else {
                filterRes[flatkey] = res.data.map((item) => {
                    let val = Number(item.values[0])
                    if (isNaN(val)) {
                        return null
                    }
                    return val
                })
            }
            // let countryIdx = res.columns.findIndex(col => col.code === 'reporting country')
            // let yearIdx = res.columns.findIndex(col => col.code === 'time')
            

            // return filterRes[label][country]
        })
    })

    // dragItems.forEach((item) => {chartType.push(item.getChartOpt())})
    // Label is year, name of dataset is data item and year (ex: Marriages in Denmark)
    let title = "Chart throughout the year by " + selectedLabels.join(", ") // title
    // console.log(filterRes) // keys: name, values: dataset
    // console.log(title) // title
    // console.log(selectedYear) // label
    // console.log(chartType) // type

    const datasets = Object.keys(filterRes).map((key, idx) => {
        let typeIdx = Math.floor(idx / selectedCountries.length)
        return {
            name: key,
            chartType: chartType[typeIdx],
            values: filterRes[key]
        }
    })
    tempDatasets = datasets
    console.log(datasets)
    const data = {
        labels: selectedYear,
        datasets: datasets,
        yMarkers: [
            { 
                label: "",
                value: 0 
            }
        ]
    }
    // console.log(data)
    
    // Return drag item and lock drop
    let chartArea = document.getElementById("chartArea")
    dataItems.forEach((item) => {
        let handle = item.querySelector(".removeBtn")
        if (handle) {
            handle.innerHTML = `
            <span></span><span></span>
            <span></span><span></span>
            <span></span><span></span>
            `
            item.draggable = true
            handle.className = 'dragHandle'
            handle.onclick = null
            
        }
        document.getElementById('dragContainer').appendChild(item)
    })
    chartArea.style.display = "flex"
    chartArea.style.flex = "1"
    chartArea.style.width = "100%"
    chartArea.style.height = "100%"
    dragArea.classList.add('dropDisabled')
    // Draw chart
    visualising = true
    if (data.datasets.length == 0) {
        console.log("use temp")
        drawChart(tempTitle, tempData)
    } else {
        tempData = data
        tempTitle = title
        drawChart(title, data)
    }
    console.log("chart generated")
    showNotif("chart.overlay.generate")
}

// Clear chart

let resetBtn = document.getElementById("resetBtn")
resetBtn.onclick = (event) => {
    let chartArea = document.getElementById("chartArea")
    if (chartArea.innerHTML == "") {
        console.log("what is there to clear...")
        showNotif("chart.overlay.noClear")
        return
    }
    tempData = {}
    tempTitle = ""
    tempDatasets = {}
    selectedYear = []
    chartArea.innerHTML = ""
    chartArea.style.display = "none"
    chartArea.style.flex = ""
    chartArea.style.width = "0"
    chartArea.style.height = "0"
    dragArea.classList.remove('dropDisabled')
    if (dragArea.querySelectorAll(".dataItem").length == 0) {
        let txt = dragArea.querySelector(".dropTxt")
        txt.style.display = ""
    }
    visualising = false
    showNotif("chart.overlay.reset")
}

// Predict data
function linearRegression(values) {
    // y = mx + b
    const validData = values.filter(v => v !== null && !isNaN(v))
    if (validData.length < 2) {
        console.log("need at least 2 data")
        showNotif("chart.overlay.missingPrediction")
        return null
    }
    const n = validData.length
    let sumx = 0
    let sumy = 0
    let sumxy = 0
    let sumxSquare = 0

    for (let i = 0; i < n; i++) {
        const x = i
        const y = validData[i]

        sumx += x
        sumy += y
        sumxy += x * y
        sumxSquare += x * x
    }
    const m = (n * sumxy - sumx * sumy) / (n * sumxSquare - sumx * sumx)
    const b = (sumy - m * sumx) / n

    return Math.max(0, Math.round(m * n + b))
}

let predictBtn = document.getElementById("predictBtn")
predictBtn.onclick = () => {
    if (Object.keys(tempData).length == 0) {
        console.log("theres no data to predict")
        showNotif("chart.overlay.noPrediction")
        return
    }
    let prevYear = selectedYear[selectedYear.length - 1]
    let nextYear = prevYear + 1

    selectedYear.push(nextYear)
    tempDatasets.forEach(dataset => {
        let prediction = linearRegression(dataset.values);
        if (prediction === null) return
        dataset.values.push(prediction);
    })

    // console.log(datasets)
    const data = {
        labels: selectedYear,
        datasets: tempDatasets,
        yMarkers: [
            { 
                label: "",
                value: 0 
            }
        ]
    }
    tempData = data
    drawChart(tempTitle, tempData)
    showNotif("chart.overlay.prediction")
}


// Download png ja svg
const chartArea = document.getElementById("chartArea")

let pngBtn = document.getElementById("pngBtn")
pngBtn.onclick = (event) => {
    event.preventDefault()
    if (chartArea.innerHTML == "") {
        console.log("No chart to download lmao")
        showNotif("chart.overlay.noDownload")
        return
    }
    html2canvas(chartArea, {scale: 2}).then(canvas => {
        let link = document.createElement("a")
        link.download = "daChart.png"
        link.href = canvas.toDataURL("image/png")
        link.click()
    })
    showNotif("chart.overlay.download")
}

// temporarily enable frappe legend
let svgBtn = document.getElementById("svgBtn")
svgBtn.onclick = (event) => {
    event.preventDefault()
    if (chartArea.innerHTML == "") {
        console.log("No chart to download lmao")
        showNotif("chart.overlay.noDownload")
        return
    }
    
    const svg = document.querySelector("#chartArea svg").cloneNode(true)
    const svgLegend = svg.querySelector(".chart-legend")
    svgLegend.style.display = "block"

    const serializer = new XMLSerializer()
    let svgString = serializer.serializeToString(svg)

    const blob = new Blob([svgString], {type: "image/svg+xml;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    
    let link = document.createElement("a");
    link.href = url;
    link.download = "daChart.svg";
    link.click();
    
    URL.revokeObjectURL(url);
    showNotif("chart.overlay.download")
}
