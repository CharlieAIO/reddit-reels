import { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react'
import { socketLogin, socketSignup, verifyResend, resetPassword, resetPasswordRequest } from '../socket'

import { BarLoader } from 'react-spinners';
import { AiOutlineUser } from 'react-icons/ai'
import Logo from '../assets/images/logo.png'

const getBtnColour = (status_) => {
    switch (status_) {
        case 'pending':
            return 'slate';
        case 'success':
            return 'green';
        case 'failed':
            return 'red';
        case 'pswd-reset':
            return 'gray'
        default:
            return 'slate'
    }
}

export default function Login() {
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState("")
    const [loginData, setLoginData] = useState({ username_email: "", password: "" })
    const [loginStatus, setLoginStatus] = useState("");
    const [showVerifyResult, setShowVerifyResult] = useState(false);
    const [showPswdReset, setShowPswdReset] = useState(false);


    const login = async () => {
        setLoginStatus("pending")
        const loginResponse = await socketLogin(loginData)
        if (loginResponse.status === "success") {
            if (loginResponse.verified) {
                setLoginStatus("success")
            } else {
                setLoginStatus("failed")
                await verifyResend(loginData.username_email)
                alert("An email has been sent to you to verify your account.")
            }
        } else {
            setError(loginResponse.message)
            setLoginStatus("failed")
        }

        setInterval(() => {
            if (loginResponse.status === "success") window.location.replace("/")
            setLoginStatus("")
            setError(null)
        }, 3000);
    }

    useEffect(() => {
        const action = new URL(window.location.href)?.searchParams?.get('action') || ""
        if (action === "reset-password") return setShowPswdReset(true)
        if (action === "verify") return setShowVerifyResult(true)
        else {
            setShowPswdReset(false)
            setShowVerifyResult(false)
        }
    }, [])


    const resetPSWDRequest = async () => {
        if (loginData.username_email === "") return alert("Please enter your email or username.")
        setLoginStatus("pswd-reset")
        const res = await resetPasswordRequest(loginData.username_email)
        if (res.status === "success") {
            alert("Check your email for a link to reset your password.")
        } else {
            alert("Something went wrong, please try again later.")
        }
    }





    return (
        <>

            <div className="flex min-h-full h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8 ">

                <Signup open={showModal} setOpen={setShowModal} />
                <VerifyResult open={showVerifyResult} setOpen={setShowVerifyResult} success={new URL(window.location.href)?.searchParams?.get('verify') === 'success'} />
                <ResetPassword open={showPswdReset} setOpen={setShowPswdReset} />

                <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                    <img
                        className="mx-auto h-20 w-auto"
                        src={Logo}
                        alt=""
                    />
                    <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
                        Sign in to your account
                    </h2>
                </div>

                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                    <form className="space-y-6" action="#" method="POST">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                                Email / Username
                            </label>
                            <div className="mt-2">
                                <input
                                    onChange={(e) => setLoginData({ ...loginData, username_email: e.target.value })}
                                    value={loginData.email}
                                    id="username_email"
                                    name="username_email"
                                    required
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-slate-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                                    Password
                                </label>
                                <div className="text-sm">
                                    <a onClick={resetPSWDRequest} className="font-semibold text-slate-600 hover:text-slate-500 cursor-pointer">
                                        Forgot password?
                                    </a>
                                </div>
                            </div>
                            <div className="mt-2">
                                <input
                                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                    value={loginData.password}
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-slate-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div>
                            {error && <p className="text-red-500 text-sm text-center my-4">{error}</p>}
                            <button
                                onClick={() => login()}
                                disabled={loginStatus === "pending" || loginStatus === "success" || loginStatus === "failed"}
                                type="submit"
                                className={
                                    "flex w-full justify-center rounded-md px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                                    + ` bg-${getBtnColour(loginStatus)}-600 hover:bg-${getBtnColour(loginStatus)}-500 focus-visible:outline-${getBtnColour(loginStatus)}-600`
                                }
                            >
                                {loginStatus === "" && "Sign in"}
                                {loginStatus === "pending" && <BarLoader color="#fff" className='my-3' />}
                                {loginStatus === "success" && "Success"}
                                {loginStatus === "failed" && "Failed"}
                                {loginStatus === "pswd-reset" && "Sending Password Reset"}
                            </button>
                        </div>
                    </form>

                    <p className="mt-10 text-center text-sm text-gray-500">
                        Not a member?{' '}
                        <span
                            onClick={() => setShowModal(!showModal)}
                            className="font-semibold leading-6 text-slate-600 hover:text-slate-500 hover:cursor-pointer">
                            Signup
                        </span>
                    </p>
                </div>
            </div >
        </>
    )
}


function Signup({ open, setOpen }) {
    const [signupData, setSignupData] = useState({ username: "", email: "", password: "" })
    const [stage, setStage] = useState("signup");
    const [error, setError] = useState("");
    const [sentStatus, setSentStatus] = useState("")

    const signupUser = async () => {
        setSentStatus("pending")
        const res = await socketSignup(signupData)
        if (res === true) {
            setSentStatus("success")
            setStage("verify")
            return
        } else {
            setSentStatus("failed")
            setError(res || null)
        }

        setInterval(() => {
            setSentStatus("")
        }, 3000)
    }


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
                                {stage === "signup" && (
                                    <SignUpStage setSignupData={setSignupData} signupUser={signupUser} error={error} sentStatus={sentStatus} />
                                )}
                                {stage === "verify" && (
                                    <VerifyStage />
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>

    )
}

function SignUpStage({ setSignupData, signupUser, error, sentStatus }) {

    return (
        <div className=''>
            <div>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <AiOutlineUser className="h-6 w-6 text-blue-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                        Sign Up
                    </Dialog.Title>
                    <div className="mt-2">
                        <input onChange={(e) => setSignupData((prev) => ({ ...prev, username: e.target.value }))} type="text" placeholder="Username" className="p-2 w-full rounded-md mb-2" />
                        <input onChange={(e) => setSignupData((prev) => ({ ...prev, email: e.target.value }))} type="email" placeholder="Email" className="p-2 w-full rounded-md mb-2" />
                        <input onChange={(e) => setSignupData((prev) => ({ ...prev, password: e.target.value }))} type="password" placeholder="Password" className="p-2 w-full rounded-md" />
                    </div>
                </div>
            </div>
            <div className="mt-5 sm:mt-6">
                <p className="text-xs mb-4 text-gray-500 ">
                    By clicking "Create Account," you agree to our&nbsp;
                    <a href="https://app.redditreels.com/tos" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        Terms of Service
                    </a>
                    {" "}and&nbsp;
                    <a href="https://app.redditreels.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        Privacy Policy
                    </a>
                    .
                </p>
                {error && <p className="text-red-500 text-sm text-center my-4">{error}</p>}
                <button
                    type="button"
                    className={
                        "flex w-full justify-center rounded-md px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                        + ` bg-${getBtnColour(sentStatus)}-600 hover:bg-${getBtnColour(sentStatus)}-500 focus-visible:outline-${getBtnColour(sentStatus)}-600`
                    }
                    onClick={() => signupUser()}
                >
                    {sentStatus === "" && "Create Account"}
                    {sentStatus === "pending" && <BarLoader color="#fff" className='my-3' />}
                    {sentStatus === "success" && "Success"}
                    {sentStatus === "failed" && "Failed"}
                </button>
            </div>
        </div>
    )
}

function VerifyStage() {

    return (
        <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
            <div>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <AiOutlineUser className="h-6 w-6 text-blue-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                        Verify
                    </Dialog.Title>
                    <div className="mt-2 flex justify-center">
                        <p className='text-center text-gray-900'>
                            Please check your email for a link to verify your account.
                        </p>

                    </div>
                </div>
            </div>
        </Dialog.Panel>
    )
}

function VerifyResult({ success, open, setOpen }) {
    const [email, setEmail] = useState("")
    const [sentStatus, setSentStatus] = useState("")

    const sendVerification = async () => {
        if (email === "") return
        setSentStatus("pending")
        const res = await verifyResend(email)
        if (res.status === "success") {
            setSentStatus("success")
        } else {
            setSentStatus("failed")
        }
        setInterval(() => {
            setSentStatus("")
        }, 3000);
    }



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
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                        <AiOutlineUser className="h-6 w-6 text-blue-600" aria-hidden="true" />
                                    </div>
                                    <div className="mt-3 text-center sm:mt-5">
                                        <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                                            Verification {success ? "Success" : "Failed"}
                                        </Dialog.Title>
                                        {!success && (
                                            <div className="mt-2">
                                                <input onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="p-2 w-full rounded-md mb-2" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {!success && (
                                    <div className="mt-5 sm:mt-6">
                                        <button
                                            type="button"
                                            className={
                                                "flex w-full justify-center rounded-md px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                                                + ` bg-${getBtnColour(sentStatus)}-600 hover:bg-${getBtnColour(sentStatus)}-500 focus-visible:outline-${getBtnColour(sentStatus)}-600`
                                            }
                                            onClick={() => sendVerification()}
                                        >
                                            {sentStatus === "" && "Resend Verification Email"}
                                            {sentStatus === "pending" && <BarLoader color="#fff" className='my-3' />}
                                            {sentStatus === "success" && "Success"}
                                            {sentStatus === "failed" && "Failed"}
                                        </button>
                                    </div>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
}

function ResetPassword({ open, setOpen }) {
    const [password, setPassword] = useState("")
    const [sentStatus, setSentStatus] = useState("")

    const passwordReset = async () => {
        if (password === "") return
        setSentStatus("pending")
        const res = await resetPassword({ password: password, code: new URL(window.location.href)?.searchParams?.get('code') })
        if (res.status === "success") {
            setSentStatus("success")
        } else {
            setSentStatus("failed")
        }
        setInterval(() => {
            setSentStatus("")
            setOpen(false)
        }, 3000);
    }



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
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                        <AiOutlineUser className="h-6 w-6 text-blue-600" aria-hidden="true" />
                                    </div>
                                    <div className="mt-3 text-center sm:mt-5">
                                        <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                                            Reset your password
                                        </Dialog.Title>
                                        <div className="mt-2">
                                            <input onChange={(e) => setPassword(e.target.value)} type="password" placeholder="New Password" className="p-2 w-full rounded-md mb-2" />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-5 sm:mt-6">
                                    <button
                                        type="button"
                                        className={
                                            "flex w-full justify-center rounded-md px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                                            + ` bg-${getBtnColour(sentStatus)}-600 hover:bg-${getBtnColour(sentStatus)}-500 focus-visible:outline-${getBtnColour(sentStatus)}-600`
                                        }
                                        onClick={() => passwordReset()}
                                    >
                                        {sentStatus === "" && "Reset Password"}
                                        {sentStatus === "pending" && <BarLoader color="#fff" className='my-3' />}
                                        {sentStatus === "success" && "Password Has Been Reset"}
                                        {sentStatus === "failed" && "Failed"}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
}