import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { coachScheduleService } from '../utils/coachScheduleService';
import { bookingService } from '../utils/bookingService';
import { useToast } from './ToastContainer';

const BookingForm = ({ transactionId, memberId, coachId, coachName, onBookingComplete }) => {
  const [availableSchedules, setAvailableSchedules] = useState([]);
  const [coachAvailableDays, setCoachAvailableDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDays, setLoadingDays] = useState(false);
  
  // Initialize with empty date
  const [formData, setFormData] = useState({
    booking_date: '',
    start_time: '08:00',
    end_time: '09:00',
    notes: ''
  });

  const { showToast } = useToast();

  const daysOfWeek = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  // Generate time options (8:00 to 20:00, every hour)
  const timeOptions = [];
  for (let hour = 8; hour <= 20; hour++) {
    timeOptions.push(`${hour.toString().padStart(2, '0')}:00`);
  }

  // Fetch coach's available days when component mounts
  useEffect(() => {
    fetchCoachAvailableDays();
  }, [coachId]);

  const fetchCoachAvailableDays = async () => {
    try {
      setLoadingDays(true);
      const response = await coachScheduleService.getCoachSchedulesByCoachId(coachId);
      const schedules = response.data || [];
      
      // Get unique available days
      const availableDays = [...new Set(schedules.map(schedule => schedule.day_of_week))];
      setCoachAvailableDays(availableDays);
    } catch (error) {
      console.error('Error fetching coach available days:', error);
      showToast('Error fetching coach schedule', 'error');
    } finally {
      setLoadingDays(false);
    }
  };

  const handleDateChange = async (date) => {
    setFormData(prev => ({ ...prev, booking_date: date }));
    
    if (date && formData.start_time && formData.end_time) {
      await fetchAvailableSchedules(date, formData.start_time, formData.end_time);
    }
  };

  const handleTimeChange = async (field, time) => {
    // Ensure time is in HH:00 format
    const hour = time.split(':')[0];
    const formattedTime = `${hour}:00`;
    
    const newFormData = { ...formData, [field]: formattedTime };
    setFormData(newFormData);
    
    if (newFormData.booking_date && newFormData.start_time && newFormData.end_time) {
      await fetchAvailableSchedules(newFormData.booking_date, newFormData.start_time, newFormData.end_time);
    }
  };

  const fetchAvailableSchedules = async (date, startTime, endTime) => {
    try {
      setLoading(true);
      const bookingDate = new Date(date);
      const dayOfWeek = daysOfWeek[bookingDate.getDay()];
      
      const response = await coachScheduleService.getAvailableCoaches(dayOfWeek, startTime, endTime);
      // Filter schedules for the specific coach
      const coachSchedules = response.data?.filter(schedule => schedule.coach_id === coachId) || [];
      setAvailableSchedules(coachSchedules);
    } catch (error) {
      console.error('Error fetching available schedules:', error);
      showToast('Error fetching available schedules', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate time selection
    const startHour = parseInt(formData.start_time.split(':')[0]);
    const endHour = parseInt(formData.end_time.split(':')[0]);
    
    if (startHour >= endHour) {
      showToast('End time must be after start time', 'error');
      return;
    }
    
    if (availableSchedules.length === 0) {
      showToast('No available schedules for the selected time', 'error');
      return;
    }

    try {
      setLoading(true);
      const bookingData = {
        transaction_id: transactionId,
        coach_id: coachId,
        member_id: memberId,
        booking_date: formData.booking_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        notes: formData.notes
      };

      await bookingService.createBooking(bookingData);
      showToast('Booking created successfully', 'success');
      
      if (onBookingComplete) {
        onBookingComplete();
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getDayOfWeek = (date) => {
    const bookingDate = new Date(date);
    return daysOfWeek[bookingDate.getDay()];
  };

  const isDayAvailable = (dayOfWeek) => {
    return coachAvailableDays.includes(dayOfWeek);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Book a Session</h2>
      
      {/* Coach Information */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Coach Information</h3>
        <p className="text-blue-700"><strong>Coach:</strong> {coachName}</p>
        
        {/* Coach Available Days */}
        <div className="mt-3">
          <h4 className="font-medium text-blue-800 mb-2">Available Days:</h4>
          {loadingDays ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-600">Loading available days...</span>
            </div>
          ) : coachAvailableDays.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map((day) => (
                <span
                  key={day}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isDayAvailable(day)
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-gray-100 text-gray-500 border border-gray-200'
                  }`}
                >
                  {day.slice(0, 3)}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-red-600">No available days found for this coach</p>
          )}
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Booking Date
            </label>
            <input
              type="date"
              value={formData.booking_date}
              onChange={(e) => handleDateChange(e.target.value)}
              min={(new Date().getFullYear()) + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {formData.booking_date && (
              <div className="mt-1">
                <p className="text-sm text-gray-500">
                  {getDayOfWeek(formData.booking_date)}
                </p>
                {!isDayAvailable(getDayOfWeek(formData.booking_date)) && (
                  <p className="text-sm text-red-600 font-medium">
                    ⚠️ Coach is not available on this day
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <select
              value={formData.start_time}
              onChange={(e) => handleTimeChange('start_time', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time
            </label>
            <select
              value={formData.end_time}
              onChange={(e) => handleTimeChange('end_time', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Available Schedule
            </label>
            <div className="px-3 py-2 bg-gray-100 rounded-md text-sm text-gray-600">
              {availableSchedules.length > 0 ? (
                availableSchedules.map((schedule, index) => (
                  <div key={index} className="text-green-600 font-medium">
                    ✓ Available: {schedule.start_time} - {schedule.end_time}
                  </div>
                ))
              ) : (
                <span className="text-gray-500">No available schedule for selected time</span>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any special requests or notes..."
          />
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading available schedules...</p>
          </div>
        )}

        {availableSchedules.length === 0 && formData.booking_date && formData.start_time && formData.end_time && !loading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-yellow-800">
              Coach is not available for the selected date and time. Please try a different time or date.
            </p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || availableSchedules.length === 0}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Booking...' : 'Book Session'}
          </button>
        </div>
      </form>
    </div>
  );
};

BookingForm.propTypes = {
  transactionId: PropTypes.number.isRequired,
  memberId: PropTypes.number.isRequired,
  coachId: PropTypes.number.isRequired,
  coachName: PropTypes.string.isRequired,
  onBookingComplete: PropTypes.func
};

export default BookingForm; 