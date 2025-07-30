'use strict';
const {
  Model
} = require('sequelize');
const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CoachSchedule extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      CoachSchedule.belongsTo(models.User, {
        foreignKey: 'coach_id',
        as: 'coach'
      });
    }

    // Method to check if coach is available at specific time
    static async isCoachAvailable(coachId, dayOfWeek, startTime, endTime) {
      const schedule = await this.findOne({
        where: {
          coach_id: coachId,
          day_of_week: dayOfWeek,
          is_available: true
        }
      });

      if (!schedule) return false;

      // Check if requested time overlaps with coach's available time
      // Requested start time should be before coach's end time AND
      // Requested end time should be after coach's start time
      return startTime < schedule.end_time && endTime > schedule.start_time;
    }

    // Method to get all available coaches for a specific day and time
    static async getAvailableCoaches(dayOfWeek, startTime, endTime) {
      return await this.findAll({
        where: {
          day_of_week: dayOfWeek,
          is_available: true,
          start_time: {
            [Op.lte]: endTime  // Coach's start time should be before or equal to requested end time
          },
          end_time: {
            [Op.gte]: startTime  // Coach's end time should be after or equal to requested start time
          }
        },
        include: [{
          model: sequelize.models.User,
          as: 'coach',
          where: { role: 'coach', user_status: 'active' },
          attributes: ['id', 'name', 'phone_number']
        }]
      });
    }
  }

  CoachSchedule.init({
    coach_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    day_of_week: {
      type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
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
    is_available: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'CoachSchedule',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Add scopes after model initialization
  CoachSchedule.addScope('available', {
    where: { is_available: true }
  });

  CoachSchedule.addScope('byCoach', (coachId) => ({
    where: { coach_id: coachId }
  }));

  CoachSchedule.addScope('byDay', (dayOfWeek) => ({
    where: { day_of_week: dayOfWeek }
  }));

  return CoachSchedule;
}; 