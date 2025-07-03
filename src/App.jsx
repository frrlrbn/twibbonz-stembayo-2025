import { useState, useRef, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import LiquidGlass from 'liquid-glass-react'
import './App.css'

function App() {
  const [selectedImage, setSelectedImage] = useState(null)
  const [showCropper, setShowCropper] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [finalImage, setFinalImage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)
  const canvasRef = useRef(null)

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size too large. Please select an image under 10MB')
        return
      }

      setError(null)
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target.result)
        setShowCropper(true)
      }
      reader.onerror = () => {
        setError('Failed to read the image file')
      }
      reader.readAsDataURL(file)
    }
  }

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener('load', () => resolve(image))
      image.addEventListener('error', (error) => reject(error))
      image.setAttribute('crossOrigin', 'anonymous')
      image.src = url
    })

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    canvas.width = 800
    canvas.height = 800

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      800,
      800
    )

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        resolve(url)
      })
    })
  }

  const handleCropConfirm = async () => {
    if (croppedAreaPixels && selectedImage) {
      setIsProcessing(true)
      setError(null)
      try {
        const croppedImage = await getCroppedImg(selectedImage, croppedAreaPixels)
        await combineWithTwibbon(croppedImage)
        setShowCropper(false)
      } catch (err) {
        setError('Failed to process the image. Please try again.')
        console.error('Image processing error:', err)
      } finally {
        setIsProcessing(false)
      }
    }
  }

  const combineWithTwibbon = async (userImage) => {
    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      
      canvas.width = 800
      canvas.height = 800

      // Load user image
      const userImg = await createImage(userImage)
      ctx.drawImage(userImg, 0, 0, 800, 800)

      // Load twibbon overlay
      const twibbonImg = await createImage('/twibbon.png')
      ctx.drawImage(twibbonImg, 0, 0, 800, 800)

      // Convert to blob and create URL
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        setFinalImage(url)
      }, 'image/png', 1.0)
    } catch (err) {
      throw new Error('Failed to combine images')
    }
  }

  const downloadImage = () => {
    if (finalImage) {
      try {
        const link = document.createElement('a')
        link.download = `twibbon-${Date.now()}.png`
        link.href = finalImage
        link.click()
      } catch (err) {
        setError('Failed to download the image. Please try again.')
      }
    }
  }

  const shareToInstagram = () => {
    if (finalImage) {
      try {
        // For better mobile sharing experience, try to use Web Share API
        if (navigator.share) {
          fetch(finalImage)
            .then(res => res.blob())
            .then(blob => {
              const file = new File([blob], 'twibbon.png', { type: 'image/png' })
              navigator.share({
                title: 'Glass Twibbon',
                text: 'Check out my awesome twibbon!',
                files: [file]
              })
            })
            .catch(() => {
              // Fallback to opening Instagram
              window.open('https://www.instagram.com/', '_blank')
            })
        } else {
          // Fallback for browsers without Web Share API
          window.open('https://www.instagram.com/', '_blank')
        }
      } catch (err) {
        setError('Failed to share. Please download and share manually.')
      }
    }
  }

  const resetApp = () => {
    setSelectedImage(null)
    setFinalImage(null)
    setShowCropper(false)
    setError(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{ 
        backgroundImage: "url('/static-bg.png')", 
        fontFamily: "'Montserrat', sans-serif" 
      }}
    >
      <LiquidGlass
      children={15}
        cornerRadius={38}
        displacementScale={100}
        blurAmount={0.3}
        saturation={140}
        aberrationIntensity={1}
        elasticity={0.1}
        overLight={false}
        padding='18px 26px'
        className='w-full mt-94 ml-80 border-3 border-white/40 rounded-[39px] bg-white/20'
        >

      <div style={{minWidth: '260px'}}>
        <div className="">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 sm:mb-4 tracking-tight">
              Twibbon MPLS STEMBAYO 2025
            </h1>
            <div className="space-y-2">
              <p className="text-white/90 text-sm sm:text-base leading-relaxed px-2 font-medium">
                Selamat datang di website alternatif untuk twibbon MPLS Stembayo!
              </p>
              <p className="text-white/60 text-xs sm:text-sm leading-relaxed px-2 font-normal">
                Disini kalian dapat mendownload twibbon dengan resolusi tinggi tanpa watermark secara gratis!
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-2xl">
              <p className="text-red-200 text-xs sm:text-sm text-center">{error}</p>
            </div>
          )}

          {/* Upload Button */}
          <div className="mb-4 sm:mb-6">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-white/30 to-white/10 backdrop-blur-md border border-white/30 rounded-2xl p-3 sm:p-4 text-white font-medium transition-all duration-300 hover:border-white/40 active:scale-[0.98] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm sm:text-base font-bold">
                  {isProcessing ? 'Processing...' : 'Pilih Fotomu'}
                </span>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={isProcessing}
            />
          </div>

          {/* Preview Container - Always Visible */}
          <div className="mb-4 sm:mb-6">
            <div className="bg-gradient-to-r from-white/30 to-white/10 backdrop-blur-md border-2 border-dashed border-white/30 rounded-2xl p-3 sm:p-4">
              {finalImage && (
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={resetApp}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              
              <div className="relative mx-auto w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden">
                {finalImage ? (
                  <img
                    src={finalImage}
                    alt="Result"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white/40">
                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons - Always Visible */}
          <div className="flex space-x-2 sm:space-x-3">
            <button
              onClick={downloadImage}
              disabled={!finalImage}
              className={`flex-1 backdrop-blur-xl border rounded-2xl p-2.5 sm:p-3 text-white font-medium transition-all duration-300 active:scale-[0.98] touch-manipulation ${
                finalImage 
                  ? 'bg-white/30 border-white/30 hover:bg-white/20 active:scale-[0.98] touch-manipulation text-sm sm:text-base disabled:opacity-50 cursor-pointer' 
                  : 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm sm:text-base font-bold">Download</span>
              </div>
            </button>
            
            <button
              onClick={shareToInstagram}
              disabled={!finalImage}
              className={`flex-1 backdrop-blur-xl border rounded-2xl p-2.5 sm:p-3 text-white font-medium transition-all duration-300 active:scale-[0.98] touch-manipulation ${
                finalImage 
                  ? 'bg-white/30 border-white/30 hover:bg-white/20 active:scale-[0.98] touch-manipulation text-sm sm:text-base disabled:opacity-50 cursor-pointer' 
                  : 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.40s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-4 pt-3 border-t border-white/10">
            <p className="text-white/55 text-xs text-center">
              Perlunya dingatakan jika website ini masih dalam tahap pengembangan, jika menemukan kendala bisa menghubungi <span className="text-blue-300">admin website</span>
            </p>
          </div>
        </div>
        
      </div>
</LiquidGlass>

      {/* Cropper Modal */}
      {showCropper && (
        <div className="fixed inset-0 bg-black/20 flex items-center backdrop-blur-xs justify-center p-3 sm:p-4 z-50">
          <LiquidGlass
              children={15}
              cornerRadius={38}
              displacementScale={100}
              blurAmount={0.1}
              saturation={140}
              aberrationIntensity={1}
              elasticity={0.1}
              overLight={true}
              padding='18px 26px'
              className='border-3 border-white/40 rounded-[39px] bg-white/40 w-full ml-78 mt-86 opacity-90'
            >
          <div className="w-full max-w-sm sm:max-w-md mx-auto">
            
              <div style={{minWidth: '260px'}}>
                <h3 className="text-white font-extrabold mb-4 text-center text-md sm:text-base">Crop Foto Anda</h3>
                
                <div className="relative w-full h-56 sm:h-64 mb-4 rounded-2xl overflow-hidden bg-black/20">
                  <Cropper
                    image={selectedImage}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    cropShape="rect"
                    showGrid={false}
                    style={{
                      containerStyle: {
                        borderRadius: '1rem',
                      }
                    }}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-white/80 text-xs sm:text-sm mb-3 font-extrabold">Zoom</label>
                  <div className="relative">
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.1}
                      value={zoom}
                      onChange={(e) => setZoom(e.target.value)}
                      className="w-full h-3 bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-md border border-white/30 rounded-full outline-none appearance-none cursor-pointer transition-all duration-300 hover:border-white/40 hover:shadow-lg hover:shadow-white/10 glassmorphism-slider"
                      style={{
                        background: `linear-gradient(to right, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.4) ${((zoom - 1) / 2) * 100}%, rgba(255,255,255,0.1) ${((zoom - 1) / 2) * 100}%, rgba(255,255,255,0.1) 100%)`
                      }}
                    />
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowCropper(false)}
                    disabled={isProcessing}
                    className="flex-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-2.5 sm:p-3 text-white font-bold transition-all duration-300 hover:bg-white/20 active:scale-[0.98] touch-manipulation text-sm sm:text-base disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCropConfirm}
                    disabled={isProcessing}
                    className="flex-1 bg-white/10 backdrop-blur-xl border border-white/30 rounded-xl p-2.5 sm:p-3 text-white font-extrabold transition-all duration-300 hover:bg-white/20 active:scale-[0.98] touch-manipulation text-sm sm:text-base disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      'Confirm'
                    )}
                  </button>
                </div>
              </div>
            </div>
            </LiquidGlass>
          </div>
        
      )}

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

export default App
