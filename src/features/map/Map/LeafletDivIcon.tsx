import type { PointExpression, DivIcon } from 'leaflet';
import { renderToString } from 'react-dom/server';
import { isValidElement, ReactElement } from 'react';  // Import ReactElement type

interface DivIconValues {
  source: string | ReactElement<any>;  // Use ReactElement<any> for JSX content
  anchor: PointExpression;  // The anchor point of the icon
}

const getLeaflet = () =>
  (typeof window !== 'undefined' ? (window as any).L : null) as typeof import('leaflet') | null;

const LeafletDivIcon = ({ source, anchor }: DivIconValues): DivIcon | null => {
  const leaflet = getLeaflet();
  if (!leaflet) {
    return null;
  }

  let htmlContent: string;

// Handle the source, checking if it's a string (image URL) or a React element
if (typeof source === 'string') {
  htmlContent = `<img src="${source}" style="width:32px; height:32px;" />`; // Image URL
} else if (isValidElement(source)) {
  const reactElement :any = source as ReactElement<any>; // Type casting
  htmlContent = renderToString(reactElement);
} else {
  return null;  // If source is neither a string nor a valid React element, return null
}

    return leaflet.divIcon({
      html: htmlContent, // HTML string content
      iconAnchor: anchor, // Set the anchor point
    });
};

export default LeafletDivIcon;
