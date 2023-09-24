require('dotenv').config();
const path = require("path");
const express = require("express");
const multer = require("multer");
const session = require("express-session");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const app = express();
const PORT = process.env.PORT || 3000;
const CONNECTION_STRING = process.env.CONNECTION_STRING;
const setupAuthRoutes = require("./auth");
const pdfMake = require("pdfmake/build/pdfmake");
const pdfFonts = require("pdfmake/build/vfs_fonts");
const nodemailer = require('nodemailer');
const fs = require("fs");
const sharp = require('sharp');
pdfMake.vfs = pdfFonts.pdfMake.vfs;
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const processImages = require('./imageProcessor');
const adminRoutes = require('./admin');

  // <---- ŁĄCZENIE Z BAZĄ DANYCH ----> //
let db;

const client = new MongoClient(CONNECTION_STRING, {
  useUnifiedTopology: true,
});

client.connect()
  .then(connection => {
    db = connection.db("audit_restauracji");
    console.log("Połączono z bazą danych");
  })
  .catch(error => {
    console.error("Błąd podczas łączenia z bazą danych:", error);
    process.exit(1); // Zakończ proces, jeśli nie można połączyć się z bazą danych
  });
  // <---- ŁĄCZENIE Z BAZĄ DANYCH ----> //

app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // `true` jeśli HTTPS
}));

app.use(cors({
  origin: 'localhost:8080',
  credentials: true
}));

app.use('/app.js', (req, res, next) => {
    res.status(403).send('File not found');
});

app.use('/admin', adminRoutes);

app.get('/script.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'script.js'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.use(express.static(path.join(__dirname, 'public')));


app.use("/zdjecia", express.static(path.join(__dirname, "zdjecia")));


setupAuthRoutes(app);

// Konfiguracja multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "zdjecia/"));
  },
  filename: function (req, file, cb) {
    const parts = file.fieldname.split("_");
    const idFormularza = parts[1];
    const pytanieId = parts[2];
    const index = parts[3];
    const fileExtension = file.originalname.split(".").pop();
    cb(null, `zdjecie_${idFormularza}_${pytanieId}_${index}.${fileExtension}`);
  },
});
// Debugging: print the full destination path for each file
console.log(
  "Multer configuration: files will be saved in the",
  path.join(__dirname, "zdjecia/")
);

const upload = multer({ storage: storage });

// Pobierz listę restauracji
app.get("/api/restauracje", async (req, res) => {
  try {
    const restauracje = db.collection("restauracje");
    const restauracjeLista = await restauracje
      .find({}, { projection: { nazwa: 1 } })
      .toArray();

    res.json(restauracjeLista);
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).send("An error occurred while downloading the restaurant");
  }
});

// Pobierz pytania i kategorie dla danej restauracji
app.get("/api/restauracje/:id", async (req, res) => {
  try {
    const restauracje = db.collection("restauracje");
    const restauracjaId = req.params.id;
    const restauracja = await restauracje.findOne(
      { _id: new ObjectId(restauracjaId) },
      { projection: { kategorie: 1 } }
    );

    res.json(restauracja.kategorie);
  } catch (error) {
    console.error("An error occurred:", error);
    res
      .status(500)
      .send("An error occurred while downloading categories and questions");
  }
});

// Pobierz szczegółowe informacje o restauracjach
app.get("/api/restauracje-detal", async (req, res) => {
  try {
    const restauracje = db.collection("restauracje");
    const menedzerowie = db.collection("menedzerowie");

    const restauracjeLista = await restauracje.find({}).toArray();

    // Pobierz menedżerów dla każdej restauracji
    for (let restaurant of restauracjeLista) {
      const managerIds = restaurant.menadzerowie;
      restaurant.menadzerowie = await menedzerowie.find({ _id: { $in: managerIds } }).toArray();
    }

    res.json(restauracjeLista);
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).send("An error occurred while downloading the restaurant details");
  }
});

