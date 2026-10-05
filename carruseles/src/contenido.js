// Textos de los carruseles de VitalPet.
// *texto* = palabra destacada en gris (como en la web).
// Fotos en src/img (sacadas de la web): gato, gris, dos-colores, vertical-claro, vertical-oscuro,
// vertical-calefaccion, pantalla, tubo, calefaccion, conv1-6 (fuentes con filtro).

const BATERIA = 'Modelo de 4000 mAh. Autonomía según uso.';

module.exports = [
  {
    id: '01-filtros-50-70',
    titulo: 'Tu fuente te cuesta 50–70 € al año en filtros',
    slides: [
      { t: 'cover', kicker: 'Haz la cuenta', h: 'Tu fuente te cuesta *50–70 € al año*',
        sub: 'Solo en filtros de recambio.', imgs: ['conv3', 'conv2'] },
      { t: 'media', kicker: 'Fuente con filtro', h: 'Filtros nuevos *cada pocas semanas.*',
        body: 'Si no los cambias, el agua sigue pasando por un filtro sucio.', imgs: ['conv3'] },
      { t: 'media', kicker: 'Y el mantenimiento', h: 'Desmontar. Lavar. *Rellenar.*',
        imgs: ['conv1', 'conv2', 'conv4'], caps: ['Desmontar la bomba', 'Lavar el filtro', 'Vaciar y rellenar'], layout: 'three' },
      { t: 'full', kicker: 'La solución', h: 'VitalPet: *0 € en filtros.*',
        body: 'No lleva filtro. Renueva el agua en vez de reciclarla.', img: 'vertical-claro' },
      { t: 'media', kicker: 'Cómo lo hace', h: 'Tira el agua usada y *la rellena con agua limpia.*',
        body: 'Dos depósitos separados: uno de agua limpia y otro de agua usada.', imgs: ['tubo'] },
      { t: 'media', kicker: 'Pantalla táctil', h: 'Tú decides *cada cuánto.*',
        body: 'Programas cada cuántas horas el cuenco tira el agua y se rellena solo.', imgs: ['pantalla', 'gris'], layout: 'col' },
      { t: 'bigmedia', dark: true, kicker: 'Batería de 4000 mAh', big: '90 días', h: 'sin cargarla',
        note: BATERIA, imgs: ['vertical-oscuro', 'gato'] },
      { t: 'cta', h: 'Deja de pagar filtros. *Renueva el agua.*', imgs: ['dos-colores', 'gato', 'gris'] },
    ],
  },
  {
    id: '02-pantalla-tactil',
    titulo: 'Tú decides cada cuánto se renueva el agua',
    slides: [
      { t: 'full', kicker: 'Fuente inteligente', h: 'Esta fuente cambia el agua *ella sola*', img: 'gris', pos: '72% 70%', swipe: true },
      { t: 'media', kicker: 'Pantalla táctil', h: 'Programa *cada cuántas horas.*',
        body: 'Eliges el intervalo y la cantidad de agua desde la pantalla.', imgs: ['pantalla'] },
      { t: 'steps', kicker: 'Cada vez que toca', h: 'Tira. Rellena. *Repite.*',
        items: [['Tira', 'El agua usada del cuenco va al depósito de agua sucia.'],
                ['Rellena', 'Cae agua limpia del depósito de 4,5 L.'],
                ['Repite', 'Automáticamente, al intervalo que hayas programado.']], imgs: ['tubo'] },
      { t: 'bigmedia', kicker: 'Por ejemplo, cada 6 horas', big: '4 veces', h: 'al día agua nueva',
        body: 'Sin que tengas que vaciar ni rellenar el cuenco.', imgs: ['dos-colores'] },
      { t: 'versus', kicker: 'Haz la cuenta', h: 'Con filtro *vs VitalPet*',
        left: ['conv3', 'Fuente con filtro', '50–70 €/año'], right: ['vertical-claro', 'VitalPet', '0 € en filtros'] },
      { t: 'bigmedia', dark: true, kicker: 'Batería de 4000 mAh', big: '90 días', h: 'sin enchufe',
        note: BATERIA, imgs: ['vertical-oscuro'] },
      { t: 'cta', h: 'Programa y *olvídate.*', imgs: ['gris', 'gato', 'dos-colores'] },
    ],
  },
  {
    id: '03-bateria-90-dias',
    titulo: '90 días sin enchufe',
    slides: [
      { t: 'full', kicker: 'Batería de 4000 mAh', h: '90 días *sin enchufe*', img: 'vertical-oscuro', swipe: true },
      { t: 'media', kicker: 'Fuentes con cable', h: 'Siempre pegada *a un enchufe.*',
        body: 'Y con el cable a la vista, al alcance del gato.', imgs: ['conv6'] },
      { t: 'media', kicker: 'VitalPet', h: 'Sin cables. *Ponla donde quieras.*',
        body: 'Se carga por USB y aguanta hasta 90 días.', imgs: ['gato', 'gris', 'dos-colores'], layout: 'three', note: BATERIA },
      { t: 'media', kicker: 'Pantalla táctil', h: 'Y se programa *en segundos.*',
        body: 'Eliges cada cuántas horas el cuenco tira el agua y se rellena solo.', imgs: ['pantalla'] },
      { t: 'cover', kicker: 'Y sin filtros', h: 'Te ahorras *50–70 € al año*',
        sub: 'Lo que cuestan los filtros de recambio de una fuente normal.', imgs: ['conv3', 'vertical-claro'], vs: true },
      { t: 'cta', h: 'Agua limpia. *90 días sin cables.*', imgs: ['vertical-oscuro', 'gato', 'gris'] },
    ],
  },
];
