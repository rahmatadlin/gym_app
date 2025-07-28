require('dotenv').config();

module.exports = {
  development: {
    username: "postgres",
    password: "postgres",
    database: "gym_app_development",
    host: "localhost",
    dialect: "postgres"
  },
  test: {
    username: "postgres",
    password: "postgres",
    database: "gym_app_test",
    host: "localhost",
    dialect: "postgres"
  },
  production: {
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "gym_app_production",
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
}; 