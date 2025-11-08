import { Gem, Leaf, LocateFixed, LucideProps, PersonStanding, User, Users } from 'lucide-react'
import { FunctionComponent } from 'react'
import colors from 'tailwindcss/colors'

export enum Category {
  LOCATE = 0,
  USER = 1,
  TREASURY = 2
}

export interface MarkerCategoriesValues {
  name: string
  icon: FunctionComponent<LucideProps>
  color: string
  hideInMenu?: boolean
}

type MarkerCategoryType = {
  [key in Category]: MarkerCategoriesValues
}

const MarkerCategories: MarkerCategoryType = {
  [Category.LOCATE]: {
    name: 'User Location',
    icon: User,
    color: colors.red[400],
    hideInMenu: false,
  },
  [Category.USER]: {
    name: 'USER',
    icon: Users,
    color: colors.white,
  },
  [Category.TREASURY]: {
    name: 'TREASURY',
    icon: Gem,
    color: colors.red[500],
  },
}

export default MarkerCategories
