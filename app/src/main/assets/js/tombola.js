var numbers = []; //number cells
var lognumbers = [];
var myTimer;
var ended = false;
var numberData = []; // Array to store controlled numbers from files
var currentFileIndex = 0;
var currentNumberIndex = 0;
//TODO - the last used app, use this to control
let isWantLoadOldNumberFromPreviousSection = false

$( document ).ready(function() {
    // Load from localstorage if something is there
    if (localStorage.getItem("Numbers") != null && isWantLoadOldNumberFromPreviousSection) {
        console.log("Ready: IF - localStorage.getItem-Numbers != null");

        var mystoragedNumber = localStorage.Numbers;
        if ((mystoragedNumber != 'undefined') && (mystoragedNumber != '')) {
            numbers = mystoragedNumber.split(',');
        }
        var mystoragedLogNumbers = localStorage.LogNumbers;
        if ((mystoragedLogNumbers != 'LogNumbers') && (mystoragedLogNumbers != '')) {
            lognumbers = mystoragedLogNumbers.split(',');
        }
        DrawTable();
        for (var i = 0; i < lognumbers.length; i++) {
            AddCircle(lognumbers[i]);
        }
    } else {
        console.log("Ready: ELSE - localStorage.getItem-Numbers == null");
        restart();
    }

    // Load number data from Android
    loadNumberDataFromAndroid();
});

//TODO load data from app
function loadNumberDataFromAndroid() {
    console.log("Attempting to load number data from Android");
    if (typeof JSInterface !== 'undefined') {
        try {
            var jsonData = JSInterface.getNumberData();
            console.log("Raw data received from Android: " + jsonData);

            if (!jsonData || jsonData === '') {
                console.error("Received empty data from Android");
                numberData = [];
                return;
            }

            try {
                numberData = JSON.parse(jsonData);
                //TODO - get numbers property only
                //sample data = {filename:"test1.txt",numbers:[5,23,47,12,89,34]}
                //numberData = numberData[0]["numbers"];

                console.log("Successfully parsed number data: ", numberData);
                console.log("Number of files loaded: " + numberData.length);

                // Log first file contents if available
                if (numberData.length > 0 && numberData[0].numbers) {
                    console.error("First file (" + numberData[0].filename + ") contains " +
                               numberData[0].numbers.length + " numbers");
                }
            } catch (parseError) {
                console.error("Error parsing JSON data: " + parseError + ", data: " + jsonData);
                numberData = [];
            }
        } catch (e) {
            console.error("Error loading number data: " + e);
            numberData = [];
        }
    } else {
        console.log("JSInterface is not defined, running in browser mode");
        // For testing in browser, create some dummy data
        numberData = [
            {
                filename: "test1.txt",
                numbers: [1, 2, 3, 4, 5, 6]
            }
        ];
    }
}

$(document).on('click','.start_btn', function() {
    if(!myTimer && !genNum){
        modeState = "start";
        autoNumber();
        SetBtnColors("startBtn");
    }
});

$(document).on('click','.stop_btn', function() {
    modeState = "stop";
    clearTimeout(myTimer);
    myTimer = null;
    SetBtnColors("stopBtn");
});

function pause(){
    modeState = "stop";
    clearTimeout(myTimer);
    myTimer = null;
    SetBtnColors("stopBtn");
}

$(document).on('click','.step_btn', function() {
    if (modeState == "stop"){
        SetBtnColors("stepBtn");
        modeState = "step";
        newNumber();
    }
});

$(document).on('click','.NumberTables', function() {
    if (modeState == "stop"){
        var txtId = $(this).attr("id");
        var mynumbermanual = txtId.replace("n", "");
        modeState = "step";
        newNumberManual(mynumbermanual);
    }
});

$(document).on('click','.restart_btn', function() {
    SetBtnColors("restartBtn");
    restart();
});

$(document).on('click','.settings_btn', function() {
    $("#slowsettingsBtn").css('stroke-width', 6);
    $("#midsettingsBtn").css('stroke-width', 6);
    $("#fastsettingsBtn").css('stroke-width', 6);
    if (newNumberTime == 6000) {
        $("#slowsettingsBtn").css('stroke-width', 12);
    }
    if (newNumberTime == 4000) {
        $("#midsettingsBtn").css('stroke-width', 12);
    }
    if (newNumberTime == 2000) {
        $("#fastsettingsBtn").css('stroke-width', 12);
    }
    $("#settingsDiv").css('z-index', 4);
});

