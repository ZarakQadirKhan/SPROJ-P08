import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetch_weather_by_coords } from '../../services/weatherService';

function FarmerDashboard() {
  const navigate = useNavigate();
  const user_json = localStorage.getItem('user') || '{}';
  const user = JSON.parse(user_json);

  const [is_getting_weather, set_is_getting_weather] = useState(false);
  const [weather_error, set_weather_error] = useState('');
  const [weather_data, set_weather_data] = useState(null);

  function handle_logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  function get_browser_location() {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation is not available'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latitude = pos.coords.latitude;
          const longitude = pos.coords.longitude;
          resolve({ latitude, longitude });
        },
        () => {
          reject(new Error('Location permission denied or unavailable'));
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    });
  }

  async function handle_get_weather() {
    if (is_getting_weather) return;
    set_weather_error('');
    set_is_getting_weather(true);
    set_weather_data(null);

    try {
      const { latitude, longitude } = await get_browser_location();
      const data = await fetch_weather_by_coords(latitude, longitude);
      set_weather_data(data);
    } catch (err) {
      const msg = typeof err === 'string' ? err : err?.message || 'Failed to get weather';
      set_weather_error(msg);
    } finally {
      set_is_getting_weather(false);
    }
  }

  // Hardcoded fields and recent diagnoses for now
  const fields = [
    {
      name: 'North Field',
      area: '5 acres',
      variety: 'Punjab-11',
      sowing: 'Oct 2024',
      location: 'Lahore, Punjab',
      status: 'Healthy'
    },
    {
      name: 'East Plot',
      area: '3.5 acres',
      variety: 'Punjab-11',
      sowing: 'Oct 2024',
      location: 'Sheikhupura, Punjab',
      status: 'Needs Attention'
    },
    {
      name: 'South Block',
      area: '4 acres',
      variety: 'Punjab-11',
      sowing: 'Oct 2024',
      location: 'Kasur, Punjab',
      status: 'Healthy'
    }
  ];

  const recent = [
    { field: 'North Field', time: '2 hours ago', status: 'Healthy' },
    { field: 'East Plot', time: '5 hours ago', status: 'Pest Detected' },
    { field: 'South Block', time: '1 day ago', status: 'Disease Detected' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AgriQual - My Farm Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handle_get_weather}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:opacity-60"
              disabled={is_getting_weather}
            >
              {is_getting_weather ? 'Getting weather...' : 'Get Weather Advisory'}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Weather advisory */}
        {weather_error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {weather_error}
          </div>
        )}

        {weather_data && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Weather Advisory for Your Crops</h2>
              <p className="text-sm text-gray-600">
                {weather_data.city} • {weather_data.current.temperature_c}°C • Wind {weather_data.current.wind_speed_kmh} km/h
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
                  <li key={idx} className="text-sm">{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                {/* Field icon */}
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a1 1 0 001 1h3V6H4a1 1 0 00-1 1zM9 6v12h6V6H9zM21 7v10a1 1 0 01-1 1h-3V6h3a1 1 0 011 1z" />
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
                {/* Check circle */}
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                {/* Warning */}
                <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.29 3.86L1.82 18a1 1 0 00.86 1.5h18.64a1 1 0 00.86-1.5L13.71 3.86a1 1 0 00-1.71 0zM12 9v4m0 4h.01" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Recent Issues</p>
                <p className="text-2xl font-semibold text-gray-900">3</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  {/* Camera icon */}
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h2l2-3h6l2 3h2a2 2 0 012 2v7a2 2 0 01-2 2H3a2 2 0 01-2-2V9a2 2 0 012-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11a3 3 0 100 6 3 3 0 000-6z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Upload Wheat Image</p>
                  <p className="text-xs text-gray-500">Get instant diagnosis</p>
                </div>
              </div>
            </button>

            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  {/* Map pin */}
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.567 3-3.5S13.657 4 12 4 9 5.567 9 7.5 10.343 11 12 11z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21s8-4.5 8-11.5S12 2 12 2 4 5.5 4 9.5 12 21 12 21z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Manage My Fields</p>
                  <p className="text-xs text-gray-500">Add or update fields</p>
                </div>
              </div>
            </button>

            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-left">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  {/* Document/history icon */}
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">View History</p>
                  <p className="text-xs text-gray-500">Check past diagnoses</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* My Wheat Fields */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">My Wheat Fields</h2>
            <p className="text-sm text-gray-600">Total: {fields.length}</p>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {fields.map((f, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-md font-semibold text-gray-900">{f.name}</h3>
                    <p className="text-sm text-gray-600">{f.location}</p>
                  </div>
                  <div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${f.status === 'Healthy' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {f.status}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-700">
                  <div><span className="font-medium">Area:</span> {f.area}</div>
                  <div><span className="font-medium">Variety:</span> {f.variety}</div>
                  <div><span className="font-medium">Sowing:</span> {f.sowing}</div>
                  <div><span className="font-medium"> </span></div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button className="px-3 py-1 text-sm bg-white border border-gray-200 rounded hover:bg-gray-50">View Details</button>
                  <button className="px-3 py-1 text-sm bg-white border border-gray-200 rounded hover:bg-gray-50">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Diagnoses */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {recent.map((r, idx) => {
              const statusClass =
                r.status === 'Healthy' ? 'px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded' :
                r.status === 'Pest Detected' ? 'px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded' :
                'px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded';

              const dotClass =
                r.status === 'Healthy' ? 'bg-green-500' :
                r.status === 'Pest Detected' ? 'bg-yellow-500' :
                'bg-red-500';

              return (
                <button key={idx} className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${dotClass}`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Diagnosis for {r.field}</p>
                      <p className="text-xs text-gray-500">{r.time}</p>
                    </div>
                  </div>
                  <div>
                    <span className={statusClass}>{r.status === 'Pest Detected' ? 'Pest Detected' : r.status}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

export default FarmerDashboard;
