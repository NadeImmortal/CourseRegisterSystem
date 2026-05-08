const express = require('express');
const router = express.Router();

// Import Controllers and Middlewares
const authController = require('../controllers/authController');
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminController = require('../controllers/adminController');
const instructorController = require('../controllers/instructorController');

// =======================
// Public Routes
// =======================
router.post('/login', authController.login);
router.post('/signup', authController.signup); // <-- THIS WAS MISSING!
router.get('/courses', courseController.getAllCourses);

// =======================
// Protected Routes (Requires Login & Student Role)
// =======================
router.post('/register', authMiddleware.verifyToken, authMiddleware.requireRole('Student'), courseController.registerCourse);
router.get('/my-courses', authMiddleware.verifyToken, authMiddleware.requireRole('Student'), courseController.getMyCourses);
router.post('/drop', authMiddleware.verifyToken, authMiddleware.requireRole('Student'), courseController.dropCourse);
router.get('/admin/courses', authMiddleware.verifyToken, authMiddleware.requireRole('Admin'), adminController.getAdminCourses);
router.post('/admin/courses', authMiddleware.verifyToken, authMiddleware.requireRole('Admin'), adminController.addCourse);
router.delete('/admin/courses/:course_id', authMiddleware.verifyToken, authMiddleware.requireRole('Admin'), adminController.deleteCourse);
router.get('/admin/enrollments', authMiddleware.verifyToken, authMiddleware.requireRole('Admin'), adminController.getAllEnrollments);
router.get('/instructor/courses', authMiddleware.verifyToken, authMiddleware.requireRole('Instructor'), instructorController.getAssignedCourses);
router.get('/instructor/courses/:schedule_id/roster', authMiddleware.verifyToken, authMiddleware.requireRole('Instructor'), instructorController.getCourseRoster);
router.get('/admin/instructors', authMiddleware.verifyToken, authMiddleware.requireRole('Admin'), adminController.getAllInstructors);
router.put('/admin/courses/:schedule_id/instructor', authMiddleware.verifyToken, authMiddleware.requireRole('Admin'), adminController.assignInstructor);
router.post('/admin/instructors', authMiddleware.verifyToken, authMiddleware.requireRole('Admin'), adminController.addInstructor);


module.exports = router;