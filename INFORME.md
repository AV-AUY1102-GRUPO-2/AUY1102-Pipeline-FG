# Informe Evaluación Parcial 2 · AUY1102 Ciclo de Vida del Software

**Integrantes:** José Yovera ([@joseyovera](https://github.com/joseyovera)) y Felipe ([@Felipexsi](https://github.com/Felipexsi))
**Repositorio:** [AV-AUY1102-GRUPO-2/AUY1102-Pipeline-FG](https://github.com/AV-AUY1102-GRUPO-2/AUY1102-Pipeline-FG)
**Documentación paso a paso:** [Wiki del proyecto](https://github.com/AV-AUY1102-GRUPO-2/AUY1102-Pipeline-FG/wiki)

## Introducción

La empresa *Integration Solutions* desarrolla y despliega su software de forma manual, sin revisiones automáticas de calidad ni de seguridad. Como primeros pasos de su transformación hacia GitHub, aplicamos sobre un fork del repositorio indicado por la docente un script de pruebas unitarias con cobertura y cuatro herramientas de análisis de seguridad, y corregimos algunos de los problemas que encontraron.

Todo el trabajo se hizo con ramas y Pull Requests: cada cambio fue revisado y aprobado por el otro integrante antes de unirse a `master`. Las capturas de evidencia están en la carpeta [`evidencias/`](evidencias): las que empiezan con J corresponden a José y las que empiezan con F, a Felipe.

## Parte 1 · Pruebas unitarias y cobertura

*Realizado por José · PR #12, aprobado por Felipe · [ver paso a paso](https://github.com/AV-AUY1102-GRUPO-2/AUY1102-Pipeline-FG/wiki/02-Script-de-pruebas)*

Creamos el script `scripts/test-report.js`, que se ejecuta con `npm run test:report`. El script ejecuta las pruebas con Jest y muestra un resumen con el porcentaje de cobertura, las pruebas que fallan (con el valor esperado y el recibido) y las líneas de código que ninguna prueba ejecuta. Si alguna prueba falla, termina con código de salida 1, para que un pipeline pueda detenerse.

Las 18 pruebas existentes pasan, pero la cobertura de líneas es de alrededor del 42 %, y el archivo `date-value-object.ts` está casi sin probar (6,66 %). Para comprobar que el script detecta fallas, agregamos temporalmente una prueba rota a propósito, y el script la mostró correctamente.

## Parte 2 · Análisis de seguridad

**npm audit** *(José · PR #13 · [ver paso a paso](https://github.com/AV-AUY1102-GRUPO-2/AUY1102-Pipeline-FG/wiki/03-npm-audit))*. Agregamos los comandos `audit:all`, `audit:prod` y `audit:ci`. El análisis completo encontró 85 vulnerabilidades, pero solo 8 están en dependencias de producción; el resto son herramientas de desarrollo. El comando `audit:ci` falla solo ante vulnerabilidades altas o críticas en producción, y está pensado para un pipeline.

**GitHub Advanced Security** *(Felipe · [ver paso a paso](https://github.com/AV-AUY1102-GRUPO-2/AUY1102-Pipeline-FG/wiki/04-GitHub-Advanced-Security))*. Activamos el grafo de dependencias, las alertas y actualizaciones de seguridad de Dependabot, y la protección de secretos. El análisis de código con CodeQL ya funcionaba mediante un workflow. Dependabot comenzó a abrir Pull Requests automáticos, que dejamos abiertos porque varios son cambios de versión mayor que podrían romper el proyecto.

**SonarCloud** *(Felipe · [ver paso a paso](https://github.com/AV-AUY1102-GRUPO-2/AUY1102-Pipeline-FG/wiki/05-SonarCloud))*. Conectamos el repositorio y obtuvimos nota E en seguridad (16 problemas), D en confiabilidad y A en mantenibilidad, sin código duplicado. Los problemas más graves eran dos tokens de GitHub escritos en los archivos `.npmrc` y `credentials.yml`.

**Snyk** *(Felipe · [ver paso a paso](https://github.com/AV-AUY1102-GRUPO-2/AUY1102-Pipeline-FG/wiki/06-Snyk))*. Importamos el repositorio y Snyk analizó el `Dockerfile` y el `package.json`. La imagen base `node:14-alpine3.16`, sin soporte, concentraba 37 de las 44 vulnerabilidades encontradas (1 crítica y 14 altas).

**Remediaciones** *([ver paso a paso](https://github.com/AV-AUY1102-GRUPO-2/AUY1102-Pipeline-FG/wiki/07-Remediaciones))*. José eliminó los dos tokens expuestos detectados por SonarCloud y los agregó al `.gitignore` (PR #19, aprobado por Felipe). Felipe actualizó la imagen de Docker a `node:24-alpine` siguiendo la recomendación de Snyk (PR #20, aprobado por José), y las vulnerabilidades del contenedor bajaron de 37 a solo 1, de severidad baja.

## Parte 3 · Documentación

El paso a paso completo, con explicaciones, diagramas y capturas, está en la [Wiki del proyecto](https://github.com/AV-AUY1102-GRUPO-2/AUY1102-Pipeline-FG/wiki).

## Conclusión

Ninguna herramienta encontró todos los problemas: los tokens los detectó SonarCloud y no el escaneo de secretos de GitHub, y las pruebas pasaban aunque cubrían menos de la mitad del código. Combinar pruebas unitarias, cobertura, análisis estático y análisis de dependencias dio una visión mucho más completa de la calidad del software. Al quedar conectadas a los Pull Requests, estas herramientas detectan los problemas temprano, cuando todavía son fáciles de corregir, y permiten una mejora continua, porque las vulnerabilidades aparecen aunque el código no cambie.
