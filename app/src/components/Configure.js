import React, { useState, useEffect } from 'react';
import { SketchPicker } from 'react-color';
import { AiOutlineSave, AiOutlineDelete } from 'react-icons/ai'
import { ClipLoader } from 'react-spinners'

import voices from '../assets/voices/voices.json'

import socket, { uploadVideo, uploadFont, deleteVideo } from '../socket'

export default function Configure() {
    const [color, setColor] = useState('#000000');
    const [font, setFont] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loaded, setLoaded] = useState(false)
    const [upload, setUpload] = useState(null)
    const [language, setLanguage] = useState('en-US');
    const [selectedVoice, setSelectedVoice] = useState("Standard-A");
    const [cropOption, setCropOption] = useState("crop");
    const [tiktokConnnected, setTiktokConnected] = useState(false)

    // Placeholder handlers for the new section
    const handleVoicePreview = () => {
        if (!selectedVoice) return;
        const voiceFile = require(`../assets/voices/${language}/${language}-${selectedVoice}.wav`)
        const audio = new Audio(voiceFile);
        audio.play();
    };

    const handleSaveVoice = () => {
        // Logic to save the selected voice as the default voice for the application
        const voiceID = `${language}-${selectedVoice}`
        socket.emit('update-voice', {
            name: voiceID,
            languageCode: language,
            wpm: voices[language].find(e => e.name === selectedVoice).wpm
        })
    };




    useEffect(() => {
        socket.emit('config');

        const handleResponseListener = (data_) => {
            setLoaded(false)
            setColor(data_.subtitleColor)
            setVideos(data_.videos.map(e => e.fileName))
            setFont(data_.font)
            setLoaded(true)
            setSelectedVoice(data_.voice.name.split(data_.voice.languageCode + '-')[1])
            setLanguage(data_.voice.languageCode)
            setTiktokConnected(data_.tiktokConnected ? true : false)
        };


        socket.on('config', handleResponseListener);

        // This will unregister the listener when the component is unmounted
        return () => {
            socket.off('config', handleResponseListener);
        };

    }, []);


    const handleColorChange = (color) => {
        setColor(color.hex);
    };

    const handleFontUpload = async (e) => {
        const file = e.target.files[0];
        const uploadRes = await uploadFont(file).catch(() => { })
        if (uploadRes === "success") {
            setFont(file.name.split('.')[0])
        }
    };

    const handleVideoUpload = async (e) => {
        const file = e.target.files[0];

        if (file.name.includes('default')) {
            alert('Invalid file name')
            return
        }

        // const uploadRes = await uploadVideo(file)
        const uploadRes = await uploadVideo(file, cropOption === "crop", (progress) => {
            setUpload(progress);
        }).catch(() => { })
        if (uploadRes === "success") {
            setUpload(null)
            setVideos([...videos, file.name]);
        }
    };

    const updateFont = () => {
        socket.emit('update-subtitle-color', color)
    }

    const delVid = async (e) => {
        const delRes = await deleteVideo(e).catch(() => { })
        if (delRes === "success") {
            setVideos((prev) => prev.filter(x => x !== e))
        }
    }



    return (
        <div className='container mx-auto p-4'>
            <div className='flex flex-col md:flex-row justify-center mb-20'>
                {/* Font Section */}
                <div className='w-full md:w-1/3 p-4 border mb-4 md:mb-0 flex flex-col items-center'>
                    {
                        loaded ? (
                            <>
                                <div>
                                    <h2 className='text-xl font-bold mb-4 font-normal text-slate-600'>Fonts</h2>

                                </div>
                                <label className='bg-slate-800 text-white p-2 rounded cursor-pointer mt-2'>
                                    Upload Font
                                    <input
                                        type='file'
                                        accept='.ttf,.otf,.woff'
                                        onChange={handleFontUpload}
                                        className='hidden'
                                    />
                                </label>

                                <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 mt-2">
                                    {font ? font : "No Font"}
                                </span>
                            </>
                        ) : <ClipLoader className='text-slate-500 flex my-auto' />
                    }
                </div>

                {/* Video Section */}
                <div className='w-full md:w-1/3 p-4 border mb-4 md:mb-0 flex flex-col items-center'>
                    {
                        loaded ? (
                            <>
                                <div>
                                    <h2 className='text-xl font-bold mb-4 font-normal text-slate-600'>Background Videos</h2>
                                </div>

                                <div className="flex space-x-2 items-center">
                                    {/* First Input for Video Upload */}
                                    <label className="bg-slate-800 text-white p-2 rounded cursor-pointer">
                                        Upload Video
                                        <input
                                            type="file"
                                            accept=".mp4"
                                            onChange={handleVideoUpload}
                                            className="hidden"
                                        />
                                    </label>

                                    {/* Second Input for Crop Options */}
                                    <select
                                        onChange={(e) => setCropOption(e.target.value)}
                                        className="bg-slate-800 text-white p-2 rounded cursor-pointer"
                                    >
                                        <option value="crop">Crop</option>
                                        <option value="noCrop">No Crop</option>
                                    </select>
                                </div>
                                {upload && (
                                    <p className='text-xs text-gray-600 p-2'>
                                        {upload}
                                    </p>

                                )}
                                <div className='flex flex-col overflow-y-auto max-h-[50%] mt-2 w-full '>
                                    {
                                        videos.map((e, indx) => {
                                            return (
                                                <div key={indx} className='flex items-center my-auto'>
                                                    <div className='flex items-center justify-between w-full'>
                                                        <span className="inline-flex items-center rounded-md bg-slate-50 px-3 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 mt-2" style={{ flex: '1 0 auto' }}>
                                                            {e}
                                                        </span>
                                                        <button
                                                            onClick={() => delVid(e)}
                                                            className='inline-flex items-center rounded-md bg-slate-50 px-3 py-1 text-xs font-medium text-red-600 ring-1 ring-inset ring-gray-500/10 mt-2 ml-2'>
                                                            <AiOutlineDelete className='h-4 w-4' />
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                            </>
                        ) : <ClipLoader className='text-slate-500 flex my-auto' />
                    }


                </div>

                {/* Color Picker Section */}
                <div className='w-full md:w-1/3 p-4 border flex flex-col items-center h-full'>
                    {
                        loaded ? (
                            <>
                                <div className='flex my-auto'>
                                    <h2 className='text-xl font-bold mb-4 font-normal text-slate-600'>Subtitle Color</h2>
                                    <button
                                        onClick={updateFont}
                                        className='ml-2 mb-4 text-slate-900 hover:text-green-500'><AiOutlineSave className='h-4 w-4 hover:shadow-md' /></button>
                                </div>
                                <SketchPicker color={color} onChange={handleColorChange} />
                            </>
                        ) : <ClipLoader className='text-slate-500 flex my-auto' />
                    }
                </div>


            </div>

            <div className='flex flex-col md:flex-row justify-center mb-20'>
                {/* Voice Section */}
                <div className='w-full md:w-1/3 p-4 border mb-4 md:mb-0 flex flex-col items-center'>
                    {
                        loaded ? (
                            <>
                                <div>
                                    <h2 className='text-xl font-bold mb-4 font-normal text-slate-600'>Language and Voice</h2>
                                </div>
                                <div className='mb-4'>
                                    <label className='block text-sm font-medium text-gray-700'>Select Language</label>
                                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className='mt-1 block w-full py-2 px-10 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'>
                                        <option value="en-US">English (US)</option>
                                        <option value="en-GB">English (UK)</option>
                                    </select>
                                </div>

                                <div className='mb-4'>
                                    <label className='block text-sm font-medium text-gray-700'>Select Voice</label>
                                    <select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} className='mt-1 block w-full py-2 px-10 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'>
                                        {voices[language].map(voice => (
                                            <option key={voice.name} value={voice.name}>{voice.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className='flex justify-between w-full'>
                                    <button onClick={handleVoicePreview} className='bg-slate-800 text-white p-2 rounded cursor-pointer mt-2'>
                                        Preview Voice
                                    </button>
                                    <button onClick={handleSaveVoice} className='bg-green-500 text-white p-2 rounded cursor-pointer mt-2'>
                                        Save
                                    </button>
                                </div>
                            </>
                        ) : <ClipLoader className='text-slate-500 flex my-auto' />
                    }
                </div>

                <div className='w-full md:w-1/3 p-4 border mb-4 md:mb-0 flex flex-col items-center'>
                    {
                        loaded ? (
                            <>
                                <h2 className='text-xl font-bold mb-4 font-normal text-slate-600'>TikTok Integration</h2>
                                <button
                                    disabled={tiktokConnnected}
                                    onClick={() => window.location.href = 'https://app.redditreels.com/tiktok/oauth'} className={'text-white p-2 rounded cursor-pointer mt-2 m-auto ' + (tiktokConnnected ? 'bg-green-800' : 'bg-slate-800')}>
                                    {
                                        tiktokConnnected ? "TikTok Connected" : "Connect TikTok"
                                    }
                                </button>


                            </>
                        ) : <ClipLoader className='text-slate-500 flex my-auto' />
                    }
                </div>
            </div>

        </div >
    );
}

