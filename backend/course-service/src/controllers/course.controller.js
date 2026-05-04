import Course from '../db/models/Course.js';

// Add a new course
export const addCourse = async (req, res) => {
  const { courseId, title, description, duration, isPreAssessmentNeeded, modules } = req.body;
  if (!courseId || !title || !duration) {
    return res.status(400).json({ error: 'Course ID, title, and duration are required' });
  }

  // Check if course with the same ID already exists
  const existingCourse = await Course.findByPk(courseId);
  if (existingCourse) {
    return res.status(400).json({ error: 'Course with this ID already exists' });
  }

  try {
    const newCourse = await Course.create({
      courseId,
      title,
      description,
      duration,
      isPreAssessmentNeeded,
      modules
    });
    res.status(201).json(newCourse);
  } catch (error) {
    console.error('Error adding course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all courses
export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.findAll();
    res.status(200).json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get course by ID
export const getCourseById = async (req, res) => {
  const { courseId } = req.params;
  try {
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.status(200).json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update course
export const updateCourse = async (req, res) => {
  const { courseId } = req.params;
  const { title, description, duration, isPreAssessmentNeeded, modules } = req.body;
  try {
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    await course.update({
      title,
      description,
      duration,
      isPreAssessmentNeeded,
      modules
    });
    res.status(200).json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete course
export const deleteCourse = async (req, res) => {
  const { courseId } = req.params;
  try {
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    await course.destroy();
    res.status(204).send({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
