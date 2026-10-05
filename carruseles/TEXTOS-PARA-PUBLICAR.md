# Carruseles VitalPet — textos para publicar

Cada carrusel está en dos formatos:
- `instagram/` → 1080×1350 (4:5)
- `tiktok/` → 1080×1920 (9:16). El texto queda arriba para que no lo tapen los botones de TikTok.

Sube las imágenes **en orden** (01, 02, 03…). En TikTok, publícalo como *foto* (modo carrusel) y añade una canción en tendencia a volumen bajo.

**Orden recomendado para publicar:** 01 → 03 → 02 → 04 → 05 (una al día, o una cada dos días si alternas con otros vídeos).

---

## 01 · Un filtro no convierte agua vieja en agua nueva
**Para:** quien ya tiene una fuente con filtro. Es el carrusel principal.

```
Tu fuente filtra el agua… pero es la misma agua, día tras día 💧
VitalPet hace otra cosa: retira el agua usada a un depósito aparte y pone agua limpia en el cuenco. Sin filtros. Sin recircular.
🚚 Envío gratis · Link en la bio
¿Cada cuánto limpias la fuente de tu gato? Sé sincero 👇
#gatos #gatosdeinstagram #fuenteparagatos #bebederogatos #cosasdegatos #mascotas #catlover #tipsgatos
```

## 02 · ¿Cuánto te cuesta de verdad tu fuente?
**Para:** quien piensa que 100 € es caro. Presenta el precio como un ahorro.

```
Lo barato sale caro… sobre todo si cada pocas semanas toca comprar filtros 💸
Con VitalPet: 0 € en recambios. Programas cada cuánto se renueva el agua y te olvidas.
🚚 Envío gratis · Link en la bio
¿Cuánto te gastas al año en filtros? 👇
#gatos #perros #mascotas #fuenteparagatos #ahorro #gatosdeinstagram #cosasdegatos #tipsmascotas
```

## 03 · Así funciona VitalPet
**Para:** resolver dudas antes de comprar. Fíjalo en tu perfil (en Instagram y TikTok).

```
¿Una fuente sin filtro? Así funciona 👇
1️⃣ Retira el agua usada
2️⃣ Pone agua limpia en el cuenco de cerámica
3️⃣ Lo repite cada X horas (tú eliges)
4,5 L de capacidad · Batería de larga duración · Cuenco de cerámica
Guárdalo para cuando te pregunten 😉
#gatos #gatosdeinstagram #fuenteparagatos #mascotas #catlover #gadgetsmascotas #cosasdegatos
```

## 04 · POV: te vas el finde
**Para:** quien viaja o trabaja muchas horas fuera. Es el carrusel más emocional.

```
POV: te vas el finde y no tienes que molestar a nadie para que le cambie el agua ✈️🐱
VitalPet renueva el agua sola, cuando tú lo programes. Hasta 1–2 semanas de autonomía para un gato adulto.
🚚 Envío gratis · Link en la bio
Etiqueta a quien siempre te cuida el gato 👇
#gatos #viajarconmascotas #gatosdeinstagram #mascotas #cosasdegatos #catlover #findesemana
```

## 05 · Agua templada en invierno (modelo con calefacción)
**Para:** dueños de gatos mayores o con la casa fría. Publícalo de octubre a febrero.

```
¿Tu gato bebe menos cuando hace frío? 🥶
El modelo con calefacción de VitalPet mantiene el agua a 28 °C y la sigue renovando sola.
Elige la opción «Ceramic heating» en la web.
🚚 Envío gratis · Link en la bio
#gatos #gatosmayores #invierno #gatosdeinstagram #mascotas #cosasdegatos #catlover
```

---

## Antes de publicar, revisa
- **Modo calefacción + batería:** pregunta a CJ si el modelo con calefacción funciona con batería o tiene que estar enchufado. En el carrusel 05 no he puesto «sin cables» por si acaso.
- **«60 días de batería»** sale de la foto del producto (modelo de 1800 mAh). Por eso las diapositivas dicen «según modelo y uso».
- **Las fotos del producto** son de tu web, recortadas de las capturas de pantalla. Cuando tengas la foto original en alta resolución (de CJ o tuya), cámbiala en `src/img/producto.jpg` y vuelve a generar las imágenes.
- **Enlace en la bio:** pon el enlace directo a la ficha del producto, no a la página de inicio.

## Cómo editar textos y volver a generar las imágenes
1. Cambia los textos en `src/contenido.js`.
2. Ejecuta `node src/build.js` (necesita Node y Playwright).
3. Las imágenes nuevas aparecen en `instagram/` y `tiktok/`.

## Para mejorarlos con Higgsfield (opcional)
Las diapositivas de texto funcionan tal cual. Si quieres darle más vida al carrusel, cambia la diapositiva con foto por una imagen de un gato con el producto. Sube `src/img/producto.jpg` como referencia y usa este prompt:

```
Use the exact product from the reference image (cream-white smart pet water dispenser with tall rear tank, touchscreen on top, front tray with white rectangular ceramic bowl). A calm cat drinking from it in a minimalist warm living room, beige travertine and light oak, soft natural daylight, realistic premium lifestyle photo, no text, empty space in the top third.
```
