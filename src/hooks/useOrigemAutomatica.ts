import { useEffect, useState } from 'react'
import * as Location from 'expo-location'
import type { Endereco } from '../components/EnderecoFields'

// Pede a localização atual do celular e converte pra um Endereco (texto) via geocodificação
// reversa do próprio sistema operacional — sem precisar de chave de API nem bater no backend.
// O backend continua sendo quem descobre a latitude/longitude de verdade a partir desse texto
// (mesmo caminho que um endereço digitado ou escolhido do autocomplete já passa), então isso só
// preenche o formulário sozinho, sem mudar como a corrida é criada.
export function useOrigemAutomatica() {
  const [endereco, setEndereco] = useState<Endereco | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let cancelado = false

    async function buscar() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted' || cancelado) return

        const posicao = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        if (cancelado) return

        const [resultado] = await Location.reverseGeocodeAsync({
          latitude: posicao.coords.latitude,
          longitude: posicao.coords.longitude,
        })
        if (cancelado || !resultado) return

        setEndereco({
          logradouro: resultado.street ?? '',
          numero: resultado.streetNumber ?? 'S/N',
          complemento: '',
          bairro: resultado.district ?? resultado.subregion ?? '',
          cidade: resultado.city ?? resultado.subregion ?? '',
          estado: resultado.region ?? '',
        })
      } catch {
        // Sem permissão, GPS desligado, ou geocodificação reversa falhou — o cliente digita a
        // origem manualmente como sempre, sem erro nenhum aparecendo pra ele por causa disso.
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }

    buscar()

    return () => {
      cancelado = true
    }
  }, [])

  return { endereco, carregando }
}