function readImageFile(imagePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(imagePath, async (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      const imageBase64 = data.toString("base64");
      resolve(imageBase64);
    });
  });
}

app.get("/api/wyniki/:nazwaRestauracji", async (req, res) => {
    const nazwaRestauracji = req.params.nazwaRestauracji;

    try {
        const wyniki = await db.collection('wyniki').findOne({ _id: nazwaRestauracji });

        if (wyniki) {
            res.json(wyniki);
        } else {
            res.status(404).send("Nie znaleziono wyników dla tej restauracji.");
        }
    } catch (error) {
        console.error("Błąd podczas pobierania wyników:", error);
        res.status(500).send("Wystąpił błąd podczas pobierania wyników.");
    }
});

app.post("/api/wyniki", upload.any(), async (req, res) => {
  console.log(`Ścieżka do folderu zdjęć: ${path.join(__dirname, "zdjecia")}`);

  // Przetwarzanie dane formularza
  const idFormularza = req.body.idFormularza;
  const data = JSON.parse(req.body.jsonDane);
  console.log("Otrzymane dane:", data);

  const restaurantName = data.restaurantName;

  // Przetwarzanie zdjęcia
  req.files.forEach((file) => {
    // Przekształć nazwę pliku z powrotem na pytanieId i index
    const match = file.fieldname.match(/^zdjecie_(.+)_(.+)_(\d+)$/);
    if (match) {
      const [, idFormularza, pytanieId, index] = match;

      // Znajdowanie odpowiedniego wyniku
      const wynik = data.data.find((wynik) => wynik.pytanieId === pytanieId);

      // Zapisanie nazwy zdjęcia w odpowiednim obiekcie wyników
      if (wynik) {
        wynik.zdjecie[index] = file.filename;
        console.log(`I process the photo: ${file.filename}`); // Debugowanie: wydrukuj nazwę przetwarzanego pliku
      } else {
        console.error(`No result found for question ${pytanieId}`);
      }
    } else {
      console.error(
        `Fieldname ${file.fieldname} does not match expected pattern.`
      );
    }
  });


  // Przetwarzanie zdjęć do formatu base64
  const dataWithImages = await processImages(data);

  //Zapis wynikow do bazy danych
  try {
    const restauracje = db.collection("restauracje");
    const wyniki = db.collection("wyniki");

    // Pobierz restaurację
    const restauracja = await restauracje.findOne({ nazwa: restaurantName });

    const kategorie = {};
    const dataForPdf = JSON.parse(JSON.stringify(data)); // Kopia danych do generowania PDF
    for (const wynik of dataForPdf.data) {
      for (const kategoria of restauracja.kategorie) {
        const pytanie = kategoria.pytania.find(
          (pytanie) => pytanie._id.toString() === wynik.pytanieId
        );
        if (pytanie) {
          wynik.pytanieId = pytanie.tresc;
          if (!kategorie[kategoria.nazwa]) {
            kategorie[kategoria.nazwa] = [];
          }
          kategorie[kategoria.nazwa].push(wynik);
          break;
        }
      }
    }

    // Aktualna data jako łańcuch znaków w formacie: "YYYY-MM-DD"
    let currentDate = new Date().toISOString().slice(0, 10);

    const result = await wyniki.updateOne(
      { _id: restaurantName },
      {
        $push: {
          [`${restaurantName}.${currentDate}`]: data,
        },
      },
      { upsert: true }
    );

    // Obliczanie maksymalnej liczby punktów
    const maxPoints = data.data.length * 6;

    const categoryMaxPoints = {};
    for (const kategoria of restauracja.kategorie) {
      categoryMaxPoints[kategoria.nazwa] = kategoria.pytania.length * 6;
    }

    // Pobierz kategorie i pytania dla danej restauracji
    const restauracjaData = await restauracje.findOne({ nazwa: restaurantName });

    // Obiekt do przechowywania punktów dla każdej kategorii
    const categoryPoints = {};

    // Obliczanie punktów dla każdej kategorii oraz ogólna suma punktów
    const userPoints = data.data.reduce((total, wynik) => {
      const ocena = parseInt(wynik.ocena);
      const validOcena = isNaN(ocena) ? 0 : ocena;

      // Przypianie kategorii do wyniku
      let kategoriaName = "Nieznana kategoria";
      for (const kategoria of restauracja.kategorie) {
        const pytanie = kategoria.pytania.find(p => p._id.toString() === wynik.pytanieId);
        if (pytanie) {
          kategoriaName = kategoria.nazwa;
          break;
        }
      }
      wynik.kategoria = kategoriaName;

      // Aktualizacja punktów dla kategorii
      if (!categoryPoints[kategoriaName]) {
        categoryPoints[kategoriaName] = 0;
      }
      categoryPoints[kategoriaName] += validOcena;

      return total + validOcena;
    }, 0);

    // Obliczanie procentu uzyskanego z punktacji ogólnej
    const userPercentage = ((userPoints / maxPoints) * 100).toFixed(2);

    // Funkcja do generowania komentarza na podstawie procentowego wyniku
    function generateComment(percentage) {
      if (percentage >= 93) return "wynik bardzo dobry";
      if (percentage >= 83) return "wynik dobry";
      if (percentage >= 73) return "wynik średni";
      if (percentage >= 63) return "wynik słaby";
      return "wynik bardzo słaby wymagający natychmiastowych działań";
    }

    let count = 0
    const docDefinition = {
      content: [
        { text: "Wyniki ankiety", style: "header" },
        {
          style: 'infoTable',
          table: {
            widths: ['*', '*'],
            body: [
              ['Restauracja', restaurantName],
              ['Imię', data.imie],
              ['Data Wizyty', data.dataWizyty],
              ['Przedział Czasowy', data.przedzialCzasowy],
              ['Liczba Klientów', data.liczbaKlientow],
              ['Liczba Pracowników', data.liczbaPracownikow]
            ]
          }
        },
        {
          style: 'wynikiTable',
          table: {
            widths: ['*', '*', '*', '*', '*'],
            body: [
              ['Kategoria', 'Maksymalna ilość punktów', 'Liczba punktów', 'Wynik w %', 'Komentarz'],
              ['Ogólna Ocena restauracji', maxPoints, userPoints, `${userPercentage}%`, generateComment(userPercentage)],
              ...Object.entries(categoryPoints).map(([kategoria, punkty]) => {
                const maxForCategory = categoryMaxPoints[kategoria];
                const percentageForCategory = ((punkty / maxForCategory) * 100).toFixed(2);
                return [kategoria, maxForCategory, punkty, `${percentageForCategory}%`, generateComment(percentageForCategory)];
              }),
            ]
          }
        },
        { text: '', pageBreak: 'after' },
        // Dodawanie wyniku ankiety
        ...Object.entries(kategorie).map(([kategoria, pytania]) => {
          return [
            { text: kategoria, style: "subheader", pageBreak: 'before' },
            ...pytania.map((wynik) => {
              return {
                unbreakable: true,
                stack: [
                  { text: `Pytanie: ${wynik.pytanieId}`, style: "question" },
                  { text: `Ocena: ${wynik.ocena}`, style: "answer" },
                  { text: `Komentarz: ${wynik.komentarz}`, style: "answer" },
                  ...(wynik.zdjecie && wynik.zdjecie.length > 0
                      ? wynik.zdjecie.map((zdjecieElement) => {
                        if (typeof zdjecieElement === "string") {
                          const imagePath = path.resolve(
                              __dirname,
                              "zdjecia",
                              zdjecieElement
                          );
                          const zdjecieData = dataWithImages
                              .find((item) => item.pytanieId === wynik.pytanieId)
                              ?.zdjecie?.find((zdjecie) =>
                                  zdjecie.image.includes(zdjecieElement)
                              );
                          if (zdjecieData) {
                            
                            count = count + 1;

                            return {
                              image: dataWithImages[count - 1].zdjecie[0].image,
                              width: 150,
                              margin: [0, 5, 0, 15],
                            };
                          } else {
                            count = count + 1;

                            return {
                              image: dataWithImages[count - 1].zdjecie[0].image,
                              width: 150,
                              margin: [0, 5, 0, 15],
                            };
                          }
                        } else if (
                            typeof zdjecieElement === "object" &&
                            Object.keys(zdjecieElement).length === 0
                        ) {
                          count = count + 1;
                          return { text: "Brak zdjęcia" };
                        }
                      })
                      : []),
                  { text: '', margin: [0, 10, 0, 10] }
                ],
                margin: [0, 0, 0, 10]
              };
            }),
          ];
        }),
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10],
          alignment: 'center'
        },
        subheader: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10],
          alignment: 'center'
        },
        infoTable: {
          margin: [0, 5, 0, 15]
        },
        wynikiTable: {
          margin: [0, 5, 0, 15]
        },
        imageStyle: {
          width: 150,
          margin: [0, 5, 0, 15],
        },
      },
    };

    const pdfDoc = await pdfMake.createPdf(docDefinition);
    const pdfPath = `pdf/${restaurantName}_${currentDate}_${idFormularza}.pdf`;
    pdfDoc.getBuffer((buffer) => {
      fs.writeFileSync(pdfPath, buffer);
    });

    // Pobieranie e-maile menedżerów
    const menedzerowieCollection = db.collection("menedzerowie");
    const menedzerowieList = await menedzerowieCollection.find({
      _id: { $in: restauracja.menadzerowie }
    }).toArray();

    const emailAddresses = menedzerowieList.map(menedzer => menedzer.email);

    // Wysyłanie e-maila
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.MAIL_FROM,
      to: emailAddresses.join(", "), // wysyła e-mail do wszystkich menedżerów
      subject: `Wyniki ankiety ${restaurantName}`,
      text: 'W załączniku znajdują się wyniki ankiety.',
      attachments: [
        {
          filename: `${restaurantName}_${currentDate}_${idFormularza}.pdf`,
          path: pdfPath,
        },
      ],
    };

    //DYNAMICZNE ŁĄDOWANIE PLIKÓW PDF
    app.get('/api/pdf-list', (req, res) => {
    const pdfDirectory = path.join(__dirname, 'pdf');
    fs.readdir(pdfDirectory, (err, files) => {
        if (err) {
            res.status(500).send('Error reading PDF directory.');
            return;
        }
        res.json(files);
    });
});

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error while sending email:', error);
        res.status(500).send('Error while sending email.');
      } else {
        console.log('Email sent:', info.response);
        res.status(200).send('The data has been saved. The form has been submitted and saved as a PDF. The PDF has been sent by email.');
      }
    });


    res
      .status(200)
      .send(
        "The data has been saved. The form has been submitted and saved as a PDF."
      );
  } catch (error) {
    console.error("Błąd podczas zapisywania danych:", error);
    res.status(500).send("Błąd podczas zapisywania danych.");
  }
});


app.use((req, res, next) => {
    const requestedPath = path.join(__dirname, req.path);
    if (!fs.existsSync(requestedPath)) {
        res.status(404).send(`File not found: ${requestedPath}`); // Używam tylko `req.path` zamiast pełnej ścieżki dla bezpieczeństwa
    } else {
        next();
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send(`Internal Server Error: ${err.message}`);
});


app.listen(PORT, () => {
  console.log(`Serwer uruchomiony na porcie ${PORT}`);
});

process.on("exit", () => {
  if (client && client.isConnected()) {
    console.log("Zamykanie połączenia z bazą danych...");
    client.close();
  }
});
