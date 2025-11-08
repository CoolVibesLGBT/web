import { FunctionComponent } from 'react';
import { getSafeImageURL } from '../../../helpers/helpers';
 
interface IconProps {
  item?: any;
  width?: number;
  height?: number;
}

// MapIcon FunctionComponent olarak tanımlandı
export const MapIcon: FunctionComponent<IconProps> = ({item = null,width = 24,height = 24}) => {
  const pictureURL = getSafeImageURL(item.avatar,"icon")
  return (
    <div className="flex flex-col gap-2 items-center justify-center min-w-[60px] min-h-[60px] max-w-[60px] max-h-[60px]">
      <img
        src={pictureURL}
        alt="Map Icon"
        className={" rounded-full opacity-1 w-[60px] h-[80px]"}
      />
    </div>
  );
};