$(document).on('click','.slowsettings_btn', function() {
    newNumberTime = 6000;
    $("#slowsettingsBtn").css('stroke-width', 6);
    $("#midsettingsBtn").css('stroke-width', 6);
    $("#fastsettingsBtn").css('stroke-width', 6);
    if (newNumberTime == 6000) {
        $("#slowsettingsBtn").css('stroke-width', 12);
    }
    if (newNumberTime == 4000) {
        $("#midsettingsBtn").css('stroke-width', 12);
    }
    if (newNumberTime == 2000) {
        $("#fastsettingsBtn").css('stroke-width', 12);
    }
});

$(document).on('click','.midsettings_btn', function() {
    newNumberTime = 4000;
    $("#slowsettingsBtn").css('stroke-width', 6);
    $("#midsettingsBtn").css('stroke-width', 6);
    $("#fastsettingsBtn").css('stroke-width', 6);
    if (newNumberTime == 6000) {
        $("#slowsettingsBtn").css('stroke-width', 12);
    }
    if (newNumberTime == 4000) {
        $("#midsettingsBtn").css('stroke-width', 12);
    }
    if (newNumberTime == 2000) {
        $("#fastsettingsBtn").css('stroke-width', 12);
    }
});

$(document).on('click','.fastsettings_btn', function() {
    newNumberTime = 2000;
    $("#slowsettingsBtn").css('stroke-width', 6);
    $("#midsettingsBtn").css('stroke-width', 6);
    $("#fastsettingsBtn").css('stroke-width', 6);
    if (newNumberTime == 6000) {
        $("#slowsettingsBtn").css('stroke-width', 12);
    }
    if (newNumberTime == 4000) {
        $("#midsettingsBtn").css('stroke-width', 12);
    }
    if (newNumberTime == 2000) {
        $("#fastsettingsBtn").css('stroke-width', 12);
    }
});

$(document).on('click','.exitsettings_btn', function() {
    $("#settingsDiv").css('z-index', -3);
});

function SetBtnColors(btnName){
    $("#startBtn").css({ fill: "#555500" });
    $("#stopBtn").css({ fill: "#555500" });
    $("#stepBtn").css({ fill: "#555500" });
    $("#restartBtn").css({ fill: "#555500" });
    $("#settingsBtn").css({ fill: "#555500" });

    $("#"+btnName).css({ fill: "#ffff00" });
}

var restarTimer;
function restart(){
    clearTimeout(myTimer);
    myTimer = null;
    numbers.splice( 0, numbers.length );
    lognumbers.splice( 0, lognumbers.length );
    for (var i = 1; i <= 90; i++) {
        numbers.push(i);
    }

    // Reset controlled number indexes
    currentFileIndex = 0;
    currentNumberIndex = 0;

    // Reload number data from Android
    loadNumberDataFromAndroid();

    restarTimer = setTimeout("AfterRestart()", 500);
}

function AfterRestart(){
    clearTimeout(restarTimer);
    restarTimer = null;
    DrawTable();
}

var modeState = "stop";

function autoNumber(){
    newNumber();
}

var genNum;
var shownum;
var newNumberTime = 4000;
function newNumber(){
    genNum = setTimeout("generateNumber()", newNumberTime);
    waitEnable = true;
    Suspance();
    $("#suspanceDiv").css('z-index', 3);
}

function getControlledNumber() {
    // Check if we have number data
    if (numberData.length === 0) {
        console.log("No number data available");
        return null;
    }

    // Get current file
    if (currentFileIndex >= numberData.length) {
        console.warn("No more files available, loading more data");
        loadNumberDataFromAndroid();
        if (numberData.length === 0 || currentFileIndex >= numberData.length) {
            return null;
        }
    }

    var currentFile = numberData[currentFileIndex];
    if (!currentFile || !currentFile.numbers || currentFile.numbers.length === 0) {
        console.warn("Invalid file data at index: " + currentFileIndex);
        currentFileIndex++;
        currentNumberIndex = 0;
        return getControlledNumber(); // Try next file
    }

    // Get current number
    if (currentNumberIndex >= currentFile.numbers.length) {
        currentFileIndex++;
        currentNumberIndex = 0;
        return getControlledNumber(); // Try next file
    }

    var number = currentFile.numbers[currentNumberIndex];
    currentNumberIndex++;

    console.log("Getting controlled number: " + number + " from file: " + currentFile.filename);
    return number;
}

