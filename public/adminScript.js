$(document).ready(function() {
    const audytyDiv = $('#audyty');
    const restauracjeDiv = $('#restauracje');
    const restaurants = {};
    let detailedRestauracjeData = [];
    let audytyData = [];

    $.get('/api/restauracje', function(restauracjeData) {
        restauracjeData.forEach(restaurantObj => {
            const rawRestaurantName = restaurantObj.nazwa;
            const restaurantName = rawRestaurantName.replace(/-/g, ' ');
            restaurants[restaurantName] = [];

            const restaurantLink = $('<a>')
                .addClass('nav-link')
                .attr('href', `#`)
                .attr('data-name', rawRestaurantName) // dodajemy atrybut z nazwą restauracji
                .text(restaurantName)
                .on('click', function(e) {
                    e.preventDefault();
                    const restaurantName = $(this).data('name');
                    displayRestaurantDetails(restaurantName);
                });
            restauracjeDiv.append(restaurantLink);
        });

        $.get('/admin/api/pdf-list', function(files) {
            files.forEach(file => {
                const [rawRestaurantName] = file.split('_');
                const restaurantName = rawRestaurantName.replace(/-/g, ' ');
                if (restaurants[restaurantName]) {
                    restaurants[restaurantName].push(file);
                }
            });

            for (const [restaurantName, pdfs] of Object.entries(restaurants)) {
                const restaurantDiv = $('<div>').addClass('restaurant');
                const restaurantHeader = $('<button>')
                    .addClass('btn btn-link rotate') // Dodajemy klasę rotate
                    .attr('type', 'button')
                    .attr('data-toggle', 'collapse')
                    .attr('data-target', `#collapse${restaurantName.replace(/ /g, '')}`)
                    .text(restaurantName)
                    .append('<i class="bi bi-chevron-compact-right ml-2"></i>'); // Dodajemy ikonę strzałki
                const collapseDiv = $('<div>')
                    .addClass('collapse collapsed-content')
                    .attr('id', `collapse${restaurantName.replace(/ /g, '')}`);

                pdfs.forEach(pdf => {
                    const [_, currentDate, __] = pdf.split('_');
                    const pdfLink = $('<a>').attr('href', `/admin/pdf/${pdf}`).text(currentDate);
                    collapseDiv.append(pdfLink).append('<br>');
                });

                restaurantDiv.append(restaurantHeader);
                restaurantDiv.append(collapseDiv);
                audytyDiv.append(restaurantDiv);
            }

            
            $(document).on('click', '.restaurant > .btn-link', function() {
                const icon = $(this).find('i');
                if (icon.hasClass('bi-chevron-compact-right')) {
                    icon.removeClass('bi-chevron-compact-right').addClass('bi-chevron-compact-down');
                } else {
                    icon.removeClass('bi-chevron-compact-down').addClass('bi-chevron-compact-right');
                }
            });

           
            $(document).on('click', 'a[data-toggle="collapse"][href="#audyty"]', function() {
                const icon = $(this).find('i');
                if (icon.hasClass('bi-chevron-right')) {
                    icon.removeClass('bi-chevron-right').addClass('bi-chevron-down');
                } else {
                    icon.removeClass('bi-chevron-down').addClass('bi-chevron-right');
                }
            });
        });
    });

    $.get('/api/restauracje-detal', function(data) {
        detailedRestauracjeData = data;
    });

    function displayRestaurantDetails(restaurantName) {
        const restaurantDetails = detailedRestauracjeData.find(r => r.nazwa === restaurantName);
        if (restaurantDetails) {
            const mainContent = $('main');
            mainContent.empty();

            // Menedżerowie
            const managerAccordion = $('<div>').addClass('accordion').attr('id', 'managerAccordion');
            const managerCard = $('<div>').addClass('card');
            const managerCardHeader = $('<div>').addClass('card-header').attr('id', 'managerCardHeader');
            const managerCardLink = $('<a>').addClass('btn btn-link').attr('data-toggle', 'collapse').attr('href', '#managerCollapse').text('Menedżerowie');
            managerCardHeader.append(managerCardLink);
            const managerCollapse = $('<div>').addClass('collapse').attr('id', 'managerCollapse').attr('data-parent', '#managerAccordion');
            const managerCardBody = $('<div>').addClass('card-body');
            const managerTable = $('<table>').addClass('table table-bordered');
            const managerThead = $('<thead>').append('<tr class="question"><th>Imię</th><th>E-mail</th><th>Akcje</th></tr>');
            const managerTbody = $('<tbody>');
            restaurantDetails.menadzerowie.forEach(manager => {
                managerTbody.append(`<tr class="question"><td>${manager.imie}</td><td>${manager.email}</td><td>Akcje</td></tr>`);
            });
            managerTable.append(managerThead);
            managerTable.append(managerTbody);
            managerCardBody.append(managerTable);
            managerCollapse.append(managerCardBody);
            managerCard.append(managerCardHeader);
            managerCard.append(managerCollapse);
            managerAccordion.append(managerCard);
            mainContent.append(managerAccordion);

            // Kategorie
            const categoryAccordion = $('<div>').addClass('accordion').attr('id', 'categoryAccordion');
            const categoryCard = $('<div>').addClass('card');
            const categoryCardHeader = $('<div>').addClass('card-header').attr('id', 'categoryCardHeader');
            const categoryCardLink = $('<a>').addClass('btn btn-link').attr('data-toggle', 'collapse').attr('href', '#categoryCollapse').text('Kategorie');
            categoryCardHeader.append(categoryCardLink);
            const categoryCollapse = $('<div>').addClass('collapse').attr('id', 'categoryCollapse').attr('data-parent', '#categoryAccordion');
            const categoryCardBody = $('<div>').addClass('card-body');
            restaurantDetails.kategorie.forEach((kategoria, index) => {
                const categoryId = `category${index}`;
                const categoryBox = $('<div>').addClass('category-box');
                const categoryButton = $('<button>')
                    .addClass('btn btn-link w-100 text-left category-name')
                    .attr('type', 'button')
                    .attr('data-toggle', 'collapse')
                    .attr('data-target', `#${categoryId}`)
                    .text(kategoria.nazwa);
                const questionsList = $('<div>').addClass('collapse').attr('id', categoryId);
                const questionsTable = $('<table>').addClass('table table-bordered');
                const questionsTbody = $('<tbody>');
                kategoria.pytania.forEach(pytanie => {
                    questionsTbody.append(`<tr class="question"><td>${pytanie.tresc}</td></tr>`);
                });
                questionsTable.append(questionsTbody);
                questionsList.append(questionsTable);
                categoryBox.append(categoryButton);
                categoryBox.append(questionsList);
                categoryCardBody.append(categoryBox);
            });
            categoryCollapse.append(categoryCardBody);
            categoryCard.append(categoryCardHeader);
            categoryCard.append(categoryCollapse);
            categoryAccordion.append(categoryCard);
            mainContent.append(categoryAccordion);

            //Audyty
            $.get(`/api/wyniki/${encodeURIComponent(restaurantName)}`, function(data) {
                audytyData = data;

                const audytyAccordion = $('<div>').addClass('accordion').attr('id', 'audytyAccordion');
                const audytyCard = $('<div>').addClass('card');
                const audytyCardHeader = $('<div>').addClass('card-header').attr('id', 'audytyCardHeader');
                const audytyCardLink = $('<a>').addClass('btn btn-link').attr('data-toggle', 'collapse').attr('href', '#audytyCollapse').text('Audyty');
                audytyCardHeader.append(audytyCardLink);
                const audytyCollapse = $('<div>').addClass('collapse').attr('id', 'audytyCollapse').attr('data-parent', '#audytyAccordion');
                const audytyCardBody = $('<div>').addClass('card-body');
                audytyCollapse.append(audytyCardBody);
                audytyCard.append(audytyCardHeader);
                audytyCard.append(audytyCollapse);
                audytyAccordion.append(audytyCard);
                mainContent.append(audytyAccordion);

                if (audytyData && audytyData[restaurantName]) {
    const audytyArray = Object.entries(audytyData[restaurantName]);

    audytyArray.forEach(([date, audytyForDate]) => {
        audytyForDate.forEach((audyty, index) => {
            const dateButton = $('<button>')
                .addClass('btn btn-link w-100 text-left')
                .attr('type', 'button')
                .text(`${date} - Audyt ${index + 1}`);
            audytyCardBody.append(dateButton);

            const dateCollapse = $('<div>').addClass('collapse').attr('id', `collapse${date}${index}`);
            audytyCardBody.append(dateCollapse);

            dateButton.on('click', function () {
                $(dateCollapse).collapse('toggle');
            });

            // Dodawanie ogólnych informacji o audycie
        const detailsDiv = $('<div>').addClass('audit-details');
        detailsDiv.append($('<p>').html('<strong>Imię:</strong> ' + audyty.imie));
        detailsDiv.append($('<p>').html('<strong>Data wizyty:</strong> ' + audyty.dataWizyty));
        detailsDiv.append($('<p>').html('<strong>Przedział czasowy:</strong> ' + audyty.przedzialCzasowy));
        detailsDiv.append($('<p>').html('<strong>Liczba klientów:</strong> ' + audyty.liczbaKlientow));
        detailsDiv.append($('<p>').html('<strong>Liczba pracowników:</strong> ' + audyty.liczbaPracownikow));
        dateCollapse.append(detailsDiv);

            audyty.data.forEach(response => {
    // Znajdź odpowiednie pytanie na podstawie jego ID
    let pytanieTresc = "Nieznane pytanie"; // Domyślna wartość, jeśli nie możemy znaleźć pytania
    for (const kategoria of restaurantDetails.kategorie) {
        for (const pytanie of kategoria.pytania) {
            if (pytanie._id === response.pytanieId) {
                pytanieTresc = pytanie.tresc;
                break;
            }
        }
    }
    const ocenaValue = response.ocena !== null ? response.ocena : "Brak oceny";
    const komentarzValue = response.komentarz && response.komentarz.trim() !== "" ? response.komentarz : "Brak komentarza";

    const pytanieDiv = $('<p>').html('<strong>Pytanie:</strong> ' + pytanieTresc);
    const ocenaDiv = $('<p>').html('<strong>Ocena:</strong> ' + ocenaValue);
    const komentarzDiv = $('<p>').html('<strong>Komentarz:</strong> ' + komentarzValue);
    dateCollapse.append(pytanieDiv, ocenaDiv, komentarzDiv);

                // Zdjęcie
            response.zdjecie.forEach(zdjecieElement => {
    if (typeof zdjecieElement === "string") {
        const photoLabel = $('<span>').text('Zdjęcie: ');
        const displayButton = $('<button>').addClass('btn btn-primary').text('Wyświetl');
        const downloadButton = $('<a>').addClass('btn btn-secondary').attr('href', `/zdjecia/${zdjecieElement}`).attr('download', '').text('Pobierz');

        displayButton.on('click', function() {
            // modal i zdjęcie w nim
            const modal = $('<div>').addClass('modal').attr('tabindex', '-1').attr('role', 'dialog');
            const modalDialog = $('<div>').addClass('modal-dialog').attr('role', 'document');
            const modalContent = $('<div>').addClass('modal-content');
            const modalBody = $('<div>').addClass('modal-body');
            const image = $('<img>').attr('src', `/zdjecia/${zdjecieElement}`).attr('alt', 'Zdjęcie').addClass('img-fluid');
            modalBody.append(image);
            modalContent.append(modalBody);
            modalDialog.append(modalContent);
            modal.append(modalDialog);

            $('body').append(modal);
            modal.modal('show');

            modal.on('hidden.bs.modal', function() {
                modal.remove();
            });
        });

        dateCollapse.append(photoLabel);
        dateCollapse.append(displayButton);
        dateCollapse.append(downloadButton);
    } else if (typeof zdjecieElement === "object" && Object.keys(zdjecieElement).length === 0) {
        dateCollapse.append($('<p>').html('<strong>Zdjęcie:</strong> Brak Zdjęcia'));
    }
});
                            });
                        })
                    })
                }
            })
        }
    }
});