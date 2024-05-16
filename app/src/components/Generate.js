import { Fragment, useState, useEffect } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { BsChevronDown, BsCheck } from 'react-icons/bs'
import { AiOutlineWarning } from 'react-icons/ai'

import Notification from './Notification'
import socket from '../socket'

const generateOptions = [
    { title: 'Story', description: 'The video will be made using the users post.' },
    { title: 'Comments', description: 'The video will be made using the comments under a post.' },
]

const default_bg_videos = [
    {
        fileName: "minecraft_parkour_1_default.mp4",
        name: "Minecraft 1 (default)",
    },
    {
        fileName: "minecraft_parkour_2_default.mp4",
        name: "Minecraft 2 (default)",
    },
    {
        fileName: "trackmania_default.mp4",
        name: "Trackmania (default)",
    },
    {
        fileName: "gta_1_default.mp4",
        name: "GTA Racing (default)",
    }
]

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

export default function Generate() {
    const [credit, setCredit] = useState(0)
    const [videoOptions, setVideos] = useState([])
    const [steps, setSteps] = useState([
        { id: '01', name: 'Type', status: 'current' },
        { id: '02', name: 'Video', status: 'upcoming' },
        { id: '03', name: 'Subreddit', status: 'upcoming' },
        { id: '05', name: 'Preview', status: 'upcoming' },
    ])
    const [notification, setNotification] = useState({
        show: false,
        title: "",
        message: "",
        type: ""
    })
    const [error, setError] = useState(null)
    const [minLength, setMinLength] = useState({ enabled: false, value: 0 })
    const [maxLength, setMaxLength] = useState({ enabled: false, value: 0 })


    useEffect(() => {
        socket.emit('credit-balance');

        const handleResponseListener = (data_) => {
            setCredit(parseFloat(data_))
        };


        socket.on('credit-balance', handleResponseListener);

        return () => {
            socket.off('credit-balance', handleResponseListener);
        };

    }, []);



    useEffect(() => {
        socket.emit('config');

        const handleResponseListener = (data_) => {
            setVideos(data_.videos.map(e => e.fileName))

        };


        socket.on('config', handleResponseListener);

        // This will unregister the listener when the component is unmounted
        return () => {
            socket.off('config', handleResponseListener);
        };

    }, []);

    const setStep = (stepToChange) => {
        if (credit <= 0) return
        let newSteps = [...steps]
        // set stepToChange to current and all others to upcoming (expect if they are before then set to complete)
        newSteps = newSteps.map((step) => {
            if (step.id === stepToChange.id) {
                return { ...step, status: 'current' }
            } else if (step.id < stepToChange.id) {
                return { ...step, status: 'complete' }
            } else {
                return { ...step, status: 'upcoming' }
            }
        })

        setSteps(newSteps)
    }

    const [generateType, setGenerateType] = useState(generateOptions[0])
    const [bgVideo, setBgVideo] = useState({ value: "Random", label: "Random" })
    const [captions, setCaptions] = useState({ value: "Enabled", label: "Enabled" })
    const [subreddit, setSubreddit] = useState('')
    const [details, setDetails] = useState({
        sortBy: "",
        timeFrame: ""
    })
    const [type, setType] = useState({ value: "Auto", label: "Auto" }) //Manual or Auto
    const [manualURL, setManualURL] = useState("")

    const startGenerate = async () => {

        const data = {
            generateType: generateType.title,
            bgVideo: bgVideo.value,
            subredditType: type.value,
            manualURL: type.value === "Manual" ? manualURL : null,
            subreddit,
            sortBy: details.sortBy.value,
            timeFrame: details.sortBy.value === "Top" ? details.timeFrame.value : "N/A",
            minLength: minLength.enabled ? minLength.value : null,
            maxLength: maxLength.enabled ? maxLength.value : null,
            captions: captions.value === "Enabled" ? true : false

        }
        // console.log("Task data", data)
        if (data.subredditType === "Auto") {
            if (!data.generateType || !data.bgVideo || !data.subreddit || !data.sortBy || !data.timeFrame) {
                setError("Make sure all options are seleted.")
                return
            }
        } else {
            if (!data.generateType || !data.bgVideo || !data.manualURL) {
                setError("Make sure all options are seleted.")
                return
            }
        }

        socket.emit('generate-video', data, (res) => {
            if (res.status === "success") {
                setNotification({
                    show: true,
                    title: "Generating video",
                    message: "This may take a while, please wait.",
                    type: "warning"
                })
            } else {
                setNotification({
                    show: true,
                    title: "Error",
                    message: res.message,
                    type: "error"
                })
            }
        })
    }


    return (
        <div>
            {credit <= 0 && <NoCredit />}
            <div>
                <Notification show={notification.show} setShow={() => setNotification((prev) => ({ ...prev, show: !prev.show }))} title={notification.title} message={notification.message} type={notification.type} />
                <nav aria-label="Progress">
                    <ol role="list" className="divide-y divide-gray-300 rounded-md border border-gray-300 md:flex md:divide-y-0">
                        {steps.map((step, stepIdx) => (
                            <li
                                onClick={() => setStep(step)}
                                key={step.name} className="relative md:flex md:flex-1">
                                {step.status === 'complete' ? (
                                    <a href={step.href} className="group flex w-full items-center">
                                        <span className="flex items-center px-6 py-4 text-sm font-medium">
                                            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-600 group-hover:bg-green-800">
                                                <BsCheck className="h-6 w-6 text-white" aria-hidden="true" />
                                            </span>
                                            <span className="ml-4 text-sm font-medium text-gray-900">{step.name}</span>
                                        </span>
                                    </a>
                                ) : step.status === 'current' ? (
                                    <a href={step.href} className="flex items-center px-6 py-4 text-sm font-medium" aria-current="step">
                                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-slate-600">
                                            <span className="text-slate-600">{step.id}</span>
                                        </span>
                                        <span className="ml-4 text-sm font-medium text-slate-600">{step.name}</span>
                                    </a>
                                ) : (
                                    <a href={step.href} className="group flex items-center">
                                        <span className="flex items-center px-6 py-4 text-sm font-medium">
                                            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-300 group-hover:border-gray-400">
                                                <span className="text-gray-500 group-hover:text-gray-900">{step.id}</span>
                                            </span>
                                            <span className="ml-4 text-sm font-medium text-gray-500 group-hover:text-gray-900">{step.name}</span>
                                        </span>
                                    </a>
                                )}

                                {stepIdx !== steps.length - 1 ? (
                                    <>
                                        {/* Arrow separator for lg screens and up */}
                                        <div className="absolute right-0 top-0 hidden h-full w-5 md:block" aria-hidden="true">
                                            <svg
                                                className="h-full w-full text-gray-300"
                                                viewBox="0 0 22 80"
                                                fill="none"
                                                preserveAspectRatio="none"
                                            >
                                                <path
                                                    d="M0 -2L20 40L0 82"
                                                    vectorEffect="non-scaling-stroke"
                                                    stroke="currentcolor"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        </div>
                                    </>
                                ) : null}
                            </li>
                        ))}
                    </ol>
                </nav>
            </div>

            <div className='h-[400px] mt-20 flex justify-center mb-32'>
                {steps[0].status === 'current' && <GenerateType
                    selected={generateType}
                    setSelected={setGenerateType} />}
                {steps[1].status === 'current' && <BackgroundVideo
                    input={bgVideo}
                    setInput={setBgVideo}
                    videoOptions={videoOptions || []}
                    minLength={minLength}
                    setMinLength={setMinLength}
                    maxLength={maxLength}
                    setMaxLength={setMaxLength}
                    captions={captions}
                    setCaptions={setCaptions}
                />}
                {steps[2].status === 'current' && <SubRedditDetails
                    input={details}
                    setInput={setDetails}
                    subreddit={subreddit}
                    setSubreddit={setSubreddit}
                    manualURL={manualURL}
                    setManualURL={setManualURL}
                    setType={setType}
                    type={type} />}

                {steps[3].status === 'current' && (
                    <div className=''>
                        <div className="px-4 sm:px-0">
                            <h3 className="text-base font-semibold leading-7 text-gray-900">Preview</h3>
                            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500"></p>
                        </div>
                        <div className="mt-6 border-t border-gray-100">
                            <dl className="divide-y divide-gray-100">
                                <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                                    <dt className="text-sm font-medium leading-6 text-gray-900">Generate Type</dt>
                                    <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">{generateType ? generateType.title : "Not Selected"}</dd>
                                </div>
                                <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                                    <dt className="text-sm font-medium leading-6 text-gray-900">Background Video</dt>
                                    <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">{bgVideo ? bgVideo?.value : "Not Selected"}</dd>
                                </div>
                                <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                                    <dt className="text-sm font-medium leading-6 text-gray-900">Subreddit</dt>
                                    <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">{subreddit ? subreddit : "Not Selected"}</dd>
                                </div>
                                <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                                    <dt className="text-sm font-medium leading-6 text-gray-900">Subreddit Details</dt>
                                    <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">Sort by: {details.sortBy.value} | Time frame: {details.sortBy.value === "Top" ? details.timeFrame.value : "N/A"}</dd>
                                </div>


                                <div className="px-4 py-6 sm:gap-2 sm:px-0 mb-5">
                                    <button
                                        onClick={() => startGenerate()}
                                        className='bg-slate-800 hover:bg-slate-700 hover:shadow-lg text-white rounded-lg py-2 w-full'
                                    >Start</button>
                                    {error && <p className='text-red-500 mt-2'>{error}</p>}
                                </div>


                            </dl>
                        </div>
                    </div>

                )}
            </div>

        </div>
    )
}

