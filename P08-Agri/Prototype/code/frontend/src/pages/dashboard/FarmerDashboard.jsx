import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetch_weather_by_coords } from '../../services/weatherService'
import { diagnose_image } from '../../services/diagnoseService'
import { send_complaint } from '../../services/helpService'
import { changePassword } from '../../services/authService'
import { send_chat_message } from '../../services/chatService'
import { useLanguage } from '../../contexts/LanguageContext'

function FarmerDashboard() {
  const navigate = useNavigate()
  const { t, language, setLanguage, direction } = useLanguage()
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

  const [is_chat_open, set_is_chat_open] = useState(false)
  const [chat_messages, set_chat_messages] = useState([])
  const [chat_input, set_chat_input] = useState('')
  const [is_sending_chat, set_is_sending_chat] = useState(false)
  const [chat_error_text, set_chat_error_text] = useState('')

  function handle_logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  function get_browser_location() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject('Geolocation not supported')
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          reject('Location permission denied or unavailable')
        }
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
      const data = await fetch_weather_by_coords(coords.latitude, coords.longitude, language)
      set_weather_data(data)
    } catch (err) {
      const msg = typeof err === 'string' ? err : (err && err.message ? err.message : t.farmerDashboard.failedToGetWeather)
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
      set_is_chat_open(false)
      set_chat_messages([])
      set_chat_input('')
      set_chat_error_text('')
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
    set_is_chat_open(false)
    set_chat_messages([])
    set_chat_input('')
    set_chat_error_text('')
    try {
      const data = await diagnose_image(selected_file)
      set_diagnose_result(data)
    } catch (err) {
      const message = err && err.message ? err.message : t.farmerDashboard.analysisFailed
      set_diagnose_error(message)
    } finally {
      set_is_uploading(false)
    }
  }

  useEffect(() => {
    if (diagnose_result) {
      const confidence =
        typeof diagnose_result.confidence === 'number'
          ? (diagnose_result.confidence * 100).toFixed(1)
          : 'unknown'

      const intro_message = {
        role: 'assistant',
        content:
          `${t.farmerDashboard.analyzedWheatImage} "${diagnose_result.diagnosis}" ` +
          (confidence !== 'unknown' ? `${t.farmerDashboard.withConfidence} ${confidence}${t.farmerDashboard.confidencePercent} ` : '') +
          t.farmerDashboard.askFollowUp
      }

      set_is_chat_open(true)
      set_chat_messages([intro_message])
      set_chat_input('')
      set_chat_error_text('')
    } else {
      set_is_chat_open(false)
      set_chat_messages([])
      set_chat_input('')
      set_chat_error_text('')
    }
  }, [diagnose_result, t.farmerDashboard.analyzedWheatImage, t.farmerDashboard.askFollowUp, t.farmerDashboard.confidencePercent, t.farmerDashboard.withConfidence])

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
    if (help_error_text) set_help_error_text('')
    if (help_success_text) set_help_success_text('')
  }

  function handle_help_message_change(e) {
    set_help_message(e.target.value)
    if (help_error_text) set_help_error_text('')
    if (help_success_text) set_help_success_text('')
  }

  async function handle_help_submit(e) {
    e.preventDefault()
    if (is_sending_help) return
    const subject_trimmed = help_subject.trim()
    const message_trimmed = help_message.trim()
    if (!subject_trimmed || !message_trimmed) {
      set_help_error_text(t.farmerDashboard.subjectAndMessageRequired)
      return
    }
    set_is_sending_help(true)
    set_help_error_text('')
    set_help_success_text('')
    try {
      await send_complaint({ subject: subject_trimmed, message: message_trimmed })
      set_help_success_text(t.farmerDashboard.helpSubmitSuccess)
      set_help_subject('')
      set_help_message('')
    } catch (error) {
      const message = error && error.message ? error.message : t.farmerDashboard.helpSubmitFailed
      set_help_error_text(message)
    } finally {
      set_is_sending_help(false)
    }
  }

  function toggle_profile_menu() {
    set_is_profile_menu_open((prev) => !prev)
  }

  function open_change_password_modal() {
    set_old_password_first('')
    set_old_password_second('')
    set_new_password('')
    set_cp_error_text('')
    set_cp_success_text('')
    set_is_changing_password(false)
    set_is_change_password_open(true)
    set_is_profile_menu_open(false)
  }

  function close_change_password_modal() {
    if (is_changing_password) {
      return
    }
    set_is_change_password_open(false)
  }

  function handle_old_password_first_change(e) {
    set_old_password_first(e.target.value)
    if (cp_error_text) set_cp_error_text('')
    if (cp_success_text) set_cp_success_text('')
  }

  function handle_old_password_second_change(e) {
    set_old_password_second(e.target.value)
    if (cp_error_text) set_cp_error_text('')
    if (cp_success_text) set_cp_success_text('')
  }

  function handle_new_password_change(e) {
    set_new_password(e.target.value)
    if (cp_error_text) set_cp_error_text('')
    if (cp_success_text) set_cp_success_text('')
  }

  async function handle_change_password_submit(e) {
    e.preventDefault()
    if (is_changing_password) return
    const old1 = old_password_first.trim()
    const old2 = old_password_second.trim()
    const newP = new_password.trim()
    if (!old1 || !old2 || !newP) {
      set_cp_error_text(t.farmerDashboard.allFieldsRequired)
      return
    }
    if (old1 !== old2) {
      set_cp_error_text(t.farmerDashboard.oldPasswordMismatch)
      return
    }
    set_is_changing_password(true)
    set_cp_error_text('')
    set_cp_success_text('')
    try {
      await changePassword(old1, newP)
      set_cp_success_text(t.farmerDashboard.passwordChangeSuccess)
      set_old_password_first('')
      set_old_password_second('')
      set_new_password('')
    } catch (error) {
      const message = error && error.message ? error.message : t.farmerDashboard.passwordChangeFailed
      set_cp_error_text(message)
    } finally {
      set_is_changing_password(false)
    }
  }

  function handle_chat_input_change(e) {
    set_chat_input(e.target.value)
    if (chat_error_text) set_chat_error_text('')
  }

  async function handle_chat_submit(e) {
    e.preventDefault()
    if (is_sending_chat) return
    const trimmed = chat_input.trim()
    if (!trimmed) return
    if (!diagnose_result) {
      set_chat_error_text(t.farmerDashboard.selectImageFirst)
      return
    }
    const user_message = { role: 'user', content: trimmed }
    const next_messages = [...chat_messages, user_message]
    set_chat_messages(next_messages)
    set_chat_input('')
    set_is_sending_chat(true)
    set_chat_error_text('')
    try {
      const result = await send_chat_message({
        diagnosis: diagnose_result,
        messages: next_messages,
        language
      })
      const assistant_message = { role: 'assistant', content: result.content }
      set_chat_messages((prev) => [...prev, assistant_message])
    } catch (error) {
      const message = error && error.message ? error.message : t.dashboard.helpSubmitFailed
      set_chat_error_text(message)
    } finally {
      set_is_sending_chat(false)
    }
  }

  const fields = [
    { name: 'North Field', status: 'healthy', area: '5 acres', variety: 'Punjab-11', sowing: 'Oct 2024', location: 'Lahore, Punjab' },
    { name: 'East Field', status: 'attention', area: '3 acres', variety: 'Faisalabad-2008', sowing: 'Nov 2024', location: 'Lahore, Punjab' },
    { name: 'South Field', status: 'healthy', area: '7 acres', variety: 'Sehar-2006', sowing: 'Oct 2024', location: 'Lahore, Punjab' },
  ]

  const history_items = [
    { field: 'North Field', time: `2 ${t.farmerDashboard.hoursAgo}`, status: 'healthy', label: t.farmerDashboard.healthy },
    { field: 'East Field', time: `1 ${t.farmerDashboard.dayAgo}`, status: 'warning', label: t.farmerDashboard.rustDetected },
    { field: 'South Field', time: `3 ${t.farmerDashboard.daysAgo}`, status: 'healthy', label: t.farmerDashboard.healthy },
  ]

  return (
    <div dir={direction} className="min-h-screen bg-[#FAFDF7]">
      {/* Subtle gradient background for top section */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'linear-gradient(to bottom, #EDF5E1 0%, #FAFDF7 50%, #FAFDF7 100%)',
        zIndex: 0
      }}></div>

      {/* NAVBAR */}
      <header className="sticky top-0 z-30 bg-[#FEFFFE] border-b-2 border-[#E0E7DD]">
        <div className={`max-w-[1180px] mx-auto px-6 py-3 flex ${direction === 'rtl' ? 'flex-row-reverse' : 'flex-row'} justify-between items-center`}>
          <div className={`flex ${direction === 'rtl' ? 'flex-row-reverse' : 'flex-row'} items-center gap-3`}>
            <span className="text-lg font-semibold text-[#1B1B1B]">AgriQual</span>
            <span className="text-[13px] text-[#6B7280]">{t.farmerDashboard.welcome}, {user.name || 'Farmer'}</span>
          </div>
          <div className={`flex ${direction === 'rtl' ? 'flex-row-reverse' : 'flex-row'} items-center gap-5`}>
            <button
              onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
              className="px-2.5 py-1 text-xs bg-[#F3F7F0] text-[#6B7280] rounded-md hover:bg-[#E0E7DD] transition-colors"
            >
              {language === 'en' ? '\u0627\u0631\u062f\u0648' : 'English'}
            </button>
            <button
              type="button"
              onClick={handle_get_weather}
              className="text-sm font-medium text-[#6B7280] hover:text-[#1B1B1B] transition-colors"
              disabled={is_getting_weather}
            >
              {is_getting_weather ? t.farmerDashboard.gettingWeather : t.farmerDashboard.getWeather}
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
              className="px-5 py-2 text-sm font-medium bg-[#F4A261] text-white rounded-lg hover:bg-[#e89451] active:scale-[0.98] transition-all duration-150 shadow-sm"
            >
              {t.farmerDashboard.uploadImage}
            </button>
            <button
              type="button"
              onClick={() => navigate('/diagnostic-history')}
              className="text-sm font-medium text-[#6B7280] hover:text-[#1B1B1B] transition-colors"
            >
              {t.farmerDashboard.viewHistory}
            </button>
            <button
              type="button"
              onClick={open_help_modal}
              className="text-sm font-medium text-[#6B7280] hover:text-[#1B1B1B] transition-colors"
            >
              {t.farmerDashboard.needHelp}
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={toggle_profile_menu}
                className="flex items-center text-sm text-[#6B7280] hover:text-[#1B1B1B] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {is_profile_menu_open && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-[#E0E7DD] rounded-lg shadow-md z-50">
                  <button
                    type="button"
                    onClick={open_change_password_modal}
                    className="block w-full text-left px-4 py-2.5 text-sm text-[#1B1B1B] hover:bg-[#F3F7F0] rounded-t-lg"
                  >
                    {t.farmerDashboard.changePassword}
                  </button>
                  <button
                    onClick={handle_logout}
                    className="block w-full text-left px-4 py-2.5 text-sm text-[#DC2626] hover:bg-[#FEF2F2] rounded-b-lg"
                  >
                    {t.farmerDashboard.logout}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="relative z-10 max-w-[1180px] mx-auto px-6 py-8">
        {/* TOP: 2-column layout */}
        <div className="grid gap-8 items-start" style={{ gridTemplateColumns: '1fr 400px' }}>
          {/* LEFT: Wheat Fields */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-semibold text-[#1F3D2E]">{t.farmerDashboard.myWheatFields}</h2>
              <button 
                type="button" 
                className="border border-[#2D6A4F] rounded-lg px-4 py-2 text-[13px] font-medium text-[#2D6A4F] hover:bg-[#F3F7F0] transition-colors"
              >
                + {t.farmerDashboard.addNewField}
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {fields.map((field) => {
                const isAlert = field.status === 'attention'
                return (
                  <div
                    key={field.name}
                    className={`bg-white rounded-xl px-5 py-5 flex items-center justify-between cursor-pointer hover:shadow-md hover:-translate-y-px hover:bg-[#F9FBF6] transition-all duration-150 border border-[#E0E7DD] relative overflow-hidden`}
                  >
                    {/* Status indicator bar */}
                    <div 
                      className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full ${
                        isAlert ? 'bg-[#F59E0B]' : 'bg-[#16A34A]'
                      }`}
                      style={{ height: '60%' }}
                    ></div>
                    
                    <div className="pl-3">
                      <span className="text-[15px] font-semibold text-[#1B1B1B]">{field.name}</span>
                      {isAlert ? (
                        <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF3C7] text-[#F59E0B]">
                          {t.farmerDashboard.needsAttention}
                        </span>
                      ) : (
                        <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#DCFCE7] text-[#16A34A]">
                          {t.farmerDashboard.healthy}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[13px] text-[#6B7280]">
                      <span>{field.area}</span>
                      <span className="w-px h-4 bg-[#E0E7DD]"></span>
                      <span className="hidden lg:inline">{field.variety}</span>
                      <span className="hidden lg:inline w-px h-4 bg-[#E0E7DD]"></span>
                      <span className="hidden lg:inline">{field.sowing}</span>
                      <span className="text-[#9CA3AF] ml-2">{'\u2192'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* RIGHT: Diagnosis */}
          <div>
            {selected_file ? (
              <div className="bg-white border border-[#E0E7DD] border-t-[3px] border-t-[#2D6A4F] rounded-xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[16px] font-semibold text-[#1B1B1B]">{t.farmerDashboard.diagnosisResults}</h2>
                  <button
                    type="button"
                    onClick={() => {
                      set_selected_file(null)
                      set_preview_url('')
                      set_diagnose_result(null)
                      set_diagnose_error('')
                      set_is_chat_open(false)
                      set_chat_messages([])
                      set_chat_input('')
                      set_chat_error_text('')
                    }}
                    className="text-[13px] text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                  >
                    {t.common.close}
                  </button>
                </div>

                {preview_url && (
                  <img src={preview_url} alt="preview" className="w-full max-h-[260px] object-cover rounded-lg mb-4" />
                )}

                <button
                  type="button"
                  onClick={handle_analyze_click}
                  className="w-full px-5 py-2.5 text-sm font-medium bg-[#2D6A4F] text-white rounded-lg hover:bg-[#245840] hover:shadow-[0_0_16px_rgba(45,106,79,0.3)] active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
                  disabled={is_uploading}
                >
                  {is_uploading ? t.farmerDashboard.analyzing : t.farmerDashboard.analyzeImage}
                </button>

                {diagnose_error && (
                  <div className="mt-3 bg-[#FEF2F2] border border-[#FEE2E2] text-[#DC2626] px-3 py-2 rounded-lg text-sm">
                    {diagnose_error}
                  </div>
                )}

                {!diagnose_result && !diagnose_error && (
                  <p className="mt-3 text-[13px] text-[#9CA3AF]">{t.farmerDashboard.selectImageFirst}</p>
                )}

                {diagnose_result && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <span className="text-[12px] uppercase tracking-[0.05em] font-medium text-[#9CA3AF]">{t.farmerDashboard.diagnosis}</span>
                      <p className="text-[16px] font-semibold text-[#1B1B1B] capitalize">{diagnose_result.diagnosis}</p>
                    </div>
                    <div>
                      <span className="text-[12px] uppercase tracking-[0.05em] font-medium text-[#9CA3AF]">{t.farmerDashboard.confidence}</span>
                      <p className="text-[15px] font-medium text-[#1B1B1B]">
                        {typeof diagnose_result.confidence === 'number'
                          ? (diagnose_result.confidence * 100).toFixed(1) + '%'
                          : 'N/A'}
                      </p>
                    </div>
                    {Array.isArray(diagnose_result.recommendations) && diagnose_result.recommendations.length > 0 && (
                      <div>
                        <span className="text-[12px] uppercase tracking-[0.05em] font-medium text-[#9CA3AF]">{t.farmerDashboard.recommendations}</span>
                        <div className="mt-1 space-y-1.5">
                          {diagnose_result.recommendations.map((r, i) => (
                            <p key={i} className="text-[14px] text-[#1B1B1B] leading-relaxed">{i + 1}. {r}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {Array.isArray(diagnose_result.alternatives) && diagnose_result.alternatives.length > 0 && (
                      <div>
                        <span className="text-[12px] uppercase tracking-[0.05em] font-medium text-[#9CA3AF]">{t.farmerDashboard.alternatives}</span>
                        <div className="mt-1 space-y-1">
                          {diagnose_result.alternatives.map((a, i) => (
                            <p key={i} className="text-[14px] text-[#1B1B1B] capitalize">{a.label} — {(a.confidence * 100).toFixed(1)}%</p>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-[12px] text-[#9CA3AF]">{t.farmerDashboard.processingTime}: {diagnose_result.processing_ms}ms</p>
                  </div>
                )}

                {/* Chat */}
                {is_chat_open && (
                  <div className="mt-5 pt-4 border-t border-[#E0E7DD]">
                    <h3 className="text-[14px] font-semibold text-[#1B1B1B] mb-2">{t.farmerDashboard.aiAssistant}</h3>
                    <div className="h-48 bg-[#FAFDF7] rounded-lg p-3 overflow-y-auto mb-3">
                      {chat_messages.length === 0 && (
                        <p className="text-[13px] text-[#9CA3AF]">{t.farmerDashboard.askFollowUp}</p>
                      )}
                      {chat_messages.map((msg, index) => (
                        <div key={index} className={`mb-2 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-lg px-3 py-2 text-[13px] ${
                            msg.role === 'user'
                              ? 'bg-[#2D6A4F] text-white'
                              : 'bg-white border border-[#E0E7DD] text-[#1B1B1B]'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                    {chat_error_text && (
                      <div className="mb-2 bg-[#FEF2F2] border border-[#FEE2E2] text-[#DC2626] px-3 py-2 rounded-lg text-[13px]">
                        {chat_error_text}
                      </div>
                    )}
                    <form className="flex gap-2" onSubmit={handle_chat_submit}>
                      <input
                        type="text"
                        value={chat_input}
                        onChange={handle_chat_input_change}
                        disabled={is_sending_chat}
                        className="flex-1 px-3 py-2 border border-[#D1D5DB] rounded-lg text-[#1B1B1B] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#52B788] focus:border-transparent text-[13px] disabled:bg-gray-50"
                        placeholder={t.farmerDashboard.chatPlaceholder}
                      />
                      <button
                        type="submit"
                        disabled={is_sending_chat || !chat_input.trim()}
                        className="px-4 py-2 bg-[#2D6A4F] text-white rounded-lg hover:bg-[#245840] text-[13px] font-medium disabled:opacity-50 transition-colors"
                      >
                        {is_sending_chat ? t.common.sending : t.common.send}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <div
                onClick={handle_click_upload_button}
                className="bg-[#F8FAF5] border-2 border-dashed border-[#D1D5DB] rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#52B788] hover:bg-[#FAFDF7] transition-all duration-150 min-h-[200px]"
              >
                <svg className="w-10 h-10 text-[#52B788] mb-3 animate-pulse" style={{ animationDuration: '2s' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-[14px] font-medium text-[#6B7280]">{t.farmerDashboard.uploadImage}</p>
                <p className="text-[12px] text-[#9CA3AF] mt-1">Click to select a wheat image</p>
              </div>
            )}
          </div>
        </div>

        {/* WEATHER */}
        {weather_error && (
          <div className="mt-6 bg-[#FEF2F2] border border-[#FEE2E2] text-[#DC2626] px-4 py-3 rounded-lg text-sm">
            {weather_error}
          </div>
        )}

        {weather_data && (
          <div className="mt-10">
            <div className="my-12 h-px" style={{ background: 'linear-gradient(to right, transparent, #D1D5DB, transparent)' }}></div>
            <div className="flex items-start justify-between gap-8">
              <div className="flex-1">
                <div className="flex items-baseline gap-3 mb-1">
                  <h2 className="text-[18px] font-semibold text-[#1F3D2E]">{t.farmerDashboard.currentWeather}</h2>
                  <span className="text-[14px] text-[#6B7280]">
                    {weather_data.city} — {weather_data.current.temperature_c}°C
                  </span>
                </div>
                <p className="text-[13px] text-[#9CA3AF]">
                  {t.farmerDashboard.windSpeed} {weather_data.current.wind_speed_kmh} km/h
                  {' · '}{t.farmerDashboard.precipitation} {weather_data.today.precipitation_mm}mm
                  {' · '}{t.farmerDashboard.uvIndex} {weather_data.today.uv_index_max}
                </p>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-[11px] uppercase tracking-wider text-[#9CA3AF] font-medium">{t.farmerDashboard.maxTemp}</p>
                  <p className="text-[20px] font-semibold text-[#1B1B1B]">{weather_data.today.tmax_c}°C</p>
                </div>
                <div className="text-center">
                  <p className="text-[11px] uppercase tracking-wider text-[#9CA3AF] font-medium">{t.farmerDashboard.minTemp}</p>
                  <p className="text-[20px] font-semibold text-[#1B1B1B]">{weather_data.today.tmin_c}°C</p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-[13px] font-medium text-[#6B7280] mb-2">{t.farmerDashboard.recommendations}</p>
              {weather_data.advice.map((item, idx) => (
                <p key={idx} className="text-[14px] text-[#6B7280] leading-relaxed">{item}</p>
              ))}
            </div>

            {weather_data.llm_advice && (
              <div className="mt-4 bg-[#F3F7F0] rounded-lg p-4">
                <p className="text-[13px] font-medium text-[#2D6A4F] mb-1">{t.farmerDashboard.aiAssistant}</p>
                <div className="text-[14px] text-[#1B1B1B] whitespace-pre-line leading-relaxed">
                  {weather_data.llm_advice}
                </div>
              </div>
            )}
          </div>
        )}

        {/* DIAGNOSTIC HISTORY */}
        <div className="mt-10">
          <div className="my-12 h-px" style={{ background: 'linear-gradient(to right, transparent, #D1D5DB, transparent)' }}></div>
          <h2 className="text-[18px] font-semibold text-[#1F3D2E] mb-4">{t.diagnosticHistory.title}</h2>
          <div>
            <div className="grid grid-cols-[1fr_140px_140px] gap-4 px-4 pb-2 border-b border-[#E0E7DD]">
              <span className="text-[11px] uppercase tracking-[0.05em] font-medium text-[#9CA3AF]">Field</span>
              <span className="text-[11px] uppercase tracking-[0.05em] font-medium text-[#9CA3AF]">Date</span>
              <span className="text-[11px] uppercase tracking-[0.05em] font-medium text-[#9CA3AF] text-right">Status</span>
            </div>
            {history_items.map((item, idx) => (
              <div
                key={idx}
                className={`grid grid-cols-[1fr_140px_140px] gap-4 items-center px-4 py-3 ${
                  idx % 2 === 0 ? 'bg-[#FAFDF7]' : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    item.status === 'healthy' ? 'bg-[#16A34A]' : 'bg-[#F59E0B]'
                  }`}></div>
                  <span className="text-[14px] font-medium text-[#1B1B1B]">{t.farmerDashboard.diagnosisFor} {item.field}</span>
                </div>
                <span className="text-[12px] text-[#9CA3AF]">{item.time}</span>
                <span className="text-right">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${
                    item.status === 'healthy'
                      ? 'bg-[#DCFCE7] text-[#16A34A]'
                      : 'bg-[#FEE2E2] text-[#DC2626]'
                  }`}>
                    {item.label}
                  </span>
                </span>
              </div>
            ))}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => navigate('/diagnostic-history')}
                className="text-[13px] font-medium text-[#2D6A4F] hover:underline"
              >
                View all history
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* HELP MODAL */}
      {is_help_open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-semibold text-[#1B1B1B]">{t.farmerDashboard.needHelp}</h2>
              <button type="button" onClick={close_help_modal} className="text-[#9CA3AF] hover:text-[#6B7280]" disabled={is_sending_help}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {help_success_text && <div className="mb-4 bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] px-3 py-2 rounded-lg text-sm">{help_success_text}</div>}
            {help_error_text && <div className="mb-4 bg-[#FEF2F2] border border-[#FEE2E2] text-[#DC2626] px-3 py-2 rounded-lg text-sm">{help_error_text}</div>}
            <form className="space-y-4" onSubmit={handle_help_submit}>
              <div>
                <label className="text-sm font-medium text-[#6B7280]" htmlFor="help_subject_farmer">{t.farmerDashboard.helpSubject}</label>
                <input id="help_subject_farmer" type="text" value={help_subject} onChange={handle_help_subject_change} disabled={is_sending_help}
                  className="mt-1 w-full px-3 py-2.5 border border-[#D1D5DB] rounded-lg text-[#1B1B1B] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#52B788] focus:border-transparent disabled:bg-gray-50"
                  placeholder={t.farmerDashboard.helpSubjectPlaceholder} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#6B7280]" htmlFor="help_message_farmer">{t.farmerDashboard.helpMessage}</label>
                <textarea id="help_message_farmer" rows={4} value={help_message} onChange={handle_help_message_change} disabled={is_sending_help}
                  className="mt-1 w-full px-3 py-2.5 border border-[#D1D5DB] rounded-lg text-[#1B1B1B] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#52B788] focus:border-transparent disabled:bg-gray-50"
                  placeholder={t.farmerDashboard.helpMessagePlaceholder} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={close_help_modal} disabled={is_sending_help} className="px-4 py-2 text-[#6B7280] bg-[#F3F7F0] rounded-lg hover:bg-[#E0E7DD] text-sm disabled:opacity-60">{t.common.close}</button>
                <button type="submit" disabled={is_sending_help} className="px-5 py-2 bg-[#2D6A4F] text-white rounded-lg hover:bg-[#245840] text-sm font-medium disabled:opacity-50 flex items-center">
                  {is_sending_help && <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>}
                  {is_sending_help ? t.common.sending : t.common.send}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {is_change_password_open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-semibold text-[#1B1B1B]">{t.farmerDashboard.changePassword}</h2>
              <button type="button" onClick={close_change_password_modal} className="text-[#9CA3AF] hover:text-[#6B7280]" disabled={is_changing_password}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {cp_success_text && <div className="mb-4 bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] px-3 py-2 rounded-lg text-sm">{cp_success_text}</div>}
            {cp_error_text && <div className="mb-4 bg-[#FEF2F2] border border-[#FEE2E2] text-[#DC2626] px-3 py-2 rounded-lg text-sm">{cp_error_text}</div>}
            <form className="space-y-4" onSubmit={handle_change_password_submit}>
              <div>
                <label className="text-sm font-medium text-[#6B7280]" htmlFor="old_password_1_farmer">{t.farmerDashboard.oldPassword}</label>
                <input id="old_password_1_farmer" type="password" value={old_password_first} onChange={handle_old_password_first_change} disabled={is_changing_password}
                  className="mt-1 w-full px-3 py-2.5 border border-[#D1D5DB] rounded-lg text-[#1B1B1B] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#52B788] focus:border-transparent disabled:bg-gray-50"
                  placeholder={t.farmerDashboard.oldPasswordPlaceholder} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#6B7280]" htmlFor="old_password_2_farmer">{t.farmerDashboard.confirmOldPassword}</label>
                <input id="old_password_2_farmer" type="password" value={old_password_second} onChange={handle_old_password_second_change} disabled={is_changing_password}
                  className="mt-1 w-full px-3 py-2.5 border border-[#D1D5DB] rounded-lg text-[#1B1B1B] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#52B788] focus:border-transparent disabled:bg-gray-50"
                  placeholder={t.farmerDashboard.confirmOldPasswordPlaceholder} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#6B7280]" htmlFor="new_password_farmer">{t.farmerDashboard.newPassword}</label>
                <input id="new_password_farmer" type="password" value={new_password} onChange={handle_new_password_change} disabled={is_changing_password}
                  className="mt-1 w-full px-3 py-2.5 border border-[#D1D5DB] rounded-lg text-[#1B1B1B] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#52B788] focus:border-transparent disabled:bg-gray-50"
                  placeholder={t.farmerDashboard.newPasswordPlaceholder} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={close_change_password_modal} disabled={is_changing_password} className="px-4 py-2 text-[#6B7280] bg-[#F3F7F0] rounded-lg hover:bg-[#E0E7DD] text-sm disabled:opacity-60">{t.common.cancel}</button>
                <button type="submit" disabled={is_changing_password} className="px-5 py-2 bg-[#2D6A4F] text-white rounded-lg hover:bg-[#245840] text-sm font-medium disabled:opacity-50 flex items-center">
                  {is_changing_password && <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>}
                  {is_changing_password ? t.farmerDashboard.changing : t.farmerDashboard.changePasswordButton}
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