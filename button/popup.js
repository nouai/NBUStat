var today = new Date();
var normalizedToday;
var dd;
var mm;
var yyyy;
    
var ValidatorType = {
  CURRENCY_LIST: "cc",
  RATE: "rate"
}

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
    if (notNull(info[0].cc)) {
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
    if (notNull(prevCurrency)) {
        setCurrency(prevCurrency);
    }
}

function onLoad() {
    var prevDate = localStorage.getItem('NBUStatDate');
    var date;
    if (notNull(prevDate)) {
        date = localStorage.getItem('NBUStatDate');
    }
    if (notNull(date) && isNumber(date)) {
        yyyy = date.substring(0, 4);
        mm = date.substring(4, 6);
        dd = date.substring(6, 8);
    } else {
        localStorage.removeItem('NBUStatDate');
        yyyy = today.getFullYear();
        mm = today.getMonth() + 1;  //January is 0!
        dd = today.getDate();
    }
    
    normalizeDate(dd, mm, yyyy);
    date = '' + yyyy + mm + dd;
    
    var url = 'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?date=' + date + '&json';
    httpGetAsync(url, function(responseText) {
        var info = JSON.parse(responseText);
        if (isValidResponse(info, ValidatorType.CURRENCY_LIST)) {
            populateCurrencies(info);
            
            document.getElementById('currency').addEventListener('change', onCurrencyChanged);
            document.getElementById('today').addEventListener('click', onToday);
            document.getElementById('go').addEventListener('click', onGo);
            document.getElementById('rate').addEventListener('click', onCopy);
            
            document.getElementById('go').disabled = false;
            
            onGo();
        }
    });
}

document.addEventListener("DOMContentLoaded", onLoad);

function normalizeNumber(n, len, max, prefix) {
    var nn = '' + n;
    if (Number(n) && nn.length < len && n < max) {
        n = prefix + nn;
    }
    return n;
}

function normalizeDate(dd, mm, yyyy) {
    dd = normalizeNumber(dd, 2, 10, '0');
    mm = normalizeNumber(mm, 2, 10, '0');
    yyyy = normalizeNumber(yyyy, 4, 100, '20');
    
    setDateFields(dd, mm, yyyy);
}

function isNull(data) {
    if (data == null || data === undefined) {
        return true;
    }
    return false;
}

function isNumber(data) {
    return !isNaN(Number(data));
}

function notNull(data) {
    return !isNull(data);
}

function isValidResponse(response, validatorType) {
    return notNull(response) && notNull(response[0]) && notNull(response[0][validatorType]);
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
        
        updateRateUrl(url);
        
        if (date == normalizedToday) {
            localStorage.removeItem('NBUStatDate', date);
        } else {
            localStorage.setItem('NBUStatDate', date);
        }
        
        var rate = sessionStorage.getItem(url);
        if (notNull(rate)) {
            showRate(rate);
        } else {
            httpGetAsync(url, function(responseText) {
                var info = JSON.parse(responseText);
                if (isValidResponse(info, ValidatorType.RATE)) {
                    rate = info[0].rate;
                    showRate(rate);
                    sessionStorage.setItem(url, rate);
                }
            });
        }
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
    normalizedToday = '' + yyyy + mm + dd;
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

function updateRateUrl(url) {
    document.getElementById("rateUrl").href = url;
}