var newnumber;
function generateNumber(){
    clearTimeout(genNum);
    genNum = null;
    $("#suspanceDiv").css('z-index', -3);
    waitEnable = false;

    var myNumber;
    var controlledNumber = getControlledNumber();

    if (controlledNumber !== null) {
        console.log("controlledNumber is NOT null");
        // Use controlled number
        myNumber = controlledNumber;
        // Find index of this number in the numbers array
        newnumber = numbers.indexOf(parseInt(myNumber));
    } else {
        console.log("controlledNumber is null");
        // Fallback to random if no controlled numbers available
        newnumber = Math.floor((Math.random() * (numbers.length)) + 0);
        myNumber = numbers[newnumber];
    }
    //FIXME
    // If number is not in the array (already used), try a random one
    if (newnumber === -1) {
        console.log("Number " + myNumber + " already used, selecting random number");
        newnumber = Math.floor((Math.random() * (numbers.length)) + 0);
        myNumber = numbers[newnumber];
    }

    lognumbers.push(myNumber);
    AddCircle(myNumber);

    if (typeof JSInterface === 'undefined'){
        myspeech(myNumber);
    } else {
        JSInterface.ConvertTextToSpeech(myNumber.toString());
    }

    $("#showNum").prop('textContent', myNumber);
    $("#numberDiv").css('z-index', 4);
    shownum = setTimeout("hideNum()", 2000);
}

function newNumberManual(mynumbermanual){
    genNum = setTimeout("generateNumberManual("+mynumbermanual+")", newNumberTime);
    waitEnable = true;
    Suspance();
    $("#suspanceDiv").css('z-index', 3);
}

function generateNumberManual(mynumbermanual){
    clearTimeout(genNum);
    genNum = null;
    $("#suspanceDiv").css('z-index', -3);
    waitEnable = false;

    var myNumber = mynumbermanual;

    newnumber = numbers.indexOf(parseInt(myNumber));

    lognumbers.push(myNumber);
    AddCircle(myNumber);

    if (typeof JSInterface === 'undefined'){
        myspeech(myNumber);
    } else {
        JSInterface.ConvertTextToSpeech(myNumber.toString());
    }

    $("#showNum").prop('textContent', myNumber);
    $("#numberDiv").css('z-index', 4);
    shownum = setTimeout("hideNum()", 2000);
}

function hideNum(){
    clearTimeout(shownum);
    shownum = null;
    $("#numberDiv").css('z-index', -3);

    afterSpeech();
}

function afterSpeech(){
    if (newnumber !== -1) {
        numbers.splice(newnumber, 1);
    }

    localStorage.setItem("Numbers", numbers.join(','));
    localStorage.setItem("LogNumbers", lognumbers.join(','));

    if (numbers.length < 1){
        modeState = "stop";
    } else {
        if (modeState == "start"){
            myTimer = setTimeout("autoNumber()", 4000);
        }
        if (modeState == "step"){
            SetBtnColors("stopBtn");
            modeState = "stop";
        }
    }
}

function myspeech(txtTospeech){
    var u = new SpeechSynthesisUtterance();
    u.text = txtTospeech;
    u.lang = 'it-IT';
    u.rate = 1.2;
    u.onend = function() { afterSpeech(); };
    speechSynthesis.speak(u);
}

