let inputs = document.querySelectorAll('#calc-input');

const addInput = document.querySelector('#add-input');
const main = document.querySelector('main');

const form = document.querySelector('#form');

addInput.addEventListener('click', () => {
    const newInput = document.createElement('input');
    newInput.type = 'number';
    newInput.id = 'calc-input';
    form.appendChild(newInput);

    inputs = document.querySelectorAll('#calc-input');
    inputs.forEach((input) => {
        input.addEventListener('input', count);
    });
}
);

function count() {
    main.innerHTML = '';

    const inputValues = [];
    inputs.forEach((input) => {
        inputValues.push(input.value);
    });

    const sum = inputValues.reduce((acc, val) => {
        return acc + parseInt(val);
    }, 0);

    const average = sum / inputValues.length;
    const min = Math.min(...inputValues);
    const max = Math.max(...inputValues);

    const results = document.createElement('div');

    const sumParagraph = document.createElement('p');
    sumParagraph.textContent = `sum: ${sum}`;
    results.appendChild(sumParagraph);

    const avgParagraph = document.createElement('p');
    avgParagraph.textContent = `avg: ${average}`;
    results.appendChild(avgParagraph);

    const minParagraph = document.createElement('p');
    minParagraph.textContent = `min: ${min}`;
    results.appendChild(minParagraph);

    const maxParagraph = document.createElement('p');
    maxParagraph.textContent = `max: ${max}`;
    results.appendChild(maxParagraph);

    main.appendChild(results);
}

inputs.forEach((input) => {
    input.addEventListener('input', count);
}
);



const user = {
    oddychaj: function () {}
}