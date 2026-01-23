import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Realtime Draft Messenger'
export const size = {
    width: 1200,
    height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(to bottom right, #0f172a, #1e293b)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'sans-serif',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 40,
                        width: 150,
                        height: 150,
                        borderRadius: 75,
                        background: 'linear-gradient(to bottom right, #06b6d4, #2563eb)',
                        boxShadow: '0 0 50px rgba(6, 182, 212, 0.5)',
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="100" height="100">
                        <path d="M12 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5.025.84 1.473-.691 3.804-1.12 4.61a.999.999 0 0 0 1.252 1.344c.915-.36 3.42-1.47 5.09-1.041C9.697 22.64 10.831 23 12 23c5.523 0 10-4.477 10-10S17.523 2 12 2zm1 14h-6v-2h6v2zm4-4H7v-2h10v2zm0-4H7V6h10v2z" />
                    </svg>
                </div>
                <div
                    style={{
                        fontSize: 60,
                        fontWeight: 800,
                        color: 'white',
                        background: 'linear-gradient(to right, #ffffff, #94a3b8)',
                        backgroundClip: 'text',
                        marginBottom: 20,
                        textAlign: 'center',
                    }}
                >
                    Realtime Draft Messenger
                </div>
                <div
                    style={{
                        fontSize: 30,
                        color: '#94a3b8',
                        textAlign: 'center',
                        maxWidth: 800,
                    }}
                >
                    See messages as they are typed. Live.
                </div>
            </div>
        ),
        {
            ...size,
        }
    )
}
