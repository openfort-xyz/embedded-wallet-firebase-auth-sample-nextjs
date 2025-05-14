import { http, createConfig } from 'wagmi'
import { polygonAmoy } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export function getConfig() {
    return createConfig({
        chains: [polygonAmoy],
        connectors: [
            injected(),
        ],
        transports: {
            [polygonAmoy.id]: http('https://polygon-amoy.gateway.tenderly.co'),
        },
    })
}

declare module 'wagmi' {
    interface Register {
        config: ReturnType<typeof getConfig>
    }
}