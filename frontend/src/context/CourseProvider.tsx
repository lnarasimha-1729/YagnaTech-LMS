import { useState, useEffect, ReactNode } from "react";
import axiosInstance from "../api/axiosInstance";
import { CourseContext, CourseContextType, Course } from "./CourseContext";

export const CourseProvider = ({ children }: { children: ReactNode }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get<Course[]>("/course/all")
      .then(res => setCourses(res.data))
      .then(() => setLoading(false), () => setLoading(false));
    axiosInstance.get<Course[]>("/course/enroll/my-courses").then(res => setMyCourses(res.data));
  }, []);

  const addCourse = async (data: Partial<Course>) => axiosInstance.post("/course/add", data);
  const enrollCourse = async (data: { courseId: string }) => axiosInstance.post("/course/enroll/", data);

  const contextValue: CourseContextType = {
    courses,
    myCourses,
    loading,
    addCourse,
    enrollCourse
  };

  return (
    <CourseContext.Provider value={contextValue}>
      {children}
    </CourseContext.Provider>
  );
};