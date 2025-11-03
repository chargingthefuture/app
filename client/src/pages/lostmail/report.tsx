import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertLostmailIncidentSchema } from "@shared/schema";
import { z } from "zod";
import { useLocation } from "wouter";
import { Save, Send, Upload, X, Image as ImageIcon } from "lucide-react";
import type { LostmailIncident } from "@shared/schema";

const reportFormSchema = insertLostmailIncidentSchema.omit({
  status: true,
  assignedTo: true,
});

type ReportFormData = z.infer<typeof reportFormSchema>;

const DRAFT_STORAGE_KEY = "lostmail_report_draft";

export default function LostMailReport() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      reporterName: "",
      reporterEmail: "",
      reporterPhone: "",
      incidentType: "lost",
      carrier: "",
      trackingNumber: "",
      expectedDeliveryDate: "",
      noticedDate: "",
      description: "",
      photos: null,
      severity: "medium",
      consent: false,
    },
  });

  // Load draft from localStorage on mount
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (draft) {
      try {
        const draftData = JSON.parse(draft);
        form.reset(draftData);
        
        // Restore uploaded photos
        if (draftData.photoUrls) {
          setUploadedPhotos(draftData.photoUrls);
        }
      } catch (e) {
        console.error("Error loading draft:", e);
      }
    }
  }, [form]);

  // Save draft to localStorage on change
  const saveDraft = () => {
    const formData = form.getValues();
    const draftData = {
      ...formData,
      photoUrls: uploadedPhotos,
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
    toast({
      title: "Draft Saved",
      description: "Your report has been saved locally",
    });
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Images must be smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        
        try {
          const response = await apiRequest("POST", "/api/lostmail/upload", {
            image: base64Image,
            filename: file.name,
          });
          
          setUploadedPhotos([...uploadedPhotos, response.fileUrl]);
          toast({
            title: "Photo Uploaded",
            description: "Photo uploaded successfully",
          });
        } catch (error: any) {
          toast({
            title: "Upload Failed",
            description: error.message || "Failed to upload photo",
            variant: "destructive",
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process image",
        variant: "destructive",
      });
    }
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos(uploadedPhotos.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ReportFormData) => {
    setIsSubmitting(true);
    
    try {
      // Prepare photos array
      const photosArray = uploadedPhotos.length > 0 ? uploadedPhotos : null;
      
      const incident = await apiRequest<LostmailIncident>("POST", "/api/lostmail/incidents", {
        ...data,
        photos: photosArray ? JSON.stringify(photosArray) : null,
        expectedDeliveryDate: new Date(data.expectedDeliveryDate as string).toISOString(),
        noticedDate: data.noticedDate ? new Date(data.noticedDate as string).toISOString() : null,
      });

      // Clear draft
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      
      toast({
        title: "Report Submitted",
        description: `Your incident report has been submitted. Incident ID: ${incident.id}`,
      });
      
      // Redirect to confirmation page
      setLocation(`/apps/lostmail/incident/${incident.id}`);
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit report",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Report Mail Incident</h1>
        <p className="text-muted-foreground">
          Report lost, damaged, tampered, or delayed mail
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Incident Details</CardTitle>
          <CardDescription>
            Fill out the form below. You can save a draft and return later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Reporter Information */}
              <div className="space-y-4">
                <h3 className="font-medium">Reporter Information</h3>
                
                <FormField
                  control={form.control}
                  name="reporterName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="John Doe" data-testid="input-reporter-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="reporterEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} placeholder="your@email.com" data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reporterPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="(555) 123-4567" data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Incident Details */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">Incident Information</h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="incidentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Incident Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-incident-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="lost">Lost</SelectItem>
                            <SelectItem value="damaged">Damaged</SelectItem>
                            <SelectItem value="tampered">Tampered</SelectItem>
                            <SelectItem value="delayed">Delayed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="severity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Severity *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-severity">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="trackingNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tracking Number *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="1234567890" data-testid="input-tracking" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="carrier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mail Carrier</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="USPS, FedEx, UPS, etc." data-testid="input-carrier" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="expectedDeliveryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Delivery Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-expected-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="noticedDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date Noticed</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-noticed-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe the incident in detail..."
                          rows={6}
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Photos */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">Photos (Optional)</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Photo
                        </span>
                      </Button>
                    </label>
                    <Input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                      data-testid="input-photo-upload"
                    />
                  </div>
                  
                  {uploadedPhotos.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {uploadedPhotos.map((photoUrl, index) => (
                        <div key={index} className="relative">
                          <img
                            src={photoUrl}
                            alt={`Uploaded photo ${index + 1}`}
                            className="w-full h-32 object-cover rounded border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => removePhoto(index)}
                            data-testid={`button-remove-photo-${index}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Consent */}
              <FormField
                control={form.control}
                name="consent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-consent"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>I consent to storing this information *</FormLabel>
                      <FormDescription>
                        Required to process your report
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={saveDraft}
                  data-testid="button-save-draft"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !form.watch("consent")}
                  className="flex-1"
                  data-testid="button-submit"
                >
                  {isSubmitting ? "Submitting..." : "Submit Report"}
                  <Send className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
