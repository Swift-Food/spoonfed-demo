import { CateringWidget } from '@swift-food-services/catering-widget';
import { useStore } from '../../store/useStore';

// Eden brand primary — keep in sync with `eden.green` in tailwind.config.js.
const EDEN_PRIMARY = '#1F4D2E';

const PUBLISHABLE_KEY = import.meta.env.VITE_PUBLIC_SWIFT_CATERING_PUBLISHABLE_KEY ?? '';
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

export default function WidgetOrder() {
  const aiEnabled = useStore((s) => s.persona.aiEnabled ?? false);

  if (!PUBLISHABLE_KEY) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-eden-sage/40 bg-white p-6 text-sm text-eden-stone">
        <h1 className="font-serif text-2xl text-eden-green">Catering widget not configured</h1>
        <p className="mt-2">
          Set <code className="rounded bg-eden-sand px-1">VITE_PUBLIC_SWIFT_CATERING_PUBLISHABLE_KEY</code> and{' '}
          <code className="rounded bg-eden-sand px-1">VITE_PUBLIC_GOOGLE_MAPS_API_KEY</code> in a{' '}
          <code className="rounded bg-eden-sand px-1">.env.local</code> file, then restart the dev server.
        </p>
      </div>
    );
  }

  return (
    <CateringWidget
      key={aiEnabled ? 'ai' : 'no-ai'}
      aiEnabled={aiEnabled}
      publishableKey={PUBLISHABLE_KEY}
      googleMapsApiKey={GOOGLE_MAPS_API_KEY}
      stickyTopOffset={0}
      theme={{ primary: EDEN_PRIMARY }}
      onError={(e) => {
        console.error('catering widget error', e);
      }}
    />
  );
}
