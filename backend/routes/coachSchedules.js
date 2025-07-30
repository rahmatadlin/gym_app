const express = require('express');
const router = express.Router();
const coachScheduleController = require('../controllers/coachScheduleController');

// Get all coach schedules
router.get('/', coachScheduleController.getAllCoachSchedules);

// Get available coaches for specific day and time
router.get('/available', coachScheduleController.getAvailableCoaches);

// Get coach schedules by coach ID
router.get('/coach/:coachId', coachScheduleController.getCoachSchedulesByCoachId);

// Create coach schedule
router.post('/', coachScheduleController.createCoachSchedule);

// Update coach schedule
router.put('/:id', coachScheduleController.updateCoachSchedule);

// Delete coach schedule
router.delete('/:id', coachScheduleController.deleteCoachSchedule);

module.exports = router; 