import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetch_weather_by_coords } from '../../services/weatherService'
import { diagnose_image } from '../../services/diagnoseService'
import { send_complaint } from '../../services/helpService'
import { changePassword } from '../../services/authService'

function Dashboard() {
  const navigate = useNavigate()
  const user_json = localStorage.getItem('user') || '{}'
  const user = JSON.parse(user_json)

  const [is_getting_weather, set_is_getting_weather] = useState(false)
  const [weather_error, set_weather_error] = useState('')
  const [weather_data, set_weather_data] = useState(null)

  const [selected_file, set_selected_file] = useState(null)
  const [preview_url, set_preview_url] = useState('')
  const [is_uploading, set_is_uploading] = useState(false)
  const [diagnose_error, set_diagnose_error] = useState('')
  const [diagnose_result, set_diagnose_result] = useState(null)
  const file_input_ref = useRef(null)

  const [is_help_open, set_is_help_open] = useState(false)
  const [help_subject, set_help_subject] = useState('')
  const [help_message, set_help_message] = useState('')
  const [help_error_text, set_help_error_text] = useState('')
  const [help_success_text, set_help_success_text] = useState('')
  const [is_sending_help, set_is_sending_help] = useState(false)

  const [is_profile_menu_open, set_is_profile_menu_open] = useState(false)
  const [is_change_password_open, set_is_change_password_open] = useState(false)
  const [old_password_first, set_old_password_first] = useState('')
  const [old_password_second, set_old_password_second] = useState('')
  const [new_password, set_new_password] = useState('')
  const [cp_error_text, set_cp_error_text] = useState('')
  const [cp_success_text, set_cp_success_text] = useState('')
  const [is_changing_password, set_is_changing_password] = useState(false)

  function handle_logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  function get_browser_location() {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation is not available'))
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latitude = pos.coords.latitude
          const longitude = pos.coords.longitude
          resolve({ latitude, longitude })
        },
        () => {
          reject(new Error('Location permission denied or unavailable'))
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      )
    })
  }

  async function handle_get_weather() {
    if (is_getting_weather) {
      return
    }
    set_weather_error('')
    set_is_getting_weather(true)
    set_weather_data(null)
    try {
      const coords = await get_browser_location()
      const data = await fetch_weather_by_coords(coords.latitude, coords.longitude)
      set_weather_data(data)
    } catch (err) {
      const msg = typeof err === 'string' ? err : err && err.message ? err.message : 'Failed to get weather'
      set_weather_error(msg)
    } finally {
      set_is_getting_weather(false)
    }
  }

  function handle_click_upload_button() {
    if (file_input_ref.current) {
      file_input_ref.current.click()
    }
  }

  function handle_file_change(e) {
    const file = e.target.files && e.target.files[0]
    if (file) {
      set_selected_file(file)
      set_preview_url(URL.createObjectURL(file))
      set_diagnose_result(null)
      set_diagnose_error('')
    }
  }

  async function handle_analyze_click() {
    if (!selected_file) {
      set_diagnose_error('Please select an image')
      return
    }
    set_is_uploading(true)
    set_diagnose_error('')
    set_diagnose_result(null)
    try {
      const data = await diagnose_image(selected_file)
      set_diagnose_result(data)
    } catch (err) {
      const message = err && err.message ? err.message : 'Analysis failed'
      set_diagnose_error(message)
    } finally {
      set_is_uploading(false)
    }
  }

  function open_help_modal() {
    set_help_subject('')
    set_help_message('')
    set_help_error_text('')
    set_help_success_text('')
    set_is_sending_help(false)
    set_is_help_open(true)
  }

  function close_help_modal() {
    if (is_sending_help) {
      return
    }
    set_is_help_open(false)
  }

  function handle_help_subject_change(e) {
    set_help_subject(e.target.value)
    if (help_error_text) {
      set_help_error_text('')
    }
    if (help_success_text) {
      set_help_success_text('')
    }
  }

  function handle_help_message_change(e) {
    set_help_message(e.target.value)
    if (help_error_text) {
      set_help_error_text('')
    }
    if (help_success_text) {
      set_help_success_text('')
    }
  }

  async function handle_help_submit(e) {
    e.preventDefault()
    if (is_sending_help) {
      return
    }

    const subject_trimmed = help_subject.trim()
    const message_trimmed = help_message.trim()

    if (!subject_trimmed || !message_trimmed) {
      set_help_error_text('Subject and message are required')
      return
    }

    set_is_sending_help(true)
    set_help_error_text('')
    set_help_success_text('')

    try {
      await send_complaint({ subject: subject_trimmed, message: message_trimmed })
      set_help_success_text('Your message has been sent successfully')
      set_help_subject('')
      set_help_message('')
    } catch (error) {
      const message = error && error.message ? error.message : 'Failed to send help request'
      set_help_error_text(message)
    } finally {
      set_is_sending_help(false)
    }
  }

  function toggle_profile_menu() {
    set_is_profile_menu_open(function (prev) {
      return !prev
    })
  }

  function open_change_password_modal() {
    set_is_profile_menu_open(false)
    set_old_password_first('')
    set_old_password_second('')
    set_new_password('')
    set_cp_error_text('')
    set_cp_success_text('')
    set_is_changing_password(false)
    set_is_change_password_open(true)
  }

  function close_change_password_modal() {
    if (is_changing_password) {
      return
    }
    set_is_change_password_open(false)
  }

  function handle_old_password_first_change(e) {
    set_old_password_first(e.target.value)
    if (cp_error_text) {
      set_cp_error_text('')
    }
    if (cp_success_text) {
      set_cp_success_text('')
    }
  }

  function handle_old_password_second_change(e) {
    set_old_password_second(e.target.value)
    if (cp_error_text) {
      set_cp_error_text('')
    }
    if (cp_success_text) {
      set_cp_success_text('')
    }
  }

  function handle_new_password_change(e) {
    set_new_password(e.target.value)
    if (cp_error_text) {
      set_cp_error_text('')
    }
    if (cp_success_text) {
      set_cp_success_text('')
    }
  }

  async function handle_change_password_submit(e) {
    e.preventDefault()
    if (is_changing_password) {
      return
    }

    const old1 = old_password_first
    const old2 = old_password_second
    const new_pass = new_password

    if (!old1 || !old2 || !new_pass) {
      set_cp_error_text('All fields are required')
      return
    }

    if (old1 !== old2) {
      set_cp_error_text('Old password entries do not match')
      return
    }

    if (new_pass.length < 8) {
      set_cp_error_text('New password must be at least 8 characters long')
      return
    }

    set_is_changing_password(true)
    set_cp_error_text('')
    set_cp_success_text('')

    try {
      await changePassword({ oldPassword: old1, newPassword: new_pass })
      set_cp_success_text('Your password has been changed successfully')
      set_old_password_first('')
      set_old_password_second('')
      set_new_password('')
    } catch (error) {
      const message = error && error.message ? error.message : 'Failed to change password'
      set_cp_error_text(message)
    } finally {
      set_is_changing_password(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">AgriQual Dashboard</h1>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handle_get_weather}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:opacity-60"
              disabled={is_getting_weather}
            >
              {is_getting_weather ? 'Getting weather...' : 'Get Weather update'}
            </button>
            <input
              ref={file_input_ref}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handle_file_change}
            />
            <button
              type="button"
              onClick={handle_click_upload_button}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              Upload a Picture
            </button>
            <button
              type="button"
              onClick={open_help_modal}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              Help
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={toggle_profile_menu}
                className="flex items-center text-sm text-gray-600 hover:text-gray-800 focus:outline-none"
              >
                <span>
                  Welcome, <span className="font-medium">{user.name || 'User'}</span>
                </span>
                <svg
                  className="w-4 h-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {is_profile_menu_open && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <button
                    type="button"
                    onClick={open_change_password_modal}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Change Password
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={handle_logout}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* existing dashboard content (weather, diagnose, cards, activity) remains exactly as before */}
      {/* ... THE REST OF YOUR DASHBOARD CONTENT FROM PREVIOUS VERSION ... */}
      {/* (for brevity I’m not re-pasting all the middle sections again; keep them as in the version you already have with Help) */}

      {/* Help modal */}
      {is_help_open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Need help?</h2>
              <button
                type="button"
                onClick={close_help_modal}
                className="text-gray-500 hover:text-gray-700"
                disabled={is_sending_help}
              >
                ✕
              </button>
            </div>

            {help_success_text && (
              <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded">
                <svg
                  className="w-5 h-5 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">{help_success_text}</span>
              </div>
            )}

            {help_error_text && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {help_error_text}
              </div>
            )}

            <form className="space-y-4" onSubmit={handle_help_submit}>
              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="help_subject">
                  Subject
                </label>
                <input
                  id="help_subject"
                  type="text"
                  value={help_subject}
                  onChange={handle_help_subject_change}
                  disabled={is_sending_help}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="Briefly describe your issue"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="help_message">
                  Message
                </label>
                <textarea
                  id="help_message"
                  rows={4}
                  value={help_message}
                  onChange={handle_help_message_change}
                  disabled={is_sending_help}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="Tell us what you need help with"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={close_help_modal}
                  disabled={is_sending_help}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-60"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={is_sending_help}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60 flex items-center justify-center"
                >
                  {is_sending_help && (
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                  )}
                  {is_sending_help ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change password modal */}
      {is_change_password_open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
              <button
                type="button"
                onClick={close_change_password_modal}
                className="text-gray-500 hover:text-gray-700"
                disabled={is_changing_password}
              >
                ✕
              </button>
            </div>

            {cp_success_text && (
              <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded">
                <svg
                  className="w-5 h-5 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">{cp_success_text}</span>
              </div>
            )}

            {cp_error_text && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {cp_error_text}
              </div>
            )}

            <form className="space-y-4" onSubmit={handle_change_password_submit}>
              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="old_password_1">
                  Old password
                </label>
                <input
                  id="old_password_1"
                  type="password"
                  value={old_password_first}
                  onChange={handle_old_password_first_change}
                  disabled={is_changing_password}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="Enter your current password"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="old_password_2">
                  Confirm old password
                </label>
                <input
                  id="old_password_2"
                  type="password"
                  value={old_password_second}
                  onChange={handle_old_password_second_change}
                  disabled={is_changing_password}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="Re-enter your current password"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="new_password">
                  New password
                </label>
                <input
                  id="new_password"
                  type="password"
                  value={new_password}
                  onChange={handle_new_password_change}
                  disabled={is_changing_password}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="At least 8 characters"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={close_change_password_modal}
                  disabled={is_changing_password}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={is_changing_password}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60 flex items-center justify-center"
                >
                  {is_changing_password && (
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                  )}
                  {is_changing_password ? 'Changing...' : 'Change password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
