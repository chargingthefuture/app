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

    ffmpeg.on("log", ({ message }) => {
      console.log("[FFmpeg]", message);
    });

    ffmpeg.on("progress", ({ progress: p }) => {
      setProgress(p * 100);
    });

    try {
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });
      return ffmpeg;
    } catch (error) {
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
      
      // Write video file to FFmpeg virtual file system
      setStatus("Processing video...");
      await ffmpeg.writeFile("input.mp4", videoData);
      
      // Convert to GIF
      // Using palette-based conversion for better quality and smaller file size
      setStatus("Generating color palette...");
      await ffmpeg.exec([
        "-i", "input.mp4",
        "-vf", "fps=10,scale=640:-1:flags=lanczos,palettegen",
        "palette.png"
      ]);

      setStatus("Creating GIF...");
      await ffmpeg.exec([
        "-i", "input.mp4",
        "-i", "palette.png",
        "-filter_complex", "fps=10,scale=640:-1:flags=lanczos[x];[x][1:v]paletteuse",
        "output.gif"
      ]);

      // Read the output GIF
      setStatus("Finalizing...");
      const gifData = await ffmpeg.readFile("output.gif");
      
      // Create blob URL for download
      const gifBlob = new Blob([gifData], { type: "image/gif" });
      const gifUrl = URL.createObjectURL(gifBlob);
      setGifUrl(gifUrl);

      // Clean up FFmpeg files
      await ffmpeg.deleteFile("input.mp4");
      await ffmpeg.deleteFile("palette.png");
      await ffmpeg.deleteFile("output.gif");

      setStatus("Complete!");
      toast({
        title: "Conversion Complete",
        description: "Your GIF is ready to download",
      });
    } catch (error: any) {
      console.error("Conversion error:", error);
      toast({
        title: "Conversion Failed",
        description: error.message || "Failed to convert video to GIF",
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
            Select a video file from your device (max 100MB). Supports common video formats like MP4, MOV, etc.
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

