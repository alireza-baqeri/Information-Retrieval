'use strict';
document.getElementById('analyzeBtn').addEventListener('click', () => {
    const inputStr = document.getElementById('docIdsInput').value;
    const resultsDiv = document.getElementById('results');
    const errorDiv = document.getElementById('error');

    // Reset UI
    resultsDiv.classList.add('hidden');
    errorDiv.classList.add('hidden');

    try {
        const docIds = parseInput(inputStr);
        if (docIds.length === 0) {
            throw new Error("لیست ورودی نمی‌تواند خالی باشد.");
        }

        // 1. Gap Encoding
        const gaps = encodeGaps(docIds);

        // 2. Variable Byte Encoding
        const vbEncodedBytes = vbEncode(gaps);

        // 3. Variable Byte Decoding (for time measurement and verification)
        const startTime = performance.now();
        const vbDecodedGaps = vbDecode(vbEncodedBytes);
        const endTime = performance.now();
        const decodeTime = (endTime - startTime).toFixed(4);

        // 4. Display results
        displayResults(docIds, gaps, vbEncodedBytes, decodeTime);
        resultsDiv.classList.remove('hidden');

    } catch (e) {
        errorDiv.textContent = `خطا: ${e.message}`;
        errorDiv.classList.remove('hidden');
    }
});

function parseInput(inputStr) {
    // FIX 1: Return an empty array for empty input to prevent errors.
    if (!inputStr.trim()) return [];

    const parts = inputStr.split(',').map(s => s.trim());
    const numbers = parts.map(p => {
        const num = parseInt(p, 10);
        // FIX 2: Use logical OR (||) instead of bitwise OR (|) for clarity and correctness.
        if (isNaN(num) || num < 0) {
            throw new Error(`مقدار نامعتبر در ورودی: "${p}"`);
        }
        return num;
    });

    // Check if sorted
    for (let i = 0; i < numbers.length - 1; i++) {
        if (numbers[i] >= numbers[i+1]) {
            throw new Error("شناسه‌های اسناد باید به صورت صعودی و بدون تکرار باشند.");
        }
    }
    return numbers;
}

function encodeGaps(docIds) {
    if (docIds.length === 0) return [];

    // FIX 3 (CRITICAL LOGIC): Initialize with the first element, not the whole array.
    const gaps = [docIds[0]];

    for (let i = 1; i < docIds.length; i++) {
        gaps.push(docIds[i] - docIds[i - 1]);
    }
    return gaps;
}

function vbEncode(numbers) {
    // FIX 4 (SYNTAX): Initialize empty array correctly.
    const allBytes = [];

    for (const num of numbers) {
        let n = num;
        // FIX 5 (SYNTAX): Initialize empty array correctly.
        const bytesForNum = [];

        while (true) {
            const sevenBits = n & 0x7F;
            n >>>= 7;
            if (n === 0) {
                bytesForNum.unshift(sevenBits);
                break;
            }
            bytesForNum.unshift(sevenBits | 0x80);
        }
        allBytes.push(...bytesForNum);
    }
    return new Uint8Array(allBytes);
}

function vbDecode(byteArray) {
    // FIX 6 (SYNTAX): Initialize empty array correctly.
    const numbers = [];
    let n = 0;

    for (const byte of byteArray) {
        if ((byte & 0x80) === 0) {
            n = (n << 7) | byte;
            numbers.push(n);
            n = 0;
        } else {
            n = (n << 7) | (byte & 0x7F);
        }
    }
    return numbers;
}

function displayResults(docIds, gaps, vbEncodedBytes, decodeTime) {
    document.getElementById('originalList').textContent = docIds.join(', ');
    document.getElementById('gapList').textContent = gaps.join(', ');

    const hexString = Array.from(vbEncodedBytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    document.getElementById('vbStream').textContent = hexString;

    const originalSize = docIds.length * 4;
    const compressedSize = vbEncodedBytes.length;

    // Avoid division by zero if compressed size is 0
    const ratio = compressedSize > 0 ? (originalSize / compressedSize).toFixed(2) : "N/A";

    document.getElementById('originalSize').textContent = `${originalSize} بایت`;
    document.getElementById('compressedSize').textContent = `${compressedSize} بایت`;
    document.getElementById('compressionRatio').textContent = `${ratio} : 1`;
    document.getElementById('decodeTime').textContent = `${decodeTime} میلی‌ثانیه`;
}


/* --- Dropdown Menu Logic --- */
const researchersBtn = document.getElementById('researchersBtn');
const researchersDropdown = document.getElementById('researchersDropdown');

researchersBtn.addEventListener('click', () => {
    researchersDropdown.classList.toggle('show');
});

// Close the dropdown if the user clicks outside of it
window.onclick = function(event) {
    if (!event.target.matches('.dropdown-btn')) {
        if (researchersDropdown.classList.contains('show')) {
            researchersDropdown.classList.remove('show');
        }
    }
}
