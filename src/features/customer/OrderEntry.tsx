import { useStore } from '../../store/useStore';
import DatePicker from './DatePicker';
import WidgetOrder from './WidgetOrder';

/**
 * `/order` landing. Widget-driven orderers see the embedded Swift catering
 * widget; everyone else continues through Eden's in-house ordering flow.
 */
export default function OrderEntry() {
  const useWidget = useStore((s) => s.persona.useWidget ?? false);
  return useWidget ? <WidgetOrder /> : <DatePicker />;
}
