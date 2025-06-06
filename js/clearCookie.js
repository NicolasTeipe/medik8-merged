/**
 * Deletes a cookie by setting its value to an empty string, and an expiration date in the past.
 *
 * @param {Event} e - The event obj.
 * @param {array} cookieArray - An array of cookies to be deleted
 * @param {boolean} reload [optional] - A flag indicating whether to reload the page after deleting the cookie (defaults to false).
 *
 * @returns {void}
 */
export function clearCookie(e, cookieArray, reload) {
  e.preventDefault();

  cookieArray.forEach(cookieName => {
    document.cookie = `${cookieName}=; Path=/; Domain=medik8.com; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
    if (reload) location.reload();
  });
}
