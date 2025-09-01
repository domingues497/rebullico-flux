import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Scan, Camera, X } from "lucide-react";

interface BarcodeScannerProps {
  onCodeScanned: (code: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function BarcodeScanner({ onCodeScanned, isOpen, onClose }: BarcodeScannerProps) {
  const [manualCode, setManualCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setIsScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment", // Use rear camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setIsScanning(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onCodeScanned(manualCode.trim());
      setManualCode("");
      onClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    setManualCode("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Scanner de Código</h3>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Camera Scanner */}
          <div className="space-y-4">
            {isScanning ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg"
                />
                <div className="absolute inset-0 border-2 border-primary rounded-lg flex items-center justify-center">
                  <div className="w-48 h-12 border-2 border-primary bg-primary/10 rounded"></div>
                </div>
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
              >
                <div className="text-center">
                  <Camera className="h-8 w-8 mx-auto mb-2" />
                  <span>Ativar Câmera</span>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}