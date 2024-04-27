import { useState, Fragment, useEffect } from "react"
import { Listbox, Transition } from '@headlessui/react'
import { AiOutlineCheck, AiOutlineDown, AiOutlineSave } from 'react-icons/ai'
import { BarLoader, SquareLoader } from 'react-spinners'

import { AiFillInfoCircle } from "react-icons/ai"
import { BiLogoTiktok } from "react-icons/bi"

import Notification from "./Notification"
import socket, { downloadVideo } from "../socket"

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}


export default function Home() {
    const [stats, setStats] = useState(null)


    const [timeFrame, setTimeFrame] = useState({
        value: "Today",
        id: "today"
    })


    useEffect(() => {
        const tiktok_add_code = new URL(window.location.href)?.searchParams?.get('tiktok') || null
        if (tiktok_add_code) {
            socket.emit('connect-tiktok', { code: tiktok_add_code })
            // remove code from url
            window.history.replaceState({}, document.title, "/");
        }
    }, [])





    useEffect(() => {
        socket.emit('stats');

        const updateStatsListener = (data_) => {
            setStats(data_)
        };


        socket.on('stats', updateStatsListener);

        // This will unregister the listener when the component is unmounted
        return () => {
            socket.off('stats', updateStatsListener);
        };

    }, []);





    return (
        <div>
            <div className="flex flex-col gap-8">
                <div>

                    <GuideAlert />

                    <div className="w-1/4">
                        <TimeSelect selected={timeFrame} setSelected={setTimeFrame} />
                    </div>

                    <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
                        {
                            stats ? (

                                Object.values(stats[timeFrame.id]).map((item) => (
                                    <div key={item.name} className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                                        <dt className="truncate text-sm font-medium text-gray-500">{item.name}</dt>
                                        <dd className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">{item.stat}</dd>
                                    </div>
                                )))
                                : (
                                    <>
                                        <div key={1} className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                                            <dt className="truncate text-sm font-medium text-gray-500"></dt>
                                            <dd className="mt-1 text-3xl font-semibold tracking-tight text-slate-800 justify-center flex">
                                                <BarLoader color={'#0f172a'} />
                                            </dd>
                                        </div>
                                        <div key={2} className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                                            <dt className="truncate text-sm font-medium text-gray-500"></dt>
                                            <dd className="mt-1 text-3xl font-semibold tracking-tight text-slate-800 justify-center flex">
                                                <BarLoader color={'#0f172a'} />
                                            </dd>
                                        </div>
                                        <div key={3} className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                                            <dt className="truncate text-sm font-medium text-gray-500"></dt>
                                            <dd className="mt-1 text-3xl font-semibold tracking-tight text-slate-800 justify-center flex">
                                                <BarLoader color={'#0f172a'} />
                                            </dd>
                                        </div></>
                                )

                        }
                    </dl>
                </div>
            </div>

            <div>
                <VideoGrid downloadVideo={downloadVideo} />
            </div>
        </div>
    )
}


function TimeSelect({ selected, setSelected }) {

    const options = [{
        value: "Today",
        id: "today"
    }, {
        value: "Last 7 Days",
        id: "last7Days"
    }, {
        value: "Last 30 Days",
        id: "last30Days"
    }, {
        value: "All Time",
        id: "allTime"
    }]


    function classNames(...classes) {
        return classes.filter(Boolean).join(' ')
    }



    return (
        <Listbox value={selected} onChange={setSelected}>
            {({ open }) => (
                <>
                    <div className="relative mt-2">
                        <Listbox.Button className="relative  cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-slate-600 sm:text-sm sm:leading-6 w-[200px] md:w-full">
                            <span className="block truncate">{selected.value}</span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                <AiOutlineDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </span>
                        </Listbox.Button>

                        <Transition
                            show={open}
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <Listbox.Options className="absolute z-10 mt-1 max-h-60 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm w-[200px] md:w-full">
                                {options.map((o) => (
                                    <Listbox.Option
                                        key={o.id}
                                        className={({ active }) =>
                                            classNames(
                                                active ? 'bg-slate-600 text-white' : 'text-gray-900',
                                                'relative cursor-default select-none py-2 pl-3 pr-9'
                                            )
                                        }
                                        value={o}
                                    >
                                        {({ selected, active }) => (
                                            <>
                                                <span className={classNames(selected ? 'font-semibold' : 'font-normal', 'block truncate')}>
                                                    {o.value}
                                                </span>

                                                {selected ? (
                                                    <span
                                                        className={classNames(
                                                            active ? 'text-white' : 'text-slate-600',
                                                            'absolute inset-y-0 right-0 flex items-center pr-4'
                                                        )}
                                                    >
                                                        <AiOutlineCheck className="h-5 w-5" aria-hidden="true" />
                                                    </span>
                                                ) : null}
                                            </>
                                        )}
                                    </Listbox.Option>
                                ))}
                            </Listbox.Options>
                        </Transition>
                    </div>
                </>
            )}
        </Listbox>
    )
}




