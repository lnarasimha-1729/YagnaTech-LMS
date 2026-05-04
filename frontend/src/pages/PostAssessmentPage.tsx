import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Clock, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAssessment } from "@/api/assessmentApi";

const PostAssessmentPage = () => {
  
  const navigate = useNavigate()

  const startAssessment = async () => {
  try {
    const assessmentId = "A2"; // Post Assessment ID
  
    const res = await getAssessment(assessmentId);
  
    navigate(`/postassessment/${assessmentId}`, {
      state: { assessment: res.data }
    });
  
  } catch (error) {
    console.error(error);
    alert("Failed to start assessment");
  }
};



  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-subtle p-6">
      <div className="max-w-3xl w-full">
        {/* Welcome Section */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            Welcome to YagnaTech!
          </h1>
          <p className="mt-2 text-gray-600">
            Let's get started by evaluating your current knowledge before the program begins.
          </p>
        </div>

        {/* Assessment Info Card */}
        <Card className="rounded-2xl shadow-lg border border-gray-200">
          <CardHeader className="text-center">
            <CardTitle className="text-[#177385] text-2xl font-semibold">
              Pre-Assessment Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Instructions */}
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center">
                <ClipboardList className="h-8 w-8 text-[#177385] mb-2" />
                <p className="text-gray-700 font-medium">20 Questions</p>
                <p className="text-sm text-gray-500">MCQs & Scenario-based</p>
              </div>
              <div className="flex flex-col items-center">
                <Clock className="h-8 w-8 text-[#177385] mb-2" />
                <p className="text-gray-700 font-medium">30 Minutes</p>
                <p className="text-sm text-gray-500">Complete in one sitting</p>
              </div>
              <div className="flex flex-col items-center">
                <Award className="h-8 w-8 text-[#177385] mb-2" />
                <p className="text-gray-700 font-medium">Program Ready</p>
                <p className="text-sm text-gray-500">Unlock after results</p>
              </div>
            </div>

            {/* Guidelines */}
            <ul className="list-disc list-inside text-gray-600 text-sm space-y-2">
              <li>Make sure you have a stable internet connection.</li>
              <li>Do not refresh or close the window during the test.</li>
              <li>Click "Submit" after answering all questions.</li>
            </ul>

            {/* Start Button */}
            <div className="flex justify-center pt-4">
              <Button onClick={startAssessment} 
  className="px-8 py-3 text-lg rounded-xl bg-[#177385] text-white hover:bg-[#135f6e] transition-all shadow-md">
  Start Assessment
</Button>

            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default PostAssessmentPage;
