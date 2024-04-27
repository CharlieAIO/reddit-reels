import { Fragment, useEffect, useState } from 'react'
import {jwtDecode} from 'jwt-decode'
import { Menu, Popover, Transition } from '@headlessui/react'
import { FaBars, FaWindowClose, FaUserCircle } from 'react-icons/fa'
import { FaMagnifyingGlass } from 'react-icons/fa6'
import { BsDiscord, BsTwitter } from 'react-icons/bs'


import Logo from '../assets/images/logo.png'
import Feed from '../components/Feed'

import { signout } from '../socket'
import Home from '../components/Home'
import Generate from '../components/Generate'
import Configure from '../components/Configure'
import Credit from '../components/Credit'

const userNavigation = [
    { name: 'Sign out', href: '#' },
]

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}


const searchEnabled = false
export default function App() {
    const [user, setUser] = useState({
        name: 'Charlie',

    })
    const [navigation, setNavigation] = useState([
        { name: 'Home', href: '#', current: true },
        { name: 'Generate', href: '#', current: false },
        { name: 'Configure', href: '#', current: false },
        { name: 'Credit', href: '#', current: false },
    ])


    useEffect(() => {
        const token = localStorage.getItem('accessToken')
        if (token) {
            const decoded = jwtDecode(token)
            setUser({ name: decoded.username })
        }
    }, [])

    const navigate = (name) => {
        setNavigation(navigation.map((nav) => {
            nav.current = nav.name === name
            return nav
        }))
    }

    const logoutUser = () => {
        signout()
    }

    return (
        <div className='h-screen'>

            <div className="min-h-full bg-gray-100">
                <Popover as="header" className="bg-slate-900 pb-24">
                    {({ open }) => (
                        <>
                            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
                                <div className="relative flex items-center justify-center py-10 md:py-5 lg:justify-between">
                                    {/* Logo */}
                                    <div className="absolute left-0 flex-shrink-0 lg:static">
                                        <span className='flex'>
                                            <span className="sr-only">y</span>
                                            <img
                                                className="h-20 w-auto"
                                                src={Logo}
                                                alt=""
                                            />
                                            <h1 className='my-auto text-white font-medium text-xl'>RedditReels</h1>
                                        </span>
                                    </div>

                                    {/* Right section on desktop */}
                                    <div className="hidden lg:ml-4 lg:flex lg:items-center lg:pr-0.5">

                                        {/* Profile dropdown */}
                                        <Menu as="div" className="relative ml-4 flex-shrink-0">
                                            <div>
                                                <Menu.Button className="relative flex text-sm ring-0">
                                                    <span className="absolute -inset-1.5" />
                                                    <span className="sr-only">Open user menu</span>
                                                    <span className='text-white font-bold'>Welcome, {user?.name}</span>
                                                </Menu.Button>
                                            </div>
                                            <Transition
                                                as={Fragment}
                                                leave="transition ease-in duration-75"
                                                leaveFrom="transform opacity-100 scale-100"
                                                leaveTo="transform opacity-0 scale-95"
                                            >
                                                <Menu.Items className="absolute -right-2 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                    {userNavigation.map((item) => (
                                                        <Menu.Item key={item.name}>
                                                            {({ active }) => (
                                                                <a
                                                                    onClick={logoutUser}
                                                                    className={classNames(
                                                                        active ? 'bg-gray-100' : '',
                                                                        'block px-4 py-2 text-sm text-gray-700 hover:cursor-pointer'
                                                                    )}
                                                                >
                                                                    {item.name}
                                                                </a>
                                                            )}
                                                        </Menu.Item>
                                                    ))}
                                                </Menu.Items>
                                            </Transition>
                                        </Menu>
                                    </div>

                                    {/* Search */}
                                    {
                                        searchEnabled && (
                                            <div className="min-w-0 flex-1 px-12 lg:hidden">
                                                <div className="mx-auto w-full max-w-xs">
                                                    <label htmlFor="desktop-search" className="sr-only">
                                                        Search
                                                    </label>
                                                    <div className="relative text-white focus-within:text-gray-600">
                                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                            <FaMagnifyingGlass className="h-5 w-5" aria-hidden="true" />
                                                        </div>
                                                        <input
                                                            id="desktop-search"
                                                            className="block w-full rounded-md border-0 bg-white/20 py-1.5 pl-10 pr-3 text-white placeholder:text-white focus:bg-white focus:text-gray-900 focus:ring-0 focus:placeholder:text-gray-500 sm:text-sm sm:leading-6"
                                                            placeholder="Search"
                                                            type="search"
                                                            name="search"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }

                                    {/* Menu button */}
                                    <div className="absolute right-0 flex-shrink-0 lg:hidden">
                                        {/* Mobile menu button */}
                                        <Popover.Button className="relative inline-flex items-center justify-center rounded-md bg-transparent p-2 text-indigo-200 hover:bg-white hover:bg-opacity-10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white">
                                            <span className="absolute -inset-0.5" />
                                            <span className="sr-only">Open main menu</span>
                                            {open ? (
                                                <FaWindowClose className="block h-6 w-6" aria-hidden="true" />
                                            ) : (
                                                <FaBars className="block h-6 w-6" aria-hidden="true" />
                                            )}
                                        </Popover.Button>
                                    </div>
                                </div>
                                <div className="hidden border-t border-white border-opacity-20 py-5 lg:block">
                                    <div className="grid grid-cols-3 items-center gap-8">
                                        <div className="col-span-2">
                                            <nav className="flex space-x-4">
                                                {navigation.map((item) => (
                                                    <span
                                                        onClick={() => navigate(item.name)}
                                                        key={item.name}
                                                        className={classNames(
                                                            item.current ? 'text-white' : 'text-indigo-100',
                                                            'rounded-md bg-white bg-opacity-0 px-3 py-2 text-sm font-medium hover:bg-opacity-10 hover:cursor-pointer'
                                                        )}
                                                        aria-current={item.current ? 'page' : undefined}
                                                    >
                                                        {item.name}
                                                    </span>
                                                ))}
                                            </nav>
                                        </div>
                                        <div>
                                            {
                                                searchEnabled && (
                                                    <div className="mx-auto w-full max-w-md">
                                                        <label htmlFor="mobile-search" className="sr-only">
                                                            Search
                                                        </label>
                                                        <div className="relative text-white focus-within:text-gray-600">
                                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                                <FaMagnifyingGlass className="h-5 w-5" aria-hidden="true" />
                                                            </div>
                                                            <input
                                                                id="mobile-search"
                                                                className="block w-full rounded-md border-0 bg-white/20 py-1.5 pl-10 pr-3 text-white placeholder:text-white focus:bg-white focus:text-gray-900 focus:ring-0 focus:placeholder:text-gray-500 sm:text-sm sm:leading-6"
                                                                placeholder="Search"
                                                                type="search"
                                                                name="search"
                                                            />
                                                        </div>
                                                    </div>
                                                )
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Transition.Root as={Fragment}>
                                <div className="lg:hidden">
                                    <Transition.Child
                                        as={Fragment}
                                        enter="duration-150 ease-out"
                                        enterFrom="opacity-0"
                                        enterTo="opacity-100"
                                        leave="duration-150 ease-in"
                                        leaveFrom="opacity-100"
                                        leaveTo="opacity-0"
                                    >
                                        <Popover.Overlay className="fixed inset-0 z-20 bg-black bg-opacity-25" />
                                    </Transition.Child>

                                    <Transition.Child
                                        as={Fragment}
                                        enter="duration-150 ease-out"
                                        enterFrom="opacity-0 scale-95"
                                        enterTo="opacity-100 scale-100"
                                        leave="duration-150 ease-in"
                                        leaveFrom="opacity-100 scale-100"
                                        leaveTo="opacity-0 scale-95"
                                    >
                                        <Popover.Panel
                                            focus
                                            className="absolute inset-x-0 top-0 z-30 mx-auto w-full max-w-3xl origin-top transform p-2 transition"
                                        >
                                            <div className="divide-y divide-gray-200 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 ">
                                                <div className="pb-2 pt-3 ">
                                                    <div className="flex items-center justify-between px-4">
                                                        <div>
                                                            <img
                                                                className="h-20 w-auto"
                                                                src={Logo}
                                                                alt="Your Company"
                                                            />
                                                        </div>
                                                        <div className="-mr-2">
                                                            <Popover.Button className="relative inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                                                                <span className="absolute -inset-0.5" />
                                                                <span className="sr-only">Close menu</span>
                                                                <FaWindowClose className="h-6 w-6" aria-hidden="true" />
                                                            </Popover.Button>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 space-y-1 px-2">
                                                        {
                                                            navigation.map((item) => (
                                                                <span
                                                                    onClick={() => navigate(item.name)}
                                                                    className={`block rounded-md px-3 py-2 text-base font-medium text-gray-900 ${item.current && 'bg-gray-100'} hover:bg-gray-100 hover:text-gray-80 hover:cursor-pointer`}
                                                                >
                                                                    {item.name}
                                                                </span>
                                                            ))
                                                        }
                                                    </div>
                                                </div>
                                                <div className="pb-2 pt-4">
                                                    <div className="flex items-center px-5">
                                                        <div className="flex-shrink-0">
                                                            <FaUserCircle className='h-10 w-10' />
                                                        </div>
                                                        <div className="ml-3 min-w-0 flex-1">
                                                            <div className="truncate text-base font-medium text-gray-800">{user.name}</div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 space-y-1 px-2">
                                                        {userNavigation.map((item) => (
                                                            <a
                                                                key={item.name}
                                                                onClick={logoutUser}
                                                                className="block rounded-md px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-100 hover:text-gray-800"
                                                            >
                                                                {item.name}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </Popover.Panel>
                                    </Transition.Child>
                                </div>
                            </Transition.Root>
                        </>
                    )}
                </Popover>
                <main className="-mt-24 pb-8">
                    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-7xl lg:px-8 h-full">
                        <h1 className="sr-only">Page title</h1>
                        {/* Main 3 column grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8 h-1/2">
                            {/* Left column */}
                            <div className="grid grid-cols-1 gap-4 lg:col-span-2 h-full">
                                <section aria-labelledby="section-1-title" className="h-full">
                                    <h2 className="sr-only" id="section-1-title">
                                        Section title
                                    </h2>
                                    <div className="overflow-hidden rounded-lg bg-white shadow h-full">
                                        <div className="p-6">
                                            <LeftColumn page={navigation.find(e => e.current).name} />
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Right column */}
                            <div className="grid grid-cols-1 gap-4 h-full">
                                <section aria-labelledby="section-2-title" className="h-[full]">
                                    <h2 className="sr-only" id="section-2-title">
                                        Feed
                                    </h2>
                                    <div className="overflow-hidden rounded-lg bg-white shadow h-full">
                                        <div className="p-6">
                                            <Feed />
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>


                </main>
                <footer>
                    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
                        <div className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
                            <div className="flex items-center space-x-32">

                                {/* Social Icons */}
                                <div className="text-gray-600 text-sm space-x-4">
                                    <a target='_blank' href="https://discord.com/invite/YJa946V7TK" className="hover:text-gray-900">
                                        <BsDiscord size={20} />
                                    </a>
                                    <a target='_blank' href="https://twitter.com/Reddit_Reels" className="hover:text-gray-900">
                                        <BsTwitter size={20} />
                                    </a>
                                </div>

                                {/* Terms of Service & Privacy Policy Links */}
                                <div className="flex-grow">
                                    <div className="flex justify-center text-gray-600 text-sm space-x-4">
                                        <a target='_blank' href="https://app.redditreels.com/tos" className="hover:text-gray-900">Terms of Service</a>
                                        <a target='_blank' href="https://app.redditreels.com/privacy" className="hover:text-gray-900">Privacy Policy</a>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </footer>
                {/* <Footer /> */}
            </div>
        </div>
    )
}


function LeftColumn({ page }) {
    switch (page.toLowerCase()) {
        case 'home':
            return <Home />

        case 'generate':
            return <Generate />

        case 'configure':
            return <Configure />

        case 'credit':
            return <Credit />

        default:
            return <div></div>
    }
}
