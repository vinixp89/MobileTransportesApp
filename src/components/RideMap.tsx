import { StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'

type Ponto = { latitude: number; longitude: number }

type Props = {
  origem: Ponto
  destino: Ponto
  corHex: string
  // Posição atual do motorista a caminho (opcional) — usada pela tela de acompanhar corrida pra
  // mostrar ele se deslocando em tempo real, sempre dentro do enquadramento do mapa.
  motoristaPos?: Ponto | null
}

// Mesmo mapa do front-end web (Leaflet + tiles OSM/CARTO, sem chave de API, trajeto real via
// OSRM) — só que rodando dentro de uma WebView, já que o React Native não tem um jeito nativo
// de renderizar isso sem depender do SDK do Google Maps (que exigiria chave de API paga/gerenciada).
function montarHtml(origem: Ponto, destino: Ponto, corHex: string, motoristaPos?: Ponto | null) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #mapa { height: 100%; margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="mapa"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const origem = ${JSON.stringify(origem)};
    const destino = ${JSON.stringify(destino)};
    const corHex = ${JSON.stringify(corHex)};
    const motoristaPos = ${JSON.stringify(motoristaPos ?? null)};
    const origemLatLng = [origem.latitude, origem.longitude];
    const destinoLatLng = [destino.latitude, destino.longitude];

    const mapa = L.map('mapa', {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      touchZoom: false,
      doubleClickZoom: false,
    }).setView(origemLatLng, 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(mapa);

    L.circleMarker(origemLatLng, { radius: 7, color: '#38bdf8', fillColor: '#38bdf8', fillOpacity: 1 }).addTo(mapa);
    L.circleMarker(destinoLatLng, { radius: 7, color: corHex, fillColor: corHex, fillOpacity: 1 }).addTo(mapa);

    if (motoristaPos) {
      L.circleMarker([motoristaPos.latitude, motoristaPos.longitude], {
        radius: 8, color: '#9333ea', fillColor: '#9333ea', fillOpacity: 1, weight: 2,
      }).addTo(mapa);
    }

    let linha = L.polyline([origemLatLng, destinoLatLng], { color: corHex, weight: 3, dashArray: '6 6' }).addTo(mapa);
    const pontosEnquadramento = motoristaPos
      ? [origemLatLng, destinoLatLng, [motoristaPos.latitude, motoristaPos.longitude]]
      : [origemLatLng, destinoLatLng];
    mapa.fitBounds(pontosEnquadramento, { padding: [32, 32], maxZoom: 15 });

    // Trajeto real seguindo ruas, via servidor de demonstração público do OSRM (sem chave de API).
    // Se falhar, fica a linha reta tracejada já desenhada acima.
    fetch('https://router.project-osrm.org/route/v1/driving/' +
      origem.longitude + ',' + origem.latitude + ';' + destino.longitude + ',' + destino.latitude +
      '?overview=full&geometries=geojson')
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => {
        const coordenadas = data && data.routes && data.routes[0] && data.routes[0].geometry.coordinates;
        if (Array.isArray(coordenadas) && coordenadas.length > 1) {
          const pontos = coordenadas.map(([lon, lat]) => [lat, lon]);
          mapa.removeLayer(linha);
          linha = L.polyline(pontos, { color: corHex, weight: 4 }).addTo(mapa);
          const bounds = motoristaPos ? [...pontos, [motoristaPos.latitude, motoristaPos.longitude]] : pontos;
          mapa.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
        }
      })
      .catch(() => {});
  </script>
</body>
</html>`
}

export default function RideMap({ origem, destino, corHex, motoristaPos }: Props) {
  return (
    <View style={styles.container}>
      <WebView
        source={{ html: montarHtml(origem, destino, corHex, motoristaPos) }}
        style={styles.webview}
        scrollEnabled={false}
        originWhitelist={['*']}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 160,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
})
