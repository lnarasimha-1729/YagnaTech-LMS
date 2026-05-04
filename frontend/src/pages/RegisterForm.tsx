import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud } from "lucide-react";

const Register = () => {
  const [program, setProgram] = useState("");

  return (
    <div className="min-h-screen bg-muted py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="card-ngo border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-xl md:text-2xl font-bold text-gradient-800">
              Register to Take the YagnaTech Pre-Assessment Test
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Complete the form below to register for the assessment
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-10">
            {/* Basic Details */}
            <div>
              <h3 className="font-semibold text-lg mb-4 text-gradient-700 flex items-center gap-2">
                <span className="text-xl">1.</span> Basic Details
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Input placeholder="Full Name" required />
                <Input placeholder="Email Address" type="email" required />
                <Input placeholder="Mobile Number" />
                <Input placeholder="dd-mm-yyyy" type="date" />
                <Select required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Academic Info */}
            <div>
              <h3 className="font-semibold text-lg mb-4 text-gradient-700 flex items-center gap-2">
                <span className="text-xl">2.</span> Academic Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Current Education Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inter">Intermediate</SelectItem>
                    <SelectItem value="bachelor">Bachelor's</SelectItem>
                    <SelectItem value="master">Master's</SelectItem>
                  </SelectContent>
                </Select>

                <Input placeholder="Branch / Stream" />
                <Input placeholder="College / Institution Name" />
                <Input placeholder="Year of Study / Graduation" />
                <Input placeholder="Enter college code" />
              </div>
            </div>

            {/* Preferred Program */}
            <div>
              <h3 className="font-semibold text-lg mb-4 text-gradient-700 flex items-center gap-2">
                <span className="text-xl">3.</span> Preferred Program & Track
              </h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="program"
                    value="starter"
                    checked={program === "starter"}
                    onChange={() => setProgram("starter")}
                  />
                  <span>AI Frontier Program (6 months virtual)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="program"
                    value="advance"
                    checked={program === "advance"}
                    onChange={() => setProgram("advance")}
                  />
                  <span>AI Frontier Plus Program (4 months virtual + 2 months on-premises)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="program"
                    value="elite"
                    checked={program === "elite"}
                    onChange={() => setProgram("elite")}
                  />
                  <span>Elite AI Residency (6 months premises)</span>
                </label>
              </div>
            </div>

            {/* Document Upload */}
            <div>
              <h3 className="font-semibold text-lg mb-4 text-gradient-700 flex items-center gap-2">
                <span className="text-xl">4.</span> Documents (Optional Upload)
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border border-dashed p-4 rounded-md text-center space-y-2">
                  <UploadCloud className="mx-auto w-6 h-6 text-muted-foreground" />
                  <Label className="block font-medium">Upload Resume</Label>
                  <Input type="file" />
                </div>
                <div className="border border-dashed p-4 rounded-md text-center space-y-2">
                  <UploadCloud className="mx-auto w-6 h-6 text-muted-foreground" />
                  <Label className="block font-medium">Upload College ID Proof</Label>
                  <Input type="file" />
                </div>
              </div>
            </div>

            {/* Consent & Submit */}
            <div className="space-y-4">
              <label className="flex items-start space-x-2">
                <Checkbox id="consent" required />
                <span className="text-sm">
                  I confirm that all details provided above are accurate.
                </span>
              </label>
              <Button className="w-full bg-gradient-hero">Submit</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
