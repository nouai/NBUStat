var today = new Date();
var dd;
var mm;
var yyyy;

function setDateFields(d, m, y) {
    dd = d;
    mm = m;
    yyyy = y;
    document.getElementById('dd').value = dd;
    document.getElementById('mm').value = mm;
    document.getElementById('yyyy').value = yyyy;
}

function setCurrency(c) {
    document.getElementById('currency').value = c;
}

function populateCurrencies(info) {
    var currency = document.getElementById('currency');
    if (info) {
        for (var i = 0; i < info.length; i++) {
            var opt = info[i].cc;
            if (opt && opt != 'USD') {
                var el = document.createElement("option");
                el.id = opt;
                el.textContent = opt;
                el.value = opt;
                el.text = opt;
                currency.appendChild(el);
            }
        }
    }
    var prevCurrency = localStorage.getItem('NBUStatCurrency');
    if (prevCurrency) {
        setCurrency(prevCurrency);
    }
}

function onLoad() {
    var prevDate = localStorage.getItem('NBUStatDate');
    var date;
    if (prevDate) {
        date = localStorage.getItem('NBUStatDate');
    }
    if (date) {
        yyyy = date.substring(0, 4);
        mm = date.substring(4, 6);
        dd = date.substring(6, 8);
        setDateFields(dd, mm, yyyy);
    } else {
        normalizeDate(today.getDate(), today.getMonth() + 1, today.getFullYear());  //January is 0!
        date = '' + yyyy + mm + dd;
    }
    
    var url = 'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?date=' + date + '&json';
    var request = httpGetAsync(url, function(responseText) {
        var info = JSON.parse(responseText);
        if (info[0]) {
            populateCurrencies(info);
        }
    });
    document.getElementById('currency').addEventListener('change', onCurrencyChanged);
    document.getElementById('today').addEventListener('click', onToday);
    document.getElementById('go').addEventListener('click', onGo);
    document.getElementById('rate').addEventListener('click', onCopy);
    
    document.getElementById('go').disabled = false;
}

document.addEventListener("DOMContentLoaded", onLoad);

function normalizeNumber(n, len, max, def) {
    var nn = '' + n;
    if (Number(n) && nn.length < len && n < max) {
        n = def + nn;
    }
    return n;
}

function normalizeDate(dd, mm, yyyy) {
    dd = normalizeNumber(dd, 2, 10, '0');
    mm = normalizeNumber(mm, 2, 10, '0');
    yyyy = normalizeNumber(yyyy, 4, 100, '20');
    
    setDateFields(dd, mm, yyyy);
}

function httpGetAsync(theUrl, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.send(null);
}

function processRate(currency) {
    var isValid = Date.parse('' + yyyy + '-' + mm + '-' + dd);
    if (isValid) {
        var date = '' + yyyy + mm + dd;
        var url = 'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json&valcode=' + currency + '&date=' + date;
        var request = httpGetAsync(url, function(responseText) {
            var info = JSON.parse(responseText);
            if (info[0]) {
                showRate(info[0].rate);
                localStorage.setItem('NBUStatDate', '' + yyyy + mm + dd);
            }
        });
    } else {
        hideRate();
    }
}

function onCurrencyChanged() {
    onGo();
    localStorage.setItem('NBUStatCurrency', document.getElementById('currency').value);
}

function onGo() {
    normalizeDate(document.getElementById('dd').value,
                  document.getElementById('mm').value,
                  document.getElementById('yyyy').value);
    processRate(document.getElementById('currency').value);
}

function onToday() {
    normalizeDate(today.getDate(), today.getMonth() + 1, today.getFullYear());  //January is 0!
    processRate(document.getElementById('currency').value);
    
    document.getElementById('go').disabled = false;
}

function copyStringToClipboard(str) {
   // Create new element
   var el = document.createElement('textarea');
   // Set value (string to be copied)
   el.value = str;
   // Set non-editable to avoid focus and move outside of view
   el.setAttribute('readonly', '');
   el.style = {position: 'absolute', left: '-9999px'};
   document.body.appendChild(el);
   // Select text inside element
   el.select();
   // Copy text to clipboard
   document.execCommand('copy');
   // Remove temporary element
   document.body.removeChild(el);
}

function onCopy() {
    copyStringToClipboard(document.getElementById("rate").value);
}

function showRate(rate) {
    document.getElementById("rate").value = rate;
    document.getElementById("separator").hidden = false;
    document.getElementById("rate").hidden = false;
}

function hideRate() {
    document.getElementById("rate").value = '';
    document.getElementById("separator").hidden = true;
    document.getElementById("rate").hidden = true;
}