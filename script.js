const {
    createFormGroup,
    createLabel,
    createTextInput,
    createNumberInput,
    createRadioInput,
    createFileInput,
    createFormCheck
} = window;

function generujIdFormularza() {
    return Date.now();
}

async function pobierzRestauracje() {
    const response = await fetch('localhost:8080/api/restauracje');
    return restauracje;
}

async function pobierzKategorie(restauracjaId) {
    const response = await fetch(`localhost:8080/api/restauracje/${restauracjaId}`);
    const kategorie = await response.json();
    globalneKategorie = kategorie;
    return kategorie;
}

function wyswietlRestauracje(restauracje) {
    const restauracjeDiv = document.getElementById('restauracje');
    restauracjeDiv.innerHTML = '';

    const select = document.createElement('select');
    select.id = 'restauracjeSelect';
    select.onchange = async () => {
        const selectedIndex = select.selectedIndex;
        const restauracja = restauracje[selectedIndex - 1]; 

        if (restauracja) {
            const kategorie = await pobierzKategorie(restauracja._id);
            wyswietlKategorie(kategorie, restauracja.nazwa);
        } else {
            // Czyszczenie kategorii, gdy wybrano "Wybierz restaurację"
            const kategorieDiv = document.getElementById('kategorie');
            kategorieDiv.innerHTML = '';
            globalneKategorie = null; 
        }
    };

    // Dodajemy opcję "Wybierz restaurację" jako pierwszą opcję na liście
    const defaultOption = document.createElement('option');
    defaultOption.textContent = 'Wybierz restaurację';
    defaultOption.selected = true;
    defaultOption.disabled = true;
    select.appendChild(defaultOption);

    // Dodajemy opcje dla każdej restauracji
    restauracje.forEach((restauracja) => {
        const option = document.createElement('option');
        option.textContent = restauracja.nazwa;
        option.value = restauracja._id;
        option.classList.add('select-restauracja');
        select.appendChild(option);
    });

    restauracjeDiv.appendChild(select);
}

