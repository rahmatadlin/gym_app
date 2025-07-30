const { CoachSchedule, User } = require('../models');
const { Op } = require('sequelize');

// Get all coach schedules
const getAllCoachSchedules = async (req, res) => {
  try {
    const schedules = await CoachSchedule.findAll({
      include: [{
        model: User,
        as: 'coach',
        attributes: ['id', 'name', 'phone_number']
      }],
      order: [['coach_id', 'ASC'], ['day_of_week', 'ASC']]
    });

    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error('Error getting coach schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get coach schedules by coach ID
const getCoachSchedulesByCoachId = async (req, res) => {
  try {
    const { coachId } = req.params;
    
    const schedules = await CoachSchedule.findAll({
      where: { coach_id: coachId },
      include: [{
        model: User,
        as: 'coach',
        attributes: ['id', 'name', 'phone_number']
      }],
      order: [['day_of_week', 'ASC']]
    });

    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error('Error getting coach schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create coach schedule
const createCoachSchedule = async (req, res) => {
  try {
    const { coach_id, day_of_week, start_time, end_time, is_available } = req.body;

    // Validate required fields
    if (!coach_id || !day_of_week || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'coach_id, day_of_week, start_time, and end_time are required'
      });
    }

    // Validate time format (HH:00)
    const timeRegex = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):00$/;
    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
      return res.status(400).json({
        success: false,
        message: 'Time must be in HH:00 format (e.g., 08:00, 14:00)'
      });
    }

    // Validate time range (8:00 to 20:00)
    const startHour = parseInt(start_time.split(':')[0]);
    const endHour = parseInt(end_time.split(':')[0]);
    
    if (startHour < 8 || startHour > 20 || endHour < 8 || endHour > 20) {
      return res.status(400).json({
        success: false,
        message: 'Time must be between 08:00 and 20:00'
      });
    }

    // Validate start time is before end time
    if (startHour >= endHour) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    // Check if coach exists and is a coach
    const coach = await User.findOne({
      where: { id: coach_id, role: 'coach', user_status: 'active' }
    });

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found or not active'
      });
    }

    // Check if schedule already exists for this coach and day
    const existingSchedule = await CoachSchedule.findOne({
      where: { coach_id, day_of_week }
    });

    if (existingSchedule) {
      return res.status(400).json({
        success: false,
        message: 'Schedule already exists for this coach on this day'
      });
    }

    const schedule = await CoachSchedule.create({
      coach_id,
      day_of_week,
      start_time,
      end_time,
      is_available: is_available !== undefined ? is_available : true
    });

    const createdSchedule = await CoachSchedule.findByPk(schedule.id, {
      include: [{
        model: User,
        as: 'coach',
        attributes: ['id', 'name', 'phone_number']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Coach schedule created successfully',
      data: createdSchedule
    });
  } catch (error) {
    console.error('Error creating coach schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update coach schedule
const updateCoachSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { day_of_week, start_time, end_time, is_available } = req.body;

    const schedule = await CoachSchedule.findByPk(id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Coach schedule not found'
      });
    }

    // Validate time format if provided (HH:00)
    if (start_time || end_time) {
      const timeRegex = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):00$/;
      const finalStartTime = start_time || schedule.start_time;
      const finalEndTime = end_time || schedule.end_time;
      
      if (!timeRegex.test(finalStartTime) || !timeRegex.test(finalEndTime)) {
        return res.status(400).json({
          success: false,
          message: 'Time must be in HH:00 format (e.g., 08:00, 14:00)'
        });
      }

      // Validate time range (8:00 to 20:00)
      const startHour = parseInt(finalStartTime.split(':')[0]);
      const endHour = parseInt(finalEndTime.split(':')[0]);
      
      if (startHour < 8 || startHour > 20 || endHour < 8 || endHour > 20) {
        return res.status(400).json({
          success: false,
          message: 'Time must be between 08:00 and 20:00'
        });
      }

      // Validate start time is before end time
      if (startHour >= endHour) {
        return res.status(400).json({
          success: false,
          message: 'End time must be after start time'
        });
      }
    }

    await schedule.update({
      day_of_week: day_of_week || schedule.day_of_week,
      start_time: start_time || schedule.start_time,
      end_time: end_time || schedule.end_time,
      is_available: is_available !== undefined ? is_available : schedule.is_available
    });

    const updatedSchedule = await CoachSchedule.findByPk(id, {
      include: [{
        model: User,
        as: 'coach',
        attributes: ['id', 'name', 'phone_number']
      }]
    });

    res.json({
      success: true,
      message: 'Coach schedule updated successfully',
      data: updatedSchedule
    });
  } catch (error) {
    console.error('Error updating coach schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete coach schedule
const deleteCoachSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await CoachSchedule.findByPk(id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Coach schedule not found'
      });
    }

    await schedule.destroy();

    res.json({
      success: true,
      message: 'Coach schedule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting coach schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get available coaches for specific day and time
const getAvailableCoaches = async (req, res) => {
  try {
    const { day_of_week, start_time, end_time } = req.query;

    if (!day_of_week || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'day_of_week, start_time, and end_time are required'
      });
    }

    const availableCoaches = await CoachSchedule.getAvailableCoaches(day_of_week, start_time, end_time);

    res.json({
      success: true,
      data: availableCoaches
    });
  } catch (error) {
    console.error('Error getting available coaches:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getAllCoachSchedules,
  getCoachSchedulesByCoachId,
  createCoachSchedule,
  updateCoachSchedule,
  deleteCoachSchedule,
  getAvailableCoaches
}; 