import { Bird, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Popup, PopupProps } from 'react-leaflet'

import { AppConfig } from './lib/AppConfig'
import { MarkerCategoriesValues } from '.lib/MarkerCategories'
import { MapIcon } from './Icon'
import { MutableRefObject, useEffect, useRef, useState } from 'react'
import ProfileScreen from '../ProfileScreen'






interface LeafletPopupProps extends PopupProps {
  handlePopupClose: (active?: boolean) => void
  item: any
  isOpen: boolean // pass this from parent
  onOpenChange: (open: boolean) => void // pass this from parent
}


const LeafletPopup = ({
  handlePopupClose,
  item,
  isOpen,
  onOpenChange,
  ...props
}: LeafletPopupProps) => {

 
  useEffect(() => {
    if (isOpen) {

 
    }
  }, [isOpen])



  const loadContributionInfo = async (place: any) => {
      console.log("Here")
  }

  const loadData = async (place: any) => {
    await loadContributionInfo(place)
  }




  return (
    <div className=' w-full  h-screen bg-red-500'>
      coolvibes
      </div>

   
  )
}

export default LeafletPopup

