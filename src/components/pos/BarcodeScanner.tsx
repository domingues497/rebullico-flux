import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Scan, Camera, X, AlertTriangle, Wifi } from "lucide-react";
import { BarcodeDetector } from "barcode-detector";

interface BarcodeScannerProps {
  onCodeScanned: (code: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function BarcodeScanner({ onCodeScanned, isOpen, onClose }: BarcodeScannerProps) {
  const [manualCode, setManualCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [scanningActive, setScanningActive] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);

  // Check camera support on component mount
  useEffect(() => {
    const checkCameraSupport = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setIsSupported(false);
        setError("Câmera não suportada neste dispositivo ou navegador");
        return;
      }

      // Check if running on HTTPS (required for camera on mobile)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        setIsSupported(false);
        setError("Câmera requer conexão segura (HTTPS) em dispositivos móveis");
        return;
      }

      // Try to enumerate devices to check if camera is available
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideoInput = devices.some(device => device.kind === 'videoinput');
        
        if (hasVideoInput) {
          setIsSupported(true);
          setError(null);
          
          // Initialize barcode detector (polyfill works on all browsers)
          detectorRef.current = new BarcodeDetector({
            formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'qr_code', 'upc_a', 'upc_e']
          });
        } else {
          setIsSupported(false);
          setError("Nenhuma câmera encontrada neste dispositivo");
        }
      } catch (error) {
        console.warn("Error checking camera devices:", error);
        // Fallback: assume camera is available and let getUserMedia handle the error
        setIsSupported(true);
        setError(null);
        
        // Initialize barcode detector anyway
        detectorRef.current = new BarcodeDetector({
          formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'qr_code', 'upc_a', 'upc_e']
        });
      }
    };

    if (isOpen) {
      checkCameraSupport();
    }
  }, [isOpen]);

  // Barcode detection function
  const detectBarcode = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !scanningActive || !detectorRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    try {
      const barcodes = await detectorRef.current.detect(canvas);
      
      if (barcodes.length > 0) {
        const detectedCode = barcodes[0].rawValue;
        console.log('Código detectado:', detectedCode);
        setScanningActive(false);
        stopCamera(); // Para a câmera imediatamente
        onCodeScanned(detectedCode);
        onClose();
        return;
      }
    } catch (error) {
      console.warn('Erro na detecção de código de barras:', error);
    }
  }, [scanningActive, onCodeScanned, onClose]);



  const getErrorMessage = (error: DOMException | Error): string => {
    if (error.name === 'NotAllowedError') {
      return "Permissão de câmera negada. Por favor, permita o acesso à câmera nas configurações do navegador.";
    }
    if (error.name === 'NotFoundError') {
      return "Nenhuma câmera encontrada neste dispositivo.";
    }
    if (error.name === 'NotReadableError') {
      return "Câmera está sendo usada por outro aplicativo. Feche outros apps que possam estar usando a câmera.";
    }
    if (error.name === 'OverconstrainedError') {
      return "Configurações de câmera não suportadas. Tentando com configurações alternativas...";
    }
    if (error.name === 'SecurityError') {
      return "Acesso à câmera bloqueado por questões de segurança. Verifique se está usando HTTPS.";
    }
    return `Erro ao acessar câmera: ${error.message || 'Erro desconhecido'}`;
  };

  const startCamera = useCallback(async () => {
    if (!isSupported) {
      setError("Câmera não disponível neste dispositivo");
      return;
    }
    
    try {
      setError(null);
      setIsScanning(true);
      
      // Check permissions first
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
        if (permissionStatus.state === 'denied') {
          throw new DOMException('Permission denied', 'NotAllowedError');
        }
      } catch (permError) {
        // Permissions API might not be available, continue anyway
        console.warn("Could not check camera permissions:", permError);
      }
      
      // Try with ideal constraints first
      let constraints: MediaStreamConstraints = {
        video: { 
          facingMode: "environment", // Use rear camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      let stream: MediaStream;
      
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstError: unknown) {
        // If ideal constraints fail, try with basic constraints
        console.warn("Ideal constraints failed, trying basic constraints:", firstError);
        constraints = {
          video: { 
            facingMode: "environment"
          }
        };
        
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (secondError: unknown) {
          // If rear camera fails, try any camera
          console.warn("Rear camera failed, trying any camera:", secondError);
          constraints = { video: true };
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        }
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Ensure video plays on mobile
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            // Start barcode scanning once video is playing
            setScanningActive(true);
            console.log("Camera started successfully, scanning active");
          }).catch((playError) => {
            console.error("Error playing video:", playError);
            setError("Erro ao reproduzir vídeo da câmera");
            setIsScanning(false);
          });
        };
      }
    } catch (error: unknown) {
      console.error("Error accessing camera:", error);
      const errorMessage = error instanceof Error || error instanceof DOMException 
        ? getErrorMessage(error) 
        : "Erro desconhecido ao acessar câmera";
      setError(errorMessage);
      setIsScanning(false);
    }
  }, [isSupported]);

  const stopCamera = useCallback(() => {
    setScanningActive(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setError(null);
  }, []);

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      stopCamera(); // Para a câmera ao inserir código manual
      onCodeScanned(manualCode.trim());
      setManualCode("");
      onClose();
    }
  };

  // Effect to start/stop scanning interval
  useEffect(() => {
    if (scanningActive && isScanning) {
      scanIntervalRef.current = setInterval(detectBarcode, 500); // Scan every 500ms
    } else {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    }
    
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    };
  }, [scanningActive, isScanning, detectBarcode]);

  const handleClose = () => {
    stopCamera();
    setManualCode("");
    setError(null);
    onClose();
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Scanner de Código</h3>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* HTTPS Warning for mobile */}
          {location.protocol !== 'https:' && location.hostname !== 'localhost' && (
            <Alert className="mb-4" variant="destructive">
              <Wifi className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Para usar a câmera em dispositivos móveis, é necessário acessar via HTTPS. 
                Tente acessar através de: <strong>https://{location.host}</strong>
              </AlertDescription>
            </Alert>
          )}

          {/* Camera Scanner */}
          <div className="space-y-4">
            {isScanning ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-lg bg-black"
                  style={{ maxHeight: '300px' }}
                />
                <div className="absolute inset-0 border-2 border-primary rounded-lg flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-12 border-2 border-primary bg-primary/10 rounded"></div>
                </div>
                {/* Hidden canvas for barcode detection */}
                <canvas
                  ref={canvasRef}
                  style={{ display: 'none' }}
                />
                <Button
                  variant="destructive"
                  className="absolute bottom-2 left-2"
                  onClick={stopCamera}
                >
                  Parar Câmera
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full h-32 border-dashed"
                onClick={startCamera}
                disabled={!isSupported}
              >
                <div className="text-center">
                  <Camera className="h-8 w-8 mx-auto mb-2" />
                  <span>
                    {!isSupported ? "Câmera não disponível" : "Ativar Câmera"}
                  </span>
                </div>
              </Button>
            )}

            {/* Manual Input */}
            <div className="border-t pt-4">
              <label className="text-sm font-medium mb-2 block">
                Ou digite o código manualmente:
              </label>
              <div className="flex space-x-2">
                <Input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Digite o código de barras"
                  onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
                />
                <Button onClick={handleManualSubmit} disabled={!manualCode.trim()}>
                  <Scan className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Help Text */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Posicione o código de barras dentro da área destacada</p>
              <p>• Certifique-se de que há boa iluminação</p>
              <p>• Se a câmera não funcionar, use a entrada manual</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

