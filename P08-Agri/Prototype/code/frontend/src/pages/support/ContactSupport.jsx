import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { submitSupportRequest } from '../../services/supportService'

function ContactSupport() {
  const navigate = useNavigate()
  const user_json = localStorage.getItem('user') || '{}'
  const user = JSON.parse(user_json)

  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    subject: '',
    message: ''
  })
  const [attachment, setAttachment] = useState(null)
  const [attachmentPreview, setAttachmentPreview] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [ticketId, setTicketId] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const fileInputRef = useRef(null)

  // Auto-fill name and email from user account (Alternate Course 1)
  useEffect(() => {
    if (user.name && !formData.name) {
      setFormData(prev => ({ ...prev, name: user.name }))
    }
    if (user.email && !formData.email) {
      setFormData(prev => ({ ...prev, email: user.email }))
    }
  }, [user])

  function handleInputChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
    setSubmitError('')
  }

  function handleFileChange(e) {
    const file = e.target.files && e.target.files[0]
    if (file) {
      // Check file size (5MB limit)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        setErrors(prev => ({
          ...prev,
          attachment: 'File size exceeds 5MB limit. Please upload a smaller file.'
        }))
        setAttachment(null)
        setAttachmentPreview('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }

      setAttachment(file)
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.attachment
        return newErrors
      })

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setAttachmentPreview(reader.result)
        }
        reader.readAsDataURL(file)
      } else {
        setAttachmentPreview('')
      }
      setSubmitError('')
    }
  }

  function handleRemoveAttachment() {
    setAttachment(null)
    setAttachmentPreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors.attachment
      return newErrors
    })
  }

  function validateForm() {
    const newErrors = {}

    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email || !formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Invalid email format'
      }
    }

    if (!formData.subject || !formData.subject.trim()) {
      newErrors.subject = 'Subject is required'
    }

    if (!formData.message || !formData.message.trim()) {
      newErrors.message = 'Message is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()

    // Validate form
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitError('')
    setSubmitSuccess(false)

    try {
      // Create FormData for multipart/form-data
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name.trim())
      formDataToSend.append('email', formData.email.trim())
      formDataToSend.append('subject', formData.subject.trim())
      formDataToSend.append('message', formData.message.trim())
      
      if (user.id) {
        formDataToSend.append('userId', user.id)
      }

      // Add attachment if present (Alternate Course 2)
      if (attachment) {
        formDataToSend.append('attachment', attachment)
      }

      const response = await submitSupportRequest(formDataToSend)
      
      setSubmitSuccess(true)
      setTicketId(response.ticketId)
      
      // Reset form after successful submission
      setFormData({
        name: user.name || '',
        email: user.email || '',
        subject: '',
        message: ''
      })
      setAttachment(null)
      setAttachmentPreview('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (error) {
      console.error('Support request error:', error)
      
      // Handle field-specific errors
      if (error.field) {
        setErrors(prev => ({
          ...prev,
          [error.field]: error.message
        }))
      } else {
        setSubmitError(error.message || 'Failed to submit support request. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleCancel() {
    // Alternate Course 3: Discard draft if user cancels
    if (window.confirm('Are you sure you want to cancel? Your draft will be discarded.')) {
      navigate(-1) // Go back to previous page
    }
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Support Request Submitted</h2>
            <p className="text-gray-600 mb-4">
              Your support request has been received successfully.
            </p>
            {ticketId && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600">Ticket ID:</p>
                <p className="text-lg font-semibold text-gray-900">{ticketId}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Please save this ticket ID for reference. You will receive a confirmation email shortly.
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setSubmitSuccess(false)
                  setTicketId(null)
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                Submit Another Request
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Contact Support</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 mb-6">
            Please fill out the form below to contact our support team. We'll get back to you as soon as possible.
          </p>

          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Subject Field */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
                    errors.subject ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Brief description of your issue"
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                )}
              </div>

              {/* Message Field */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={6}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
                    errors.message ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Please describe your issue or question in detail..."
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                )}
              </div>

              {/* Attachment Field */}
              <div>
                <label htmlFor="attachment" className="block text-sm font-medium text-gray-700 mb-1">
                  Attachment (Optional)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="attachment"
                  name="attachment"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximum file size: 5MB. Allowed types: Images, PDF, Word documents, Text files.
                </p>
                {errors.attachment && (
                  <p className="mt-1 text-sm text-red-600">{errors.attachment}</p>
                )}
                {attachment && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {attachmentPreview && (
                        <img src={attachmentPreview} alt="Preview" className="w-16 h-16 object-cover rounded" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                        <p className="text-xs text-gray-500">
                          {(attachment.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveAttachment}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="mt-8 flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

export default ContactSupport

