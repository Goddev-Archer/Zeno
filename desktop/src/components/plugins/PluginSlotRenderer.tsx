// ============================================================================
//   ZENO PLUGIN UI SLOT RENDERER
//   Dynamische Einhängepunkte für UI-Komponenten von Community-Plugins
// ============================================================================

import React, { useEffect, useRef, useState } from "react";
import { pluginManager } from "../../services/pluginManagerService";
import { UISlot, UIComponentDef } from "../../types/pluginTypes";

interface PluginSlotRendererProps {
  slot: UISlot;
  className?: string;
  style?: React.CSSProperties;
}

export const PluginSlotRenderer: React.FC<PluginSlotRendererProps> = ({ slot, className, style }) => {
  const [components, setComponents] = useState<UIComponentDef[]>([]);

  useEffect(() => {
    const update = () => {
      setComponents(pluginManager.getUIComponentsForSlot(slot));
    };

    update();
    const unsubscribe = pluginManager.onPluginChange(update);
    return () => {
      unsubscribe();
    };
  }, [slot]);

  if (components.length === 0) return null;

  return (
    <div className={`zeno-plugin-slot zeno-slot-${slot} ${className || ""}`} style={style}>
      {components.map((comp) => (
        <PluginItemContainer key={comp.id} component={comp} />
      ))}
    </div>
  );
};

const PluginItemContainer: React.FC<{ component: UIComponentDef }> = ({ component }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const cleanup = component.render(ref.current);
    return () => {
      if (typeof cleanup === "function") {
        cleanup();
      }
    };
  }, [component]);

  return <div ref={ref} className="zeno-plugin-component-container" />;
};
