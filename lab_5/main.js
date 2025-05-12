const asyncAdd = async (a, b) => {
    if (typeof a !== "number" || typeof b !== "number") {
        return Promise.reject("Argumenty muszą mieć typ number!");
    }
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(a + b);
        }, 100);
    });
};

const sumNumbersSequentially = async (...numbers) => {
    let operationsCount = 0;
    if (numbers.length === 0)
        return { result: 0, operations: operationsCount };
    let currentSum = numbers[0];
    for (let i = 1; i < numbers.length; i++) {
        try {
            currentSum = await asyncAdd(currentSum, numbers[i]);
            operationsCount++;
        } catch (error) {
            console.error("Blad w sumNumbersSequentially:", error);
            throw error;
        }
    }
    return { result: currentSum, operations: operationsCount };
};

const sumNumbersOptimized = async (...initialNumbers) => {
    let totalOperations = 0;
    if (initialNumbers.length === 0)
        return { result: 0, operations: totalOperations };
    if (initialNumbers.length === 1)
        return { result: initialNumbers[0], operations: totalOperations };

    let numbersToProcess = [...initialNumbers];
    while (numbersToProcess.length > 1) {
        const promises = [];
        const nextBatchCarryOver = [];
        for (let i = 0; i < numbersToProcess.length; i += 2) {
            if (i + 1 < numbersToProcess.length) {
                promises.push(
                    asyncAdd(numbersToProcess[i], numbersToProcess[i + 1])
                );
                totalOperations++;
            } else {
                nextBatchCarryOver.push(numbersToProcess[i]);
            }
        }
        try {
            const resolvedSumsFromBatch = await Promise.all(promises);
            numbersToProcess = [
                ...resolvedSumsFromBatch,
                ...nextBatchCarryOver,
            ];
        } catch (error) {
            console.error("Blad w sumNumbersOptimized:", error);
            throw error;
        }
    }
    return { result: numbersToProcess[0], operations: totalOperations };
};

async function runAndDisplayTest(
    sumFunction,
    data,
    description,
    outputElementId
) {
    const outputElement = document.getElementById(outputElementId);
    if (!outputElement) {
        console.error(`Nie znaleziono elementu o id: ${outputElementId}`);
        return;
    }
    outputElement.className =
        "mb-5 p-4 border border-gray-300 rounded-md bg-white shadow-sm";
    outputElement.innerHTML = `<h3 class="text-xl font-semibold mb-2 text-gray-700">${description}</h3><p class="text-gray-600 italic">Przetwarzanie...</p>`;

    const startTime = performance.now();
    try {
        const { result, operations } = await sumFunction(...data);
        const endTime = performance.now();
        const duration = endTime - startTime;

        outputElement.innerHTML = `
            <h3 class="text-xl font-semibold mb-2 text-gray-700">${description}</h3>
            <p class="my-1"><strong>Dane wejsciowe:</strong> ${data.length
            } elementow</p>
            <p class="my-1"><strong>Wynik sumowania:</strong> ${result}</p>
            <p class="my-1"><strong>Czas wykonania:</strong> ${duration.toFixed(
                2
            )} ms</p>
            <p class="my-1"><strong>Ilośc operacji <code>asyncAdd</code>:</strong> ${operations}</p>
        `;
    } catch (error) {
        outputElement.innerHTML = `
            <h3 class="text-xl font-semibold mb-2 text-gray-700">${description}</h3>
            <p class="my-1 text-red-600 font-semibold"><strong>Wystąpił blad:</strong> ${error}</p>
        `;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const runTestsButton = document.getElementById("runTestsButton");
    const resultsArea = document.getElementById("resultsArea");
    const loader = document.getElementById("loader");

    runTestsButton.addEventListener("click", async () => {
        runTestsButton.disabled = true;
        loader.style.display = "block";
        resultsArea.innerHTML = `
            <div id="sequentialResults"></div>
            <div id="optimizedResults"></div>
        `;

        const testData = Array.from({ length: 100 }, (_, i) => i + 1);

        await runAndDisplayTest(
            sumNumbersSequentially,
            testData,
            "Sumowanie sekwencyjne",
            "sequentialResults"
        );
        await runAndDisplayTest(
            sumNumbersOptimized,
            testData,
            "Sumowanie zoptymalizowane (rownoległe)",
            "optimizedResults"
        );

        loader.style.display = "none";
        runTestsButton.disabled = false;
    });
});