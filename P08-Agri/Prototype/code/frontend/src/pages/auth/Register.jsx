import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register as register_api } from "../../services/authService";

function Register() {
  const navigate = useNavigate();

  const [form_data, set_form_data] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    role: "farmer"
  });

  const [field_errors, set_field_errors] = useState({});
  const [api_error, set_api_error] = useState("");
  const [show_password, set_show_password] = useState(false);
  const [is_loading, set_is_loading] = useState(false);

  function handle_change(e) {
    const { name, value } = e.target;
    set_form_data((prev) => ({ ...prev, [name]: value }));
    if (field_errors[name]) {
      set_field_errors((prev) => ({ ...prev, [name]: "" }));
    }
    set_api_error("");
  }

  function validate_form() {
    const new_errors = {};
    if (!form_data.name.trim()) {
      new_errors.name = "Name is required";
    }

    const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form_data.email || !email_regex.test(form_data.email)) {
      new_errors.email = "Valid email is required";
    }

    if (form_data.phone) {
      const digits = form_data.phone.replace(/[^0-9]/g, "");
      if (!/^\d{10,}$/.test(digits)) {
        new_errors.phone = "Valid phone number is required";
      }
    }

    if (!form_data.password) {
      new_errors.password = "Password is required";
    } else if (form_data.password.length < 8) {
      new_errors.password = "Password must be at least 8 characters";
    }

    if (form_data.password !== form_data.confirm_password) {
      new_errors.confirm_password = "Passwords do not match";
    }

    set_field_errors(new_errors);
    return Object.keys(new_errors).length === 0;
  }

  async function handle_submit(e) {
    e.preventDefault();
    set_api_error("");

    const is_valid = validate_form();
    if (!is_valid) {
      return;
    }

    set_is_loading(true);

    try {
      const { confirm_password, name, email, phone, role, password } = form_data;
      const payload = {
        full_name: name,
        email: email,
        phone: phone || undefined,
        role: role,
        password: password
      };

      const result = await register_api(payload);

      if (result?.user?.role === "farmer") {
        navigate("/farmer-dashboard");
      } else if (result?.user?.role === "inspector") {
        navigate("/inspector-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      const message = err?.message || "Registration failed. Please try again.";
      set_api_error(message);
    } finally {
      set_is_loading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-green-600 hover:text-green-500">
              Sign in
            </Link>
          </p>
        </div>

        {api_error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {api_error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handle_submit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={form_data.name}
                onChange={handle_change}
                disabled={is_loading}
                className={`mt-1 w-full px-3 py-2 border ${field_errors.name ? "border-red-500" : "border-gray-300"} rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                placeholder="John Doe"
              />
              {field_errors.name && <p className="mt-1 text-xs text-red-500">{field_errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form_data.email}
                onChange={handle_change}
                disabled={is_loading}
                className={`mt-1 w-full px-3 py-2 border ${field_errors.email ? "border-red-500" : "border-gray-300"} rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                placeholder="john@example.com"
              />
              {field_errors.email && <p className="mt-1 text-xs text-red-500">{field_errors.email}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Phone Number (Optional)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form_data.phone}
                onChange={handle_change}
                disabled={is_loading}
                className={`mt-1 w-full px-3 py-2 border ${field_errors.phone ? "border-red-500" : "border-gray-300"} rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                placeholder="+92 300 1234567"
              />
              {field_errors.phone && <p className="mt-1 text-xs text-red-500">{field_errors.phone}</p>}
            </div>

            <div>
              <label htmlFor="role" className="text-sm font-medium text-gray-700">
                I am a
              </label>
              <select
                id="role"
                name="role"
                value={form_data.role}
                onChange={handle_change}
                disabled={is_loading}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="farmer">Farmer</option>
                <option value="inspector">Quality Inspector</option>
              </select>
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={show_password ? "text" : "password"}
                  required
                  value={form_data.password}
                  onChange={handle_change}
                  disabled={is_loading}
                  className={`w-full px-3 py-2 border ${field_errors.password ? "border-red-500" : "border-gray-300"} rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => set_show_password(!show_password)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={is_loading}
                >
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {show_password ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    )}
                  </svg>
                </button>
              </div>
              {field_errors.password && <p className="mt-1 text-xs text-red-500">{field_errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirm_password" className="text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type={show_password ? "text" : "password"}
                required
                value={form_data.confirm_password}
                onChange={handle_change}
                disabled={is_loading}
                className={`mt-1 w-full px-3 py-2 border ${field_errors.confirm_password ? "border-red-500" : "border-gray-300"} rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                placeholder="••••••••"
              />
              {field_errors.confirm_password && <p className="mt-1 text-xs text-red-500">{field_errors.confirm_password}</p>}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={is_loading}
              className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {is_loading ? "Creating Account..." : "Create Account"}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            By creating an account, you agree to our{" "}
            <Link to="/terms" className="text-green-600 hover:text-green-500">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-green-600 hover:text-green-500">
              Privacy Policy
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;
