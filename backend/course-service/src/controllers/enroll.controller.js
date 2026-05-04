import Enrollment from '../db/models/Enrollment.js';
import {generateEnrollmentId} from '../utils/uidGeneration.js';
import Course from '../db/models/Course.js';


// Enroll a user in a course
export const enrollInCourse = async (req, res) => {
  const userId = req.user.id;
  const { courseId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }
    // Check if course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

  try {
    const enrollment = await Enrollment.create({
      enrollmentId: generateEnrollmentId(),
      userId,
      courseId
    });
    res.status(201).json(enrollment);
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all courses a user is enrolled in
export const getMyCourses = async (req, res) => {
  const userId = req.user.id;
  try {
    const enrollments = await Enrollment.findAll({
      where: { userId },
    include: [{ model: Course }]
    });

    if (!enrollments) {
      return res.status(404).json({ error: 'No enrollments found for this user' });
    }

    res.status(200).json(enrollments);
  } catch (error) {
    console.error('Error fetching user courses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
