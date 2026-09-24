const crypto = require("crypto");

const generate6DigitCode = () => {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
};

const hashCode = (code) => {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
};

const minutesFromNow = (minutes) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

module.exports = { generate6DigitCode, hashCode, minutesFromNow };