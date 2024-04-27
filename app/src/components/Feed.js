import { useEffect, useState } from 'react'
import { BiTimer, BiCheck, BiDotsHorizontalRounded, BiX } from 'react-icons/bi'
import moment from 'moment'
import socket from '../socket'


function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

export default function Feed() {
    const [feed, setFeed] = useState(null)

    useEffect(() => {
        socket.emit('feed');

        const updateFeedListener = (data_) => {
            handleFeed(data_)
        };


        socket.on('update-feed', updateFeedListener);

        // This will unregister the listener when the component is unmounted
        return () => {
            socket.off('update-feed', updateFeedListener);
        };

    }, []);

    function handleFeed(data) {
        var temp = data.feed
        if (data.type === 'all') {
            temp = temp.reverse()
            temp = temp.map((event) => {
                event.when = moment(parseFloat(event.datetime)).fromNow()
                event.icon = event.background === "bg-gray-500" ? BiTimer : (event.background === "bg-green-500" ? BiCheck : BiX)
                return event
            })
            setFeed(temp)
        } else {
            temp.when = moment(temp.datetime).fromNow()
            temp.icon = temp.background === "bg-gray-500" ? BiTimer : (temp.background === "bg-green-500" ? BiCheck : BiX)
            setFeed((prev) => [temp, ...prev])
        }
    }

    useEffect(() => {
        // Existing socket code...

        // Set interval to update 'when' field
        const intervalId = setInterval(() => {
            if (feed) {
                const updatedFeed = feed.map(event => {
                    event.when = moment(parseFloat(event.datetime)).fromNow();
                    return event;
                });
                setFeed(updatedFeed);
            }
        }, 10000); // Update every 10s (10000 milliseconds)

        // Clear the interval when the component is unmounted
        return () => clearInterval(intervalId);
    }, [feed]); // Dependency array to ensure useEffect runs when 'feed' changes




    return (
        <div className="flow-root select-none overflow-y-auto h-[800px]">

            <ul role="list" className="-mb-8">

                {feed?.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-96">
                        <div className="flex flex-col items-center justify-center">
                            <BiDotsHorizontalRounded className="h-24 w-24 text-gray-400" />
                            <p className="mt-4 text-gray-500">your feed is currently empty</p>
                        </div>
                    </div>

                )}
                {feed?.map((event, eventIdx) => (
                    <li key={event.id}>
                        <div className="relative pb-8">
                            {eventIdx !== feed.length - 1 ? (
                                <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                                <div>
                                    <span
                                        className={classNames(
                                            event.background,
                                            'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white'
                                        )}
                                    >
                                        <event.icon className="h-5 w-5 text-white" aria-hidden="true" />
                                    </span>
                                </div>
                                <div className="flex min-w-0 flex-1 justify-between space-x-4">
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            {event.status}{' '}

                                        </p>
                                    </div>
                                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                        <time dateTime={event.datetime}>{event.when}</time>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}
