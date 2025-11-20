import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetch_weather_by_coords } from '../../services/weatherService'
import { diagnose_image } from '../../services/diagnoseService'
import { send_complaint } from '../../services/helpService'

function FarmerDashboard() {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">AgriQual - My Farm Dashboard</h1>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handle_get_weather}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:opacity-60"
              disabled={is_getting_weather}
            >
              {is_getting_weather ? 'Getting weather...' : 'Get Weather Advisory'}
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
              Upload Wheat Image
            </button>
            <button
              type="button"
              onClick={open_help_modal}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              Help
            </button>
            <span className="text-sm text-gray-600">
              Welcome, <span className="font-medium">{user.name || 'Farmer'}</span>
            </span>
            <button
              onClick={handle_logout}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selected_file && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Wheat Crop Diagnosis</h2>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handle_analyze_click}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-60"
                  disabled={is_uploading}
                >
                  {is_uploading ? 'Analyzing...' : 'Analyze'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    set_selected_file(null)
                    set_preview_url('')
                    set_diagnose_result(null)
                    set_diagnose_error('')
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                {preview_url && <img src={preview_url} alt="preview" className="w-full rounded-lg shadow" />}
              </div>
              <div>
                {diagnose_error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {diagnose_error}
                  </div>
                )}
                {diagnose_result && (
                  <div className="space-y-3">
                    <div className="text-lg">
                      Diagnosis:{' '}
                      <span className="font-semibold capitalize">{diagnose_result.diagnosis}</span>
                    </div>
                    <div>Confidence: {(diagnose_result.confidence * 100).toFixed(1)}%</div>
                    {Array.isArray(diagnose_result.recommendations) &&
                      diagnose_result.recommendations.length > 0 && (
                        <div>
                          <div className="font-medium">Recommendations</div>
                          <ul className="list-disc pl-6">
                            {diagnose_result.recommendations.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    {Array.isArray(diagnose_result.alternatives) &&
                      diagnose_result.alternatives.length > 0 && (
                        <div>
                          <div className="font-medium">Alternatives</div>
                          <ul className="list-disc pl-6">
                            {diagnose_result.alternatives.map((a, i) => (
                              <li key={i} className="capitalize">
                                {a.label} • {(a.confidence * 100).toFixed(1)}%
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    <div className="text-sm text-gray-600">
                      Processing time: {diagnose_result.processing_ms} ms
                    </div>
                  </div>
                )}
                {!diagnose_result && !diagnose_error && (
                  <p className="text-sm text-gray-600">Click Analyze to diagnose your wheat crop.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {weather_error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {weather_error}
          </div>
        )}

        {weather_data && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Weather Advisory for Your Crops</h2>
              <p className="text-sm text-gray-600">
                {weather_data.city} • {weather_data.current.temperature_c}°C • Wind{' '}
                {weather_data.current.wind_speed_kmh} km/h
              </p>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Max Temp</p>
                <p className="text-2xl font-semibold text-gray-900">{weather_data.today.tmax_c}°C</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Min Temp</p>
                <p className="text-2xl font-semibold text-gray-900">{weather_data.today.tmin_c}°C</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Precipitation</p>
                <p className="text-2xl font-semibold text-gray-900">{weather_data.today.precipitation_mm} mm</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">UV Index</p>
                <p className="text-2xl font-semibold text-gray-900">{weather_data.today.uv_index_max}</p>
              </div>
            </div>
            <div className="px-6 pb-6">
              <h3 className="text-md font-semibold text-gray-900 mb-3">Crop Care Recommendations</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                {weather_data.advice.map((item, idx) => (
                  <li key={idx} className="text-sm">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">My Wheat Fields</p>
                <p className="text-2xl font-semibold text-gray-900">5</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Diagnoses</p>
                <p className="text-2xl font-semibold text-gray-900">12</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg
                  className="w-8 h-8 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Recent Issues</p>
                <p className="text-2xl font-semibold text-gray-900">3</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">My Wheat Fields</h2>
            <button
              type="button"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm"
            >
              Add New Field
            </button>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 relative">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900">North Field</h3>
                <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded">Healthy</span>
              </div>
              <div className="space-y-1 text-sm text-gray-600 mb-4">
                <p>
                  Area: <span className="font-medium">5 acres</span>
                </p>
                <p>
                  Variety: <span className="font-medium">Punjab-11</span>
                </p>
                <p>
                  Sowing Date: <span className="font-medium">Oct 2024</span>
                </p>
                <p>
                  Location: <span className="font-medium">Lahore, Punjab</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                  View Details
                </button>
                <button className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                  Edit
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 relative">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900">East Field</h3>
                <span className="px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded">
                  Needs Attention
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-600 mb-4">
                <p>
                  Area: <span className="font-medium">3 acres</span>
                </p>
                <p>
                  Variety: <span className="font-medium">Faisalabad-2008</span>
                </p>
                <p>
                  Sowing Date: <span className="font-medium">Nov 2024</span>
                </p>
                <p>
                  Location: <span className="font-medium">Lahore, Punjab</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                  View Details
                </button>
                <button className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                  Edit
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 relative">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900">South Field</h3>
                <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded">Healthy</span>
              </div>
              <div className="space-y-1 text-sm text-gray-600 mb-4">
                <p>
                  Area: <span className="font-medium">7 acres</span>
                </p>
                <p>
                  Variety: <span className="font-medium">Sehar-2006</span>
                </p>
                <p>
                  Sowing Date: <span className="font-medium">Oct 2024</span>
                </p>
                <p>
                  Location: <span className="font-medium">Lahore, Punjab</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                  View Details
                </button>
                <button className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Diagnoses</h2>
          </div>
          <div className="divide-y divide-gray-200">
            <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Diagnosis for North Field</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded">Healthy</span>
            </div>
            <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Diagnosis for East Field</p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
              <span className="px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded">
                Rust Detected
              </span>
            </div>
            <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Diagnosis for South Field</p>
                  <p className="text-xs text-gray-500">3 days ago</p>
                </div>
              </div>
              <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded">Healthy</span>
            </div>
          </div>
        </div>
      </main>

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
                <label className="text-sm font-medium text-gray-700" htmlFor="help_subject_farmer">
                  Subject
                </label>
                <input
                  id="help_subject_farmer"
                  type="text"
                  value={help_subject}
                  onChange={handle_help_subject_change}
                  disabled={is_sending_help}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="Briefly describe your issue"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="help_message_farmer">
                  Message
                </label>
                <textarea
                  id="help_message_farmer"
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
    </div>
  )
}

export default FarmerDashboard
