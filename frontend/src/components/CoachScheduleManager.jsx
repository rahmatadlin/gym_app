import React, { useState, useEffect } from 'react';
import { coachScheduleService } from '../utils/coachScheduleService';
import { useToast } from './ToastContainer';

const CoachScheduleManager = ({ coachId }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    day_of_week: 'Monday',
    start_time: '08:00',
    end_time: '09:00',
    is_available: true
  });

  const { showToast } = useToast();

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  // Generate time options (8:00 to 20:00, every hour)
  const timeOptions = [];
  for (let hour = 8; hour <= 20; hour++) {
    timeOptions.push(`${hour.toString().padStart(2, '0')}:00`);
  }

  useEffect(() => {
    if (coachId) {
      fetchSchedules();
    }
  }, [coachId]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await coachScheduleService.getCoachSchedulesByCoachId(coachId);
      setSchedules(response.data || []);
    } catch (error) {
      showToast('Error fetching schedules', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (field, time) => {
    // Ensure time is in HH:00 format
    const hour = time.split(':')[0];
    const formattedTime = `${hour}:00`;
    setFormData({ ...formData, [field]: formattedTime });
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
    
    try {
      setLoading(true);
      const scheduleData = {
        ...formData,
        coach_id: coachId
      };

      if (editingSchedule) {
        await coachScheduleService.updateCoachSchedule(editingSchedule.id, scheduleData);
        showToast('Schedule updated successfully', 'success');
      } else {
        await coachScheduleService.createCoachSchedule(scheduleData);
        showToast('Schedule created successfully', 'success');
      }

      setShowForm(false);
      setEditingSchedule(null);
      setFormData({
        day_of_week: 'Monday',
        start_time: '08:00',
        end_time: '09:00',
        is_available: true
      });
      fetchSchedules();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      is_available: schedule.is_available
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    try {
      setLoading(true);
      await coachScheduleService.deleteCoachSchedule(id);
      showToast('Schedule deleted successfully', 'success');
      fetchSchedules();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSchedule(null);
    setFormData({
      day_of_week: 'Monday',
      start_time: '08:00',
      end_time: '09:00',
      is_available: true
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Manage Schedule</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Schedule
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Day of Week
                </label>
                <select
                  value={formData.day_of_week}
                  onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {daysOfWeek.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available
                </label>
                <select
                  value={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.value === 'true' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={true}>Available</option>
                  <option value={false}>Not Available</option>
                </select>
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
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : (editingSchedule ? 'Update' : 'Create')}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && !showForm ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {schedules.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No schedules found</p>
          ) : (
            schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="border border-gray-200 rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <h4 className="font-semibold text-gray-800">{schedule.day_of_week}</h4>
                  <p className="text-gray-600">
                    {schedule.start_time} - {schedule.end_time}
                  </p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                    schedule.is_available 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {schedule.is_available ? 'Available' : 'Not Available'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(schedule)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(schedule.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CoachScheduleManager; 