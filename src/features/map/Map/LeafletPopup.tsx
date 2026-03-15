import { Popup, PopupProps } from 'react-leaflet';
import { decodeGeoHash } from './lib/helper/geocoder';

interface LeafletPopupProps extends PopupProps {
  handlePopupClose: (active?: boolean) => void
  item: any
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const LeafletPopup = ({
  handlePopupClose: _handlePopupClose,
  item,
  isOpen: _isOpen,
  onOpenChange,
  ...props
}: LeafletPopupProps) => {
  return (
    <Popup
      {...props}
      position={decodeGeoHash(item)}
      eventHandlers={{
        remove: () => onOpenChange(false)
      }}
    >
      <div className="min-w-[200px] p-0 overflow-hidden rounded-xl">
        <div className="p-3 bg-white dark:bg-gray-950">
          <h3 className="font-bold text-gray-900 dark:text-white">
            {item.displayname || item.username}
          </h3>
          <p className="text-xs text-gray-500">@{item.username}</p>
        </div>
      </div>
    </Popup>
  );
};

export default LeafletPopup;