function GenerateType({ selected, setSelected }) {
    return (
        <Listbox value={selected} onChange={setSelected}>
            {({ open }) => (
                <>
                    <Listbox.Label className="sr-only">Change Generate Type</Listbox.Label>
                    <div className="relative">
                        <label htmlFor="genType" className="block text-sm font-medium leading-6 text-gray-900">
                            Generate Type
                        </label>
                        <div className="inline-flex divide-x divide-gray-100 rounded-md shadow-sm">
                            <div className="inline-flex items-center gap-x-1.5 rounded-l-md bg-gray-400 px-3 py-2 text-white shadow-sm">
                                <BsCheck className="-ml-0.5 h-6 w-6" aria-hidden="true" />
                                <p className="text-sm font-semibold">{selected.title}</p>
                            </div>
                            <Listbox.Button className="inline-flex items-center rounded-l-none rounded-r-md bg-gray-300 p-2 hover:bg-gray-400 focus:outline-none focus:ring-0">
                                <span className="sr-only">Change Generate Type</span>
                                <BsChevronDown className="h-5 w-5 text-white" aria-hidden="true" />
                            </Listbox.Button>
                        </div>

                        <Transition
                            show={open}
                            as={Fragment}
                            enter="transition duration-100 ease-out"
                            enterFrom="transform scale-95 opacity-0"
                            enterTo="transform scale-100 opacity-100"
                            leave="transition duration-75 ease-out"
                            leaveFrom="transform scale-100 opacity-100"
                            leaveTo="transform scale-95 opacity-0"
                        >
                            <Listbox.Options className="relative md:absolute xs:inset-0 md:right-0 z-10 mt-2 w-72 divide-y divide-gray-200 overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                {generateOptions.map((option) => (
                                    <Listbox.Option
                                        key={option.title}
                                        className={({ active }) =>
                                            classNames(
                                                active ? 'bg-gray-400 text-white' : 'text-gray-900',
                                                'cursor-default select-none p-4 text-sm'
                                            )
                                        }
                                        value={option}
                                    >
                                        {({ selected, active }) => (
                                            <div className="flex flex-col">
                                                <div className="flex justify-between">
                                                    <p className={selected ? 'font-semibold' : 'font-normal'}>{option.title}</p>
                                                    {selected ? (
                                                        <span className={active ? 'text-white' : 'text-gray-600'}>
                                                            <BsCheck className="h-5 w-5" aria-hidden="true" />
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <p className={classNames(active ? 'text-gray-200' : 'text-gray-500', 'mt-2')}>
                                                    {option.description}
                                                </p>
                                            </div>
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

function CustomTextInputNoPrefix({ label, placeholder, input, setInput }) {
    return (
        <div>
            <label htmlFor={label} className="block text-sm font-medium leading-6 text-gray-900">
                {label}
            </label>
            <div className="mt-2">
                <div className="flex rounded-md shadow-sm focus-within:ring-inset focus-within:ring-slate-800 sm:max-w-sm">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        id={label}
                        name={label}
                        type="text"
                        className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                        placeholder={placeholder}
                    />
                </div>
            </div>
        </div>
    )
}

function CustomTextInput({ label, placeholder, input, setInput, prefix }) {
    return (
        <div>
            <label htmlFor={label} className="block text-sm font-medium leading-6 text-gray-900">
                {label}
            </label>
            <div className="mt-2">
                <div className="flex rounded-md shadow-sm focus-within:ring-inset focus-within:ring-slate-800 sm:max-w-sm">
                    <span className="flex select-none items-center pl-3 text-gray-500">{prefix}</span>
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        id={label}
                        name={label}
                        type="text"
                        className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                        placeholder={placeholder}
                    />
                </div>
            </div>
        </div>
    )
}

function CustomTextInputMaxMinTime({ label, placeholder, input, setInput, prefix }) {
    return (
        <div className=''>
            <label htmlFor="price" className="block text-sm font-medium leading-6 text-gray-900">
                {label}
            </label>
            <div className="relative mt-2 rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 flex items-center">
                    <label htmlFor="currency" className="sr-only">
                        Length
                    </label>
                    <select
                        value={input.enabled ? "Enabled" : "Disabled"}
                        onChange={(e) => setInput((prev) => ({ ...prev, enabled: e.target.value === "Enabled" ? true : false }))}
                        className="h-full rounded-md border-0 bg-transparent py-0 pl-2 pr-7 text-gray-500 focus:ring-0 sm:text-sm"
                    >
                        <option>Enabled</option>
                        <option>Disabled</option>

                    </select>
                </div>

                <input
                    type="number"
                    value={input.value}
                    onChange={(e) => setInput((prev) => ({ ...prev, value: e.target.value }))}
                    className="block w-full rounded-md border-0 py-1.5 pl-24 pr-20 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-slate-600 sm:text-sm sm:leading-6"
                    placeholder={placeholder}
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 sm:text-sm">{prefix}</span>
                </div>
            </div>
        </div>
    )
}

function SubRedditDetails({ input, setInput, subreddit, setSubreddit, manualURL, setManualURL, setType, type }) {

    return (
        <div className='w-full md:w-1/2 h-full flex flex-col gap-y-4'>

            <div>
                <CustomInput
                    label={"Type"}
                    options={[{ value: "Auto", label: "Auto" }, { value: "Manual", label: "Manual" }]}
                    selected={type}
                    setSelected={(e) => setType({ value: e.value, label: e.value })}
                />
            </div>

            {
                type.value === "Auto" && (
                    <>
                        <div>
                            <CustomTextInput label={"SubReddit"} placeholder={"AskReddit"} prefix={"r/"} input={subreddit} setInput={setSubreddit} />
                        </div>

                        <div>
                            <CustomInput
                                label={"Sort By"}
                                options={[{ value: "Hot", label: "Hot" }, { value: "New", label: "New" }, { value: "Top", label: "Top" }, { value: "Rising", label: "Rising" }]}
                                selected={input.sortBy}
                                setSelected={(e) => setInput({ ...input, sortBy: e })}
                            />
                        </div>
                        <div>
                            {
                                input.sortBy.value === "Top" ? (
                                    <CustomInput
                                        label={"Time Frame"}
                                        options={[{ value: "Hour", label: "Hour" }, { value: "Day", label: "Day" }, { value: "Week", label: "Week" }, { value: "Month", label: "Month" }, { value: "Year", label: "Year" }, { value: "All", label: "All" }]}
                                        selected={input.timeFrame}
                                        setSelected={(e) => setInput({ ...input, timeFrame: e })}
                                    />
                                ) : <></>
                            }
                        </div>
                    </>
                )
            }

            {
                type.value === "Manual" && (
                    <div>
                        <CustomTextInputNoPrefix label={"Post URL"} placeholder={"https://www.reddit.com/r/AmItheAsshole/comments/164gett/aita_for_telling_my_sister_her_son_is_only/"} input={manualURL} setInput={setManualURL} />
                    </div>
                )
            }

        </div>
    )
}


function BackgroundVideo({ input, setInput, videoOptions, minLength, maxLength, setMinLength, setMaxLength, captions, setCaptions }) {


    return (
        <div className='w-full md:w-1/2 h-full flex flex-col gap-y-4'>

            <div>
                <CustomInput
                    label={"Captions"}
                    options={[{ value: "Enabled", label: "Enabled" }, { value: "Disabled", label: "Disabled" }]}
                    selected={captions}
                    setSelected={(e) => setCaptions(e)}
                />

            </div>

            <div>
                <CustomTextInputMaxMinTime label={"Min Video Length"} placeholder={"60"} prefix={"seconds"} input={minLength} setInput={setMinLength} />
            </div>

            <div>
                <CustomTextInputMaxMinTime label={"Max Video Length"} placeholder={"120"} prefix={"seconds"} input={maxLength} setInput={setMaxLength} />
            </div>

            <div>
                <CustomInput
                    label={"Background Video"}
                    options={[{ value: "Random", label: "Random" }, ...default_bg_videos.map(e => { return { value: e.fileName, label: e.name } }), ...videoOptions?.map(e => {
                        return {
                            value: e,
                            label: e
                        }
                    })]}
                    selected={input}
                    setSelected={(e) => setInput(e)}
                />

            </div>

        </div>
    )
}

function CustomInput({ label, options, selected, setSelected }) {
    return (
        <Listbox value={selected} onChange={setSelected}>
            {({ open }) => (
                <>
                    <Listbox.Label className="block text-sm font-medium leading-6 text-gray-900">{label}</Listbox.Label>
                    <div className="relative mt-2">
                        <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-600 sm:text-sm sm:leading-6">
                            <span className="block truncate">
                                {selected ? selected.label : "Select an option"}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                <BsChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </span>
                        </Listbox.Button>

                        <Transition
                            show={open}
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                {options.map((e) => (
                                    <Listbox.Option
                                        onClick={() => setSelected(e.value)}
                                        key={e.value}
                                        className={({ active }) =>
                                            classNames(
                                                active ? 'bg-gray-400 text-white' : 'text-gray-900',
                                                'relative cursor-default select-none py-2 pl-3 pr-9'
                                            )
                                        }
                                        value={e}
                                    >
                                        {({ selected, active }) => (
                                            <>
                                                <span className={classNames(selected ? 'font-semibold' : 'font-normal', 'block truncate')}>
                                                    {e.label}
                                                </span>

                                                {selected ? (
                                                    <span
                                                        className={classNames(
                                                            active ? 'text-white' : 'text-gray-200',
                                                            'absolute inset-y-0 right-0 flex items-center pr-4'
                                                        )}
                                                    >
                                                        <BsCheck className="h-5 w-5" aria-hidden="true" />
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

function NoCredit() {

    return (
        <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4 my-5">
            <div className="flex">
                <div className="flex-shrink-0">
                    <AiOutlineWarning className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                        You have no credits left. Please add more credits to continue.
                    </p>
                </div>
            </div>
        </div>
    )

}