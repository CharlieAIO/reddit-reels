import { useEffect, useState, Fragment } from "react";
import { Dialog, Transition } from '@headlessui/react'
import { AiOutlineCreditCard, AiFillInfoCircle } from 'react-icons/ai'

import socket from "../socket";

export default function Credit() {
    const [credit, setCredit] = useState(0)
    const [creditToAdd, setCreditToAdd] = useState(0);
    const [paymentLink, setPaymentLink] = useState(null)
    const [open, setOpen] = useState(false)

    const addCredit = () => {
        socket.emit('add-credit', { amount: creditToAdd, currency: "USD" });
    }

    useEffect(() => {
        if (paymentLink) {
            setOpen(true)
        }
    }, [paymentLink])


    useEffect(() => {
        socket.emit('credit-balance');


        const handleResponseListener = (data_) => {
            setCredit(data_)
        };


        socket.on('credit-balance', handleResponseListener);

        return () => {
            socket.off('credit-balance', handleResponseListener);
        };

    }, []);

    return (

        <div>
            <PaymentModal open={open} setOpen={setOpen} url={paymentLink} />
            <PromoCode />
            <div className="rounded-2xl bg-gray-50 py-10 text-center ring-1 ring-inset ring-gray-900/5 lg:flex lg:flex-col lg:justify-center lg:py-16">

                <div className="mx-auto max-w-xs px-8">

                    <DisplayCredit credit={credit} />
                    <span
                        onClick={() => addCredit()}
                        className="hover:cursor-pointer mt-10 block w-full rounded-md bg-slate-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
                    >
                        Add Credit
                    </span>
                    <AddCredit setCreditToAdd={setCreditToAdd} setPaymentLink={setPaymentLink} />
                </div>
            </div>
        </div>
    )
}

function DisplayCredit({ credit }) {

    return (
        <>
            <p className="text-base font-semibold text-gray-600">Current Balance</p>
            <p className="mt-6 flex items-baseline justify-center gap-x-2">
                <span className="text-5xl font-bold tracking-tight text-gray-900">{credit}</span>
                <span className="text-sm font-semibold leading-6 tracking-wide text-gray-600"></span>
            </p>
            <p className="mt-1 flex items-baseline justify-center gap-x-2">
                <span className="text-lg font-bold tracking-tight text-gray-900">${(credit / 100).toFixed(2)}</span>
                <span className="text-sm font-semibold leading-6 tracking-wide text-gray-600">USD</span>
            </p>
        </>

    )
}


function AddCredit({ setCreditToAdd, setPaymentLink }) {
    const [currency, setCurrency] = useState("USD");


    useEffect(() => {
        const handleResponseListener = (data_) => {
            setPaymentLink(data_)
        };

        socket.on('add-credit', handleResponseListener);

        return () => {
            socket.off('add-credit', handleResponseListener);
        };

    }, []);

    return (
        <div className="relative mt-2 rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 sm:text-sm">
                    {currency === "USD" ? "$" : currency === "GBP" ? "£" : "€"}
                </span>
            </div>
            <input
                onChange={(e) => setCreditToAdd(parseFloat(e.target.value))}
                type="text"
                name="price"
                id="price"
                className="block w-full rounded-md border-0 py-1.5 pl-7 pr-20 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-slate-600 sm:text-sm sm:leading-6"
                placeholder="0.00"
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
                <label htmlFor="currency" className="sr-only">
                    Currency
                </label>
                <select
                    onChange={(e) => setCurrency(e.target.value)}
                    id="currency"
                    name="currency"
                    className="h-full rounded-md border-0 bg-transparent py-0 pl-2 pr-7 text-gray-500 focus:ring-2 focus:ring-inset focus:ring-slate-600 sm:text-sm"
                >
                    <option>USD</option>
                    {/* <option>GBP</option>
                <option>EUR</option> */}
                </select>
            </div>
        </div>
    )
}



function PaymentModal({ open, setOpen, url }) {
    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={setOpen}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0 ">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6 my-auto">
                                <div>
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                                        <AiOutlineCreditCard className="h-6 w-6 text-slate-600" aria-hidden="true" />
                                    </div>
                                    <div className="mt-3 text-center sm:mt-5">
                                        {/* <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                                            Complete your payment
                                        </Dialog.Title> */}
                                        <div className="mt-2">
                                            <a href={url} className="text-sm text-gray-500 hover:text-green-500">
                                                Click here to complete your payment
                                            </a>
                                        </div>
                                    </div>
                                </div>

                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
}

function PromoCode() {

    return (
        <div className="border-l-4 border-blue-400 bg-blue-50 p-4 my-5">
            <div className="flex">
                <div className="flex-shrink-0">
                    <AiFillInfoCircle className="h-5 w-5 text-blue-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                    <p className="text-sm text-blue-700">
                        You will receive 100 FREE Credits every day.
                    </p>
                </div>
            </div>
        </div>
    )

}