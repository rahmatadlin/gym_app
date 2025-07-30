'use strict';
const {
  Model
} = require('sequelize');
const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Booking.belongsTo(models.Transaction, {
        foreignKey: 'transaction_id',
        as: 'transaction'
      });
      
      Booking.belongsTo(models.User, {
        foreignKey: 'coach_id',
        as: 'coach'
      });
      
      Booking.belongsTo(models.User, {
        foreignKey: 'member_id',
        as: 'member'
      });
    }

    // Method to check if there's a booking conflict
    static async checkBookingConflict(coachId, bookingDate, startTime, endTime, excludeBookingId = null) {
      const whereClause = {
        coach_id: coachId,
        booking_date: bookingDate,
        status: {
          [Op.in]: ['scheduled', 'completed']
        },
        [Op.or]: [
          {
            start_time: {
              [Op.lt]: endTime
            },
            end_time: {
              [Op.gt]: startTime
            }
          }
        ]
      };

      if (excludeBookingId) {
        whereClause.id = {
          [Op.ne]: excludeBookingId
        };
      }

      const conflictingBooking = await this.findOne({
        where: whereClause
      });

      return conflictingBooking !== null;
    }

    // Method to get all bookings for a coach on a specific date
    static async getCoachBookings(coachId, bookingDate) {
      return await this.findAll({
        where: {
          coach_id: coachId,
          booking_date: bookingDate,
          status: {
            [Op.in]: ['scheduled', 'completed']
          }
        },
        include: [{
          model: sequelize.models.User,
          as: 'member',
          attributes: ['id', 'name', 'phone_number']
        }],
        order: [['start_time', 'ASC']]
      });
    }

    // Method to get all bookings for a member
    static async getMemberBookings(memberId) {
      return await this.findAll({
        where: {
          member_id: memberId
        },
        include: [
          {
            model: sequelize.models.User,
            as: 'coach',
            attributes: ['id', 'name', 'phone_number']
          },
          {
            model: sequelize.models.Transaction,
            as: 'transaction',
            include: [{
              model: sequelize.models.Package,
              as: 'package',
              attributes: ['package_name']
            }]
          }
        ],
        order: [['booking_date', 'DESC'], ['start_time', 'ASC']]
      });
    }

    // Method to update booking status
    static async updateBookingStatus(id, status) {
      return await this.update(
        { status: status },
        { where: { id } }
      );
    }
  }

  Booking.init({
    transaction_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Transactions',
        key: 'id'
      }
    },
    coach_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    member_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    booking_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'completed', 'cancelled', 'no_show'),
      allowNull: false,
      defaultValue: 'scheduled'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Booking',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Add scopes after model initialization
  Booking.addScope('scheduled', {
    where: { status: 'scheduled' }
  });

  Booking.addScope('completed', {
    where: { status: 'completed' }
  });

  Booking.addScope('cancelled', {
    where: { status: 'cancelled' }
  });

  Booking.addScope('byCoach', (coachId) => ({
    where: { coach_id: coachId }
  }));

  Booking.addScope('byMember', (memberId) => ({
    where: { member_id: memberId }
  }));

  return Booking;
}; 