function VideoGrid() {
    const [videos, setVideos] = useState([])
    const [showNotification, setShowNotification] = useState(false)
    const [showNotificationComplete, setShowNotificationComplete] = useState(false)
    const [showNotificationError, setShowNotificationError] = useState(false)
    const [downloadProgress, setDownloadProgress] = useState(null)
    const [showNotificationUpload, setShowNotificationUpload] = useState(false)
    const [showNotificationUploadFailed, setShowNotificationUploadFailed] = useState(false)
    const [showNotificationUploadComplete, setShowNotificationUploadComplete] = useState(false)
    const todayDate = new Date();

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
    }

    const colors = [
        'bg-pink-600',
        'bg-yellow-500',
        'bg-green-500',
        'bg-blue-500',
        'bg-indigo-500',
        'bg-purple-500',
        'bg-red-500',
    ]

    const DownloadVideo = async (id) => {
        setShowNotificationComplete(false)
        setShowNotificationError(false)

        setShowNotification(true)
        setDownloadProgress("0.00%")

        const res = await downloadVideo(id, (progress) => {
            setDownloadProgress(progress)
        }).catch((err) => {
            setShowNotification(false)
            setShowNotificationError(true)
        })

        if (res) {
            setShowNotification(false)
            if (res === 'success') {

                setShowNotificationComplete(true)
            } else {
                setShowNotificationError(true)
            }
        }

    }

    const UploadVideo = async (id) => {
        setShowNotificationUploadComplete(false)
        setShowNotificationUploadFailed(false)
        setShowNotificationUpload(true)

        socket.emit('tiktok-upload', id)



    }

    useEffect(() => {
        const uploadListener = (data_) => {
            if (data_.status === "success") {
                setShowNotificationUpload(false)
                setShowNotificationUploadComplete(true)
            } else {
                setShowNotificationUpload(false)
                setShowNotificationUploadFailed(true)
            }
        }


        socket.on('tiktok-upload', uploadListener);

        // This will unregister the listener when the component is unmounted
        return () => {
            socket.off('tiktok-upload', uploadListener);
        };

    }, []);


    useEffect(() => {
        socket.emit('completed-videos');

        const updateVideoListener = (data_) => {
            setVideos(data_.reverse())
        };


        socket.on('completed-videos', updateVideoListener);

        return () => {
            socket.off('completed-videos', updateVideoListener);
        };

    }, []);

    useEffect(() => {
        const updateNewVideoListener = (data_) => {
            socket.emit('stats');
            setVideos((prev) => [data_, ...prev])
        };


        socket.on('new-video', updateNewVideoListener);

        return () => {
            socket.off('new-video', updateNewVideoListener);
        };

    }, []);

    return (
        <div className="mt-10">
            <Notification show={showNotificationUploadFailed} setShow={setShowNotificationUploadFailed} title={"Upload Failed"} message={"Please try again later, you might need to reconnect your tiktok account."} type={"warning"} />
            <Notification show={showNotificationError} setShow={setShowNotificationError} title={"Download Failed"} message={"Please try again later"} type={"warning"} />
            <Notification show={showNotificationComplete} setShow={setShowNotificationComplete} title={"Download Complete"} message={"Your reddit video is ready!"} type={"success"} />
            <Notification show={showNotification} setShow={setShowNotification} title={"Download in progress"} message={"Please wait for download to complete. " + downloadProgress || ""} type={"warning"} />
            <Notification show={showNotificationUpload} setShow={setShowNotificationUpload} title={"Upload in progress"} message={"Please wait for upload to complete."} type={"warning"} />
            <Notification show={showNotificationUploadComplete} setShow={setShowNotificationUploadComplete} title={"Upload Complete"} message={"Your reddit video is ready on tiktok!"} type={"success"} />
            <h2 className="text-sm font-medium text-gray-500">Completed Videos</h2>
            <ul role="list" className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-2">
                {
                    videos?.length > 0 ? (
                        videos.map((vid, indx) => {
                            const date = new Date(vid.timestamp); // Convert from seconds to milliseconds
                            date.setHours(0, 0, 0, 0); // Reset time component
                            const isNewVideo = date.getDate() === todayDate.getDate() && date.getMonth() === todayDate.getMonth() && date.getFullYear() === todayDate.getFullYear()
                            return (

                                <div className="col-span-2">
                                    <li key={vid.id} className="flex rounded-md shadow-sm">
                                        <div
                                            className={classNames(
                                                isNewVideo ? colors[indx % colors.length] : 'bg-gray-600',
                                                'flex w-16 flex-shrink-0 items-center justify-center rounded-l-md text-sm font-medium text-white'
                                            )}
                                        >
                                            {formatTime(parseFloat(vid.videoLength))}
                                        </div>
                                        <div className="flex flex-1 items-center justify-between truncate rounded-r-md border-b border-r border-t border-gray-200 bg-white">
                                            <div className="flex-1 truncate px-4 py-2 text-sm">
                                                <a href={`https://www.reddit.com/r/${vid.subreddit}/comments/${vid.redditID}/`} target={"_blank"} className="font-medium text-gray-900 hover:text-gray-600">
                                                    {vid.title}
                                                </a>
                                            </div>
                                            <div className="flex-shrink-0 pr-2">
                                                <button
                                                    onClick={() => {
                                                        DownloadVideo(vid.id)
                                                    }}
                                                    type="button"
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-transparent bg-white text-gray-400 hover:text-gray-500"
                                                >
                                                    <span className="sr-only">Save video</span>
                                                    <AiOutlineSave className="h-5 w-5" aria-hidden="true" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        UploadVideo(vid.id)
                                                    }}
                                                    type="button"
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-transparent bg-white text-gray-400 hover:text-gray-500"
                                                >
                                                    <span className="sr-only">Upload Video</span>
                                                    <BiLogoTiktok className="h-5 w-5" aria-hidden="true" />
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                </div>
                            )
                        })
                    ) : (
                        <>
                            <FakeVideoLoader />
                            <FakeVideoLoader />
                            <FakeVideoLoader />
                        </>
                    )
                }
            </ul>
        </div>
    )
}


