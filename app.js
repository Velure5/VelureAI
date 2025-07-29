console.log('app.js loaded');

const { useState, useEffect, useRef } = React;

// Main App Component
const App = () => {
  // isDarkMode is now always true
  const isDarkMode = true;

  // Ref for the hidden canvas used for downloading
  const canvasRef = useRef(null);
  // Ref for the carousel container to control scrolling
  const carouselRef = useRef(null);
  // Ref for the animation frame ID to control continuous scrolling
  const animationFrameId = useRef(null);

  // State for image previews (placeholders)
  const [originalImage, setOriginalImage] = useState('https://placehold.co/600x400/E0E0E0/333333?text=Upload+Your+Image');
  const [appliedPreset, setAppliedPreset] = useState('None');

  // Carousel images state - 6 distinct images
  // IMPORTANT: Replace these with your DIRECT IMAGE URLs (ending in .jpg, .png, etc.)
  const [carouselImages, setCarouselImages] = useState([
    'https://i.pinimg.com/736x/a4/66/ac/a466ac57e88d5070ab557e8b3b79378b.jpg',
    'https://i.pinimg.com/736x/fa/8c/58/fa8c588dd16e35a2de52d0c73584eaf3.jpg',
    'https://i.pinimg.com/736x/ee/05/c3/ee05c31928ad4e5a3a9e3114e82497df.jpg',
    'https://i.pinimg.com/736x/e2/db/39/e2db39917c93f7d836d74c587490dc75.jpg',
    'https://i.pinimg.com/736x/92/71/10/9271107e948045f96c1d27a2504ffce9.jpg',
    'https://i.pinimg.com/736x/71/25/14/7125145b126737756bc2f15ad2ecabd5.jpg',
  ]);

  // State for editing tool sliders
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [hueRotation, setHueRotation] = useState(0);
  const [sharpen, setSharpen] = useState(0); // Sharpen is hard to do with pure CSS filters

  // State for active filter/preset
  const [activeFilter, setActiveFilter] = useState('');
  const [activePreset, setActivePreset] = useState('');

  // Define filters with their CSS and highlight status
  const filters = [
    { name: 'Grayscale', css: 'grayscale(1)', isHighlighted: true },
    { name: 'Invert Colors', css: 'invert(1)', isHighlighted: true },
    { name: 'Sepia', css: 'sepia(1)', isHighlighted: true },
    { name: 'Blur', css: 'blur(3px)', isHighlighted: true }, // Highlighted new filter
    { name: 'High Contrast', css: 'contrast(1.5)', isHighlighted: false },
    { name: 'Soft Focus', css: 'blur(1px) brightness(1.05)', isHighlighted: false },
    { name: 'Vignette', css: 'brightness(0.8) contrast(1.1)', isHighlighted: false }, // Simplified visual vignette
    { name: 'Vintage Warmth', css: 'sepia(0.3) saturate(1.2) hue-rotate(-5deg)', isHighlighted: false },
  ];

  // Define presets with their configuration and highlight status
  const presets = [
    { name: 'Classic Vintage', config: { brightness: 105, contrast: 110, saturation: 90, hueRotation: 5, extraCss: 'sepia(0.5)' }, isHighlighted: true },
    { name: 'Monochrome Dream', config: { brightness: 100, contrast: 120, saturation: 0, hueRotation: 0, extraCss: 'grayscale(1)' }, isHighlighted: true },
    { name: 'Vibrant Pop', config: { brightness: 110, contrast: 100, saturation: 150, hueRotation: 0 }, isHighlighted: true },
    { name: 'Cool Tones', config: { brightness: 95, contrast: 105, saturation: 110, hueRotation: 20 }, isHighlighted: true },
    { name: 'Sharp & Clear', config: { brightness: 100, contrast: 100, saturation: 100, hueRotation: 0 }, isHighlighted: false },
    { name: 'Warm Glow', config: { brightness: 110, contrast: 90, saturation: 120, hueRotation: -10 }, isHighlighted: false },
    { name: 'Faded Film', config: { brightness: 90, contrast: 80, saturation: 70, hueRotation: 0, extraCss: 'sepia(0.8) contrast(0.9)' }, isHighlighted: false },
    { name: 'Cinematic Drama', config: { brightness: 95, contrast: 130, saturation: 100, hueRotation: 0 }, isHighlighted: false },
  ];

  // Function to handle image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result);
        setAppliedPreset('None');
        resetAllEffects(); // Also reset effects when a new image is uploaded
      };
      reader.readAsDataURL(file);
    }
  };

  // Carousel auto-scrolling logic
  useEffect(() => {
    const carouselElement = carouselRef.current;
    if (!carouselElement) return;

    const scrollSpeed = 0.5; // Pixels per frame

    const startScrolling = () => {
        const scroll = () => {
            if (!carouselElement) return; // Guard against unmounted component

            // Calculate the width of one full "real" loop cycle
            // Since we duplicated the whole carouselImages array, the scrollWidth is effectively twice the original content.
            // When carouselElement.scrollLeft goes past the first half of the scrollable content,
            // we immediately jump it back to the beginning of the first half.
            const totalContentWidth = carouselElement.scrollWidth / 2;

            if (carouselElement.scrollLeft >= totalContentWidth) {
                carouselElement.scrollLeft = 0; // Jump back to the start of the 'original' content
            } else {
                carouselElement.scrollLeft += scrollSpeed;
            }
            animationFrameId.current = requestAnimationFrame(scroll);
        };
        animationFrameId.current = requestAnimationFrame(scroll);
    };

    const stopScrolling = () => {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
    };

    // Pause on hover
    carouselElement.addEventListener('mouseenter', stopScrolling);
    carouselElement.addEventListener('mouseleave', startScrolling);

    // Start scrolling when component mounts
    startScrolling();

    // Cleanup function: stop animation and remove event listeners
    return () => {
        stopScrolling();
        if (carouselElement) {
            carouselElement.removeEventListener('mouseenter', stopScrolling);
            carouselElement.removeEventListener('mouseleave', startScrolling);
        }
    };
  }, [carouselImages]); // Depend on carouselImages to re-init if they change

  // Function to get CSS filter style string based on current slider values and active filter/preset
  const getFilterStyle = () => {
    let currentFilters = [];

    // Apply slider effects
    currentFilters.push(`brightness(${brightness / 100})`);
    currentFilters.push(`contrast(${contrast / 100})`);
    currentFilters.push(`saturate(${saturation / 100})`);
    currentFilters.push(`hue-rotate(${hueRotation}deg)`);

    // Apply active filter's specific CSS
    const activeFilterObj = filters.find(f => f.name === activeFilter);
    if (activeFilterObj && activeFilterObj.css) {
        currentFilters.push(activeFilterObj.css);
    }

    // Apply active preset's additional CSS if any (after sliders)
    const activePresetObj = presets.find(p => p.name === activePreset);
    if (activePresetObj && activePresetObj.config.extraCss) {
        currentFilters.push(activePresetObj.config.extraCss);
    }

    return currentFilters.join(' ');
  };

  const resetAllEffects = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setHueRotation(0);
    setSharpen(0);
    setActiveFilter('');
    setActivePreset('');
    setAppliedPreset('None');
  };

  // Handler for applying a preset
  const applyPreset = (presetName) => {
    const preset = presets.find(p => p.name === presetName);
    if (preset) {
      // Set slider values from preset config
      setBrightness(preset.config.brightness || 100);
      setContrast(preset.config.contrast || 100);
      setSaturation(preset.config.saturation || 100);
      setHueRotation(preset.config.hueRotation || 0);
      // Sharpen is visual for UI, not real image sharpening
      setSharpen(preset.config.sharpen || 0);

      // Clear active filter and set active preset
      setActiveFilter('');
      setActivePreset(presetName);
      setAppliedPreset(presetName);
    }
  };

  // Helper for slider styles
  const getSliderTrackGradient = (value, min, max, hue = false) => {
    const percentage = ((value - min) / (max - min)) * 100;
    if (hue) {
        return `linear-gradient(to right, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%))`;
    }
    return `linear-gradient(to right, ${isDarkMode ? '#3498db' : '#2196f3'} 0%, ${isDarkMode ? '#3498db' : '#2196f3'} ${percentage}%, ${isDarkMode ? '#4a4a4a' : '#ddd'} ${percentage}%, ${isDarkMode ? '#4a4a4a' : '#ddd'} 100%)`;
  };

  // Function to download the edited image
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImage) {
      console.error('Canvas or original image not available for download.');
      alert('Please upload an image first before downloading.');
      return;
    }

    // Check if the image is a data URL (local upload) or external URL
    const isDataURL = originalImage.startsWith('data:');
    
    const img = new Image();
    
    if (isDataURL) {
      // For local uploaded images, we can use them directly
      img.src = originalImage;
    } else {
      // For external images, try with CORS but handle errors gracefully
      img.crossOrigin = 'Anonymous';
      img.src = originalImage;
    }

    img.onload = () => {
      try {
        // Set canvas dimensions to match the image
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error('Could not get 2D context for canvas.');
          alert('Unable to process image. Please try again.');
          return;
        }

        // Apply the CSS filters to the canvas context
        ctx.filter = getFilterStyle();

        // Draw the image onto the canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Reset filter for next draw if needed
        ctx.filter = 'none';

        // Get the data URL from canvas
        const dataURL = canvas.toDataURL('image/png');
        
        // Detect if we're on mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
          // Mobile-friendly download approach
          try {
            // Try to use the download attribute first (works on some mobile browsers)
            const link = document.createElement('a');
            link.download = 'velure_edited_image.png';
            link.href = dataURL;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            console.log('Mobile download attempted with download attribute');
          } catch (mobileError) {
            console.log('Download attribute failed, trying alternative method');
            
            // Alternative: Open in new tab for mobile users to save manually
            const newWindow = window.open();
            if (newWindow) {
              newWindow.document.write(`
                <html>
                  <head>
                    <title>Velure AI - Edited Image</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                      body { 
                        margin: 0; 
                        padding: 20px; 
                        background: #1a1a1a; 
                        color: white; 
                        font-family: Arial, sans-serif;
                        text-align: center;
                      }
                      img { 
                        max-width: 100%; 
                        height: auto; 
                        border-radius: 8px;
                        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                      }
                      .download-btn {
                        display: inline-block;
                        margin: 20px 10px;
                        padding: 12px 24px;
                        background: #2196f3;
                        color: white;
                        text-decoration: none;
                        border-radius: 8px;
                        font-weight: bold;
                      }
                      .instructions {
                        margin: 20px 0;
                        padding: 15px;
                        background: rgba(255,255,255,0.1);
                        border-radius: 8px;
                        line-height: 1.5;
                      }
                    </style>
                  </head>
                  <body>
                    <h1>Your Edited Image</h1>
                    <img src="${dataURL}" alt="Edited Image" />
                    <div class="instructions">
                      <p><strong>To save this image:</strong></p>
                      <p>• <strong>iOS:</strong> Long press the image and select "Save to Photos"</p>
                      <p>• <strong>Android:</strong> Long press the image and select "Save image" or "Download image"</p>
                      <p>• <strong>Other:</strong> Right-click and select "Save image as..."</p>
                    </div>
                    <a href="${dataURL}" class="download-btn" download="velure_edited_image.png">Download Image</a>
                    <br><br>
                    <button onclick="window.close()" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
                  </body>
                </html>
              `);
              newWindow.document.close();
            } else {
              // Fallback: Show data URL for manual copying
              alert('Please long-press the image below and select "Save to Photos" or "Download image":\n\n' + dataURL.substring(0, 100) + '...');
            }
          }
        } else {
          // Desktop download approach
          const link = document.createElement('a');
          link.download = 'velure_edited_image.png';
          link.href = dataURL;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          console.log('Desktop download successful!');
        }
        
      } catch (error) {
        console.error('Error during download process:', error);
        alert('Download failed. This might be due to CORS restrictions with external images. Please upload your own image instead.');
      }
    };

    img.onerror = (error) => {
      console.error('Error loading image for canvas:', error);
      alert('Unable to load image for download. This is likely due to CORS restrictions. Please upload your own image instead of using external URLs.');
    };
  };

  return (
    // Set the whole app to dark mode by default
    <div className={`min-h-screen font-inter transition-colors duration-300 bg-slate-900 text-white dark`}>
      <style>
        {`
          /* Custom slider styles for better appearance and glow */
          input[type="range"] {
            -webkit-appearance: none;
            appearance: none;
            width: 100%;
            height: 8px;
            background: #4a4a4a; /* Dark mode default */
            outline: none;
            opacity: 0.7;
            transition: opacity .2s;
            border-radius: 4px;
          }

          input[type="range"]:hover {
            opacity: 1;
          }

          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #2196f3; /* Dark mode default */
            cursor: pointer;
            box-shadow: 0 0 5px #2196f3; /* Dark mode default */
            transition: background 0.3s ease, box-shadow 0.3s ease;
          }

          input[type="range"]::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #2196f3; /* Dark mode default */
            cursor: pointer;
            box-shadow: 0 0 5px #2196f3; /* Dark mode default */
            transition: background 0.3s ease, box-shadow 0.3s ease;
          }

          /* Neon glow effect for buttons in dark mode (now standard) */
          .neon-button-dark {
            box-shadow: 0 0 5px #8d448d, 0 0 10px #8d448d, 0 0 15px #8d448d;
            border: 1px solid #8d448d;
          }
          .neon-button-dark:hover {
            box-shadow: 0 0 10px #a554a5, 0 0 20px #a554a5, 0 0 30px #a554a5;
          }

          /* Glowing border for active preset */
          .active-preset-glow {
            border: 2px solid transparent;
            background-image: linear-gradient(var(--dark-mode-gradient)), linear-gradient(var(--dark-mode-gradient)); /* Always dark mode gradient */
            background-origin: border-box;
            background-clip: padding-box, border-box;
            box-shadow: 0 0 8px rgba(130, 255, 255, 0.7); /* Always dark mode glow */
            transition: all 0.3s ease-in-out;
          }

          /* Active button state (darker background) */
          .button-active-state {
            background: rgba(30, 40, 50, 0.4); /* Darker glassmorphism */
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2); /* Inner shadow for pressed look */
            transform: translateY(0); /* Remove hover translateY if active */
          }

          :root {
            --light-mode-gradient: to right, #2196f3, #4fc3f7; /* Keep for reference but not used */
            --dark-mode-gradient: to right, #8d448d, #c876c8; /* Always use this */
          }

          .glassmorphism {
            background: rgba(0, 0, 0, 0.2); /* Always dark mode */
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1); /* Always dark mode */
          }
          .button-glassmorphism {
            background: rgba(55, 65, 81, 0.3); /* Always dark mode */
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.15); /* Always dark mode */
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .button-glassmorphism:hover {
            box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15);
            transform: translateY(-2px);
          }
          /* Highlighted button specific styles for a rounded outline */
          .highlighted-button {
            border: 2px solid transparent; /* Ensure border is transparent to allow box-shadow to act as outline */
            background-clip: padding-box; /* Ensures background doesn't extend into border area */
            box-shadow:
              0 0 0 2px #6EE7B7, /* Thin outer line/border effect */
              0 0 0 4px #3B82F6, /* Slightly wider, more subtle outer glow */
              0 0 15px rgba(110, 231, 183, 0.6), /* Inner glow */
              0 0 25px rgba(59, 130, 246, 0.4); /* Larger, diffused outer glow */
            transition: all 0.3s ease;
          }
        `}
      </style>

      {/* Header (simplified) */}
      <header className="py-2 px-6 flex justify-end items-center transition-colors duration-300">
        {/* Night mode toggle button removed */}
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero/Product Description Section */}
        <section className={`mb-6 p-6 rounded-xl shadow-lg text-center transition-colors duration-300 bg-gray-800 shadow-slate-700/50`}>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
            Velure AI
          </h2>
          <p className="text-xl font-light leading-relaxed mb-6 max-w-2xl mx-auto">
            Unleash your creativity with a touch. Velure AI brings **intuitive tools, stunning filters, and smart AI** to your fingertips, all wrapped in a beautifully minimalist, mobile-first design.
          </p>

          {/* Image Carousel */}
          <div className="relative w-full max-w-2xl mx-auto mb-8 rounded-xl overflow-hidden shadow-xl h-72 md:h-96 bg-gray-700"> {/* Increased size and added distinct background/shadow */}
            {/* The inner div uses `flex` and `overflow-x-hidden` for programmatic scrolling */}
            <div ref={carouselRef} className="flex h-full w-full overflow-x-hidden">
                {/* Duplicate images array to create a seamless infinite loop effect */}
                {[...carouselImages, ...carouselImages].map((image, index) => (
                    <div
                        key={index} // Use index as key, or a more unique one if images change order often
                        className="flex-none w-1/2 md:w-1/3 lg:w-1/4 h-full p-2" // Responsive sizing for 2, 3, or 4 images visible
                    >
                        <img
                            src={image}
                            alt={`Carousel Image ${index}`}
                            className="w-full h-full object-contain rounded-lg" // Added rounded-lg here
                        />
                    </div>
                ))}
            </div>
          </div>
          {/* End Image Carousel */}

          <div className="text-md font-medium text-center max-w-xl mx-auto">
            <p className="mb-2"><strong className="text-blue-500 dark:text-purple-400">Simply upload</strong> your photo.</p>
            <p className="mb-2"><strong className="text-blue-500 dark:text-purple-400">Refine with sliders</strong> for brightness, contrast, and more.</p>
            <p className="mb-2"><strong className="text-blue-500 dark:text-purple-400">Experiment with filters & presets</strong> for instant styles.</p>
            <p><strong className="text-blue-500 dark:text-purple-400">Download</strong> your perfected image.</p>
          </div>
        </section>

        {/* Upload Image Section */}
        <section className={`mb-10 p-6 rounded-xl shadow-lg flex flex-col items-center justify-center transition-colors duration-300 bg-gray-800 shadow-slate-700/50`}>
          <h2 className="text-xl font-semibold mb-4">Upload Your Image</h2>
          <p className="text-sm text-gray-300 mb-4 text-center">Upload your own image to enable download functionality</p>
          <label htmlFor="image-upload" className={`cursor-pointer flex items-center gap-2 px-6 py-3 rounded-full text-lg font-medium transition-all duration-300 button-glassmorphism text-white hover:bg-gray-700/50`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg> Select Image
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </label>
        </section>

        {/* Image Previews Section */}
        <section className="flex flex-col md:flex-row justify-center items-center gap-8 mb-10">
          <div className="flex flex-col items-center w-full md:w-1/2 lg:w-2/5">
            <h2 className="text-xl font-medium mb-3">Original Image</h2>
            <div className={`p-2 rounded-xl shadow-lg transition-shadow duration-300 bg-gray-800 shadow-slate-700/50`}>
              <img src={originalImage} alt="Original" className="rounded-xl w-full h-auto max-w-md" /> {/* Added rounded-xl */}
            </div>
          </div>
          <div className="flex flex-col items-center w-full md:w-1/2 lg:w-2/5">
            <h2 className="text-xl font-medium mb-3">Edited Preview</h2>
            <div className={`p-2 rounded-xl shadow-lg transition-shadow duration-300 bg-gray-800 shadow-slate-700/50`}>
              <img
                src={originalImage} // Use original image as base for edited preview
                alt="Edited"
                className="rounded-xl w-full h-auto max-w-md" // Added rounded-xl
                style={{ filter: getFilterStyle() }} // Apply dynamic filters here
              />
            </div>
            <p className="text-sm font-light mt-2">Applied preset: <span className="font-medium">{appliedPreset}</span></p>
          </div>
          {/* Hidden Canvas for Image Download */}
          <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
        </section>

        {/* Editing Tools Section */}
        <section className={`mb-10 p-6 rounded-xl shadow-lg transition-colors duration-300 bg-gray-800 shadow-slate-700/50`}>
          <h2 className="text-xl font-semibold mb-4">Editing Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { label: 'Brightness', value: brightness, min: 50, max: 150, step: 1, setter: setBrightness },
              { label: 'Contrast', value: contrast, min: 50, max: 150, step: 1, setter: setContrast },
              { label: 'Saturation', value: saturation, min: 0, max: 200, step: 1, setter: setSaturation },
              { label: 'Hue Rotation', value: hueRotation, min: 0, max: 360, step: 1, setter: setHueRotation, hue: true },
              { label: 'Sharpen', value: sharpen, min: 0, max: 100, step: 1, setter: setSharpen },
            ].map((tool) => (
              <div key={tool.label} className="mb-4">
                <label className="block text-md font-medium mb-2">{tool.label}: <span className="font-light">{tool.value}{tool.label === 'Hue Rotation' ? '°' : '%'}</span></label>
                <input
                  type="range"
                  min={tool.min}
                  max={tool.max}
                  step={tool.step}
                  value={tool.value}
                  onChange={(e) => { tool.setter(e.target.value); setAppliedPreset('Custom'); setActiveFilter(''); setActivePreset(''); }}
                  style={{ background: getSliderTrackGradient(tool.value, tool.min, tool.max, tool.hue) }}
                  className={`w-full neon-thumb`}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Filters & Presets Section */}
        <section className={`mb-10 p-6 rounded-xl shadow-lg transition-colors duration-300 bg-gray-800 shadow-slate-700/50`}>
          <h2 className="text-xl font-semibold mb-4">Filters</h2>
          <div className="flex flex-wrap gap-3 mb-6 justify-center"> {/* Centered filters */}
            {filters.map((filter) => (
              <button
                key={filter.name}
                onClick={() => { setActiveFilter(filter.name); setActivePreset(''); setAppliedPreset(filter.name); }}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 button-glassmorphism text-white
                  ${activeFilter === filter.name ? 'active-preset-glow button-active-state' : ''}
                  ${filter.isHighlighted ? 'highlighted-button' : ''}
                `}
              >
                {filter.name}
              </button>
            ))}
          </div>

          <h2 className="text-xl font-semibold mb-4">Presets</h2>
          <div className="flex flex-wrap gap-3 justify-center"> {/* Centered presets */}
            {presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset.name)}
                className={`px-5 py-2 rounded-full font-medium transition-all duration-300 button-glassmorphism text-white
                  ${activePreset === preset.name ? 'active-preset-glow button-active-state' : ''}
                  ${preset.isHighlighted ? 'highlighted-button' : ''}
                `}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </section>

        {/* Mobile Sticky Action Bar */}
        <div className={`fixed bottom-0 left-0 right-0 z-20 md:hidden p-4
          flex justify-around items-center rounded-t-xl
          transition-colors duration-300 bg-slate-800 shadow-xl shadow-slate-700/50`}>
          <button
            onClick={resetAllEffects}
            className="flex-1 mx-1 px-4 py-3 rounded-lg bg-red-600 text-white font-bold transition-all duration-300 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Reset All
          </button>
          <button
            onClick={() => { /* No specific action for 'Apply Preset' on mobile bar, as edits are live */ }}
            className={`flex-1 mx-1 px-4 py-3 rounded-lg font-bold transition-all duration-300 button-glassmorphism bg-purple-600/50 text-white hover:bg-purple-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
          >
            Apply Preset
          </button>
          <button
            onClick={handleDownload}
            className={`flex-1 mx-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 button-glassmorphism text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          </button>
        </div>

        {/* Desktop/Tablet Action Buttons */}
        <section className={`hidden md:flex justify-center gap-4 p-6 rounded-xl shadow-lg transition-colors duration-300 bg-gray-800 shadow-slate-700/50`}>
          <button
            onClick={resetAllEffects}
            className="px-6 py-3 rounded-lg bg-red-600 text-white font-bold transition-all duration-300 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Reset All Effects
          </button>
          <button
            onClick={handleDownload}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 button-glassmorphism text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg> Download Edited Image
          </button>
        </section>
      </main>
    </div>
  );
};

// Root component that renders the app
const VelurePhotoEditorApp = () => {
  return <App />;
};

// Render the app
ReactDOM.render(<VelurePhotoEditorApp />, document.getElementById('root')); 
