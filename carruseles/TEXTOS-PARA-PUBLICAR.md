# Carruseles VitalPet: textos para publicar

Tres carruseles con el mismo mensaje y tres ganchos distintos:
**una fuente con filtro te cuesta entre 50 y 70 € al año en filtros → VitalPet no lleva filtro → pantalla táctil para programar cada cuánto se tira el agua y se rellena el cuenco → batería de 4000 mAh que dura hasta 90 días.**

Cada carrusel está en dos formatos:
- `instagram/` → 1080×1350 (4:5)
- `tiktok/` → 1080×1920 (9:16). El texto queda arriba para que no lo tapen los botones de TikTok.

Sube las imágenes **en orden** (01, 02, 03…). En TikTok, publícalo en modo foto (carrusel) y añade una canción que esté de moda, a volumen bajo.

**Orden recomendado:** 01 → 02 → 03. Después, vuelve a publicar el que mejor haya funcionado cambiando la primera diapositiva.

---

## 01 · Tu fuente te cuesta 50–70 € al año en filtros (8 diapositivas)
**Gancho:** el dinero. Es el carrusel principal.

```
¿Sabías que tu fuente te cuesta 50–70 € al año solo en filtros? 💸
VitalPet no lleva filtro: tira el agua usada y rellena el cuenco con agua limpia, cada cuánto tú decidas desde la pantalla táctil.
🔋 Batería de 4000 mAh: hasta 90 días sin cargarla
🚚 Envío gratis · Link en la bio
¿Cuánto te gastas tú en filtros al año? 👇
#gatos #gatosdeinstagram #fuenteparagatos #bebederogatos #mascotas #perros #cosasdegatos #ahorro
```

## 02 · Esta fuente cambia el agua ella sola (7 diapositivas)
**Gancho:** la pantalla táctil y la programación.

```
Programas cada cuántas horas quieres agua nueva… y ella hace el resto 💧
Desde la pantalla táctil eliges el intervalo: el cuenco tira el agua usada y se rellena con agua limpia.
Cada 6 h = 4 cuencos de agua nueva al día.
❌ Fuente con filtro: 50–70 €/año
✅ VitalPet: 0 € en filtros
🚚 Envío gratis · Link en la bio
#gatos #gatosdeinstagram #fuenteinteligente #mascotas #gadgetsmascotas #cosasdegatos #catlover
```

## 03 · 90 días sin enchufe (6 diapositivas)
**Gancho:** la batería y no tener cables a la vista.

```
90 días sin enchufarla 🔋
Batería de 4000 mAh: ponla donde quieras, sin cables a la vista ni al alcance del gato.
Y además sin filtros: te ahorras 50–70 € al año.
🚚 Envío gratis · Link en la bio
¿Dónde la pondrías tú? 👇
#gatos #gatosdeinstagram #fuenteparagatos #mascotas #sincables #cosasdegatos #catlover
```

---

## Antes de publicar, revisa
- **¿4000 o 4800 mAh?** En tu web, la variante dice **4000 mAh**, pero la descripción del producto dice «Cerámica mejorada: batería de **4800 mAh** y hasta 90 días». Los carruseles usan 4000 mAh, como me dijiste. Corrige la descripción para que coincida.
- **Los 90 días** son del modelo de 4000 mAh (el de 1800 mAh llega a 60). Por eso las diapositivas dicen «Modelo de 4000 mAh. Autonomía según uso». En la web, pon el modelo de 4000 mAh como recomendado.
- **Las fotos** son las de tu tienda. Las fuentes con filtro son las imágenes de la sección «mantenimiento» de tu web.
- **Enlace en la bio:** pon el enlace directo a la ficha del producto.

## Cómo cambiar textos y volver a generar las imágenes
1. Cambia los textos en `src/contenido.js`. Las fotos están en `src/img/`.
2. Ejecuta `node src/build.js` (necesita Node y Playwright).
3. Las imágenes nuevas aparecen en `instagram/` y `tiktok/`.