function FakeVideoLoader() {
    return (
        <li key={Math.random()} className="col-span-2 flex rounded-md shadow-sm">
            <div
                className={classNames(
                    'bg-gray-500',
                    'flex w-16 flex-shrink-0 items-center justify-center rounded-l-md text-sm font-medium text-white'
                )}
            >
                00
            </div>
            <div className="flex flex-1 items-center justify-between truncate rounded-r-md border-b border-r border-t border-gray-200 bg-white">
                <div className="flex-1 truncate px-4 py-2 text-sm">
                    <BarLoader color={'#0f172a'} />
                </div>
                <div className="flex-shrink-0 pr-2">
                    <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-transparent bg-white text-gray-400 hover:text-gray-500"
                    >
                        <span className="sr-only">Save video</span>
                        <SquareLoader size={5} color="#0f172a" />
                    </button>
                </div>
            </div>
        </li>
    )
}

function GuideAlert() {

    return (
        <div className="rounded-md bg-blue-50 p-4 mb-10">
            <div className="flex">
                <div className="flex-shrink-0">
                    <AiFillInfoCircle className="h-5 w-5 text-blue-400" aria-hidden="true" />
                </div>
                <div className="ml-3 flex-1 md:flex md:justify-between">
                    <p className="text-sm text-blue-700">Need some help?</p>
                    <p className="mt-3 text-sm md:ml-6 md:mt-0">
                        <a href="https://guide.redditreels.com/" target={"_blanks"} className="whitespace-nowrap font-medium text-blue-700 hover:text-blue-600">
                            Guide
                            <span aria-hidden="true"> &rarr;</span>
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}


function NewBadge() {
    return (
        <span className="inline-flex items-center gap-x-1.5 justify-center rounded-full px-2 py-1 text-xs font-medium text-gray-900 ring-1 ring-inset ring-gray-200">
            <svg className="h-1.5 w-1.5 fill-yellow-500" viewBox="0 0 6 6" aria-hidden="true">
                <circle cx={3} cy={3} r={3} />
            </svg>
            new
        </span>
    )
}