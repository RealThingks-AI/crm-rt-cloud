import { useState, useEffect } from "react";
import { supabase } from "@/supabase/client";
import { useAuth } from "@/supabase/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/common/ui/dialog";
import { Button } from "@/components/common/ui/button";
import { Input } from "@/components/common/ui/input";
import { Label } from "@/components/common/ui/label";
import { Textarea } from "@/components/common/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common/ui/select";
import { toast } from "@/hooks/use-toast";

interface Lead {
  id: string;
  lead_name: string;
  company_name: string;
  position: string;
  email: string;
  phone_no: string;
  mobile_no: string;
  linkedin: string;
  industry: string;
  city: string;
  country: string;
  website: string;
  lead_status: string;
  contact_source: string;
  description: string;
  contact_owner: string;
  created_by: string;
  modified_by: string;
  created_time: string;
  modified_time: string;
}

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead | null;
  onSuccess: () => void;
}

const leadStatuses = [
  "New",
  "Contacted",
  "Qualified", 
  "Hot",
  "Warm",
  "Cold",
  "Converted",
  "Lost"
];

const contactSources = [
  "Website",
  "Social Media",
  "Email Campaign",
  "Phone Call",
  "Referral",
  "Advertisement",
  "Trade Show",
  "Cold Call",
  "Other"
];

export const LeadModal = ({ isOpen, onClose, lead, onSuccess }: LeadModalProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    lead_name: "",
    company_name: "",
    position: "",
    email: "",
    phone_no: "",
    mobile_no: "",
    linkedin: "",
    industry: "",
    city: "",
    country: "",
    website: "",
    lead_status: "New",
    contact_source: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (lead) {
      setFormData({
        lead_name: lead.lead_name || "",
        company_name: lead.company_name || "",
        position: lead.position || "",
        email: lead.email || "",
        phone_no: lead.phone_no || "",
        mobile_no: lead.mobile_no || "",
        linkedin: lead.linkedin || "",
        industry: lead.industry || "",
        city: lead.city || "",
        country: lead.country || "",
        website: lead.website || "",
        lead_status: lead.lead_status || "New",
        contact_source: lead.contact_source || "",
        description: lead.description || "",
      });
    } else {
      setFormData({
        lead_name: "",
        company_name: "",
        position: "",
        email: "",
        phone_no: "",
        mobile_no: "",
        linkedin: "",
        industry: "",
        city: "",
        country: "",
        website: "",
        lead_status: "New",
        contact_source: "",
        description: "",
      });
    }
    setErrors({});
  }, [lead, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.lead_name.trim()) {
      newErrors.lead_name = "Lead name is required";
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!user) return;

    setLoading(true);

    try {
      const leadData = {
        ...formData,
        ...(lead ? { 
          modified_by: user.id,
          modified_time: new Date().toISOString()
        } : { 
          created_by: user.id,
          contact_owner: user.id,
          created_time: new Date().toISOString(),
          modified_time: new Date().toISOString()
        }),
      };

      if (lead) {
        const { error } = await supabase
          .from("leads")
          .update(leadData)
          .eq("id", lead.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Lead updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("leads")
          .insert([leadData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Lead created successfully",
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving lead:", error);
      toast({
        title: "Error",
        description: "Failed to save lead",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {lead ? "Edit Lead" : "Add New Lead"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lead_name">Lead Name *</Label>
              <Input
                id="lead_name"
                value={formData.lead_name}
                onChange={(e) => setFormData(prev => ({ ...prev, lead_name: e.target.value }))}
                placeholder="Enter lead name"
                className={errors.lead_name ? "border-destructive" : ""}
              />
              {errors.lead_name && (
                <p className="text-sm text-destructive">{errors.lead_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="Enter company name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                placeholder="Enter position/title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                placeholder="Enter industry"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_no">Phone</Label>
              <Input
                id="phone_no"
                value={formData.phone_no}
                onChange={(e) => setFormData(prev => ({ ...prev, phone_no: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile_no">Mobile</Label>
              <Input
                id="mobile_no"
                value={formData.mobile_no}
                onChange={(e) => setFormData(prev => ({ ...prev, mobile_no: e.target.value }))}
                placeholder="Enter mobile number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="Enter website URL"
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Enter city"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                placeholder="Enter country"
              />
            </div>
          </div>

          {/* Status and Source */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lead Status</Label>
              <Select value={formData.lead_status} onValueChange={(value) => setFormData(prev => ({ ...prev, lead_status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {leadStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Contact Source</Label>
              <Select value={formData.contact_source} onValueChange={(value) => setFormData(prev => ({ ...prev, contact_source: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {contactSources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* LinkedIn */}
          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn Profile</Label>
            <Input
              id="linkedin"
              value={formData.linkedin}
              onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
              placeholder="Enter LinkedIn profile URL"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter additional notes or description"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : lead ? "Save Changes" : "Add Lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};