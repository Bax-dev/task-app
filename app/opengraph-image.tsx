import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'TaskFlow - Project Management Platform';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              background: '#7c3aed',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: 'bold',
              color: 'white',
            }}
          >
            T
          </div>
          <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#7c3aed' }}>
            TaskFlow
          </span>
        </div>
        <h1
          style={{
            fontSize: '56px',
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          Ship Projects Faster, Together
        </h1>
        <p
          style={{
            fontSize: '24px',
            color: '#a1a1aa',
            textAlign: 'center',
            marginTop: '24px',
            maxWidth: '800px',
          }}
        >
          Plan work, track progress, and collaborate with your team in one platform
        </p>
        <div
          style={{
            display: 'flex',
            gap: '32px',
            marginTop: '48px',
            color: '#a1a1aa',
            fontSize: '18px',
          }}
        >
          <span>Tasks</span>
          <span style={{ color: '#4a4a5a' }}>|</span>
          <span>Projects</span>
          <span style={{ color: '#4a4a5a' }}>|</span>
          <span>Teams</span>
          <span style={{ color: '#4a4a5a' }}>|</span>
          <span>Notes</span>
          <span style={{ color: '#4a4a5a' }}>|</span>
          <span>Activity Logs</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
