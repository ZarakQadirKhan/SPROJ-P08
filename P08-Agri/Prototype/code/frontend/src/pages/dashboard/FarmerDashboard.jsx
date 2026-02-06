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

  /* ─── ALL HANDLERS (unchanged) ─── */

  function handle_logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  function get_browser_location() {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error(t.farmerDashboard.geolocationNotAvailable))
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => reject(new Error(t.farmerDashboard.locationPermissionDenied)),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      )
    })
  }

  async function handle_get_weather() {
    if (is_getting_weather) return
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
    if (file_input_ref.current) file_input_ref.current.click()
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
    if (!selected_file) { set_diagnose_error('Please select an image'); return }
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
      set_diagnose_error(err && err.message ? err.message : t.farmerDashboard.analysisFailed)
    } finally {
      set_is_uploading(false)
    }
  }

  useEffect(() => {
    if (diagnose_result) {
      const confidence = typeof diagnose_result.confidence === 'number' ? (diagnose_result.confidence * 100).toFixed(1) : 'unknown'
      const intro_message = {
        role: 'assistant',
        content: `${t.farmerDashboard.analyzedWheatImage} "${diagnose_result.diagnosis}" ` +
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
    set_help_subject(''); set_help_message(''); set_help_error_text(''); set_help_success_text(''); set_is_sending_help(false); set_is_help_open(true)
  }
  function close_help_modal() { if (is_sending_help) return; set_is_help_open(false) }
  function handle_help_subject_change(e) { set_help_subject(e.target.value); if (help_error_text) set_help_error_text(''); if (help_success_text) set_help_success_text('') }
  function handle_help_message_change(e) { set_help_message(e.target.value); if (help_error_text) set_help_error_text(''); if (help_success_text) set_help_success_text('') }

  async function handle_help_submit(e) {
    e.preventDefault()
    if (is_sending_help) return
    const subject_trimmed = help_subject.trim()
    const message_trimmed = help_message.trim()
    if (!subject_trimmed || !message_trimmed) { set_help_error_text(t.farmerDashboard.subjectAndMessageRequired); return }
    set_is_sending_help(true); set_help_error_text(''); set_help_success_text('')
    try {
      await send_complaint({ subject: subject_trimmed, message: message_trimmed })
      set_help_success_text(t.farmerDashboard.helpSubmitSuccess); set_help_subject(''); set_help_message('')
    } catch (error) {
      set_help_error_text(error && error.message ? error.message : t.farmerDashboard.helpSubmitFailed)
    } finally { set_is_sending_help(false) }
  }

  function toggle_profile_menu() { set_is_profile_menu_open((prev) => !prev) }

  function open_change_password_modal() {
    set_is_profile_menu_open(false); set_old_password_first(''); set_old_password_second(''); set_new_password('')
    set_cp_error_text(''); set_cp_success_text(''); set_is_changing_password(false); set_is_change_password_open(true)
  }
  function close_change_password_modal() { if (is_changing_password) return; set_is_change_password_open(false) }
  function handle_old_password_first_change(e) { set_old_password_first(e.target.value); if (cp_error_text) set_cp_error_text(''); if (cp_success_text) set_cp_success_text('') }
  function handle_old_password_second_change(e) { set_old_password_second(e.target.value); if (cp_error_text) set_cp_error_text(''); if (cp_success_text) set_cp_success_text('') }
  function handle_new_password_change(e) { set_new_password(e.target.value); if (cp_error_text) set_cp_error_text(''); if (cp_success_text) set_cp_success_text('') }

  async function handle_change_password_submit(e) {
    e.preventDefault()
    if (is_changing_password) return
    const old1 = old_password_first, old2 = old_password_second, new_pass = new_password
    if (!old1 || !old2 || !new_pass) { set_cp_error_text(t.register.passwordRequired); return }
    if (old1 !== old2) { set_cp_error_text(t.farmerDashboard.passwordsDoNotMatch); return }
    if (new_pass.length < 8) { set_cp_error_text(t.farmerDashboard.newPasswordTooShort); return }
    set_is_changing_password(true); set_cp_error_text(''); set_cp_success_text('')
    try {
      await changePassword({ oldPassword: old1, newPassword: new_pass })
      set_cp_success_text(t.farmerDashboard.passwordChangeSuccess); set_old_password_first(''); set_old_password_second(''); set_new_password('')
    } catch (error) {
      set_cp_error_text(error && error.message ? error.message : t.farmerDashboard.passwordChangeFailed)
    } finally { set_is_changing_password(false) }
  }

  function handle_chat_input_change(e) { set_chat_input(e.target.value); if (chat_error_text) set_chat_error_text('') }

  async function handle_chat_submit(e) {
    e.preventDefault()
    if (is_sending_chat) return
    const trimmed = chat_input.trim()
    if (!trimmed) return
    if (!diagnose_result) { set_chat_error_text(t.farmerDashboard.selectImageFirst); return }
    const user_message = { role: 'user', content: trimmed }
    const next_messages = [...chat_messages, user_message]
    set_chat_messages(next_messages); set_chat_input(''); set_is_sending_chat(true); set_chat_error_text('')
    try {
      const result = await send_chat_message({ diagnosis: diagnose_result, messages: next_messages, language })
      set_chat_messages((prev) => [...prev, { role: 'assistant', content: result.content }])
    } catch (error) {
      set_chat_error_text(error && error.message ? error.message : t.dashboard.helpSubmitFailed)
    } finally { set_is_sending_chat(false) }
  }

  function clear_diagnosis() {
    set_selected_file(null); set_preview_url(''); set_diagnose_result(null); set_diagnose_error('')
    set_is_chat_open(false); set_chat_messages([]); set_chat_input(''); set_chat_error_text('')
  }

  /* ─── DATA ─── */
  const fields = [
    { name: 'North Field', status: 'healthy', area: '5 acres', variety: 'Punjab-11', sowing: 'Oct 2024', location: 'Lahore, Punjab', health: 92 },
    { name: 'East Field', status: 'attention', area: '3 acres', variety: 'Faisalabad-2008', sowing: 'Nov 2024', location: 'Lahore, Punjab', health: 45 },
    { name: 'South Field', status: 'healthy', area: '7 acres', variety: 'Sehar-2006', sowing: 'Oct 2024', location: 'Lahore, Punjab', health: 88 },
  ]

  const scan_history = [
    { status: 'healthy' }, { status: 'healthy' }, { status: 'issue' },
    { status: 'healthy' }, { status: 'healthy' }, { status: 'healthy' },
    { status: 'issue' }, { status: 'healthy' }, { status: 'healthy' },
    { status: 'issue' }, { status: 'healthy' }, { status: 'healthy' },
  ]

  /* ─── RENDER ─── */
  return (
    <div dir={direction} className="min-h-screen bg-[#F9FAFB]">

      {/* ─── MINIMAL NAVBAR ─── */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 border-b border-[#D5DDD0]">
        <div className={`max-w-[1200px] mx-auto px-8 py-3.5 flex ${direction === 'rtl' ? 'flex-row-reverse' : 'flex-row'} justify-between items-center`}>
          <div className={`flex ${direction === 'rtl' ? 'flex-row-reverse' : 'flex-row'} items-center gap-2`}>
            <div className="w-8 h-8 rounded-lg bg-[#2D6A4F] flex items-center justify-center">
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <span className="text-[16px] font-semibold text-[#1B3A2D]">AgriQual</span>
          </div>
          <div className={`flex ${direction === 'rtl' ? 'flex-row-reverse' : 'flex-row'} items-center gap-4`}>
            <button
              onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
              className="px-2.5 py-1 text-[12px] bg-[#EDF2E8] text-[#5A6E52] rounded-md hover:bg-[#D5DDD0] transition-colors"
            >
              {language === 'en' ? '\u0627\u0631\u062f\u0648' : 'English'}
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={toggle_profile_menu}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#EDF2E8] transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-[#D5DDD0] flex items-center justify-center">
                  <span className="text-[12px] font-semibold text-[#3D5A3C]">{(user.name || 'F')[0].toUpperCase()}</span>
                </div>
                <span className="text-[13px] text-[#5A6E52] hidden sm:inline">{user.name || 'Farmer'}</span>
                <svg className="w-3.5 h-3.5 text-[#8A9A82]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {is_profile_menu_open && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white border border-[#D5DDD0] rounded-xl shadow-lg z-50 overflow-hidden">
                  <button type="button" onClick={open_change_password_modal} className="block w-full text-left px-4 py-2.5 text-[13px] text-[#1B3A2D] hover:bg-[#EDF2E8]">
                    {t.farmerDashboard.changePassword}
                  </button>
                  <button type="button" onClick={open_help_modal} className="block w-full text-left px-4 py-2.5 text-[13px] text-[#1B3A2D] hover:bg-[#EDF2E8]">
                    {t.farmerDashboard.needHelp}
                  </button>
                  <div className="border-t border-[#EDF2E8]"></div>
                  <button onClick={handle_logout} className="block w-full text-left px-4 py-2.5 text-[13px] text-[#B44A4A] hover:bg-[#FEF2F2]">
                    {t.farmerDashboard.logout}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <input ref={file_input_ref} type="file" accept="image/*" className="hidden" onChange={handle_file_change} />

      {/* ─── MAIN ─── */}
      <main className="max-w-[1200px] mx-auto px-8 py-8">

        {/* ─── GREETING ROW ─── */}
        <div className="mb-8">
          <h1 className="text-[26px] font-bold text-[#1B3A2D] tracking-tight">
            {t.farmerDashboard.welcome}, {user.name || 'Farmer'}
          </h1>
          <p className="text-[14px] text-[#6B7F64] mt-1">Manage your fields, scan crops, and track your harvest health.</p>
        </div>

        {/* ─── TOP ROW: Scan + Weather ─── */}
        <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: '1fr 380px' }}>

          {/* ── SCAN CARD ── */}
          <div className="bg-white rounded-2xl border border-[#D5DDD0] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)' }}>
            {selected_file ? (
              <div>
                {/* Image + controls */}
                <div className="relative">
                  {preview_url && (
                    <img src={preview_url} alt="preview" className="w-full h-[300px] object-cover" />
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      type="button"
                      onClick={clear_diagnosis}
                      className="px-3 py-1.5 text-[12px] font-medium bg-white/90 backdrop-blur-sm text-[#5A6E52] rounded-lg hover:bg-white transition-colors shadow-sm"
                    >
                      {t.common.close}
                    </button>
                  </div>
                </div>

                {/* Action bar */}
                <div className="px-6 py-4 border-t border-[#EDF2E8]">
                  <button
                    type="button"
                    onClick={handle_analyze_click}
                    className="w-full py-3 text-[14px] font-semibold bg-[#2D6A4F] text-white rounded-xl hover:bg-[#245840] active:scale-[0.99] transition-all duration-150 disabled:opacity-50"
                    disabled={is_uploading}
                  >
                    {is_uploading ? t.farmerDashboard.analyzing : t.farmerDashboard.analyzeImage}
                  </button>
                </div>

                {/* Error */}
                {diagnose_error && (
                  <div className="mx-6 mb-4 bg-[#FEF2F2] text-[#B44A4A] px-4 py-2.5 rounded-lg text-[13px]">{diagnose_error}</div>
                )}

                {/* Results */}
                {diagnose_result && (
                  <div className="px-6 pb-5">
                    <div className="flex items-start gap-6">
                      <div className="flex-1">
                        <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[#8A9A82] mb-1">{t.farmerDashboard.diagnosis}</p>
                        <p className="text-[20px] font-bold text-[#1B3A2D] capitalize leading-tight">{diagnose_result.diagnosis}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[#8A9A82] mb-1">{t.farmerDashboard.confidence}</p>
                        <p className="text-[22px] font-bold text-[#2D6A4F]">
                          {typeof diagnose_result.confidence === 'number' ? (diagnose_result.confidence * 100).toFixed(0) + '%' : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {Array.isArray(diagnose_result.recommendations) && diagnose_result.recommendations.length > 0 && (
                      <div className="mt-4 bg-[#F5F8F2] rounded-xl p-4">
                        <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[#8A9A82] mb-2">{t.farmerDashboard.recommendations}</p>
                        <div className="space-y-1.5">
                          {diagnose_result.recommendations.map((r, i) => (
                            <p key={i} className="text-[13px] text-[#3D5A3C] leading-relaxed">{r}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {Array.isArray(diagnose_result.alternatives) && diagnose_result.alternatives.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[#8A9A82] mb-2">{t.farmerDashboard.alternatives}</p>
                        <div className="flex gap-2 flex-wrap">
                          {diagnose_result.alternatives.map((a, i) => (
                            <span key={i} className="px-3 py-1.5 bg-[#EDF2E8] rounded-lg text-[12px] font-medium text-[#3D5A3C] capitalize">
                              {a.label} {(a.confidence * 100).toFixed(0)}%
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="mt-3 text-[11px] text-[#8A9A82]">{t.farmerDashboard.processingTime}: {diagnose_result.processing_ms}ms</p>
                  </div>
                )}

                {/* Chat */}
                {is_chat_open && (
                  <div className="px-6 pb-5 border-t border-[#EDF2E8] pt-4">
                    <p className="text-[12px] font-semibold text-[#3D5A3C] mb-3">{t.farmerDashboard.aiAssistant}</p>
                    <div className="h-44 bg-white border border-[#E0E7DD] rounded-xl p-3 overflow-y-auto mb-3 space-y-2">
                      {chat_messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-xl px-3.5 py-2 text-[13px] leading-relaxed ${
                            msg.role === 'user' ? 'bg-[#2D6A4F] text-white' : 'bg-white border border-[#D5DDD0] text-[#1B3A2D]'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                    {chat_error_text && <div className="mb-2 bg-[#FEF2F2] text-[#B44A4A] px-3 py-2 rounded-lg text-[12px]">{chat_error_text}</div>}
                    <form className="flex gap-2" onSubmit={handle_chat_submit}>
                      <input type="text" value={chat_input} onChange={handle_chat_input_change} disabled={is_sending_chat}
                        className="flex-1 px-3.5 py-2.5 border border-[#D5DDD0] rounded-xl text-[13px] text-[#1B3A2D] placeholder-[#8A9A82] focus:outline-none focus:ring-2 focus:ring-[#52B788] focus:border-transparent disabled:bg-gray-50"
                        placeholder={t.farmerDashboard.chatPlaceholder} />
                      <button type="submit" disabled={is_sending_chat || !chat_input.trim()}
                        className="px-4 py-2.5 bg-[#2D6A4F] text-white rounded-xl text-[13px] font-medium hover:bg-[#245840] disabled:opacity-50 transition-colors">
                        {is_sending_chat ? t.common.sending : t.common.send}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              /* ── Upload Dropzone ── */
              <div
                onClick={handle_click_upload_button}
                className="p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-white transition-all duration-200 min-h-[300px] group">
              >
                <div className="w-16 h-16 rounded-2xl bg-[#EDF2E8] flex items-center justify-center mb-4 group-hover:bg-[#D5DDD0] group-hover:scale-105 transition-all duration-200">
                  <svg className="w-7 h-7 text-[#52B788]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <p className="text-[16px] font-semibold text-[#1B3A2D]">{t.farmerDashboard.uploadImage}</p>
                <p className="text-[13px] text-[#8A9A82] mt-1">Drop an image or click to browse</p>
              </div>
            )}
          </div>

          {/* ── WEATHER + QUICK ACTIONS CARD ── */}
          <div className="flex flex-col gap-6">
            {/* Weather */}
            <div className="bg-white rounded-2xl border border-[#D5DDD0] p-5 flex-1" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)' }}>
              {weather_data ? (
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[#8A9A82]">{t.farmerDashboard.currentWeather}</p>
                      <p className="text-[13px] text-[#5A6E52] mt-0.5">{weather_data.city}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[36px] font-bold text-[#1B3A2D] leading-none">{weather_data.current.temperature_c}°</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-[#F5F8F2] rounded-xl p-3 text-center">
                      <p className="text-[10px] uppercase tracking-wider text-[#8A9A82] font-medium">{t.farmerDashboard.windSpeed.replace(' ', '')}</p>
                      <p className="text-[15px] font-semibold text-[#1B3A2D] mt-0.5">{weather_data.current.wind_speed_kmh}<span className="text-[11px] font-normal text-[#8A9A82]"> km/h</span></p>
                    </div>
                    <div className="bg-[#F5F8F2] rounded-xl p-3 text-center">
                      <p className="text-[10px] uppercase tracking-wider text-[#8A9A82] font-medium">Rain</p>
                      <p className="text-[15px] font-semibold text-[#1B3A2D] mt-0.5">{weather_data.today.precipitation_mm}<span className="text-[11px] font-normal text-[#8A9A82]"> mm</span></p>
                    </div>
                    <div className="bg-[#F5F8F2] rounded-xl p-3 text-center">
                      <p className="text-[10px] uppercase tracking-wider text-[#8A9A82] font-medium">UV</p>
                      <p className="text-[15px] font-semibold text-[#1B3A2D] mt-0.5">{weather_data.today.uv_index_max}</p>
                    </div>
                  </div>
                  {weather_data.advice && weather_data.advice.length > 0 && (
                    <div className="bg-[#FFFBEB] rounded-xl p-3.5">
                      <p className="text-[12px] font-semibold text-[#92710A] mb-1">Tip</p>
                      <p className="text-[12px] text-[#78650F] leading-relaxed">{weather_data.advice[0]}</p>
                    </div>
                  )}
                  {weather_data.llm_advice && (
                    <div className="mt-3 bg-white border border-[#E0E7DD] rounded-xl p-3.5">
                      <p className="text-[12px] font-semibold text-[#2D6A4F] mb-1">{t.farmerDashboard.aiAssistant}</p>
                      <p className="text-[12px] text-[#3D5A3C] leading-relaxed whitespace-pre-line">{weather_data.llm_advice}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-[#EDF2E8] flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-[#52B788]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
                    </svg>
                  </div>
                  <p className="text-[14px] font-semibold text-[#1B3A2D] mb-1">{t.farmerDashboard.currentWeather}</p>
                  <p className="text-[12px] text-[#8A9A82] mb-4">Check today's conditions for your area</p>
                  {weather_error && <p className="text-[12px] text-[#B44A4A] mb-3">{weather_error}</p>}
                  <button
                    type="button"
                    onClick={handle_get_weather}
                    disabled={is_getting_weather}
                    className="px-5 py-2.5 text-[13px] font-medium bg-[#2D6A4F] text-white rounded-xl hover:bg-[#245840] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {is_getting_weather ? t.farmerDashboard.gettingWeather : t.farmerDashboard.getWeather}
                  </button>
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => navigate('/diagnostic-history')}
                className="bg-white rounded-xl border border-[#D5DDD0] p-4 text-left hover:bg-[#F8FAF5] hover:border-[#B8C7B0] transition-all group"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              >
                <div className="w-8 h-8 rounded-lg bg-[#EDF2E8] flex items-center justify-center mb-2 group-hover:bg-[#D5DDD0] transition-colors">
                  <svg className="w-4 h-4 text-[#52B788]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-[13px] font-semibold text-[#1B3A2D]">{t.farmerDashboard.viewHistory}</p>
                <p className="text-[11px] text-[#8A9A82] mt-0.5">Past scans</p>
              </button>
              <button
                type="button"
                onClick={open_help_modal}
                className="bg-white rounded-xl border border-[#D5DDD0] p-4 text-left hover:bg-[#F8FAF5] hover:border-[#B8C7B0] transition-all group"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              >
                <div className="w-8 h-8 rounded-lg bg-[#EDF2E8] flex items-center justify-center mb-2 group-hover:bg-[#D5DDD0] transition-colors">
                  <svg className="w-4 h-4 text-[#52B788]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <p className="text-[13px] font-semibold text-[#1B3A2D]">{t.farmerDashboard.needHelp}</p>
                <p className="text-[11px] text-[#8A9A82] mt-0.5">Contact support</p>
              </button>
            </div>
          </div>
        </div>

        {/* ─── BOTTOM ROW: Fields + Scan History ─── */}
        <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 380px' }}>

          {/* ── FIELD HEALTH ── */}
          <div className="bg-white rounded-2xl border border-[#D5DDD0] p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-bold text-[#1B3A2D]">{t.farmerDashboard.myWheatFields}</h2>
              <button type="button" className="px-3.5 py-1.5 text-[12px] font-medium bg-[#EDF2E8] text-[#3D5A3C] rounded-lg hover:bg-[#D5DDD0] transition-colors">
                + {t.farmerDashboard.addNewField}
              </button>
            </div>
            <div className="space-y-4">
              {fields.map((field) => {
                const isAlert = field.status === 'attention'
                const barColor = isAlert ? '#F59E0B' : '#52B788'
                const barBg = isAlert ? '#FEF3C7' : '#DCFCE7'
                return (
                  <div key={field.name} className="group cursor-pointer">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[14px] font-semibold text-[#1B3A2D]">{field.name}</span>
                        {isAlert ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#FEF3C7] text-[#B7840A]">
                            {t.farmerDashboard.needsAttention}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#DCFCE7] text-[#16A34A]">
                            {t.farmerDashboard.healthy}
                          </span>
                        )}
                      </div>
                      <span className="text-[12px] text-[#8A9A82]">{field.area} · {field.variety}</span>
                    </div>
                    {/* Health bar */}
                    <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: barBg }}>
                      <div
                        className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                        style={{ width: `${field.health}%`, backgroundColor: barColor }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── SCAN HISTORY VISUAL ── */}
          <div className="bg-white rounded-2xl border border-[#D5DDD0] p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-bold text-[#1B3A2D]">Recent Scans</h2>
              <button
                type="button"
                onClick={() => navigate('/diagnostic-history')}
                className="text-[12px] font-medium text-[#2D6A4F] hover:underline"
              >
                View all
              </button>
            </div>

            {/* Mini scan grid */}
            <div className="grid grid-cols-6 gap-2 mb-5">
              {scan_history.map((scan, idx) => (
                <div
                  key={idx}
                  className="aspect-square rounded-lg"
                  style={{
                    backgroundColor: scan.status === 'healthy' ? '#DCFCE7' : '#FEE2E2',
                    border: `1px solid ${scan.status === 'healthy' ? '#BBF7D0' : '#FECACA'}`,
                  }}
                  title={scan.status === 'healthy' ? 'Healthy' : 'Issue detected'}
                ></div>
              ))}
            </div>

            {/* Summary */}
            <div className="flex gap-4">
              <div className="flex-1 bg-[#F0FAF0] rounded-xl p-3.5 text-center">
                <p className="text-[22px] font-bold text-[#16A34A]">9</p>
                <p className="text-[11px] text-[#5A6E52] font-medium mt-0.5">{t.farmerDashboard.healthy}</p>
              </div>
              <div className="flex-1 bg-[#FEF8F0] rounded-xl p-3.5 text-center">
                <p className="text-[22px] font-bold text-[#F59E0B]">3</p>
                <p className="text-[11px] text-[#78650F] font-medium mt-0.5">Issues</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── HELP MODAL ─── */}
      {is_help_open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-bold text-[#1B3A2D]">{t.farmerDashboard.needHelp}</h2>
              <button type="button" onClick={close_help_modal} className="text-[#8A9A82] hover:text-[#5A6E52]" disabled={is_sending_help}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {help_success_text && <div className="mb-4 bg-[#DCFCE7] text-[#16A34A] px-3 py-2.5 rounded-xl text-[13px]">{help_success_text}</div>}
            {help_error_text && <div className="mb-4 bg-[#FEF2F2] text-[#B44A4A] px-3 py-2.5 rounded-xl text-[13px]">{help_error_text}</div>}
            <form className="space-y-4" onSubmit={handle_help_submit}>
              <div>
                <label className="text-[12px] font-semibold text-[#5A6E52]" htmlFor="help_subject_farmer">{t.farmerDashboard.helpSubject}</label>
                <input id="help_subject_farmer" type="text" value={help_subject} onChange={handle_help_subject_change} disabled={is_sending_help}
                  className="mt-1.5 w-full px-3.5 py-2.5 border border-[#D5DDD0] rounded-xl text-[14px] text-[#1B3A2D] placeholder-[#8A9A82] focus:outline-none focus:ring-2 focus:ring-[#52B788] focus:border-transparent disabled:bg-gray-50"
                  placeholder={t.farmerDashboard.helpSubjectPlaceholder} />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-[#5A6E52]" htmlFor="help_message_farmer">{t.farmerDashboard.helpMessage}</label>
                <textarea id="help_message_farmer" rows={4} value={help_message} onChange={handle_help_message_change} disabled={is_sending_help}
                  className="mt-1.5 w-full px-3.5 py-2.5 border border-[#D5DDD0] rounded-xl text-[14px] text-[#1B3A2D] placeholder-[#8A9A82] focus:outline-none focus:ring-2 focus:ring-[#52B788] focus:border-transparent disabled:bg-gray-50"
                  placeholder={t.farmerDashboard.helpMessagePlaceholder} />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={close_help_modal} disabled={is_sending_help} className="px-4 py-2.5 text-[13px] text-[#5A6E52] bg-[#EDF2E8] rounded-xl hover:bg-[#D5DDD0] disabled:opacity-60">{t.common.close}</button>
                <button type="submit" disabled={is_sending_help} className="px-5 py-2.5 text-[13px] font-semibold bg-[#2D6A4F] text-white rounded-xl hover:bg-[#245840] disabled:opacity-50 flex items-center">
                  {is_sending_help && <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>}
                  {is_sending_help ? t.common.sending : t.common.send}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CHANGE PASSWORD MODAL ─── */}
      {is_change_password_open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-bold text-[#1B3A2D]">{t.farmerDashboard.changePassword}</h2>
              <button type="button" onClick={close_change_password_modal} className="text-[#8A9A82] hover:text-[#5A6E52]" disabled={is_changing_password}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {cp_success_text && <div className="mb-4 bg-[#DCFCE7] text-[#16A34A] px-3 py-2.5 rounded-xl text-[13px]">{cp_success_text}</div>}
            {cp_error_text && <div className="mb-4 bg-[#FEF2F2] text-[#B44A4A] px-3 py-2.5 rounded-xl text-[13px]">{cp_error_text}</div>}
            <form className="space-y-4" onSubmit={handle_change_password_submit}>
              <div>
                <label className="text-[12px] font-semibold text-[#5A6E52]" htmlFor="old_password_1_farmer">{t.farmerDashboard.oldPassword}</label>
                <input id="old_password_1_farmer" type="password" value={old_password_first} onChange={handle_old_password_first_change} disabled={is_changing_password}
                  className="mt-1.5 w-full px-3.5 py-2.5 border border-[#D5DDD0] rounded-xl text-[14px] text-[#1B3A2D] placeholder-[#8A9A82] focus:outline-none focus:ring-2 focus:ring-[#52B788] focus:border-transparent disabled:bg-gray-50"
                  placeholder={t.farmerDashboard.oldPasswordPlaceholder} />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-[#5A6E52]" htmlFor="old_password_2_farmer">{t.farmerDashboard.confirmOldPassword}</label>
                <input id="old_password_2_farmer" type="password" value={old_password_second} onChange={handle_old_password_second_change} disabled={is_changing_password}
                  className="mt-1.5 w-full px-3.5 py-2.5 border border-[#D5DDD0] rounded-xl text-[14px] text-[#1B3A2D] placeholder-[#8A9A82] focus:outline-none focus:ring-2 focus:ring-[#52B788] focus:border-transparent disabled:bg-gray-50"
                  placeholder={t.farmerDashboard.confirmOldPasswordPlaceholder} />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-[#5A6E52]" htmlFor="new_password_farmer">{t.farmerDashboard.newPassword}</label>
                <input id="new_password_farmer" type="password" value={new_password} onChange={handle_new_password_change} disabled={is_changing_password}
                  className="mt-1.5 w-full px-3.5 py-2.5 border border-[#D5DDD0] rounded-xl text-[14px] text-[#1B3A2D] placeholder-[#8A9A82] focus:outline-none focus:ring-2 focus:ring-[#52B788] focus:border-transparent disabled:bg-gray-50"
                  placeholder={t.farmerDashboard.newPasswordPlaceholder} />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={close_change_password_modal} disabled={is_changing_password} className="px-4 py-2.5 text-[13px] text-[#5A6E52] bg-[#EDF2E8] rounded-xl hover:bg-[#D5DDD0] disabled:opacity-60">{t.common.cancel}</button>
                <button type="submit" disabled={is_changing_password} className="px-5 py-2.5 text-[13px] font-semibold bg-[#2D6A4F] text-white rounded-xl hover:bg-[#245840] disabled:opacity-50 flex items-center">
                  {is_changing_password && <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>}
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