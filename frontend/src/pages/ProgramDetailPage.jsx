import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, StepBackIcon, StepForward } from "lucide-react";

const chapters = [
  { id: 1, title: "Introduction to AI", video: "https://www.youtube.com/embed/aircAruvnKk", content: "Overview of AI concepts." },
  { id: 2, title: "Machine Learning Basics", video: "https://www.youtube.com/embed/GwIo3gDZCVQ", content: "Supervised & Unsupervised Learning." },
  { id: 3, title: "Deep Learning Intro", video: "https://www.youtube.com/embed/aircAruvnKk", content: "Neural networks basics." },
];

const ProgramDetailPage = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  const selectedChapter = chapters[currentIndex];

  const handleNext = () => {
    if (currentIndex < chapters.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">

      {/* Sidebar */}
      <aside className="w-64 border-r bg-card p-4 space-y-2 hidden md:block">

        {/* Header row: Back + Chapters title */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              if (window.history.length > 1) {
                navigate("/dashboard");
              } else {
                navigate("/dashboard"); // fallback if no history
              }
            }}
            className="bg-gray-200 text-black px-3 py-1 rounded hover:bg-gray-300"
          >
            <ArrowLeft className="h-5 w-5 text-[#177385]" />
          </button>

          <h3 className="font-semibold text-lg text-[#177385]">Chapters</h3>
        </div>

        {/* Chapter Buttons */}
        {chapters.map((chapter, index) => (
          <Button
            key={chapter.id}
            className={`w-full justify-start text-black bg-transparent border border-black/20 ${currentIndex === index
                ? "bg-[#177385] text-white"
                : "hover:bg-gradient-hero"
              }`}
            onClick={() => setCurrentIndex(index)}
          >
            {chapter.id}. {chapter.title}
          </Button>
        ))}
      </aside>


      {/* Main Content */}
      <main className="flex-1 p-6 space-y-6">

        {/* Video Section */}
        <Card className="rounded-xl shadow-md">
          <CardContent className="p-4 relative">

            {/* ⭐ Top Right Back / Next Buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                onClick={handleBack}
                disabled={currentIndex === 0}
                className={`px-4 py-2 ${currentIndex === 0
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-[#177385] text-white hover:bg-[#135f6e]"
                  }`}
              >
                <StepBackIcon />
              </Button>

              <Button
                onClick={handleNext}
                disabled={currentIndex === chapters.length - 1}
                className={`px-4 py-2 ${currentIndex === chapters.length - 1
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-[#177385] text-white hover:bg-[#135f6e]"
                  }`}
              >
                <StepForward />
              </Button>
            </div>

            <h2 className="text-xl font-bold mb-4 text-[#177385]">
              {selectedChapter.title}
            </h2>

            <div className="aspect-video mb-4">
              <iframe
                width="100%"
                height="100%"
                src={selectedChapter.video}
                title={selectedChapter.title}
                allowFullScreen
                className="rounded-lg shadow"
              />
            </div>

            <p className="text-gray-600">{selectedChapter.content}</p>
          </CardContent>
        </Card>

        {/* Doubts Section */}
        <Card className="rounded-xl shadow-md">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-3 text-[#177385]">Doubts / Q&A</h3>
            <textarea
              placeholder="Ask your doubt here..."
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-[#177385] focus:outline-none"
              rows={3}
            />
            <Button className="mt-3 bg-[#177385] text-white hover:bg-[#135f6e]">
              Submit Doubt
            </Button>
          </CardContent>
        </Card>

      </main>
    </div>
  );
};

export default ProgramDetailPage;
