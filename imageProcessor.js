const fs = require("fs");
const path = require("path");
const sharp = require('sharp');

async function processImages(data) {
  const dataWithImages = await Promise.all(
    data.data.map(async (dane) => {
      if (Array.isArray(dane.zdjecie) && dane.zdjecie.length > 0) {
        const zdjecia = [];
        for (const zdjecieItem of dane.zdjecie) {
          if (zdjecieItem && typeof zdjecieItem === "string") {
            const imagePath = path.join(__dirname, "zdjecia", zdjecieItem);
            if (fs.existsSync(imagePath)) {
              try {
                const imageAsBase64 = await fs.promises.readFile(imagePath, "base64");

                // Przekształć obraz zgodnie z metadanymi EXIF
              const correctedImageBuffer = await sharp(imagePath)
              .rotate() // automatycznie obraca obraz zgodnie z metadanymi EXIF
              .toBuffer();

              const correctedImageBase64 = correctedImageBuffer.toString('base64');

                zdjecia.push({
                  image: `data:image/jpeg;base64,${correctedImageBase64}`,
                  width: 150,
                  margin: [0, 5, 0, 15],
                });
              } catch (error) {
                console.error(
                  `Error while reading a file ${imagePath}: ${error.message}`
                );
                zdjecia.push({ text: "No photo" });
              }
            } else {
              console.error(`The Photo ${imagePath} does not exist!`);
              zdjecia.push({
                text: `The Photo ${zdjecieItem} does not exist!`,
              });
            }
          } else if (
            zdjecieItem &&
            typeof zdjecieItem === "object" &&
            Object.keys(zdjecieItem).length === 0
          ) {
            console.log(`Photo for the question ${dane.pytanieId} is empty`);
            zdjecia.push({ text: "No photo" });
          } else {
            console.error(
              "The photo is not a string type, nor an empty object! Structure of the object: ",
              zdjecieItem
            );
          }
        }
        return { ...dane, zdjecie: zdjecia };
      } else {
        console.log(`No photo for the question ${dane.pytanieId}`);
        return { ...dane, zdjecie: [{ text: "No photo" }] };
      }
    })
  );

    return dataWithImages;
}

module.exports = processImages;
