window.createFormGroup = function() {
    function createFormGroup() {
        const formGroup = document.createElement('div');
        formGroup.className = 'mb-3';
        return formGroup;
    }

    function createLabel(text) {
        const label = document.createElement('label');
        label.textContent = text;
        return label;
    }

    function createTextInput(name, placeholder) {
        const input = document.createElement('input');
        input.type = 'text';
        input.name = name;
        input.placeholder = placeholder;
        input.className = 'form-control';
        return input;
    }

    function createNumberInput(name, placeholder) {
        const input = document.createElement('input');
        input.type = 'number';
        input.name = name;
        input.placeholder = placeholder;
        input.className = 'form-control';
        return input;
    }

    function createRadioInput(name, value) {
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = name;
        input.value = value;
        input.className = 'form-check-input';
        return input;
    }

    function createFileInput(name) {
        const input = document.createElement('input');
        input.type = 'file';
        input.name = name;
        input.className = 'form-control';
        return input;
    }

    function createFormCheck() {
        const formCheck = document.createElement('div');
        formCheck.className = 'form-check form-check-inline';
        return formCheck;
    }

// ... (Kod odpowiedzialny za pobieranie restauracji i kategorii)

    kategorie.forEach((kategoria) => {
        const kategoriaDiv = document.createElement('div');
        const kategoriaHeader = document.createElement('h3');
        kategoriaHeader.textContent = kategoria.nazwa;
        kategoriaHeader.className = 'mb-3';
        kategoriaDiv.appendChild(kategoriaHeader);

        const pytaniaLista = document.createElement('ul');
        kategoria.pytania.forEach((pytanie) => {
            const pytanieLi = document.createElement('li');
            pytanieLi.textContent = pytanie.tresc;
            pytanieLi.className = 'mb-2';

            const ocenaDiv = document.createElement('div');
            for (let i = 1; i <= 5; i++) {
                const formCheck = createFormCheck();

                const radioInput = createRadioInput(`ocena_${pytanie._id}`, i);
                formCheck.appendChild(radioInput);

                const label = createLabel(i);
                label.className = 'form-check-label';
                formCheck.appendChild(label);

                ocenaDiv.appendChild(formCheck);
            }
            ocenaDiv.className = 'mb-2';

            const komentarzInput = createTextInput(`komentarz_${pytanie._id}`, 'Dodatkowy komentarz');

            const zdjecieInput = createFileInput(`zdjecie_${pytanie._id}`);

            pytanieLi.appendChild(ocenaDiv);
            pytanieLi.appendChild(komentarzInput);
            pytanieLi.appendChild(zdjecieInput);
            pytaniaLista.appendChild(pytanieLi);
        });

        kategoriaDiv.appendChild(pytaniaLista);
        form.appendChild(kategoriaDiv);
    });
}