//Podgląd obrazu przed jego załadowaniem
function previewImage(input, previewContainer) {
    previewContainer.innerHTML = ''; 

    if (input.files && input.files.length > 0) {
        Array.from(input.files).forEach((file) => {
            const reader = new FileReader();

            reader.onload = function (e) {
                const image = document.createElement('img');
                image.src = e.target.result;
                image.style.maxWidth = '100px';
                image.style.marginRight = '10px';
                previewContainer.appendChild(image);
            };

            reader.readAsDataURL(file);
        });
    }
}
function wyswietlKategorie(kategorie, nazwaRestauracji) {
    const kategorieDiv = document.getElementById('kategorie');
    kategorieDiv.innerHTML = '';

    const form = document.createElement('form');
    form.id = 'ankieta';

    const row1 = document.createElement('div');
    row1.classList.add('form-row');

    const imieInput = document.createElement('input');
    imieInput.type = 'text';
    imieInput.name = 'imie';
    imieInput.placeholder = 'Imię';
    imieInput.dataset.ignore = true;
    imieInput.classList.add('input-field');
    row1.appendChild(imieInput);

    const dataWizytyInput = document.createElement('input');
    dataWizytyInput.type = 'date';
    dataWizytyInput.name = 'data_wizyty';
    dataWizytyInput.dataset.ignore = true;
    dataWizytyInput.classList.add('input-field');
    row1.appendChild(dataWizytyInput);

    const przedzialCzasowyInput = document.createElement('input');
    przedzialCzasowyInput.type = 'text';
    przedzialCzasowyInput.name = 'przedzial_czasowy';
    przedzialCzasowyInput.placeholder = 'Przedział czasowy';
    przedzialCzasowyInput.dataset.ignore = true;
    przedzialCzasowyInput.classList.add('input-field');
    row1.appendChild(przedzialCzasowyInput);

    form.appendChild(row1);

    const row2 = document.createElement('div');
    row2.classList.add('form-row');

    const liczbaKlientowInput = document.createElement('input');
    liczbaKlientowInput.type = 'number';
    liczbaKlientowInput.name = 'liczba_klientow';
    liczbaKlientowInput.placeholder = 'Liczba klientów';
    liczbaKlientowInput.dataset.ignore = true;
    liczbaKlientowInput.classList.add('input-field');
    row2.appendChild(liczbaKlientowInput);

    const liczbaPracownikowInput = document.createElement('input');
    liczbaPracownikowInput.type = 'number';
    liczbaPracownikowInput.name = 'liczba_pracownikow';
    liczbaPracownikowInput.placeholder = 'Liczba pracowników';
    liczbaPracownikowInput.dataset.ignore = true;
    liczbaPracownikowInput.classList.add('input-field');
    row2.appendChild(liczbaPracownikowInput);

    form.appendChild(row2);

    kategorie.forEach((kategoria, i) => {
        const kategoriaDiv = document.createElement('div');
        const kategoriaHeader = document.createElement('h3');
        kategoriaHeader.textContent = `${i + 1}. ${kategoria.nazwa}`; // Dodano numerowanie kategorii
        kategoriaHeader.classList.add('category-title'); // Dodaj klasę category-title do elementu <h3>
        kategoriaDiv.appendChild(kategoriaHeader);

        const pytaniaLista = document.createElement('ul');
        kategoria.pytania.forEach((pytanie, j) => {
            const pytanieLi = document.createElement('li');
            pytanieLi.textContent = `${i + 1}.${j + 1}. ${pytanie.tresc}`; // Dodano numerowanie pytań
            pytanieLi.classList.add('question-separator'); // Dodaj klasę question-separator do elementu <li>

            // Dodajemy pytanieLi do pytaniaLista
            pytaniaLista.appendChild(pytanieLi);


        // Dodajemy pytaniaLista do kategoriaDiv
        kategoriaDiv.appendChild(pytaniaLista);

        // Dodajemy kategoriaDiv do form
        form.appendChild(kategoriaDiv);



            const ocenaDiv = document.createElement('div');
            for (let i = 1; i <= 6; i++) {
                const radioInput = document.createElement('input');
                radioInput.type = 'radio';
                radioInput.name = `ocena_${pytanie._id}`;
                radioInput.value = i;
                ocenaDiv.appendChild(radioInput);

                const label = document.createElement('label');
                label.textContent = i;

                // margines do etykiety, aby stworzyć odstęp między przyciskami
                label.style.marginRight = '20px';

                ocenaDiv.appendChild(label);
            }


            const komentarzInput = document.createElement('input');
            komentarzInput.type = 'text';
            komentarzInput.name = `komentarz_${pytanie._id}`;
            komentarzInput.placeholder = 'Dodatkowy komentarz';

            const zdjecieInput = document.createElement('input');
            zdjecieInput.type = 'file';
            zdjecieInput.name = `zdjecie_${pytanie._id}`;
            zdjecieInput.multiple = true;

            //event listener do elementu zdjecieInput
            zdjecieInput.addEventListener('change', function (event) {
                // element div do wyświetlania podglądu zdjęć
                let imagePreviewContainer = pytanieLi.querySelector('.image-preview-container');

                if (!imagePreviewContainer) {
                    imagePreviewContainer = document.createElement('div');
                    imagePreviewContainer.className = 'image-preview-container';
                    imagePreviewContainer.style.marginTop = '10px';
                    pytanieLi.appendChild(imagePreviewContainer);
                }

                // Wywołanie funkcji previewImage, aby wyświetlić podgląd zdjęć
                previewImage(event.target, imagePreviewContainer);
            });

            pytanieLi.appendChild(ocenaDiv);
            pytanieLi.appendChild(komentarzInput);
            pytanieLi.appendChild(zdjecieInput);
            pytaniaLista.appendChild(pytanieLi);
        });

        kategoriaDiv.appendChild(pytaniaLista);
        form.appendChild(kategoriaDiv);
    });

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Wyślij';
    submitButton.classList.add('btn-submit');
    form.appendChild(submitButton);

    kategorieDiv.appendChild(form);

    //nasłuchiwanie zdarzeń dla formularza
    form.addEventListener('submit', (event) => zapiszWynikiAnkiety(event, nazwaRestauracji));
}

