import { useState, useRef, useCallback, useEffect } from 'react'
import Cropper from 'react-easy-crop'
import LiquidGlass from 'liquid-glass-react'
import QRCode from 'qrcode'
import './App.css'

function Panitia() {
  const [selectedImage, setSelectedImage] = useState(null)
  const [showCropper, setShowCropper] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [finalImage, setFinalImage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [showCaptionForm, setShowCaptionForm] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [captionData, setCaptionData] = useState({
    namaLengkap: '',
    kelasJurusan: ''
  })
  const [isCopied, setIsCopied] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [showThanksModal, setShowThanksModal] = useState(false)
  const fileInputRef = useRef(null)
  const canvasRef = useRef(null)

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      // More strict mobile detection - only smartphones
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobileUserAgent = /android.*mobile|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
      const isSmallScreen = window.innerWidth <= 480 // Only very small screens
      
      // Consider it mobile only if it's both mobile user agent AND small screen
      const isMobileDevice = isMobileUserAgent && isSmallScreen
      
      setIsMobile(isMobileDevice)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Generate QR Code
  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const url = window.location.href
        const qrUrl = await QRCode.toDataURL(url, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        setQrCodeUrl(qrUrl)
      } catch (error) {
        console.error('Error generating QR code:', error)
      }
    }

    generateQRCode()
  }, [])

  // Persistensi caption mode - load dari localStorage saat app dimuat
  useEffect(() => {
    const savedCaptionMode = localStorage.getItem('glasstb_panitia_captionMode')
    const savedCaptionData = localStorage.getItem('glasstb_panitia_captionData')
    
    if (savedCaptionMode === 'true') {
      setShowCaptionForm(true)
    }
    
    if (savedCaptionData) {
      try {
        const parsedData = JSON.parse(savedCaptionData)
        setCaptionData(parsedData)
      } catch (error) {
        console.error('Error parsing saved caption data:', error)
      }
    }
  }, [])

  // Save caption state ke localStorage setiap kali berubah
  useEffect(() => {
    localStorage.setItem('glasstb_panitia_captionMode', showCaptionForm.toString())
  }, [showCaptionForm])

  useEffect(() => {
    localStorage.setItem('glasstb_panitia_captionData', JSON.stringify(captionData))
  }, [captionData])

  // Auto close thanks modal after 10 seconds
  useEffect(() => {
    let timeoutId
    if (showThanksModal) {
      timeoutId = setTimeout(() => {
        setShowThanksModal(false)
      }, 10000) // 10 seconds
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [showThanksModal])

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

      setError(null)
      setIsProcessing(true)
      
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          let imageDataUrl = e.target.result
          
          // Jika file lebih dari 4MB, lakukan kompresi
          if (file.size > 4 * 1024 * 1024) {
            setIsCompressing(true)
            imageDataUrl = await compressImage(imageDataUrl, 0.8) // Kompresi dengan quality 80%
            setIsCompressing(false)
          }
          
          setSelectedImage(imageDataUrl)
          setShowCropper(true)
        } catch (error) {
          setError('Failed to process the image. Please try again.')
          console.error('Image compression error:', error)
          setIsCompressing(false)
        } finally {
          setIsProcessing(false)
        }
      }
      reader.onerror = () => {
        setError('Failed to read the image file')
        setIsProcessing(false)
        setIsCompressing(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const compressImage = (dataUrl, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // Hitung ukuran baru untuk mengoptimalkan kompresi
        let { width, height } = img
        const maxDimension = 1920 // Maksimal 1920px untuk dimensi terbesar
        
        if (width > height) {
          if (width > maxDimension) {
            height = (height * maxDimension) / width
            width = maxDimension
          }
        } else {
          if (height > maxDimension) {
            width = (width * maxDimension) / height
            height = maxDimension
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // Gambar image yang sudah diresize
        ctx.drawImage(img, 0, 0, width, height)
        
        // Konversi ke dataURL dengan kompresi
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedDataUrl)
      }
      img.onerror = reject
      img.src = dataUrl
    })
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

    // Tingkatkan resolusi untuk kualitas tinggi (2048x2048)
    canvas.width = 2048
    canvas.height = 2048

    // Enable image smoothing untuk kualitas terbaik
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      2048,
      2048
    )

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        resolve(url)
      }, 'image/png', 1.0) // PNG untuk kualitas lossless
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
      
      // Tingkatkan resolusi untuk kualitas tinggi (2048x2048)
      canvas.width = 2048
      canvas.height = 2048

      // Enable image smoothing dan pengaturan kualitas terbaik
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      // Load user image terlebih dahulu
      const userImg = await createImage(userImage)
      
      // Hitung ukuran dan posisi untuk foto user (sesuaikan dengan resolusi tinggi)
      const photoSize = 1331 // 520 * 2.56 (scaling factor untuk 2048px)
      const centerX = (2048 - photoSize) / 2 
      const centerY = 307 // 120 * 2.56 (scaling factor untuk 2048px)
      
      // Buat clipping path untuk membuat foto menjadi lingkaran
      ctx.save()
      ctx.beginPath()
      ctx.arc(centerX + photoSize/2, centerY + photoSize/2, photoSize/2, 0, Math.PI * 2)
      ctx.clip()
      
      // Gambar foto user dengan ukuran yang lebih kecil di posisi yang tepat
      ctx.drawImage(userImg, centerX, centerY, photoSize, photoSize)
      
      // Restore context
      ctx.restore()

      // Load dan gambar twibbon overlay di atas foto user (layer paling depan) - PANITIA VERSION
      const twibbonImg = await createImage('/twibbon-panitia.png')
      ctx.drawImage(twibbonImg, 0, 0, 2048, 2048)

      // Convert to blob and create URL dengan kualitas maksimum
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        setFinalImage(url)
      }, 'image/png', 1.0) // PNG dengan kualitas maksimum
    } catch (err) {
      throw new Error('Failed to combine images')
    }
  }

  const downloadImage = () => {
    if (finalImage) {
      try {
        const link = document.createElement('a')
        link.download = `twibbon-panitia-mpls-stembayo-2025-${Date.now()}.png`
        link.href = finalImage
        link.click()
        
        // Show thanks modal after successful download
        setShowThanksModal(true)
      } catch (err) {
        setError('Failed to download the image. Please try again.')
      }
    }
  }

  const shareToInstagram = () => {
    // Refresh otomatis sebelum masuk mode caption
    window.location.reload()
    // Set caption mode akan dihandle oleh localStorage setelah refresh
    localStorage.setItem('glasstb_panitia_captionMode', 'true')
  }

  const generateCaption = () => {
    return `𝐏𝐚𝐧𝐢𝐭𝐢𝐚 𝐌𝐏𝐋𝐒 𝐒𝐌𝐊𝐍 𝟐 𝐃𝐞𝐩𝐨𝐤 𝟐𝟎𝟐𝟓 🔥

"𝚁𝚎𝚊𝚕𝚒𝚣𝚒𝚗𝚐 𝚊 𝚜𝚞𝚙𝚎𝚛𝚒𝚘𝚛 𝚐𝚎𝚗𝚎𝚛𝚊𝚝𝚒𝚘𝚗, 𝚌𝚑𝚊𝚛𝚊𝚌𝚝𝚎𝚛𝚒𝚣𝚎𝚍, 𝚌𝚘𝚖𝚙𝚎𝚝𝚎𝚗𝚝 𝚊𝚗𝚍 𝚎𝚗𝚟𝚒𝚛𝚘𝚗𝚖𝚎𝚗𝚝𝚊𝚕𝚕𝚢 𝚜𝚘𝚞𝚗𝚍"
Mewujudkan generasi unggul, berkarakter, kompeten dan berwawasan lingkungan.

Halo future leaders! 👋✨
Saya ${captionData.namaLengkap || '(Nama lengkap)'} sebagai ${captionData.kelasJurusan || '(posisi/divisi panitia)'} Siap memberikan yang terbaik untuk menciptakan lingkungan yang mendukung dalam mewujudkan generasi unggul, berkarakter, kompeten dan berwawasan lingkungan 🌱

Untuk informasi lebih lanjut kunjungi Instagram resmi 📝
@infompls.smkn2depoksleman | @smkn2depoksleman.official | @osis.stembayo | @pkstembayo | @humtik.stembayo

#MPLSStembayo #MPLS2025 #MasaPengenalanLingkunganSekolah #Stembayo #SMKN2DepokSleman #smkn2depok #ProudToBeSTEMBAYO #SMKBisaHebat`
  }

  const copyCaption = () => {
    const caption = generateCaption()
    navigator.clipboard.writeText(caption).then(() => {
      // Set status copied dan reset setelah 2 detik
      setIsCopied(true)
      setTimeout(() => {
        setIsCopied(false)
      }, 2000)
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = caption
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      
      // Set status copied dan reset setelah 2 detik
      setIsCopied(true)
      setTimeout(() => {
        setIsCopied(false)
      }, 2000)
    })
  }

  const backToTwibbon = () => {
    // Clear localStorage saat back ke mode normal
    localStorage.removeItem('glasstb_panitia_captionMode')
    localStorage.removeItem('glasstb_panitia_captionData')
    setShowCaptionForm(false)
    setIsCopied(false) // Reset copied state
    // Reset caption data
    setCaptionData({
      namaLengkap: '',
      kelasJurusan: ''
    })
  }

  const resetApp = () => {
    setSelectedImage(null)
    setFinalImage(null)
    setShowCropper(false)
    setShowCaptionForm(false)
    setShowThanksModal(false)
    setCaptionData({ namaLengkap: '', kelasJurusan: '' })
    setError(null)
    setIsCompressing(false)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }

  const closeThanksModal = () => {
    setShowThanksModal(false)
  }

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
                  Website ini dirancang khusus untuk perangkat mobile. Untuk pengalaman terbaik, silakan buka website ini menggunakan:
                </p>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                    <div className="font-semibold text-white mb-1">📱 Smartphone</div>
                    <div className="text-white/70">Android / iOS</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                    <div className="font-semibold text-white mb-1">📱 Mobile Web</div>
                    <div className="text-white/70">Browser Mobile</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-white/70 text-xs">
                  Scan QR code ini dengan HP Anda atau salin URL berikut:
                </p>
                
                {/* QR Code */}
                {qrCodeUrl && (
                  <div className="flex justify-center mb-4">
                    <div className="bg-white rounded-2xl p-3 border border-white/20">
                      <img 
                        src={qrCodeUrl} 
                        alt="QR Code" 
                        className="w-32 h-32 mx-auto"
                      />
                    </div>
                  </div>
                )}
                
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                  <div className="bg-white rounded-xl p-3">
                    <div className="text-black text-xs font-mono break-all select-all">
                      {window.location.href}
                    </div>
                  </div>
                </div>
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

      {/* Main App Content */}
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
        className={`w-full border-3 border-white/20 rounded-[50px] bg-white/20 ${
          showCaptionForm ? 'mt-[500px] ml-[346px]' : 'mt-94 ml-80'
        } ${!isMobile ? 'opacity-20 pointer-events-none' : ''}`}
        >

      <div style={{minWidth: '260px'}} className="font-montserrat">
        <div className="font-montserrat">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              <img 
                src="/stembayo.png" 
                alt="Stembayo Logo" 
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
              />
              <div className="mx-4 sm:mx-6 w-0.5 h-12 sm:h-16 bg-white/60 to-transparent shadow-lg rounded-xl"></div>
              <div className="text-left">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  Twibbon Panitia<br />MPLS STEMBAYO 2025
                </h1>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-white/90 text-sm sm:text-base leading-none px-2 font-bold">
                Twibbon khusus untuk Panitia MPLS Stembayo 2025!
              </p>
              <p className="text-white/60 text-xs sm:text-sm leading-3.5 px-2 font-semibold">
                Download twibbon panitia dengan resolusi tinggi tanpa watermark!
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-2xl">
              <p className="text-red-200 text-xs sm:text-sm text-center">{error}</p>
            </div>
          )}

          {/* Compression Info Message */}
          {isCompressing && (
            <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-2xl">
              <p className="text-blue-200 text-xs sm:text-sm text-center">
                File lebih dari 4MB, sedang mengompres untuk kualitas optimal...
              </p>
            </div>
          )}

          {/* Upload Button or Caption Form */}
          {!showCaptionForm ? (
            <div className="mb-4 sm:mb-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing || isCompressing}
                className="w-full bg-gradient-to-r from-white/30 to-white/10 backdrop-blur-md border border-white/30 rounded-3xl p-3 sm:p-4 text-white font-medium transition-all duration-300 hover:border-white/40 active:scale-[0.98] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center space-x-2">
                  {isCompressing && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  )}
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm sm:text-base font-bold">
                    {isCompressing ? 'Compressing...' : isProcessing ? 'Processing...' : 'Pilih Fotomu'}
                  </span>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isProcessing || isCompressing}
              />
            </div>
          ) : (
            <div className="mb-4 sm:mb-6">
              <div className="bg-gradient-to-r from-white/30 to-white/10 backdrop-blur-md border border-white/30 rounded-3xl p-4 sm:p-5 space-y-4">
                <h3 className="text-white font-bold text-center text-sm sm:text-base mb-4">Buat Caption Instagram</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-white/80 text-xs sm:text-sm mb-2 font-medium">Nama Lengkap</label>
                    <input
                      type="text"
                      value={captionData.namaLengkap}
                      onChange={(e) => setCaptionData({...captionData, namaLengkap: e.target.value})}
                      placeholder="Contoh: Muhammad Farrel"
                      className="w-full bg-white/10 border border-white/30 rounded-xl p-2.5 text-white placeholder-white/50 text-sm focus:outline-none focus:border-white/50 transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white/80 text-xs sm:text-sm mb-2 font-medium">Posisi / Divisi Panitia</label>
                    <input
                      type="text"
                      value={captionData.kelasJurusan}
                      onChange={(e) => setCaptionData({...captionData, kelasJurusan: e.target.value})}
                      placeholder="Contoh: Divisi Media"
                      className="w-full bg-white/10 border border-white/30 rounded-xl p-2.5 text-white placeholder-white/50 text-sm focus:outline-none focus:border-white/50 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview Container or Caption Preview */}
          {!showCaptionForm ? (
            <div className="mb-4 sm:mb-6">
              <div className="bg-gradient-to-r from-white/30 to-white/10 backdrop-blur-md border-2 border-dashed border-white/30 rounded-4xl p-3 sm:p-4">
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
          ) : (
            <div className="mb-4 sm:mb-6">
              <div className="bg-gradient-to-r from-white/30 to-white/10 backdrop-blur-md border-2 border-dashed border-white/30 rounded-4xl p-3 sm:p-4">
                <h4 className="text-white font-extrabold text-xs sm:text-sm mb-3 text-center">Preview Caption</h4>
                <div className="bg-black/20 rounded-2xl p-3 max-h-64 overflow-y-auto">
                  <pre className="text-white/90 text-xs leading-relaxed font-normal whitespace-pre-wrap break-words">
                    {generateCaption()}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons - Always Visible */}
          <div className="flex space-x-2 sm:space-x-3">
            <button
              onClick={showCaptionForm ? backToTwibbon : downloadImage}
              disabled={showCaptionForm ? false : !finalImage}
              className={`flex-1 backdrop-blur-xl border rounded-2xl p-2.5 sm:p-3 text-white font-medium transition-all duration-300 active:scale-[0.98] touch-manipulation ${
                showCaptionForm || finalImage
                  ? 'bg-white/30 border-white/30 hover:bg-white/20 active:scale-[0.98] touch-manipulation text-sm sm:text-base disabled:opacity-50 cursor-pointer' 
                  : 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                {showCaptionForm ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="text-sm sm:text-base font-bold">Back</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm sm:text-base font-bold">Download</span>
                  </>
                )}
              </div>
            </button>
            
            <button
              onClick={showCaptionForm ? copyCaption : shareToInstagram}
              disabled={showCaptionForm ? false : !finalImage}
              className={`flex-1 backdrop-blur-xl border rounded-2xl p-2.5 sm:p-3 font-medium transition-all duration-300 active:scale-[0.98] touch-manipulation ${
                showCaptionForm || finalImage
                  ? isCopied && showCaptionForm
                    ? 'bg-green-500/30 border-green-500/40 hover:bg-green-500/25 text-green-100 cursor-pointer'
                    : 'bg-white/30 border-white/30 hover:bg-white/20 text-white cursor-pointer'
                  : 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed text-white'
              }`}
            >
              <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                {showCaptionForm ? (
                  <>
                    {isCopied ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm sm:text-base font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm sm:text-base font-bold">Copy</span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <span className="text-sm sm:text-base font-bold">Caption</span>
                  </>
                )}
              </div>
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-4 pt-3 border-t border-white/30 rounded-2xl">
            <p className="text-white/55 text-xs text-center">
              Jika menemukan kendala pada website ini bisa menghubungi <a className="text-blue-200 hover:text-blue-300 transition-colors" href='https://api.whatsapp.com/send?phone=6281215219801&text=hai%20admint' target="_blank" 
                rel="noopener noreferrer">admin website</a>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-2 pt-2">
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

      {/* Cropper Modal */}
      {showCropper && isMobile && (
        <div className="fixed inset-0 bg-black/20 flex items-center backdrop-blur-xs justify-center p-3 sm:p-4 z-50">
          <LiquidGlass
              children={15}
              cornerRadius={48}
              displacementScale={100}
              blurAmount={0.1}
              saturation={150}
              aberrationIntensity={1}
              elasticity={0.1}
              overLight={true}
              padding='18px 26px'
              className='border-3 border-white/40 rounded-[50px] bg-[#fe7ca728] w-full ml-78 mt-86 opacity-90'
            >
          <div className="w-full max-w-sm sm:max-w-md mx-auto">
            
              <div style={{minWidth: '260px'}}>
                <h3 className="text-white font-extrabold mb-4 text-center text-md sm:text-base">Crop Foto Anda</h3>
                
                <div className="relative w-full h-56 sm:h-64 mb-4 rounded-4xl overflow-hidden bg-black/20">
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
                    className="flex-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2.5 sm:p-3 text-white font-bold transition-all duration-300 hover:bg-white/20 active:scale-[0.98] touch-manipulation text-sm sm:text-base disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCropConfirm}
                    disabled={isProcessing}
                    className="flex-1 bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-2.5 sm:p-3 text-white font-extrabold transition-all duration-300 hover:bg-white/20 active:scale-[0.98] touch-manipulation text-sm sm:text-base disabled:opacity-50"
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

      {/* Thanks Modal */}
      {showThanksModal && isMobile && (
        <div className="fixed inset-0 bg-black/40 flex items-center backdrop-blur-sm justify-center p-3 sm:p-4 z-50">
          <LiquidGlass
            children={15}
            cornerRadius={48}
            displacementScale={100}
            blurAmount={0.1}
            saturation={150}
            aberrationIntensity={1}
            elasticity={0.1}
            overLight={true}
            padding='18px 26px'
            className='border-3 border-white/40 rounded-[50px] bg-[#fe7ca728] w-full ml-80 mt-124 opacity-95'
          >
            <div className="w-full max-w-sm sm:max-w-md mx-auto">
              <div style={{minWidth: '260px'}} className="text-center relative overflow-hidden">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute top-4 left-4 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
                  <div className="absolute top-8 right-6 w-1 h-1 bg-white/40 rounded-full animate-pulse"></div>
                  <div className="absolute bottom-8 left-6 w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce"></div>
                  <div className="absolute bottom-4 right-4 w-1 h-1 bg-white/30 rounded-full animate-ping delay-500"></div>
                  
                  {/* Additional floating elements */}
                  <div className="absolute top-12 right-12 w-0.5 h-0.5 bg-yellow-300/40 rounded-full animate-pulse delay-1000"></div>
                  <div className="absolute top-20 left-12 w-0.5 h-0.5 bg-blue-300/40 rounded-full animate-bounce delay-700"></div>
                  <div className="absolute bottom-16 right-8 w-0.5 h-0.5 bg-purple-300/40 rounded-full animate-ping delay-300"></div>
                  
                </div>

                {/* Close Button */}
                <div className="flex justify-end mb-2 relative z-10">
                  <button
                    onClick={closeThanksModal}
                    className="text-white/60 hover:text-white transition-all duration-300 p-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 hover:scale-110 active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Thanks GIF with Enhanced Container */}
                <div className="mb-6 flex justify-center relative">
                  <div className="relative group">
                    {/* Multiple glowing ring effects */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 to-white/10 blur-sm group-hover:blur-md transition-all duration-500 scale-110 animate-pulse"></div>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-300/10 to-orange-300/10 blur-md transition-all duration-500 scale-125 animate-pulse delay-200"></div>
                    
                    {/* GIF Container */}
                    <div className="relative bg-white/10 backdrop-blur-md border border-white/30 rounded-full p-2 shadow-2xl group-hover:shadow-3xl transition-all duration-500 group-hover:scale-105">
                      <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-full p-1">
                        <img 
                          src="/thanks.gif" 
                          alt="Thank You" 
                          className="w-20 h-20 sm:w-28 sm:h-28 object-contain rounded-full relative z-10"
                        />
                      </div>
                    </div>
                    
                    {/* Floating sparkles with better positioning */}
                    <div className="absolute -top-1 -right-1 text-yellow-300 animate-bounce text-sm">✨</div>
                    <div className="absolute -bottom-1 -left-1 text-blue-300 animate-pulse text-xs">💫</div>
                    <div className="absolute top-2 -left-2 text-purple-300 animate-bounce delay-300 text-xs">⭐</div>
                    <div className="absolute -bottom-2 right-2 text-green-300 animate-pulse delay-700 text-xs">🌟</div>
                  </div>
                </div>

                {/* Thank You Message with Enhanced Typography */}
                <div className="space-y-4 mb-4 relative z-10">
                  <div className="relative">
                    <h3 className="text-white font-extrabold text-3xl sm:text-2xl mb-2 relative">
                      <span className="bg-gradient-to-r from-white via-white/90 to-white bg-clip-text text-transparent">
                        Terima Kasih!
                      </span>
                    </h3>
                    {/* Subtle underline effect */}
                    <div className="w-16 h-0.5 bg-gradient-to-r from-white/60 to-transparent mx-auto rounded-full"></div>
                  </div>
                  
                  <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-4 space-y-3">
                    <p className="text-white/90 text-sm sm:text-base leading-4 font-medium">
                      <p className='font-extrabold'>Download berhasil!</p> Jika website ini membantu, ayo beri untuk support agar admin bisa terus berkembang! <span className="ml-1 text-yellow-300 animate-pulse">✨</span>
                    </p>
                  </div>
                  
                </div>

                {/* Enhanced Support Button */}
                <div className="space-y-4 relative z-10">
                  <div className="relative group">
                    {/* Multiple glow layers for depth */}
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300 scale-105 opacity-60"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300 scale-110 opacity-40"></div>
                    
                    <a
                      href="https://saweria.co/frrlverse"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative block w-full bg-gradient-to-r from-yellow-500/40 to-orange-500/40 backdrop-blur-md border border-yellow-400/50 rounded-2xl p-4 text-white font-bold transition-all duration-300 hover:border-yellow-400/70 hover:from-yellow-500/50 hover:to-orange-500/50 active:scale-[0.98] touch-manipulation shadow-lg hover:shadow-xl group"
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <div className="bg-yellow-400/20 rounded-full p-2 group-hover:bg-yellow-400/30 transition-all duration-300 group-hover:scale-110">
                          <span className="text-yellow-200 text-lg transition-transform duration-300 inline-block">⭐</span>
                        </div>
                        <div className="flex flex-col items-center space-y-1">
                          <span className="text-sm sm:text-base bg-gradient-to-r from-yellow-100 to-orange-100 bg-clip-text text-transparent">
                            Saweria
                          </span>
                          <div className="flex items-center space-x-1 text-yellow-200/80 text-xs">
                            <span>Buat beli jajan 😅</span>
                            <div className="w-1 h-1 bg-yellow-300/60 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </a>
                  </div>

                  {/* Auto-close timer with enhanced progress bar */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                        <p className="text-white/60 text-xs">
                          Tertutup otomatis
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 text-white/60">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-mono">10s</span>
                      </div>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-pink-500/80 via-pink-400/80 to-pink-300/80 h-1.5 rounded-full transition-all duration-100 ease-linear shadow-sm"
                        style={{
                          animation: showThanksModal ? 'countdown 10s linear forwards' : 'none',
                          width: '100%'
                        }}
                      ></div>
                    </div>
                  </div>
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

export default Panitia
