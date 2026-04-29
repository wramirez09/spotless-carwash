export type Location = {
  slug: 'roosevelt-rd' | 'madison-st'
  name: string
  street: string
  city: string
  region: string
  postalCode: string
  phone: string
  phoneHref: string
  selfServeBays: number
  touchlessBays: number
  heated: boolean
  photoCaption: string
  gradient: string
}

export const locations: Location[] = [
  {
    slug: 'roosevelt-rd',
    name: 'Roosevelt Rd',
    street: '7343 Roosevelt Road',
    city: 'Forest Park',
    region: 'IL',
    postalCode: '60130',
    phone: '(708) 771-2945',
    phoneHref: 'tel:7087712945',
    selfServeBays: 3,
    touchlessBays: 2,
    heated: true,
    photoCaption: '// photo: roosevelt-rd-exterior.jpg',
    gradient: 'linear-gradient(135deg,#1B4FD9 0%,#0A2A6B 100%)',
  },
  {
    slug: 'madison-st',
    name: 'Madison St',
    street: '7802 Madison Street',
    city: 'Forest Park',
    region: 'IL',
    postalCode: '60130',
    phone: '(708) 771-2945',
    phoneHref: 'tel:7087712945',
    selfServeBays: 3,
    touchlessBays: 2,
    heated: false,
    photoCaption: '// photo: madison-st-exterior.jpg',
    gradient: 'linear-gradient(135deg,#0A2A6B 0%,#1B4FD9 100%)',
  },
]

export function fullAddress(loc: Location) {
  return `${loc.street}, ${loc.city}, ${loc.region} ${loc.postalCode}`
}

export function directionsUrl(loc: Location) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress(loc))}`
}