async function inicjalizuj() {
    const restauracje = await pobierzRestauracje();
    wyswietlRestauracje(restauracje);
}

inicjalizuj();


async function zapiszWynikiAnkiety(event, nazwaRestauracji) {
    event.preventDefault();

    const form = event.target;

    // Pobierz dane z formularza
    const formData = new FormData(form);
    const wyniki = [];

    const imie = formData.get('imie');
    const dataWizyty = formData.get('data_wizyty');
    const przedzialCzasowy = formData.get('przedzial_czasowy');
    const liczbaKlientow = formData.get('liczba_klientow');
    const liczbaPracownikow = formData.get('liczba_pracownikow');

    for (const [key, value] of formData.entries()) {
        const inputElement = form.elements[key];

        if (inputElement && inputElement.dataset && inputElement.dataset.ignore) {
            continue;
        }

        const [fieldType, pytanieId] = key.split('_');

        if (!wyniki.some((wynik) => wynik.pytanieId === pytanieId)) {
            wyniki.push({
                pytanieId,
                ocena: fieldType === 'ocena' ? value : null,
                komentarz: fieldType === 'komentarz' ? value : null,
                zdjecie: fieldType === 'zdjecie' ? [value] : [],
            });
        } else {
            const wynik = wyniki.find((wynik) => wynik.pytanieId === pytanieId);

            if (fieldType === 'ocena') {
                wynik.ocena = value;
            } else if (fieldType === 'komentarz') {
                wynik.komentarz = value;
            } else if (fieldType === 'zdjecie') {
                wynik.zdjecie.push(value);
            }
        }
    }

    const dane = {
        idFormularza: generujIdFormularza(),
        restaurantName: nazwaRestauracji,
        date: new Date().toISOString().split('T')[0],
        imie: imie,
        dataWizyty: dataWizyty,
        przedzialCzasowy: przedzialCzasowy,
        liczbaKlientow: liczbaKlientow,
        liczbaPracownikow: liczbaPracownikow,
        data: wyniki
    };

    // Przekształcanie danych w JSON
    const jsonDane = JSON.stringify(dane);
    const daneFormData = new FormData();
    daneFormData.append('jsonDane', jsonDane);

    // Dodawanie idFormularza do FormData
    daneFormData.append('idFormularza', dane.idFormularza);

    // Dodawanie zdjęcia do FormData
    wyniki.forEach((wynik) => {
        wynik.zdjecie.forEach((zdjecie, index) => {
            if (zdjecie instanceof File) {
                daneFormData.append(`zdjecie_${dane.idFormularza}_${wynik.pytanieId}_${index}`, zdjecie);
            } else {
                console.log(`Zdjęcie nie jest instancją File: ${zdjecie}`);
            }
        });
    });

    // Zapis wyników w bazie danych
    try {

        document.getElementById('loadingSpinner').style.display = 'block';

        const response = await fetch('localhost:8080/api/wyniki', { //local
            method: 'POST',
            body: daneFormData, 
        });

        if (response.ok) {
            alert('Dane zostały zapisane.');
        } else {
            alert('Wystąpił błąd podczas zapisywania danych.');
        }
    } catch (error) {
        console.error('Wystąpił błąd podczas zapisywania danych:', error);
        alert('Wystąpił błąd podczas zapisywania danych.');
    } finally {
    document.getElementById('loadingSpinner').style.display = 'none';
}
}