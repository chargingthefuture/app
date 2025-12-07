import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Video, Download, Upload, Loader2, X } from "lucide-react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export default function VideoToGifConverter() {
  const { toast } = useToast();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("video/")) {
      toast({
        title: "Invalid File",
        description: "Please select a video file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a video file smaller than 100MB",
        variant: "destructive",
      });
      return;
    }

    setVideoFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setGifUrl(null); // Clear previous GIF
  };

  const loadFFmpeg = async () => {
    if (ffmpegRef.current) {
      return ffmpegRef.current;
    }

    const ffmpeg = new FFmpeg();
    ffmpegRef.current = ffmpeg;

    // FFmpeg logging removed for production

    ffmpeg.on("progress", ({ progress: p }) => {
      setProgress(p * 100);
    });

    try {
      // Try multiple CDN sources for better reliability
      const cdnSources = [
        "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm",
        "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm",
        "https://esm.sh/@ffmpeg/core@0.12.6/dist/esm",
      ];

      let lastError: Error | null = null;
      
      for (const baseURL of cdnSources) {
        try {
          setStatus(`Loading FFmpeg from ${new URL(baseURL).hostname}...`);
          await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
          });
          return ffmpeg;
        } catch (error: any) {
          console.warn(`Failed to load from ${baseURL}:`, error);
          lastError = error;
          // Reset FFmpeg instance for next attempt
          ffmpegRef.current = new FFmpeg();
          ffmpegRef.current.on("progress", ({ progress: p }) => {
            setProgress(p * 100);
          });
        }
      }

      // If all CDN sources failed, throw the last error
      throw new Error(
        `Failed to load FFmpeg from all CDN sources. This may be due to network issues or CORS restrictions. ` +
        `Last error: ${lastError?.message || "Unknown error"}. ` +
        `Please check your internet connection and try again.`
      );
    } catch (error: any) {
      console.error("Failed to load FFmpeg:", error);
      throw error;
    }
  };

  const convertToGif = async () => {
    if (!videoFile) {
      toast({
        title: "No Video Selected",
        description: "Please select a video file first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setStatus("Loading FFmpeg...");
    setGifUrl(null);

    try {
      // Load FFmpeg
      const ffmpeg = await loadFFmpeg();
      
      setStatus("Reading video file...");
      const videoData = await fetchFile(videoFile);
      
      // Detect file extension from MIME type or filename
      let inputExtension = "mp4";
      if (videoFile.type.includes("webm")) {
        inputExtension = "webm";
      } else if (videoFile.type.includes("mov") || videoFile.name.toLowerCase().endsWith(".mov")) {
        inputExtension = "mov";
      } else if (videoFile.type.includes("avi") || videoFile.name.toLowerCase().endsWith(".avi")) {
        inputExtension = "avi";
      } else if (videoFile.name.toLowerCase().endsWith(".webm")) {
        inputExtension = "webm";
      } else if (videoFile.name.toLowerCase().endsWith(".mp4")) {
        inputExtension = "mp4";
      }
      
      const inputFileName = `input.${inputExtension}`;
      
      // Write video file to FFmpeg virtual file system
      setStatus("Processing video...");
      await ffmpeg.writeFile(inputFileName, videoData);
      
      // Convert to GIF
      // Using palette-based conversion for better quality and smaller file size
      setStatus("Generating color palette...");
      await ffmpeg.exec([
        "-i", inputFileName,
        "-vf", "fps=10,scale=640:-1:flags=lanczos,palettegen",
        "palette.png"
      ]);

      setStatus("Creating GIF...");
      await ffmpeg.exec([
        "-i", inputFileName,
        "-i", "palette.png",
        "-filter_complex", "fps=10,scale=640:-1:flags=lanczos[x];[x][1:v]paletteuse",
        "output.gif"
      ]);

      // Read the output GIF
      setStatus("Finalizing...");
      const gifData = await ffmpeg.readFile("output.gif");
      
      // Create blob URL for download
      // FileData can be Uint8Array or string, handle both cases
      let gifBlob: Blob;
      if (typeof gifData === "string") {
        // If it's a string (base64), convert to blob
        const binaryString = atob(gifData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        gifBlob = new Blob([bytes], { type: "image/gif" });
      } else {
        // If it's Uint8Array, use it directly
        gifBlob = new Blob([gifData], { type: "image/gif" });
      }
      const gifUrl = URL.createObjectURL(gifBlob);
      setGifUrl(gifUrl);

      // Clean up FFmpeg files
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile("palette.png");
      await ffmpeg.deleteFile("output.gif");

      setStatus("Complete!");
      toast({
        title: "Conversion Complete",
        description: "Your GIF is ready to download",
      });
    } catch (error: any) {
      console.error("Conversion error:", error);
      
      // Provide more helpful error messages
      let errorMessage = error.message || "Failed to convert video to GIF";
      
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("unpkg.com")) {
        errorMessage = "Failed to load FFmpeg library. This may be due to network issues, CORS restrictions, or CDN unavailability. Please check your internet connection and try again. If the problem persists, try using a different network or VPN.";
      } else if (errorMessage.includes("format") || errorMessage.includes("codec")) {
        errorMessage = `Video format may not be supported. Error: ${errorMessage}. Try converting your video to MP4 format first.`;
      } else if (errorMessage.includes("memory") || errorMessage.includes("Memory")) {
        errorMessage = "Video file is too large to process in browser memory. Try a smaller video file.";
      }
      
      toast({
        title: "Conversion Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setStatus("Error");
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const handleDownload = () => {
    if (!gifUrl) return;

    const link = document.createElement("a");
    link.href = gifUrl;
    link.download = videoFile 
      ? `${videoFile.name.replace(/\.[^/.]+$/, "")}.gif`
      : "converted.gif";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up blob URL after download
    setTimeout(() => {
      URL.revokeObjectURL(gifUrl);
      setGifUrl(null);
    }, 100);
  };

  const handleClear = () => {
    // Clean up URLs
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    if (gifUrl) {
      URL.revokeObjectURL(gifUrl);
    }
    
    setVideoFile(null);
    setVideoUrl(null);
    setGifUrl(null);
    setProgress(0);
    setStatus("");
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Video to GIF Converter</h1>
        <p className="text-muted-foreground">
          Convert video files to GIF format. All processing happens in your browser - no files are stored on the server.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Video</CardTitle>
          <CardDescription>
            Select a video file from your device (max 100MB). Supports common video formats including MP4, WebM, MOV, AVI, etc.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video-upload">Video File</Label>
            <div className="flex gap-2">
              <Input
                id="video-upload"
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                ref={fileInputRef}
                disabled={isLoading}
                className="flex-1"
                data-testid="input-video-upload"
              />
              {videoFile && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleClear}
                  disabled={isLoading}
                  data-testid="button-clear"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            {videoFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {videoUrl && (
            <div className="space-y-2">
              <Label>Video Preview</Label>
              <video
                src={videoUrl}
                controls
                className="w-full rounded-md border"
                style={{ maxHeight: "400px" }}
                data-testid="video-preview"
              />
            </div>
          )}

          <Button
            onClick={convertToGif}
            disabled={!videoFile || isLoading}
            className="w-full"
            data-testid="button-convert"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <Video className="w-4 h-4 mr-2" />
                Convert to GIF
              </>
            )}
          </Button>

          {isLoading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{status}</span>
                <span className="text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" data-testid="progress-bar" />
            </div>
          )}

          {gifUrl && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Converted GIF</Label>
                <div className="border rounded-md p-4 bg-muted/50">
                  <img
                    src={gifUrl}
                    alt="Converted GIF"
                    className="max-w-full h-auto rounded-md"
                    data-testid="gif-preview"
                  />
                </div>
              </div>
              <Button
                onClick={handleDownload}
                className="w-full"
                data-testid="button-download"
              >
                <Download className="w-4 h-4 mr-2" />
                Download GIF
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                After downloading, the file will be removed from memory. No files are stored on the server.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ul className="list-disc list-inside space-y-1">
            <li>For best results, use videos shorter than 30 seconds</li>
            <li>GIFs are converted at 10 FPS and scaled to 640px width</li>
            <li>Larger videos will take longer to process</li>
            <li>All processing happens in your browser - your files never leave your device</li>
            <li>After downloading, the GIF is automatically removed from memory</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}






