const API_KEY = '91aaa0edd08d8750761cb0ff'; 
const BASE_URL = 'https://v6.exchangerate-api.com/v6';



const fromCurrency = document.getElementById('from-currency');
const toCurrency = document.getElementById('to-currency');
const amountInput = document.getElementById('amount');
const convertBtn = document.getElementById('convert-btn');
const swapBtn = document.getElementById('swap-btn');
const resultDiv = document.getElementById('result');
const resultText = document.getElementById('result-text');
const rateText = document.getElementById('rate-text');
const saveBtn = document.getElementById('save-btn');
const reviewList = document.getElementById('recent-list');
const clearRecentBtn = document.getElementById('clear-recent-btn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const histForm = document.getElementById('historical-form');
const histFrom = document.getElementById('hist-from');
const histTo = document.getElementById('hist-to');
const histDate = document.getElementById('hist-date');
const histResult = document.getElementById('hist-result');
const histText = document.getElementById('hist-text');
const histLoading = document.getElementById('hist-loading');
const histError = document.getElementById('hist-error');

let currencies = {};
let recentConversions = JSON.parse(localStorage.getItem('recentConversions')) || [];



histDate.max = new Date().toISOString().split('T')[0];



document.addEventListener('DOMContentLoaded', loadCurrencies);


async function loadCurrencies() {
    try {
        const response = await fetch(`${BASE_URL}/${API_KEY}/codes`);
        const data = await response.json();
        if (data.result === 'success') {
            currencies = {};
            // Clear existing options
            fromCurrency.innerHTML = '';
            toCurrency.innerHTML = '';
            histFrom.innerHTML = '';
            histTo.innerHTML = '';

            data.supported_codes.forEach(([code, name]) => {
                currencies[code] = name;
                const option = document.createElement('option');
                option.value = code;
                option.textContent = `${code} - ${name}`;
                fromCurrency.appendChild(option.cloneNode(true));
                toCurrency.appendChild(option.cloneNode(true));
                histFrom.appendChild(option.cloneNode(true));
                histTo.appendChild(option.cloneNode(true));
            });

            //  default selections
            fromCurrency.value = 'USD';
            toCurrency.value = 'EUR';
            histFrom.value = 'USD';
            histTo.value = 'EUR';
        } else {
            throw new Error('Failed to load currency codes');
        }
    } catch (error) {
        console.error('Error loading currencies:', error);
        // Fallback currencies if API fails
        currencies = {
            INR: 'Indian Rupee',
            USD: 'US Dollar',
            EUR: 'Euro',
            GBP: 'British Pound',
            JPY: 'Japanese Yen',
            AUD: 'Australian Dollar',
            CAD: 'Canadian Dollar',
        };
        fromCurrency.innerHTML = '';
        toCurrency.innerHTML = '';
        histFrom.innerHTML = '';
        histTo.innerHTML = '';
        Object.keys(currencies).forEach((code) => {
            fromCurrency.innerHTML += `<option value="${code}">${code} - ${currencies[code]}</option>`;
            toCurrency.innerHTML += `<option value="${code}">${code} - ${currencies[code]}</option>`;
            histFrom.innerHTML += `<option value="${code}">${code} - ${currencies[code]}</option>`;
            histTo.innerHTML += `<option value="${code}">${code} - ${currencies[code]}</option>`;
        });
        fromCurrency.value = 'USD';
        toCurrency.value = 'EUR';
        histFrom.value = 'USD';
        histTo.value = 'EUR';
    }
}

// Convert currency (ExchangeRate API)
convertBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const from = fromCurrency.value;
    const to = toCurrency.value;
    const amount = parseFloat(amountInput.value);

    if (!from || !to || isNaN(amount) || amount <= 0) {
        error.style.display = 'flex';
        return;
    }

    error.style.display = 'none';
    loading.style.display = 'flex';

    try {
        const response = await fetch(
            `${BASE_URL}/${API_KEY}/pair/${from}/${to}/${amount}`
        );
        const data = await response.json();

        if (data.result === 'success') {
            const rate = data.conversion_rate;
            const converted = data.conversion_result.toFixed(2);
            resultText.textContent = `${amount} ${from} = ${converted} ${to}`;
            rateText.textContent = `Exchange rate: 1 ${from} = ${rate} ${to}`;
            resultDiv.style.display = 'block';
            window.currentConversion = { from, to, amount, converted, rate };
        } else {
            throw new Error(data.error_type || 'Conversion failed');
        }
    } catch (err) {
        console.error(err);
        resultDiv.style.display = 'none';
        error.style.display = 'flex';
    } finally {
        loading.style.display = 'none';
    }
});

// Swap currencies
swapBtn.addEventListener('click', () => {
    const temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;
});

// Save to recent
saveBtn.addEventListener('click', () => {
    if (window.currentConversion) {
        const conversion = window.currentConversion;
        recentConversions.unshift({
            from: conversion.from,
            to: conversion.to,
            amount: conversion.amount,
            converted: conversion.converted,
            rate: conversion.rate,
            date: new Date().toLocaleString(),
        });
        if (recentConversions.length > 10) recentConversions.pop();
        localStorage.setItem(
            'recentConversions',
            JSON.stringify(recentConversions)
        );
        displayRecent();
    }
});

// Display recent conversions
function displayRecent() {
    reviewList.innerHTML = '';
    if (recentConversions.length === 0) {
        reviewList.innerHTML =
            '<li class="p-3 bg-white bg-opacity-10 rounded-lg">No recent conversions saved.</li>';
        return;
    }
    recentConversions.forEach((conv) => {
        const li = document.createElement('li');
        li.className = 'p-3 bg-white bg-opacity-10 rounded-lg';
        li.textContent = `${conv.amount} ${conv.from} = ${conv.converted} ${conv.to} (Rate: ${conv.rate}) at ${conv.date}`;
        reviewList.appendChild(li);
    });
}

// Clear recent conversions
clearRecentBtn.addEventListener('click', () => {
    recentConversions = [];
    localStorage.removeItem('recentConversions');
    displayRecent();
});

// Display recent on load
displayRecent();

// Historical rates (Frankfurter API)
histForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const from = histFrom.value;
    const to = histTo.value;
    const date = histDate.value;

    if (!from || !to || !date) {
        histError.style.display = 'flex';
        return;
    }

    histError.style.display = 'none';
    histLoading.style.display = 'flex';
    histResult.style.display = 'none';

    try {
        const response = await fetch(
            `https://api.frankfurter.app/${date}?from=${from}&to=${to}`
        );
        const data = await response.json();

        if (data.rates && data.rates[to]) {
            const rate = data.rates[to];
            histText.textContent = `Historical rate on ${date}: 1 ${from} = ${rate} ${to}`;
            histResult.style.display = 'block';
        } else {
            throw new Error('Failed to fetch historical data');
        }
    } catch (err) {
        console.error(err);
        histResult.style.display = 'none';
        histError.style.display = 'flex';
    } finally {
        histLoading.style.display = 'none';
    }
});
