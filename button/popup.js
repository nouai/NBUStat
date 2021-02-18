const ENDPOINT = 'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange';
const NBU_STAT_DATE = 'NBUStatDate';
const NBU_STAT_CURRENCY = 'NBUStatCurrency';

const ElementId = {
    RATE_URL: 'rateUrl',
    CURRENCY: 'currency',
    Date: {
        DAY: 'dd',
        MONTH: 'mm',
        YEAR: 'yyyy'
    },
    GO: 'go',
    TODAY: 'today',
    SEPARATOR: 'separator',
    RATE: 'rate'
}

const TagName = {
    TEXT_AREA: 'textarea',
    OPTION: 'option'
}

const EventListener = {
    CLICK: 'click',
    CHANGE: 'change'
}

const ValidatorType = {
    CURRENCY_LIST: 'cc',
    RATE: 'rate'
}

const PreSelectedCurrencies = {
    USD: 'USD',
    EUR: 'EUR'
}


var today = new Date();
var normalizedToday;
var dd;
var mm;
var yyyy;


function setDateFields(d, m, y) {
    dd = d;
    mm = m;
    yyyy = y;
    document.getElementById(ElementId.Date.DAY).value = dd;
    document.getElementById(ElementId.Date.MONTH).value = mm;
    document.getElementById(ElementId.Date.YEAR).value = yyyy;
}

function setCurrency(c) {
    document.getElementById(ElementId.CURRENCY).value = c;
}

function populateCurrencies(info) {
    var currency = document.getElementById(ElementId.CURRENCY);
    if (info[0].cc != null) {
        for (var i = 0; i < info.length; i++) {
            var opt = info[i].cc;
            if (opt && (opt !== PreSelectedCurrencies.EUR || opt !== PreSelectedCurrencies.USD)) {
                var el = document.createElement(TagName.OPTION);
                el.id = opt;
                el.textContent = opt;
                el.value = opt;
                el.text = opt;
                currency.appendChild(el);
            }
        }
    }
    var prevCurrency = localStorage.getItem(NBU_STAT_CURRENCY);
    if (prevCurrency != null) {
        setCurrency(prevCurrency);
    }
}

function onLoad() {
    var prevDate = localStorage.getItem(NBU_STAT_DATE);
    var date;
    if (prevDate != null) {
        date = localStorage.getItem(NBU_STAT_DATE);
    }
    if (date != null && isValidNumber(date)) {
        yyyy = date.substring(0, 4);
        mm = date.substring(4, 6);
        dd = date.substring(6, 8);
    } else {
        localStorage.removeItem(NBU_STAT_DATE);
        yyyy = today.getFullYear();
        mm = today.getMonth() + 1;  //January is 0!
        dd = today.getDate();
    }

    normalizeDate(dd, mm, yyyy);
    date = '' + yyyy + mm + dd;

    var url = ENDPOINT + '?date=' + date + '&json';
    httpGetAsync(url, function (responseText) {
        var info = JSON.parse(responseText);
        if (isValidResponse(info, ValidatorType.CURRENCY_LIST)) {
            populateCurrencies(info);

            document.getElementById(ElementId.CURRENCY).addEventListener(EventListener.CHANGE, onCurrencyChanged);
            document.getElementById(ElementId.TODAY).addEventListener(EventListener.CLICK, onToday);
            document.getElementById(ElementId.GO).addEventListener(EventListener.CLICK, onGo);
            document.getElementById(ElementId.RATE).addEventListener(EventListener.CLICK, onCopy);

            document.getElementById(ElementId.GO).disabled = false;

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

function isValidNumber(data) {
    return !isNaN(Number(data));
}

function isValidResponse(response, validatorType) {
    return response != null && response[0] != null && response[0][validatorType] != null;
}

function httpGetAsync(theUrl, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.send(null);
}

function processRate(currency) {
    var isValid = Date.parse('' + yyyy + '-' + mm + '-' + dd);
    if (isValid) {
        var date = '' + yyyy + mm + dd;
        var url = ENDPOINT + '?json&valcode=' + currency + '&date=' + date;

        updateRateUrl(url);

        if (date === normalizedToday) {
            localStorage.removeItem(NBU_STAT_DATE, date);
        } else {
            localStorage.setItem(NBU_STAT_DATE, date);
        }

        var rate = sessionStorage.getItem(url);
        if (rate != null) {
            showRate(rate);
        } else {
            httpGetAsync(url, function (responseText) {
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
    localStorage.setItem(NBU_STAT_CURRENCY, document.getElementById(ElementId.CURRENCY).value);
}

function onGo() {
    normalizeDate(document.getElementById(ElementId.Date.DAY).value,
        document.getElementById(ElementId.Date.MONTH).value,
        document.getElementById(ElementId.Date.YEAR).value);
    processRate(document.getElementById(ElementId.CURRENCY).value);
}

function onToday() {
    normalizeDate(today.getDate(), today.getMonth() + 1, today.getFullYear());  //January is 0!
    normalizedToday = '' + yyyy + mm + dd;
    processRate(document.getElementById(ElementId.CURRENCY).value);

    document.getElementById(ElementId.GO).disabled = false;
}

function copyStringToClipboard(str) {
    // Create new element
    var el = document.createElement(TagName.TEXT_AREA);
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
    copyStringToClipboard(document.getElementById(ElementId.RATE).value);
}

function showRate(rate) {
    document.getElementById(ElementId.RATE).value = rate;
    document.getElementById(ElementId.RATE).hidden = false;
    document.getElementById(ElementId.SEPARATOR).hidden = false;
}

function hideRate() {
    document.getElementById(ElementId.RATE).value = '';
    document.getElementById(ElementId.RATE).hidden = true;
    document.getElementById(ElementId.SEPARATOR).hidden = true;
}

function updateRateUrl(url) {
    document.getElementById(ElementId.RATE_URL).href = url;
}