<script>
    console.log("Pixel Rearranger script starting...");

    const CANVAS_SIZE = 500; 
    const TOTAL_PIXELS = CANVAS_SIZE * CANVAS_SIZE;

    const imagesLoaded = {
        source: false,
        map: false
    };

    const sourceImageUpload = document.getElementById('sourceImageUpload');
    const mapImageUpload = document.getElementById('mapImageUpload');
    
    const sourceCanvas = document.getElementById('sourceCanvas');
    const mapCanvas = document.getElementById('mapCanvas');
    const resultCanvas = document.getElementById('resultCanvas');

    sourceCanvas.width = sourceCanvas.height = CANVAS_SIZE;
    mapCanvas.width = mapCanvas.height = CANVAS_SIZE;
    resultCanvas.width = resultCanvas.height = CANVAS_SIZE;
    
    const ctxSource = sourceCanvas.getContext('2d');
    const ctxMap = mapCanvas.getContext('2d');
    const ctxResult = resultCanvas.getContext('2d');

    ctxSource.fillStyle = '#333';
    ctxMap.fillStyle = '#333';
    ctxResult.fillStyle = '#333';
    ctxSource.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctxMap.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctxResult.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    sourceImageUpload.addEventListener('change', (e) => handleImageUpload(e, 'source'));
    mapImageUpload.addEventListener('change', (e) => handleImageUpload(e, 'map'));

    function handleImageUpload(event, type) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                drawLoadedImage(img, type);
                imagesLoaded[type] = true;
                console.log(`SUCCESS: ${type} image loaded.`);
                
                if (imagesLoaded.source && imagesLoaded.map) {
                    setTimeout(rearrangePixels, 50); 
                }
            };
            img.onerror = (error) => {
                console.error(`ERROR: Failed to load ${type} image.`, error);
                imagesLoaded[type] = false;
            };
            img.src = e.target.result;
        };
        reader.onerror = (error) => console.error("ERROR: Failed to read file.", error);
        reader.readAsDataURL(file);
    }

    function drawLoadedImage(img, type) {
        const ctx = (type === 'source') ? ctxSource : ctxMap;
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }

    function rearrangePixels() {
        try {
            const sourceData = ctxSource.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
            const mapData = ctxMap.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
            
            const sourcePixels = sourceData.data;
            const mapPixels = mapData.data;

            const resultData = ctxResult.createImageData(CANVAS_SIZE, CANVAS_SIZE);
            const resultPixels = resultData.data;

            const structureMap = [];
            const colorMap = [];

            for (let i = 0; i < sourcePixels.length; i += 4) {
                const rA = sourcePixels[i];
                const gA = sourcePixels[i + 1];
                const bA = sourcePixels[i + 2];
                const brightnessA = (0.2126 * rA + 0.7152 * gA + 0.0722 * bA);

                structureMap.push({ 
                    brightness: brightnessA, 
                    originalIndex: i 
                });

                const rB = mapPixels[i];
                const gB = mapPixels[i + 1];
                const bB = mapPixels[i + 2];
                const brightnessB = (0.2126 * rB + 0.7152 * gB + 0.0722 * bB);

                colorMap.push({
                    brightness: brightnessB,
                    colorIndex: i, 
                    r: rB, 
                    g: gB, 
                    b: bB,
                    a: mapPixels[i + 3]
                });
            }
            
            structureMap.sort((a, b) => a.brightness - b.brightness);
            colorMap.sort((a, b) => a.brightness - b.brightness);

            const WINDOW_SIZE = 10;

            for (let rank = 0; rank < TOTAL_PIXELS; rank++) {
                const struct = structureMap[rank];
                const resultIndex = struct.originalIndex; 
                
                const targetR = sourcePixels[resultIndex];
                const targetG = sourcePixels[resultIndex + 1];
                const targetB = sourcePixels[resultIndex + 2];
                
                let bestMatchIndex = rank;
                let minDistance = Infinity;

                const start = Math.max(0, rank - WINDOW_SIZE);
                const end = Math.min(TOTAL_PIXELS, rank + WINDOW_SIZE);
                
                for (let searchRank = start; searchRank < end; searchRank++) {
                    const colorCandidate = colorMap[searchRank];
                    const dr = targetR - colorCandidate.r;
                    const dg = targetG - colorCandidate.g;
                    const db = targetB - colorCandidate.b;
                    const distance = dr * dr + dg * dg + db * db;

                    if (distance < minDistance) {
                        minDistance = distance;
                        bestMatchIndex = searchRank;
                    }
                }

                const bestColor = colorMap[bestMatchIndex];
                const colorSourceIndex = bestColor.colorIndex;

                resultPixels[resultIndex] = mapPixels[colorSourceIndex];
                resultPixels[resultIndex + 1] = mapPixels[colorSourceIndex + 1];
                resultPixels[resultIndex + 2] = mapPixels[colorSourceIndex + 2];
                resultPixels[resultIndex + 3] = mapPixels[colorSourceIndex + 3];
            }
            
            ctxResult.putImageData(resultData, 0, 0);
            console.log("SUCCESS: Pixels rearranged using Color Similarity Transfer.");

        } catch (error) {
            console.error("A critical error occurred during pixel rearrangement:", error);
            alert("Processing Error: Check the console (F12) for detailed JavaScript errors. It might be a security or timing issue.");
        }
    }
</script>
