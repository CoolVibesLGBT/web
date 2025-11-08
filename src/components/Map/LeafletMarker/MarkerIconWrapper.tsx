import { useEffect, useState } from "react"
import { getSafeImageURL } from "../../../helpers/helpers"
import { MapIcon } from "../Icon"
import { motion } from "framer-motion"


export interface MarkerIconWrapperProps {
  item: any,
  color?: any,
  label?: string
}


const GroupIcon = ({ group, color, label }: { group: any, color: any, label: any }) => {
  return (
    <div
      className="relative rounded-full max-w-64 max-h-64 m-0 inline-flex p-0 cursor-pointer select-none
                 active:scale-95 active:shadow-inner active:duration-150 active:ease-in-out"
      style={{ backgroundColor: color }}
    >
      <span className="absolute -inset-2 rounded-full opacity-40" style={{ backgroundColor: color }} />

      <div
        className="relative inline-block rounded-full p-2 text-white"
        style={{ backgroundColor: color }}
      >
        <div className="flex flex-col gap-2 items-center justify-center min-w-[60px] min-h-[60px] max-w-[60px] max-h-[60px]">
          <img
            src={"/icons/marker.webp"}
            alt="Map Icon"
            className="perspective-image rounded-full opacity-100 w-[60px] h-[60px]"
          />
        </div>

        {label && (
          <span className="absolute -top-2 -right-2 flex h-7 w-7 flex-col items-center rounded-full border-2 border-white bg-red-500 pt-1 text-xs">
            {label}
          </span>
        )}
      </div>
      <span className={`absolute ${label ? "-inset-2" : "-inset-1"} rounded-full shadow-md`} />
    </div>
  )
}


const UserIcon = ({ user, color, label }: { user: any, color: any, label: any }) => {
  return (
    <div
      className="relative rounded-full max-w-64 max-h-64 m-0 inline-flex p-0 cursor-pointer select-none 
                 active:scale-95 active:shadow-inner active:duration-150 active:ease-in-out"
      style={{ backgroundColor: color }}
    >
      <span className="absolute -inset-2 rounded-full opacity-40" style={{ backgroundColor: color }} />

      <div
        className="relative inline-block rounded-full p-2 text-white"
        style={{ backgroundColor: color }}
      >
        <div className="flex flex-col gap-2 items-center justify-center min-w-[60px] min-h-[60px] max-w-[60px] max-h-[60px]">
          <img
            src={user.image}
            alt="Map Icon"
            className="perspective-image rounded-full opacity-100 w-[60px] h-[60px]"
          />
        </div>

        {label && (
          <span
            style={{
              width: "100px",
              left: "72px",
              minWidth: "100px",
              backgroundColor: color,
              borderColor: color,
            }}
            className="absolute -top-2 -right-2 flex h-7 w-[50px] flex-col items-center rounded-full pt-1 text-xs"
          >
            {label}
          </span>
        )}
      </div>
      <span className={`absolute ${label ? "-inset-2" : "-inset-1"} rounded-full shadow-md`} />
    </div>
  );
}
const MarkerIconWrapper = ({ item, color, label }: MarkerIconWrapperProps) => {
  console.log(item);

  return item.group ? (
    <GroupIcon group={item} color={color} label={label} />
  ) : (
    <UserIcon user={item} color={color} label={label} />
  );
};

export default MarkerIconWrapper