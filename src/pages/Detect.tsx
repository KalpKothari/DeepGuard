import { useState, useCallback } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useAuth } from '@/contexts/AuthContext';
import { analyzeMedia, saveScan, ScanResult } from '@/lib/detection';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileImage, FileVideo, FileAudio, X, Shield, AlertTriangle, CheckCircle, Loader2, Lock, FolderDown, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import AppLayout from '@/components/AppLayout';
import { PremiumAnalytics } from '@/components/PremiumAnalytics';
import { useNavigate } from 'react-router-dom';

const MAX_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ['image/', 'video/', 'audio/'];

const Detect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showMobileSamples, setShowMobileSamples] = useState(false);
  const [downloadingSample, setDownloadingSample] = useState<string | null>(null);
  const isPremium = user?.subscription === 'premium';
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const sampleFiles = [
    'Best-of-Shahrukh-Khan-.jpg',
    'Kanyes iconic speech (Messi Version).mp4',
    'man.jpg',
    'Mission Impossible Tom Cruise.jpg',
    'Morgan Freeman.mp4',
    'morph-alia.png',
    'Ranveer Singh.jfif',
    'Rashmika Mandanna.jpg',
    'Rashmika.png',
    'Study hard, work hard, play harder.Srk Speech.mp4'
  ];

  const handleFile = useCallback((f: File) => {
    // Check for video restriction on free plan
    if (f.type.startsWith('video/') && !isPremium) {
      toast.error('Video detection is a Premium feature', {
        description: 'Upgrade to Premium to analyze videos',
      });
      return;
    }

    if (!ALLOWED_TYPES.some(t => f.type.startsWith(t))) {
      toast.error('Please upload an image, video, or audio file');
      return;
    }
    if (f.size > MAX_SIZE) {
      toast.error('File must be under 50MB');
      return;
    }
    setFile(f);
    setResult(null);
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }, [isPremium]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const analyze = async () => {
    if (!file || !user) return;
    setAnalyzing(true);
    setProgress(5);

    const interval = setInterval(() => {
      setProgress(p => {
        if (p < 30) return p + 2;
        if (p < 70) return p + 1;
        if (p < 90) return p + 0.5;
        return p;
      });
    }, 200);

    try {
      const res = await analyzeMedia(file);

      res.userId = user.id;
      saveScan(res);

      clearInterval(interval);
      setProgress(100);

      setTimeout(() => {
        setResult(res);
        if (res.result === 'fake') {
          toast.warning('High probability of manipulation detected!', {
            description: "Biometric inconsistencies found in facial regions."
          });
        } else {
          toast.success('Media consistency verified!', {
            description: "Skin texture and landmarks match authentic patterns."
          });
        }
      }, 500);

    } catch (error) {
      clearInterval(interval);
      console.error("Analysis Error:", error);
      toast.error('Forensic analysis failed.', {
        description: "Could not initialize neural engine. Please refresh."
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview); 
    setFile(null);
    setPreview(null);
    setResult(null);
    setProgress(0);
  };

  const getSampleFileType = (filename: string) => {
    const isVideoFile = /\.(mp4|mov|avi|webm|mkv)$/i.test(filename);
    return isVideoFile ? 'Video' : 'Image';
  };

  const handleMobileSampleDownload = async (filename: string) => {
    try {
      setDownloadingSample(filename);
      const fileUrl = `/data/${encodeURIComponent(filename)}`;

      // Primary path: fetch then save as file for best browser compatibility.
      const response = await fetch(fileUrl, {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }

      const blob = await response.blob();
      if (!blob.size) {
        throw new Error('Empty file received');
      }

      saveAs(blob, filename);

      toast.success('Download started', {
        id: 'sample-download-single',
        description: filename,
      });
    } catch (error) {
      console.error('Single file download error:', error);

      // Fallback path: open direct URL from user interaction context.
      try {
        const fallbackUrl = `/data/${encodeURIComponent(filename)}`;
        const popup = window.open(fallbackUrl, '_blank', 'noopener,noreferrer');

        if (!popup) {
          const link = document.createElement('a');
          link.href = fallbackUrl;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        toast.success('Opened file for download', {
          id: 'sample-download-single',
          description: filename,
        });
      } catch (fallbackError) {
        console.error('Fallback single file download error:', fallbackError);
        toast.error('Could not start download. Please try again.', { id: 'sample-download-single' });
      }
    } finally {
      setTimeout(() => setDownloadingSample(null), 700);
    }
  };

  const handleDownloadSamples = async () => {
    if (isMobile) {
      setShowMobileSamples(true);
      return;
    }

    toast.loading("Preparing secure ZIP file...", { id: 'sample-download' });

    try {
      // Desktop Experience: Bundle all files into a ZIP
      const zip = new JSZip();
      const folder = zip.folder("DeepGuard_Sample_Media");
      
      let successfulFetches = 0;

      for (const filename of sampleFiles) {
        try {
          const response = await fetch(`/data/${encodeURIComponent(filename)}`);
          if (response.ok) {
            const blob = await response.blob();
            folder?.file(filename, blob);
            successfulFetches++;
          }
        } catch (e) {
          console.error(`Could not bundle file: ${filename}`, e);
      }
      }

      if (successfulFetches === 0) {
        toast.error("Could not locate sample files. Ensure they are in the /data/ folder.", { id: 'sample-download' });
        return;
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `DeepGuard_Sample_Media.zip`);
      toast.success(`Sample ZIP downloaded (${successfulFetches} files included)!`, { id: 'sample-download' });
    } catch (error) {
      console.error("Download error:", error);
      toast.error("An error occurred during download.", { id: 'sample-download' });
    }
  };

  const getFileIcon = () => {
    if (!file) return Upload;
    if (file.type.startsWith('video')) return FileVideo;
    if (file.type.startsWith('audio')) return FileAudio;
    return FileImage;
  };
  const FileIcon = getFileIcon();

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Detect Deepfake</h1>
          <p className="text-muted-foreground mt-1">Upload media to analyze for manipulation</p>
        </div>

        {/* Upload zone */}
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                className={`glass rounded-2xl p-8 border-2 border-dashed transition-all cursor-pointer text-center ${dragOver ? 'border-primary bg-primary/5' : 'border-border'}`}
                onClick={() => !file && !analyzing && document.getElementById('file-input')?.click()}
              >
                <input id="file-input" type="file" accept="image/*,video/*,audio/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

                {file ? (
                  <div className="space-y-4">
                    {preview && (
                      <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-xl object-cover" />
                    )}
                    <div className="flex items-center justify-center gap-3">
                      <FileIcon className="w-5 h-5 text-primary" />
                      <span className="font-medium text-foreground">{file.name}</span>
                      {!analyzing && (
                        <button onClick={(e) => { e.stopPropagation(); reset(); }} className="text-muted-foreground hover:text-destructive">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <p className="font-heading font-bold text-foreground">Drop your file here</p>
                    <p className="text-sm text-muted-foreground">
                      {isPremium ? 'Images or videos • up to 50MB' : 'Images only • up to 50MB'}
                    </p>
                    {!isPremium && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
                        <Lock className="w-3 h-3" />
                        Video detection is Premium
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Progress */}
              {analyzing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    <span className="text-sm text-muted-foreground font-medium">
                      {progress < 40 ? 'Loading Neural Models...' : 'Scanning Facial Landmarks...'}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2 rounded-full" />
                </motion.div>
              )}

              {file && !analyzing && (
                <Button onClick={analyze} className="w-full mt-4 rounded-xl gradient-primary text-primary-foreground font-semibold h-11">
                  <Shield className="w-4 h-4 mr-2" /> Analyze Media
                </Button>
              )}

              {/* Sample Media Banner */}
              {!analyzing && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass rounded-2xl p-6 sm:p-8 border border-border/50 bg-gradient-to-r from-primary/10 via-background to-success/5 flex flex-col md:flex-row items-center justify-between gap-6"
                >
                  <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                      <FolderDown className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-bold text-foreground mb-1">Don't have media to test?</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Download our curated sample kit containing both verified authentic and AI-generated deepfake media to test the engine.
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleDownloadSamples} 
                    variant="outline"
                    className="w-full md:w-auto rounded-xl border-primary/30 hover:bg-primary/10 text-primary font-semibold h-11 shrink-0 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" /> Download Samples
                  </Button>
                </motion.div>
              )}

              {/* Mobile sample picker */}
              <AnimatePresence>
                {showMobileSamples && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/50"
                    onClick={() => setShowMobileSamples(false)}
                  >
                    <motion.div
                      initial={{ y: 40, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 40, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                      className="absolute bottom-0 left-0 right-0 rounded-t-3xl border border-border/70 bg-background p-5 max-h-[75vh] overflow-y-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-heading text-lg font-bold text-foreground">Sample Media Files</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setShowMobileSamples(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <p className="text-sm text-muted-foreground mb-4">Tap a file to download individually.</p>

                      <div className="space-y-2">
                        {sampleFiles.map((filename) => {
                          const fileType = getSampleFileType(filename);
                          const ItemIcon = fileType === 'Video' ? FileVideo : FileImage;
                          const isDownloading = downloadingSample === filename;

                          return (
                            <div
                              key={filename}
                              className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/40 px-3 py-2"
                            >
                              <div className="min-w-0 flex items-center gap-2">
                                <ItemIcon className="h-4 w-4 shrink-0 text-primary" />
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-foreground">{filename}</p>
                                  <p className="text-xs text-muted-foreground">{fileType}</p>
                                </div>
                              </div>

                              <Button
                                size="sm"
                                variant="outline"
                                className="shrink-0"
                                disabled={isDownloading}
                                onClick={() => handleMobileSampleDownload(filename)}
                              >
                                {isDownloading ? (
                                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Download className="mr-1 h-3.5 w-3.5" />
                                )}
                                {isDownloading ? 'Starting...' : 'Download'}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              {/* Result card */}
              <div className={`glass rounded-2xl p-8 text-center border-2 ${result.result === 'fake' ? 'border-destructive/30' : 'border-success/30'}`}>
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${result.result === 'fake' ? 'bg-destructive/10' : 'bg-success/10'}`}>
                  {result.result === 'fake' ? (
                    <AlertTriangle className="w-10 h-10 text-destructive" />
                  ) : (
                    <CheckCircle className="w-10 h-10 text-success" />
                  )}
                </div>
                <h2 className="font-heading text-2xl font-bold text-foreground">
                  {result.result === 'fake' ? 'Deepfake Detected' : 'Media is Authentic'}
                </h2>
                <p className={`text-4xl font-bold mt-2 ${result.result === 'fake' ? 'text-destructive' : 'text-success'}`}>
                  {result.confidence}%
                </p>
                <p className="text-sm text-muted-foreground mt-1">confidence score</p>
              </div>

              {/* Explanation */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-heading font-bold text-foreground mb-2">Technical Analysis</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{result.explanation}</p>
              </div>

              {/* Premium Analytics */}
              {isPremium && (
                <div>
                 <PremiumAnalytics result={result} preview={preview} />
                </div>
              )}

              {/* Upgrade CTA for free users */}
              {!isPremium && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-2xl p-6 border-2 border-primary/30 bg-primary/5"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Lock className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground mb-2">Unlock Advanced Analytics</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Upgrade to Premium to see confidence graphs, feature analysis, heatmaps, and more detailed insights about deepfake detection.
                      </p>
                      <Button
                        onClick={() => navigate('/profile')}
                        className="rounded-lg gradient-primary text-primary-foreground text-sm font-bold"
                      >
                        Upgrade to Premium
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              <Button onClick={reset} variant="outline" className="w-full rounded-xl h-11">
                Scan Another File
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AppLayout>
  );
};

export default Detect;