var gx = 72;
var gy = 65;
function DrawTable(){
    // Table drawing code (unchanged)
    var c,r,px,py,num;
    var btnx = (gx*12)-(gx/3);
    var btny = gy/2;
    var btnh = 650/5;
    var myTable = '<svg id="tablesvg"  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 950 650" width="100%" height="100%" preserveAspectRatio="none" >';
    myTable += '<rect id="r1" x="4" y="4" width="796" height="646" fill-opacity="1" style="fill: #ffff00; stroke: #aa0000; stroke-width:6; "/>';

    myTable += '<g transform="translate(-'+(gx/2)+',-'+(gy/2)+')">';
    myTable += '<rect id="r1" x="'+gx+'" y="'+gy+'" width="'+(gx*5)+'" height="'+(gy*3)+'" fill-opacity="0" style="fill: #008800; stroke: red; stroke-width:4; "/>';
    myTable += '<rect id="r1" x="'+(gx*6)+'" y="'+gy+'" width="'+(gx*5)+'" height="'+(gy*3)+'" fill-opacity="0" style="fill: #00ff00; stroke: red; stroke-width:4; "/>';
    myTable += '<rect id="r1" x="'+gx+'" y="'+(gy*4)+'" width="'+(gx*5)+'" height="'+(gy*3)+'" fill-opacity="0" style="fill: #00ff00; stroke: red; stroke-width:4; "/>';
    myTable += '<rect id="r1" x="'+(gx*6)+'" y="'+(gy*4)+'" width="'+(gx*5)+'" height="'+(gy*3)+'" fill-opacity="0" style="fill: #00ff00; stroke: red; stroke-width:4; "/>';
    myTable += '<rect id="r1" x="'+gx+'" y="'+(gy*7)+'" width="'+(gx*5)+'" height="'+(gy*3)+'" fill-opacity="0" style="fill: #00ff00; stroke: red; stroke-width:4; "/>';
    myTable += '<rect id="r1" x="'+(gx*6)+'" y="'+(gy*7)+'" width="'+(gx*5)+'" height="'+(gy*3)+'" fill-opacity="0" style="fill: #00ff00; stroke: red; stroke-width:4; "/>';

    myTable += '<circle id="startBtn" class="start_btn" r=60 cx="'+(btnx + gx)+'" cy="'+(btny + btnh/2)+'" stroke="red" stroke-width="6" fill="#555500" > </circle>';
    myTable += '<circle id="stopBtn" class="stop_btn" r=60 cx="'+(btnx + gx)+'" cy="'+(btny + btnh + btnh/2)+'" stroke="red" stroke-width="6" fill="yellow" > </circle>';
    myTable += '<circle id="stepBtn" class="step_btn" r=60 cx="'+(btnx + gx)+'" cy="'+(btny + btnh*2 + btnh/2)+'" stroke="red" stroke-width="6" fill="#555500" > </circle>';
    myTable += '<circle id="restartBtn" class="restart_btn" r=60 cx="'+(btnx + gx)+'" cy="'+(btny + btnh*3 + btnh/2)+'" stroke="red" stroke-width="6" fill="#555500" > </circle>';
    myTable += '<circle id="settingsBtn" class="settings_btn" r=60 cx="'+(btnx + gx)+'" cy="'+(btny + btnh*4 + btnh/2)+'" stroke="red" stroke-width="6" fill="#555500" > </circle>';

    myTable += '</g>';

    myTable += '<g transform="translate('+(gx*12-(gx/8))+','+(gy/2)+')">';
    myTable += '<path class="start_btn" d="M0 0 L50 30 L0 60 Z" fill-opacity="1" style="fill: black; stroke: black; stroke-width:4; "/>';
    myTable += '</g>';

    myTable += '<g transform="translate('+(gx*12-(gx/6))+','+(gy*2.6)+')">';
    myTable += '<path class="stop_btn" d="M0 0 L50 0 L50 50 L0 50 Z" fill-opacity="1" style="fill: black; stroke: black; stroke-width:4; "/>';
    myTable += '</g>';

    myTable += '<g transform="translate('+(gx*12-(gx/8))+','+(gy*4.6)+')">';
    myTable += '<path class="step_btn" d="M0 0 L50 30 L0 60 Z" fill-opacity="1" style="fill: black; stroke: black; stroke-width:4; "/>';
    myTable += '<path class="step_btn" d="M40 0 L52 0 L52 60 L40 60 Z" fill-opacity="1" style="fill: black; stroke: black; stroke-width:4; "/>';
    myTable += '</g>';

    myTable += '<g transform="translate('+(gx*12-(gx/2.5))+','+(gy*6.3)+') scale(0.15)">';
    myTable += '<path class="restart_btn" d="M274.292,21.879C122.868,21.879,0,145.072,0,296.496C0,447.92,122.262,571.111,275.262,571.111v-91.799 c-100.98,0-183.462-82.012-183.462-182.816c0-100.806,81.362-182.817,182.168-182.817c98.753,0,179.413,78.718,182.661,176.696 h-45.236l90.799,127.541l90.799-127.541h-44.486C545.248,141.767,423.67,21.879,274.292,21.879z" fill-opacity="1" style="fill: black; stroke: black; stroke-width:4; "/>';
    myTable += '</g>';

    myTable += '<g transform="translate('+(gx*12-(gx/2.5))+','+(gy*8.3)+') scale(0.25)">';
    myTable += '<path class="settings_btn" d="M293.629,127.806l-5.795-13.739c19.846-44.856,18.53-46.189,14.676-50.08l-25.353-24.77l-2.516-2.12h-2.937 c-1.549,0-6.173,0-44.712,17.48l-14.184-5.719c-18.332-45.444-20.212-45.444-25.58-45.444h-35.765 c-5.362,0-7.446-0.006-24.448,45.606l-14.123,5.734C86.848,43.757,71.574,38.19,67.452,38.19l-3.381,0.105L36.801,65.032 c-4.138,3.891-5.582,5.263,15.402,49.425l-5.774,13.691C0,146.097,0,147.838,0,153.33v35.068c0,5.501,0,7.44,46.585,24.127 l5.773,13.667c-19.843,44.832-18.51,46.178-14.655,50.032l25.353,24.8l2.522,2.168h2.951c1.525,0,6.092,0,44.685-17.516 l14.159,5.758c18.335,45.438,20.218,45.427,25.598,45.427h35.771c5.47,0,7.41,0,24.463-45.589l14.195-5.74 c26.014,11,41.253,16.585,45.349,16.585l3.404-0.096l27.479-26.901c3.909-3.945,5.278-5.309-15.589-49.288l5.734-13.702 c46.496-17.967,46.496-19.853,46.496-25.221v-35.029C340.268,146.361,340.268,144.434,293.629,127.806z M170.128,228.474 c-32.798,0-59.504-26.187-59.504-58.364c0-32.153,26.707-58.315,59.504-58.315c32.78,0,59.43,26.168,59.43,58.315 C229.552,202.287,202.902,228.474,170.128,228.474z"/>';
    myTable += '</g>';

    for (var r = 1; r <= 9; r++) {
        for (var c = 1; c <= 10; c++) {
            num = (10*(r-1))+c;
            px = c*gx;
            py = r*gy;
            myTable += '<text id="n'+num+'" class="NumberTables" text-anchor="middle" alignment-baseline="middle" font-family="Arial" font-size="30" font-weight="bold" fill="red" x="'+px+'" y="'+py+'">'+num+'</text>';
        }
    }

    myTable += '</svg>';
    $("#numberTable").empty();
    $("#numberTable").append(myTable);
}

