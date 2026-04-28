const { parseISO } = require('date-fns');
const apptDate = parseISO(`2026-04-30T16:00`);
const now = new Date();
const hoursDiff = (apptDate.getTime() - now.getTime()) / (1000 * 60 * 60);
console.log(apptDate, apptDate.getTime(), Math.floor(hoursDiff));
