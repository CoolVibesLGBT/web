import { Bird, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Popup, PopupProps } from 'react-leaflet'

import { AppConfig } from './lib/AppConfig'
import { MarkerCategoriesValues } from '.lib/MarkerCategories'
import { MapIcon } from './Icon'
import { useEffect, useRef, useState } from 'react'






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

  const [name, setName] = useState<string>("")
  const [description, setDescription] = useState<string>("")

  const targetRef = useRef(null);
 

 
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
    <div className='w-full'>
      ersan2
      </div>
  )
}

export default LeafletPopup