function AddCircle(num){
    var px,py,pyi;
    pyi = Math.floor(parseInt(num)/10);
    if ((parseInt(num) -(pyi*10)) == 0){
        py = ((pyi)*gy)-2;
        px = ((parseInt(num)+10)-(pyi*10))*gx;
    }
    else
    {
        py =  ((pyi)*gy)+gy-2;
        px = (num -(pyi*10))*gx;
    }
    var shape = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    shape.setAttributeNS(null, 'id','c'+num);
    shape.setAttributeNS(null, "cx", px);
    shape.setAttributeNS(null, "cy", py);
    shape.setAttributeNS(null, "r",  (gx/2.5));
    shape.setAttributeNS(null, "fill", "#aa0000");
    shape.setAttributeNS(null, "fill-opacity", 0.2);
    shape.setAttributeNS(null, "stroke", "#ff0000");
    shape.setAttributeNS(null, "stroke-width", 6);
    document.getElementById("tablesvg").appendChild(shape);
}

var rot=0;
var waitEnable = false;
function Suspance()
{
    if (waitEnable){
        document.getElementById("mywheel").setAttributeNS(null, "transform", "rotate("+rot+", 200, 200)");
        rot += 10;
        if (rot > 360){
            rot = 5;
        }
        setTimeout(Suspance, 150);
    }
}