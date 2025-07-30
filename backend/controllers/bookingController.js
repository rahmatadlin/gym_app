const { Booking, User, Transaction, Package, CoachSchedule } = require('../models');
const { Op } = require('sequelize');

// Get all bookings
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      include: [
        {
          model: User,
          as: 'coach',
          attributes: ['id', 'name', 'phone_number']
        },
        {
          model: User,
          as: 'member',
          attributes: ['id', 'name', 'phone_number']
        },
        {
          model: Transaction,
          as: 'transaction',
          include: [{
            model: Package,
            as: 'package',
            attributes: ['package_name']
          }]
        }
      ],
      order: [['booking_date', 'DESC'], ['start_time', 'ASC']]
    });

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error getting bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get bookings by member ID
const getBookingsByMemberId = async (req, res) => {
  try {
    const { memberId } = req.params;
    
    const bookings = await Booking.getMemberBookings(memberId);

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error getting member bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get bookings by coach ID
const getBookingsByCoachId = async (req, res) => {
  try {
    const { coachId } = req.params;
    const { date } = req.query;
    
    let whereClause = { coach_id: coachId };
    
    if (date) {
      whereClause.booking_date = date;
    }

    const bookings = await Booking.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'member',
          attributes: ['id', 'name', 'phone_number']
        },
        {
          model: Transaction,
          as: 'transaction',
          include: [{
            model: Package,
            as: 'package',
            attributes: ['package_name']
          }]
        }
      ],
      order: [['booking_date', 'ASC'], ['start_time', 'ASC']]
    });

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error getting coach bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create booking
const createBooking = async (req, res) => {
  try {
    const { 
      transaction_id, 
      coach_id, 
      member_id, 
      booking_date, 
      start_time, 
      end_time, 
      notes 
    } = req.body;

    // Validate required fields
    if (!transaction_id || !coach_id || !member_id || !booking_date || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'transaction_id, coach_id, member_id, booking_date, start_time, and end_time are required'
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

    // Check if transaction exists
    const transaction = await Transaction.findByPk(transaction_id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check if coach exists and is active
    const coach = await User.findOne({
      where: { id: coach_id, role: 'coach', user_status: 'active' }
    });
    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found or not active'
      });
    }

    // Check if member exists and is active
    const member = await User.findOne({
      where: { id: member_id, role: 'member', user_status: 'active' }
    });
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found or not active'
      });
    }

    // Get day of week from booking date
    const bookingDate = new Date(booking_date);
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = daysOfWeek[bookingDate.getDay()];

    // Check if coach is available on this day and time
    const isAvailable = await CoachSchedule.isCoachAvailable(coach_id, dayOfWeek, start_time, end_time);
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Coach is not available at this time'
      });
    }

    // Check for booking conflicts
    const hasConflict = await Booking.checkBookingConflict(coach_id, booking_date, start_time, end_time);
    if (hasConflict) {
      return res.status(400).json({
        success: false,
        message: 'There is a booking conflict at this time'
      });
    }

    const booking = await Booking.create({
      transaction_id,
      coach_id,
      member_id,
      booking_date,
      start_time,
      end_time,
      notes
    });

    const bookingWithDetails = await Booking.findByPk(booking.id, {
      include: [
        {
          model: User,
          as: 'coach',
          attributes: ['id', 'name', 'phone_number']
        },
        {
          model: User,
          as: 'member',
          attributes: ['id', 'name', 'phone_number']
        },
        {
          model: Transaction,
          as: 'transaction',
          include: [{
            model: Package,
            as: 'package',
            attributes: ['package_name']
          }]
        }
      ]
    });

    // Update transaction with booking_id
    await transaction.update({ booking_id: booking.id });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: bookingWithDetails
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update booking
const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { booking_date, start_time, end_time, status, notes } = req.body;

    const booking = await Booking.findByPk(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Validate time format if provided (HH:00)
    if (start_time || end_time) {
      const timeRegex = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):00$/;
      const finalStartTime = start_time || booking.start_time;
      const finalEndTime = end_time || booking.end_time;
      
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

    // If updating time/date, check for conflicts
    if (booking_date || start_time || end_time) {
      const newDate = booking_date || booking.booking_date;
      const newStartTime = start_time || booking.start_time;
      const newEndTime = end_time || booking.end_time;

      const hasConflict = await Booking.checkBookingConflict(
        booking.coach_id, 
        newDate, 
        newStartTime, 
        newEndTime, 
        booking.id
      );

      if (hasConflict) {
        return res.status(400).json({
          success: false,
          message: 'There is a booking conflict at this time'
        });
      }
    }

    await booking.update({
      booking_date: booking_date || booking.booking_date,
      start_time: start_time || booking.start_time,
      end_time: end_time || booking.end_time,
      status: status || booking.status,
      notes: notes !== undefined ? notes : booking.notes
    });

    const updatedBooking = await Booking.findByPk(id, {
      include: [
        {
          model: User,
          as: 'coach',
          attributes: ['id', 'name', 'phone_number']
        },
        {
          model: User,
          as: 'member',
          attributes: ['id', 'name', 'phone_number']
        },
        {
          model: Transaction,
          as: 'transaction',
          include: [{
            model: Package,
            as: 'package',
            attributes: ['package_name']
          }]
        }
      ]
    });

    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: updatedBooking
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete booking
const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findByPk(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    await booking.destroy();

    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update booking status
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const booking = await Booking.findByPk(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    await Booking.updateBookingStatus(id, status);

    const updatedBooking = await Booking.findByPk(id, {
      include: [
        {
          model: User,
          as: 'coach',
          attributes: ['id', 'name', 'phone_number']
        },
        {
          model: User,
          as: 'member',
          attributes: ['id', 'name', 'phone_number']
        },
        {
          model: Transaction,
          as: 'transaction',
          include: [{
            model: Package,
            as: 'package',
            attributes: ['package_name']
          }]
        }
      ]
    });

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: updatedBooking
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getAllBookings,
  getBookingsByMemberId,
  getBookingsByCoachId,
  createBooking,
  updateBooking,
  deleteBooking,
  updateBookingStatus
}; 