import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { bookingService } from '../utils/bookingService';
import { useToast } from './ToastContainer';

const BookingList = ({ memberId, coachId, showActions = true, isCoach = false }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    fetchBookings();
  }, [memberId, coachId, selectedDate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      let response;
      
      if (memberId) {
        response = await bookingService.getBookingsByMemberId(memberId);
      } else if (coachId) {
        response = await bookingService.getBookingsByCoachId(coachId, selectedDate);
      } else {
        response = await bookingService.getAllBookings();
      }
      
      setBookings(response.data || []);
    } catch (error) {
      showToast('Error fetching bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      setLoading(true);
      await bookingService.updateBookingStatus(bookingId, newStatus);
      showToast('Booking status updated successfully', 'success');
      fetchBookings();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bookingId) => {
    if (!confirm('Are you sure you want to delete this booking?')) {
      return;
    }

    try {
      setLoading(true);
      await bookingService.deleteBooking(bookingId);
      showToast('Booking deleted successfully', 'success');
      fetchBookings();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {memberId ? 'My Bookings' : coachId ? 'Coach Bookings' : 'All Bookings'}
        </h2>
        
        {coachId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : bookings.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No bookings found</p>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="font-semibold text-gray-800">
                      {formatDate(booking.booking_date)}
                    </h3>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${getStatusColor(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p><strong>Time:</strong> {formatTime(booking.start_time)} - {formatTime(booking.end_time)}</p>
                      {booking.coach && (
                        <p><strong>Coach:</strong> {booking.coach.name}</p>
                      )}
                      {booking.member && (
                        <p><strong>Member:</strong> {booking.member.name}</p>
                      )}
                    </div>
                    
                    <div>
                      {booking.transaction?.package && (
                        <p><strong>Package:</strong> {booking.transaction.package.package_name}</p>
                      )}
                      {booking.notes && (
                        <p><strong>Notes:</strong> {booking.notes}</p>
                      )}
                    </div>
                  </div>
                </div>

                {showActions && (
                  <div className="flex gap-2 ml-4">
                    {booking.status === 'scheduled' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(booking.id, 'completed')}
                          className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    
                    {booking.status === 'scheduled' && (
                      <button
                        onClick={() => handleStatusUpdate(booking.id, 'no_show')}
                        className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition-colors"
                      >
                        No Show
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDelete(booking.id)}
                      className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

BookingList.propTypes = {
  memberId: PropTypes.number,
  coachId: PropTypes.number,
  showActions: PropTypes.bool,
  isCoach: PropTypes.bool
};

export default BookingList; 