/**
 * Formatting utilities for Indian Police System standards.
 * Supports Indian Number System (Lakhs/Crores), 24-hour Time, and Indian Date formats.
 */

/**
 * Formats numbers into Indian Numbering System format (e.g. 1,25,000).
 * @param {number|string} num 
 * @returns {string}
 */
export function formatIndianNumber(num) {
  if (num === null || num === undefined || isNaN(Number(num))) return "0";
  const val = Number(num);
  return new Intl.NumberFormat("en-IN").format(val);
}

/**
 * Formats date into Indian format (e.g., 20 Jul 2026 or 20/07/2026).
 * @param {Date|string|number} dateInput 
 * @param {boolean} numeric - if true, returns DD/MM/YYYY else DD MMM YYYY
 * @returns {string}
 */
export function formatIndianDate(dateInput, numeric = false) {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  if (numeric) {
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = d.getDate();
  const monthStr = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${monthStr} ${year}`;
}

/**
 * Formats time into 24-hour format (e.g., 18:45 IST).
 * @param {Date|string|number} dateInput 
 * @param {boolean} includeZone 
 * @returns {string}
 */
export function format24HourTime(dateInput, includeZone = true) {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}${includeZone ? " IST" : ""}`;
}
