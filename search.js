$(document).ready(function () {
  let pages = []; // Lista para guardar las URLs del sitio

  // Cargar y procesar el XML del mapa del sitio
  $.ajax({
    url: "sitemap.xml",
    dataType: "xml",
    success: function (xml) {
      // Extrae las URLs del archivo y agrégalas a la lista
      $(xml)
        .find("url")
        .each(function () {
          const loc = $(this).find("loc").text();
          pages.push(loc);
        });
    },
  });

  // Función para realizar la búsqueda en cada página
  function search(query) {
    $(".search-results").remove(); // Limpia resultados anteriores, si hay
    let resultsFound = false; // Para saber si se encuentran coincidencias

    const queryLower = query.toLowerCase(); // Normalizar a minúsculas para evitar problemas de mayúsculas/minúsculas

    // Recorre cada página y busca coincidencias
    pages.forEach(function (page) {
      $.ajax({
        url: page,
        dataType: "html",
        success: function (data) {
          const content = $(data).text().toLowerCase(); // Pasa el contenido de la página a minúsculas
          const words = content.split(/\s+/); // Separa el texto en palabras

          // Busca si alguna palabra es similar a la búsqueda
          let matchIndex = -1;
          words.some((word, index) => {
            if (levenshteinDistance(word, queryLower) <= 2) {
              matchIndex = index; // Guarda la posición de la coincidencia aproximada
              return true; // Detiene la búsqueda después de la primera coincidencia
            }
            return false;
          });

          // Si se encuentra una coincidencia aproximada
          if (matchIndex !== -1) {
            if (!resultsFound) {
              // Crea el contenedor de resultados la primera vez que se encuentra un match
              $(".search-container").after('<ul class="search-results"></ul>');
              resultsFound = true;
            }

            const title = $(data).find("h2").first().text(); // Toma el primer título <h2> como título del resultado

            // Extrae un fragmento de texto alrededor de la palabra encontrada
            const snippetStart = Math.max(0, matchIndex - 5); // Cinco palabras antes de la coincidencia
            const snippetEnd = Math.min(words.length, matchIndex + 5); // Cinco palabras después
            const snippet =
              words.slice(snippetStart, snippetEnd).join(" ") + "...";

            // Muestra el resultado de la búsqueda
            $(".search-results").append(`
                  <li>
                    <h3>${title}</h3>
                    <p>${snippet}</p>
                    <a href="${page}">Leer más</a>
                  </li>
                `);
          }
        },
      });
    });
  }

  // Algoritmo para calcular la distancia de Levenshtein entre dos palabras (permite comparar similitudes)
  function levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i]; // Inicializa la primera columna
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j; // Inicializa la primera fila
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]; // Sin costo si son iguales
        } else {
          // Calcula el menor costo entre sustitución, inserción o eliminación
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length]; // Devuelve la distancia final
  }

  // Ejecuta la búsqueda cuando se hace clic en el botón
  $(".search-container button").click(function () {
    const query = $(".search-container input").val().trim(); // Toma la búsqueda y elimina espacios en blanco
    if (query) {
      search(query); // Ejecuta la búsqueda si hay algo escrito
    }
  });
});
