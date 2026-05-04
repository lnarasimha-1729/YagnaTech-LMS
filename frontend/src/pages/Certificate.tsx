import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Loader2 } from "lucide-react";
import {
  listMyCertificates,
  type StudentCertificateWithCourse,
} from "@/api/course/courseApi";

const fmtDate = (d?: string | null) => {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const Certificate = () => {
  const [certs, setCerts] = useState<StudentCertificateWithCourse[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    listMyCertificates()
      .then((res) => {
        if (!alive) return;
        setCerts(res.certificates || []);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err?.response?.data?.error || "Failed to load certificates");
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="section-padding bg-gradient-subtle py-4">
      <div className="container-ngo">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-gray-800 text-center">
          My Certificates
        </h2>

        {certs === null && !error && (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading your certificates…
          </div>
        )}

        {error && (
          <div className="text-center py-10 text-red-600">{error}</div>
        )}

        {certs && certs.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Award className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p>You haven't earned any certificates yet.</p>
            <p className="text-sm mt-1">
              Complete a program <strong>and</strong> pass the post-assessment
              to receive a certificate of completion.
            </p>
          </div>
        )}

        {certs && certs.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certs.map((cert) => {
              const title =
                cert.course?.title || `Course #${cert.course_id}`;
              const completed = fmtDate(cert.issued_at || cert.created_at);
              return (
                <Card
                  key={cert.id}
                  className="rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all"
                >
                  <div className="bg-gradient-hero p-4 text-center">
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    {completed && (
                      <p className="text-sm text-gray-200">
                        Completed on {completed}
                      </p>
                    )}
                  </div>

                  <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
                    <div className="w-14 h-14 rounded-full bg-[#177385]/10 flex items-center justify-center">
                      <Award className="h-8 w-8 text-[#177385]" />
                    </div>

                    <p className="text-sm text-gray-600">
                      Certificate ID:{" "}
                      <span className="font-medium">{cert.identifier}</span>
                    </p>

                    <a
                      href={`/certificate/${cert.identifier}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button
                        size="sm"
                        className="bg-gradient-hero text-white px-4 py-2 rounded-lg hover:bg-[#177385] transition-colors"
                      >
                        Download Certificate
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default Certificate;
