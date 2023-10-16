import { useState } from 'react'
const AppScreenshot = require('./appScreenshot.png')

export default function App() {

  return (
    <div className="bg-white">
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <a href="#" className="-m-1.5 p-1.5">
              <span className="sr-only">RedditReels</span>
              <img
                className="h-16 w-auto"
                src="https://i.imgur.com/qCpPsx7.png"
                alt=""
              />
            </a>
          </div>
          <div className="flex lg:hidden">

          </div>
          <div className="lg:flex lg:gap-x-12">
          </div>
          <div className="lg:flex lg:flex-1 lg:justify-end">
            <a href="#" className="text-sm font-semibold leading-6 text-gray-900">
              Log in <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </nav>

      </header>

      <div className="relative pt-14">
        {/* Main Content */}
        <div className="py-24 sm:py-32 lg:pb-40">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
                Reddit Reels
              </h1>
              <p className="mt-6 text-xl leading-8 text-gray-600">
                Transform trending Reddit posts into captivating TikTok videos effortlessly and automatically!
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <a
                  href="https://app.redditreels.com/login"
                  className="rounded-md bg-orange-600 px-5 py-3 text-base font-semibold text-white shadow-lg hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-600"
                >
                  Get started
                </a>
                <a href="https://guide.redditreels.com" className="text-sm font-semibold leading-6 text-gray-900">
                  Learn more <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
            <div className="mt-16 flow-root sm:mt-24">
              <div className="-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
                <img
                  src={AppScreenshot}
                  alt="App screenshot"
                  width={2432}
                  height={1442}
                  className="rounded-md shadow-2xl ring-1 ring-gray-900/10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}


function Footer() {
  return (
    <footer className="bg-gray-100 py-6">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-center items-center">
          <div className="text-gray-600 text-sm">
            <a href="https://app.redditreels.com/tos" className="mr-4 hover:text-gray-900">Terms of Service</a>
            <a href="https://app.redditreels.com/privacy" className="hover:text-gray-900">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}