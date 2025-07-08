import { useEffect, useState } from 'react'
import LiquidGlass from 'liquid-glass-react'
import './App.css'

function NotFound() {
  const [isMobile, setIsMobile] = useState(false)
  const [countdown, setCountdown] = useState(10)

  // Set page title dan log 404
  useEffect(() => {
    document.title = '404 - Halaman Tidak Ditemukan | Twibbon MPLS Stembayo 2025'
    
    // Log 404 untuk debugging (opsional)
    if (window.location.pathname !== '/') {
      console.log(`404 Page accessed: ${window.location.pathname}`)
    }
    
    return () => {
      document.title = 'Twibbon MPLS Stembayo 2025'
    }
  }, [])

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobileUserAgent = /android.*mobile|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
      const isSmallScreen = window.innerWidth <= 480
      
      const isMobileDevice = isMobileUserAgent && isSmallScreen
      setIsMobile(isMobileDevice)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auto redirect countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.location.href = '/'
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center font-montserrat"
      style={{ 
        backgroundImage: "url('/sec-bg.jpg')", 
        fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif" 
      }}
    >
      {/* Mobile Only Warning for Desktop/Tablet */}
      {!isMobile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl shadow-black/50 max-w-lg mx-auto p-8">
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <svg className="w-16 h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-extrabold text-white">
                    Mobile Only
                  </h2>
                  <p className="text-white/80 text-lg font-semibold">
                    Website Khusus Mobile!
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-white/90 text-sm leading-relaxed">
                  Website ini dirancang khusus untuk perangkat mobile. Silakan akses menggunakan smartphone Anda.
                </p>
              </div>

              <div className="pt-2 border-t border-white/20">
                <p className="text-white/55 text-xs text-center">
                  Made with 🤍 by <a 
                    className="text-white/60 hover:text-white transition-colors font-medium" 
                    href="https://frl.blue" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    frrlverse
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main 404 Content */}
      <LiquidGlass
        children={15}
        cornerRadius={48}
        displacementScale={100}
        blurAmount={0.2}
        saturation={140}
        aberrationIntensity={1}
        elasticity={0.1}
        overLight={false}
        padding='18px 26px'
        className={`w-full border-3 border-white/20 rounded-[50px] bg-white/20 mt-100 ml-80 ${
          !isMobile ? 'opacity-20 pointer-events-none' : ''
        }`}
      >
        <div style={{minWidth: '260px'}} className="font-montserrat">
          <div className="text-center space-y-6">
            {/* 404 Animation */}
            <div className="relative">
              <div className="text-8xl sm:text-9xl font-extrabold text-white/20 select-none not-found-404">
                404
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/10 backdrop-blur-md border border-white/30 rounded-full p-4 not-found-icon">
                  <svg className="w-12 h-12 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Header */}
            <div className="space-y-3">
              <div className="flex items-center justify-center mb-3">
                <img 
                  src="/stembayo.png" 
                  alt="Stembayo Logo" 
                  className="w-12 h-12 object-contain"
                />
                <div className="mx-3 w-0.5 h-12 bg-white/60 rounded-xl"></div>
                <div className="text-left">
                  <h1 className="text-lg font-extrabold text-white leading-tight">
                    Halaman Tidak<br />Ditemukan
                  </h1>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-white/90 text-sm font-bold">
                  Oops! Halaman yang Anda cari tidak ada
                </p>
                <p className="text-white/60 text-xs leading-relaxed">
                  Mungkin URL salah atau halaman telah dipindahkan
                </p>
              </div>
            </div>

            {/* Auto Redirect Info */}
            <div className="bg-gradient-to-r from-white/30 to-white/10 backdrop-blur-md border border-white/30 rounded-3xl p-4 space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                <p className="text-white/80 text-sm font-medium">
                  Otomatis kembali ke beranda dalam
                </p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-full">
                  <span className="text-xl font-extrabold text-white">
                    {countdown}
                  </span>
                </div>
              </div>
              
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-pink-500/80 via-pink-400/80 to-pink-300/80 h-2 rounded-full transition-all duration-1000 ease-linear"
                  style={{
                    width: `${((10 - countdown) / 10) * 100}%`
                  }}
                ></div>
              </div>
            </div>

            {/* Quick Navigation */}
            <div className="space-y-3">
              <p className="text-white/70 text-xs font-medium">
                Atau pilih halaman yang ingin dikunjungi:
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="/"
                  className="flex flex-col items-center space-y-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 hover:border-white/30 rounded-2xl p-3 transition-all duration-300 active:scale-[0.98] touch-manipulation"
                >
                  <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <span className="text-xs font-bold text-white">
                    Twibbon Peserta
                  </span>
                </a>
                
                <a
                  href="/panitia"
                  className="flex flex-col items-center space-y-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 hover:border-white/30 rounded-2xl p-3 transition-all duration-300 active:scale-[0.98] touch-manipulation"
                >
                  <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-xs font-bold text-white">
                    Twibbon Panitia
                  </span>
                </a>
              </div>
            </div>

            {/* Contact Help */}
            <div className="pt-3 border-t border-white/30">
              <p className="text-white/55 text-xs text-center">
                Butuh bantuan? Hubungi <a 
                  className="text-blue-200 hover:text-blue-300 transition-colors font-medium" 
                  href='https://api.whatsapp.com/send?phone=6281215219801&text=hai%20admin%20website%20404' 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  admin website
                </a>
              </p>
            </div>

            {/* Footer */}
            <div className="pt-2">
              <p className="text-white/55 text-xs text-center">
                Made with 🤍 by <a 
                  className="text-white/60 hover:text-white transition-colors font-medium" 
                  href="https://frl.blue" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  frrlverse
                </a>
              </p>
            </div>
          </div>
        </div>
      </LiquidGlass>
    </div>
  )
}

export default NotFound
