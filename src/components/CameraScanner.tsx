import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, X, Upload, Scan } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CameraScannerProps {
  onClose: () => void;
  mode: 'photo' | 'scan';
  user?: any;
}

const CameraScanner = ({ onClose, mode, user }: CameraScannerProps) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Access Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageDataUrl);
    stopCamera();
  };

  const uploadPhoto = async () => {
    if (!capturedImage || !user) {
      toast({
        title: "Upload Failed",
        description: "Please capture a photo and ensure you're logged in.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Convert data URL to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      // Generate unique filename
      const fileName = `photo-${user.id}-${Date.now()}.jpg`;
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(fileName);

      // Save to photo wall
      const { error: insertError } = await supabase
        .from('photo_wall')
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          caption: 'Captured via Victory Camera'
        });

      if (insertError) throw insertError;

      toast({
        title: "Photo Uploaded!",
        description: "Your photo has been submitted for approval."
      });

      onClose();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload photo",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            {mode === 'photo' ? (
              <>
                <Camera className="h-5 w-5" />
                Victory Camera
              </>
            ) : (
              <>
                <Scan className="h-5 w-5" />
                QR Scanner
              </>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!isStreaming && !capturedImage && (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                {mode === 'photo' 
                  ? "Capture photos to share your Victory moments"
                  : "Scan QR codes for special offers and menu access"}
              </p>
              <Button onClick={startCamera} className="luxury-button">
                <Camera className="h-4 w-4 mr-2" />
                Start Camera
              </Button>
            </div>
          )}

          {isStreaming && (
            <div className="space-y-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {mode === 'scan' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-primary rounded-lg opacity-50">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button onClick={capturePhoto} className="luxury-button flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  {mode === 'photo' ? 'Capture' : 'Scan'}
                </Button>
                <Button variant="outline" onClick={stopCamera}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {capturedImage && (
            <div className="space-y-4">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <img 
                  src={capturedImage} 
                  alt="Captured" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              {mode === 'photo' && user && (
                <div className="flex gap-2">
                  <Button 
                    onClick={uploadPhoto} 
                    disabled={isLoading}
                    className="luxury-button flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isLoading ? 'Uploading...' : 'Upload to Victory Wall'}
                  </Button>
                  <Button variant="outline" onClick={retakePhoto}>
                    Retake
                  </Button>
                </div>
              )}

              {mode === 'photo' && !user && (
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Please log in to upload photos
                  </p>
                  <Button variant="outline" onClick={retakePhoto}>
                    Retake Photo
                  </Button>
                </div>
              )}
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </CardContent>
      </Card>
    </div>
  );
};

export default CameraScanner;